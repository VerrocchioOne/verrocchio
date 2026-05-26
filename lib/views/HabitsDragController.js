// lib/views/HabitsDragController.js
//
// PointerEvents-based drag-and-drop for the Habits organize tool.
// Touch-first (iOS Safari, Android Chrome) with mouse fallback for
// any touch laptop / desktop user who pokes a finger at the screen
// while reorder mode is on. The button-toolbar UX (Up/Down/Layer
// arrows) stays as the desktop/keyboard path — see
// HabitsReorderToolbar.js. On touch devices the toolbar is suppressed
// and this drag is the only reorder affordance.
//
// Why a separate controller module (instead of inlining into
// HabitsView or HabitsHabitCard): both files are already near the
// 1000-LOC hard cap, and the drag math (auto-scroll math, hit-test,
// scroll-delta-corrected document coordinates) wants its own seam so
// it can be unit-tested independently of React render.
//
// PURE-ISH design: the controller doesn't own React state — it
// receives `getDragState` / `setDragState` as injected deps. That
// keeps it Node-requireable for tests and lets the view use whatever
// hook shape it prefers.
//
// The drag commits via the existing `commitHabitReorderDrop` engine
// (index.html:5714) — same call shape as the SortableJS-era code and
// the 4-spec habit-reorder-layered-drop desktop E2E suite. Layered
// (right-edge cohort join) support lands in Phase 2; this phase
// ships within-section + cross-section reorder.
//
// History: the v71 SortableJS removal + v77 drag-handle stub deletion
// + Wave 5.19 dead-code cleanup all reflect that pointer-drag was
// previously abandoned because of complex bugs (auto-scroll vs
// translateY, multi-slot reorder no-op, layered-cohort accounting
// breaking). This rebuild deliberately avoids those traps:
//   - Auto-scroll: capture startScrollY on pointerdown and resolve
//     pointer coordinates against document space, not viewport, so a
//     scrolling page doesn't leave the dragged card "stuck" to the
//     viewport while everything else moves under it.
//   - Hit-test: pure document.elementFromPoint(viewportX, viewportY)
//     + walk-up to nearest [data-habit-id]. Coordinates here are
//     viewport-correct because elementFromPoint expects viewport-
//     relative input.
//   - Same engine as the button toolbar — no parallel reorder code
//     path that could drift from the toolbar's accounting.

(function () {
  "use strict";

  // Auto-scroll thresholds and rates. Touch viewport edges trigger
  // scrolling when the finger gets within EDGE px of the top/bottom;
  // scroll rate scales linearly with proximity to the edge (closer =
  // faster) capped at MAX_SCROLL_PER_FRAME. requestAnimationFrame
  // drives the loop so the rate is smooth across device refresh rates.
  const AUTO_SCROLL_EDGE_PX = 60;
  const MAX_SCROLL_PER_FRAME = 18;

  // Hit-test resolves a drop target's vertical position relative to
  // the target row's bounding box: if the pointer Y is above the
  // midpoint, drop BEFORE the row; otherwise drop AFTER.
  function resolveDropPosition(pointerY, rowRect) {
    const midY = rowRect.top + rowRect.height / 2;
    return pointerY < midY ? "before" : "after";
  }

  // Walk up from an element until we find one carrying a
  // [data-habit-id] attribute. Returns the matching element or null.
  // Cap the walk at 12 levels so a stray click in a nested portal
  // doesn't pathologically walk to <html>.
  function findHabitRowAncestor(el) {
    let cur = el;
    let i = 0;
    while (cur && i < 12) {
      if (cur.getAttribute && cur.getAttribute("data-habit-id")) return cur;
      cur = cur.parentElement;
      i += 1;
    }
    return null;
  }

  // Walk up from a row element until we find a section container
  // carrying a [data-sec] attribute (the existing per-section wrapper
  // div in HabitsView). Returns the section string or null.
  function findSectionForRow(rowEl) {
    let cur = rowEl;
    let i = 0;
    while (cur && i < 16) {
      const sec = cur.getAttribute && cur.getAttribute("data-sec");
      if (sec) return sec;
      cur = cur.parentElement;
      i += 1;
    }
    return null;
  }

  // Compute the target index inside a section given the drop position
  // and the section's ordered habit ids (top-level only — sub-habit
  // rows are excluded). The dragged id is filtered out of the list
  // before insertion to mirror commitHabitReorderDrop's expectations
  // (it inserts at the resolved index in the section's peers EXCLUDING
  // the dragged habit).
  function indexForDrop(orderedIds, draggedId, targetId, side) {
    const peers = orderedIds.filter(id => String(id) !== String(draggedId));
    const idx = peers.findIndex(id => String(id) === String(targetId));
    if (idx < 0) return peers.length;
    return side === "before" ? idx : idx + 1;
  }

  // Given a viewport-relative pointer X/Y, find the (habitId,
  // section, index) drop target. enumerateSections returns
  // [{ section, orderedIds }] so the function stays pure of DOM
  // beyond the elementFromPoint call. Returns null when the pointer
  // isn't over any habit row (which means: drop is a no-op).
  function hitTest(viewportX, viewportY, draggedId, enumerateSections) {
    if (typeof document === "undefined" || !document.elementFromPoint) {
      return null;
    }
    const el = document.elementFromPoint(viewportX, viewportY);
    if (!el) return null;
    const rowEl = findHabitRowAncestor(el);
    if (!rowEl) return null;
    const targetId = rowEl.getAttribute("data-habit-id");
    if (!targetId || String(targetId) === String(draggedId)) return null;
    const section = findSectionForRow(rowEl);
    if (!section) return null;
    const sections = enumerateSections();
    const sec = sections.find(s => s.section === section);
    if (!sec) return null;
    const rect = rowEl.getBoundingClientRect();
    const side = resolveDropPosition(viewportY, rect);
    const index = indexForDrop(sec.orderedIds, draggedId, targetId, side);
    return { section, index, targetId, side };
  }

  // Compute per-frame scroll delta given the pointer's viewport Y.
  // Returns 0 when not near an edge; positive scrolls down,
  // negative scrolls up. Used inside a requestAnimationFrame loop.
  function autoScrollDelta(viewportY, viewportHeight) {
    if (viewportY < AUTO_SCROLL_EDGE_PX) {
      const proximity = (AUTO_SCROLL_EDGE_PX - viewportY) / AUTO_SCROLL_EDGE_PX;
      return -Math.ceil(MAX_SCROLL_PER_FRAME * Math.min(1, Math.max(0, proximity)));
    }
    if (viewportY > viewportHeight - AUTO_SCROLL_EDGE_PX) {
      const proximity = (viewportY - (viewportHeight - AUTO_SCROLL_EDGE_PX)) / AUTO_SCROLL_EDGE_PX;
      return Math.ceil(MAX_SCROLL_PER_FRAME * Math.min(1, Math.max(0, proximity)));
    }
    return 0;
  }

  function makeController(deps) {
    const getDragState = (deps && deps.getDragState) || (() => null);
    const setDragState = (deps && deps.setDragState) || (() => {});
    const onCommit = (deps && deps.onCommit) || (() => {});
    const enumerateSections = (deps && deps.enumerateSections) || (() => []);

    let rafHandle = null;
    let pointerCapturedOn = null;

    function stopAutoScroll() {
      if (rafHandle != null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(rafHandle);
      }
      rafHandle = null;
    }

    function startAutoScroll() {
      if (rafHandle != null) return;
      const tick = () => {
        const s = getDragState();
        if (!s || !s.dragging) { rafHandle = null; return; }
        const vh = (typeof window !== "undefined" && window.innerHeight) || 0;
        const dy = autoScrollDelta(s.viewportY || 0, vh);
        if (dy !== 0 && typeof window !== "undefined") {
          window.scrollBy(0, dy);
        }
        rafHandle = requestAnimationFrame(tick);
      };
      rafHandle = requestAnimationFrame(tick);
    }

    function beginDrag(e, habitId, sectionHint) {
      if (!e) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      // setPointerCapture binds subsequent pointer events to the
      // element that captured, even if the finger drifts off the
      // handle — critical for iOS where a small drag movement can
      // otherwise hand the pointer off to a sibling card mid-drag.
      try {
        if (e.target && e.target.setPointerCapture && e.pointerId != null) {
          e.target.setPointerCapture(e.pointerId);
          pointerCapturedOn = { el: e.target, pointerId: e.pointerId };
        }
      } catch (_err) { /* setPointerCapture can throw on detached nodes */ }
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      setDragState({
        dragging: true,
        habitId: String(habitId),
        sourceSection: sectionHint || null,
        startX: e.clientX,
        startY: e.clientY,
        startScrollY: (typeof window !== "undefined" && window.scrollY) || 0,
        viewportX: e.clientX,
        viewportY: e.clientY,
        dropTarget: null
      });
    }

    function onPointerMove(e) {
      const s = getDragState();
      if (!s || !s.dragging) return;
      if (e.preventDefault) e.preventDefault();
      const dropTarget = hitTest(e.clientX, e.clientY, s.habitId, enumerateSections);
      setDragState(Object.assign({}, s, {
        viewportX: e.clientX,
        viewportY: e.clientY,
        dropTarget
      }));
      startAutoScroll();
    }

    function releaseCapture() {
      if (pointerCapturedOn && pointerCapturedOn.el && pointerCapturedOn.el.releasePointerCapture) {
        try { pointerCapturedOn.el.releasePointerCapture(pointerCapturedOn.pointerId); } catch (_e) {}
      }
      pointerCapturedOn = null;
    }

    function onPointerUp(_e) {
      const s = getDragState();
      stopAutoScroll();
      releaseCapture();
      if (!s || !s.dragging) return;
      const dropTarget = s.dropTarget;
      setDragState(null);
      if (!dropTarget) return; // dropped on nothing — no-op
      onCommit(s.habitId, dropTarget.section, dropTarget.index, {
        // Phase 2 will set targetConcurrent / layeredPeerId / layeredSide
        // when right-edge layered drop is detected. Phase 1 ships
        // plain reorder only.
        targetConcurrent: false,
        layeredPeerId: null,
        layeredSide: null
      });
    }

    function onPointerCancel() {
      stopAutoScroll();
      releaseCapture();
      setDragState(null);
    }

    return {
      beginDrag,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      // Exposed for unit tests; not part of the React-facing API.
      _hitTest: hitTest,
      _autoScrollDelta: autoScrollDelta,
      _indexForDrop: indexForDrop,
      _resolveDropPosition: resolveDropPosition
    };
  }

  const api = {
    makeController,
    AUTO_SCROLL_EDGE_PX,
    MAX_SCROLL_PER_FRAME,
    // Pure helpers re-exported for tests.
    hitTest,
    indexForDrop,
    autoScrollDelta,
    resolveDropPosition,
    findHabitRowAncestor,
    findSectionForRow
  };

  if (typeof window !== "undefined") {
    window.HabitsDragController = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
