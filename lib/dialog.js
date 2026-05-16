// Verrocchio dialog helper — thin wrapper around a11y-dialog@8.x.
// Phase 2 OSS-port Port #6 + #9 pilot. Replaces hand-rolled modal
// open/close + focus-trap effects that previously lived inline in
// index.html.
//
// Why a wrapper at all (vs. instantiating A11yDialog directly at each
// call site):
//   1. ONE place that knows we use a11y-dialog. If we ever swap libs
//      again, the surface area is here, not 10+ scattered modal sites.
//   2. The browser surface follows the same dual-load shim pattern as
//      lib/hydration.js — a window-global in browsers, CommonJS in
//      Node. Node currently has no test for this module (focus-trap
//      semantics live in the DOM; we cover them via Playwright in
//      tests/e2e/dialog.spec.js), but keeping the shim aligned with
//      sibling lib/*.js modules keeps the export contract consistent.
//   3. Lets the wrapper degrade gracefully if window.A11yDialog isn't
//      loaded (CDN failure, offline-without-precache) by returning a
//      no-op shim — the modal still appears via React state, just
//      without the focus-trap upgrade. Better than throwing during
//      render and tanking the whole tab.
//
// The a11y-dialog README convention this wraps:
//   • Mount a [role="dialog"][aria-modal="true"] element somewhere in the
//     DOM (typically a React-rendered subtree).
//   • Tag close affordances with `data-a11y-dialog-hide` so any click
//     within the dialog subtree dismisses without needing a handler.
//   • new A11yDialog(el) wires:
//       - aria-hidden toggling
//       - focus-on-show (first tabbable inside, or the dialog itself)
//       - Tab/Shift+Tab containment within the dialog
//       - Escape key to hide
//       - focus return to the element that was focused when .show()
//         was called (the natural "trigger" element)
//
// React integration pattern (used by completeGoalModal in index.html):
//
//   const ref = React.useRef(null);
//   const dlgRef = React.useRef(null);
//   React.useEffect(() => {
//     if (!ref.current) return;
//     dlgRef.current = createDialog(ref.current);
//     dlgRef.current.show();
//     return () => { if (dlgRef.current) dlgRef.current.destroy(); };
//   }, []);
//
// Caveat captured during the pilot: a11y-dialog's show()/hide() set
// aria-hidden on the wrapper element. We MUST render the dialog DOM
// unconditionally (or at least keep it mounted long enough for hide()
// to fire before unmount), otherwise the focus-return step has no
// dialog element to read its "previously-focused" pointer from and
// focus is lost.  In React, that means: drive open/close via a single
// effect's show()/destroy() lifecycle, NOT via conditional rendering
// of the dialog element itself.

function createDialog(rootEl) {
  // Defensive: a null root would throw inside the A11yDialog constructor
  // (it reads .querySelectorAll on the element). Return a no-op shim so
  // call sites don't have to guard the return value.
  if (!rootEl) {
    return {
      show: function () {},
      hide: function () {},
      on: function () {},
      off: function () {},
      destroy: function () {}
    };
  }

  // CDN-failure fallback. If A11yDialog never loaded (offline-without-
  // precache on first run, or CDN outage), the modal still renders via
  // React state — it just doesn't have the focus-trap upgrade. We log
  // once so a regression in the script tag is at least visible in
  // devtools, then return a no-op shim that won't crash the render.
  if (typeof window === "undefined" || typeof window.A11yDialog !== "function") {
    if (typeof window !== "undefined" && !window.__a11yDialogWarned) {
      window.__a11yDialogWarned = true;
      try {
        // eslint-disable-next-line no-console
        console.warn("[verrocchio] a11y-dialog not loaded; modal will render without focus trap.");
      } catch (_) {}
    }
    return {
      show: function () {},
      hide: function () {},
      on: function () {},
      off: function () {},
      destroy: function () {}
    };
  }

  var inst = new window.A11yDialog(rootEl);

  return {
    // Open the dialog. Captures document.activeElement at call time so
    // hide() can return focus to it (the a11y-dialog default — we don't
    // override).
    show: function () { inst.show(); },

    // Close the dialog. Restores focus to whatever was focused before
    // show() was called.
    hide: function () { inst.hide(); },

    // Forward event hooks (show, hide, destroy). Useful when a caller
    // needs to sync external state to the dialog's open/close state,
    // e.g. resetting form inputs on hide.
    on:  function (event, cb) { inst.on(event, cb); },
    off: function (event, cb) { inst.off(event, cb); },

    // Tear down listeners. Call from a React useEffect cleanup so we
    // don't leak event handlers when the component unmounts.
    destroy: function () { inst.destroy(); }
  };
}

// Browser binding — exposes the helper at a stable global so inline
// React.createElement code in index.html can call it without an
// import statement (consistent with how hydrateCloudDoc is referenced
// from index.html via the Script scope).
if (typeof window !== "undefined") {
  window.verrocchioDialog = { createDialog: createDialog };
}

// CommonJS export for any future Node-side test of this surface (none
// today — DOM dependency makes Playwright the right place to test). The
// guard ensures the browser path is untouched.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { createDialog: createDialog };
}
