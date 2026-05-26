// tests/HabitsDragController.test.mjs
//
// Unit tests for the pure helpers exported by HabitsDragController.
// React-coupled behavior (the requestAnimationFrame auto-scroll
// loop, real PointerEvent dispatch) is covered by TestFlight
// visual verification on iOS - synth here only what is needed to
// drive the controller's branches.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const dc = require("../lib/views/HabitsDragController.js");

test("dc.resolveDropPosition returns 'before' above midpoint", () => {
  const rect = { top: 100, height: 40 };
  assert.equal(dc.resolveDropPosition(110, rect), "before");
  assert.equal(dc.resolveDropPosition(115, rect), "before");
});

test("dc.resolveDropPosition returns 'after' at and below midpoint", () => {
  const rect = { top: 100, height: 40 };
  assert.equal(dc.resolveDropPosition(120, rect), "after");
  assert.equal(dc.resolveDropPosition(135, rect), "after");
});

test("dc.indexForDrop inserts before the target row", () => {
  assert.equal(dc.indexForDrop(["a", "b", "c"], "d", "b", "before"), 1);
});

test("dc.indexForDrop inserts after the target row", () => {
  assert.equal(dc.indexForDrop(["a", "b", "c"], "d", "b", "after"), 2);
});

test("dc.indexForDrop filters dragged id out of peers before computing index", () => {
  // Dragging b within section [a, b, c]; targeting c with
  // side=before. peers without b = [a, c]; idx of c = 1; before
  // -> insert at 1 (i.e., between a and c). Contract that
  // commitHabitReorderDrop expects.
  assert.equal(dc.indexForDrop(["a", "b", "c"], "b", "c", "before"), 1);
});

test("dc.indexForDrop returns end-of-list when target id not found", () => {
  // Defensive: if the target id has been removed between hit-test
  // and commit, fall back to end-of-section instead of throwing.
  assert.equal(dc.indexForDrop(["a", "b", "c"], "d", "zzz", "before"), 3);
});

test("dc.autoScrollDelta is 0 when pointer is mid-viewport", () => {
  assert.equal(dc.autoScrollDelta(400, 800), 0);
});

test("dc.autoScrollDelta scrolls UP near top edge (negative delta)", () => {
  assert.equal(dc.autoScrollDelta(0, 800), -dc.MAX_SCROLL_PER_FRAME);
  assert.equal(dc.autoScrollDelta(30, 800), -Math.ceil(dc.MAX_SCROLL_PER_FRAME * 0.5));
});

test("dc.autoScrollDelta scrolls DOWN near bottom edge (positive delta)", () => {
  assert.equal(dc.autoScrollDelta(800, 800), dc.MAX_SCROLL_PER_FRAME);
  assert.equal(dc.autoScrollDelta(770, 800), Math.ceil(dc.MAX_SCROLL_PER_FRAME * 0.5));
});

test("dc.autoScrollDelta clamps proximity at edges to <= MAX", () => {
  assert.equal(dc.autoScrollDelta(-50, 800), -dc.MAX_SCROLL_PER_FRAME);
  assert.equal(dc.autoScrollDelta(900, 800), dc.MAX_SCROLL_PER_FRAME);
});

test("dc.findHabitRowAncestor walks up until it finds [data-habit-id]", () => {
  const root = { getAttribute: () => null, parentElement: null };
  const mid = {
    getAttribute: name => (name === "data-habit-id" ? "h42" : null),
    parentElement: root
  };
  const leaf = { getAttribute: () => null, parentElement: mid };
  const hit = dc.findHabitRowAncestor(leaf);
  assert.equal(hit && hit.getAttribute("data-habit-id"), "h42");
});

test("dc.findHabitRowAncestor returns null when no ancestor carries the attribute", () => {
  const root = { getAttribute: () => null, parentElement: null };
  const mid = { getAttribute: () => null, parentElement: root };
  const leaf = { getAttribute: () => null, parentElement: mid };
  assert.equal(dc.findHabitRowAncestor(leaf), null);
});

test("dc.findSectionForRow walks up to [data-sec] container", () => {
  const root = { getAttribute: () => null, parentElement: null };
  const section = {
    getAttribute: name => (name === "data-sec" ? "morning" : null),
    parentElement: root
  };
  const row = { getAttribute: () => null, parentElement: section };
  assert.equal(dc.findSectionForRow(row), "morning");
});

test("dc.makeController.beginDrag populates the drag state", () => {
  let state = null;
  const ctrl = dc.makeController({
    getDragState: () => state,
    setDragState: next => { state = next; },
    onCommit: () => {},
    enumerateSections: () => []
  });
  const fakeEvent = {
    pointerType: "touch",
    pointerId: 1,
    clientX: 50,
    clientY: 100,
    target: { setPointerCapture: () => {}, releasePointerCapture: () => {} },
    preventDefault: () => {},
    stopPropagation: () => {}
  };
  ctrl.beginDrag(fakeEvent, "h7", "afternoon");
  assert.equal(state.dragging, true);
  assert.equal(state.habitId, "h7");
  assert.equal(state.sourceSection, "afternoon");
  assert.equal(state.startX, 50);
  assert.equal(state.startY, 100);
  assert.equal(state.viewportX, 50);
  assert.equal(state.viewportY, 100);
  assert.equal(state.dropTarget, null);
});

test("dc.makeController.beginDrag ignores right-click on mouse", () => {
  let state = null;
  const ctrl = dc.makeController({
    getDragState: () => state,
    setDragState: next => { state = next; },
    onCommit: () => {},
    enumerateSections: () => []
  });
  const fakeEvent = {
    pointerType: "mouse",
    button: 2,
    clientX: 50,
    clientY: 100,
    target: { setPointerCapture: () => {}, releasePointerCapture: () => {} },
    preventDefault: () => { throw new Error("should not preventDefault on rejected event"); },
    stopPropagation: () => {}
  };
  ctrl.beginDrag(fakeEvent, "h7", "afternoon");
  assert.equal(state, null);
});

test("dc.makeController.onPointerUp dispatches commit with resolved drop target", () => {
  let state = {
    dragging: true,
    habitId: "h7",
    sourceSection: "afternoon",
    viewportX: 100,
    viewportY: 200,
    dropTarget: { section: "morning", index: 2, targetId: "h3", side: "before" }
  };
  const calls = [];
  const ctrl = dc.makeController({
    getDragState: () => state,
    setDragState: next => { state = next; },
    onCommit: (id, sec, idx, opts) => calls.push({ id, sec, idx, opts }),
    enumerateSections: () => []
  });
  ctrl.onPointerUp({});
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, "h7");
  assert.equal(calls[0].sec, "morning");
  assert.equal(calls[0].idx, 2);
  // Phase 1 always sends layered=false. Phase 2 will exercise true.
  assert.equal(calls[0].opts.targetConcurrent, false);
  assert.equal(calls[0].opts.layeredPeerId, null);
  // Drag state cleared.
  assert.equal(state, null);
});

test("dc.makeController.onPointerUp with no dropTarget is a no-op commit", () => {
  let state = {
    dragging: true,
    habitId: "h7",
    sourceSection: "afternoon",
    viewportX: 100,
    viewportY: 200,
    dropTarget: null
  };
  const calls = [];
  const ctrl = dc.makeController({
    getDragState: () => state,
    setDragState: next => { state = next; },
    onCommit: (id, sec, idx) => calls.push({ id, sec, idx }),
    enumerateSections: () => []
  });
  ctrl.onPointerUp({});
  assert.equal(calls.length, 0); // commit NOT called
  assert.equal(state, null);     // state still cleared
});

test("dc.makeController.onPointerCancel clears state without commit", () => {
  let state = {
    dragging: true,
    habitId: "h7",
    sourceSection: "afternoon",
    viewportX: 100,
    viewportY: 200,
    dropTarget: { section: "morning", index: 2, targetId: "h3", side: "before" }
  };
  const calls = [];
  const ctrl = dc.makeController({
    getDragState: () => state,
    setDragState: next => { state = next; },
    onCommit: (id, sec, idx) => calls.push({ id, sec, idx }),
    enumerateSections: () => []
  });
  ctrl.onPointerCancel();
  assert.equal(calls.length, 0); // commit NOT called on cancel
  assert.equal(state, null);
});
