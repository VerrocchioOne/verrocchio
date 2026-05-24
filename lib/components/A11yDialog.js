// lib/components/A11yDialog.js
//
// React wrapper around the a11y-dialog library. Provides focus trap,
// Esc-to-close, backdrop-click-to-close, and bridges a11y-dialog's
// imperative "hide" event back to React state via the onHide callback.
//
// Originally lived inline in index.html L2740-L2810.
//
// IMPORTANT — name collision avoidance:
// The a11y-dialog UMD library (loaded via the jsDelivr CDN script in
// head) defines `window.A11yDialog` as the class constructor for the
// underlying dialog. `lib/dialog.js` then does `new window.A11yDialog(rootEl)`
// to wrap it.
//
// Our React wrapper happens to share the name. To avoid clobbering the
// library's global, we expose this React component under a DIFFERENT
// window slot: `window.VerrocchioReactDialog`. The body script in
// index.html then does `const A11yDialog = window.VerrocchioReactDialog;`
// so all existing call sites (React.createElement(A11yDialog, ...))
// keep working.
//
// (This was discovered the hard way: a first extraction attempt assigned
// `window.A11yDialog = A11yDialog` and broke 12 of 20 E2E tests because
// it overrode the library class that lib/dialog.js depends on.)
//
// Dual-loaded (browser <script> global + Node CJS export) per
// docs/superpowers/patterns/view-extraction.md.

(function () {
  "use strict";

  if (typeof window === "undefined" || !window.React) return;

  function VerrocchioReactDialog({ onHide, overlayStyle, cardStyle, dialogProps, children, ariaLabelledby }) {
    const elRef = React.useRef(null);
    const dlgRef = React.useRef(null);
    const onHideRef = React.useRef(onHide);
    React.useEffect(() => { onHideRef.current = onHide; }, [onHide]);

    React.useEffect(() => {
      if (!elRef.current) return;
      const dlg = (window.verrocchioDialog && window.verrocchioDialog.createDialog(elRef.current));
      if (!dlg) return;
      dlgRef.current = dlg;
      const handleHide = () => { if (onHideRef.current) onHideRef.current(); };
      dlg.on("hide", handleHide);
      dlg.show();
      return () => {
        try { dlg.off("hide", handleHide); } catch (_) {}
        try { dlg.destroy(); } catch (_) {}
      };
    }, []);

    const onBackdropClick = (e) => {
      if (e.target === e.currentTarget && dlgRef.current) {
        dlgRef.current.hide();
      }
    };

    const baseOverlay = {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 350,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center"
    };
    const baseCard = {
      background: "var(--c-surface, #fff)",
      borderRadius: "20px 20px 0 0",
      padding: "24px 20px",
      width: "100%",
      maxWidth: 640,
      maxHeight: "85vh",
      overflowY: "auto",
      boxShadow: "0 -8px 40px rgba(0,0,0,.2)"
    };

    return React.createElement("div", Object.assign({
      ref: elRef,
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": ariaLabelledby,
      onClick: onBackdropClick,
      style: Object.assign({}, baseOverlay, overlayStyle || {})
    }, dialogProps || {}),
      React.createElement("div", {
        className: "fade-in",
        onClick: (e) => e.stopPropagation(),
        style: Object.assign({}, baseCard, cardStyle || {})
      }, children)
    );
  }

  // Expose under a name that does NOT collide with the a11y-dialog
  // library's window.A11yDialog. Body script in index.html re-aliases
  // to the local `A11yDialog` identifier.
  window.VerrocchioReactDialog = VerrocchioReactDialog;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { VerrocchioReactDialog };
  }
})();
