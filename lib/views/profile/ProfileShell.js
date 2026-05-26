// lib/views/profile/ProfileShell.js
//
// Profile sheet chrome: A11yDialog wrapper + header (toggle nav,
// section title, close X) + collapsible side nav + active-panel
// dispatch. The seven panels themselves (account/scorecard/inspiration/
// content/history/reports/settings) are rendered by App() and passed
// in via the `panels` map — this shell only owns the chrome.
//
// Wave 4.4.8 (final piece of Wave 4.4). Originally the wrapping
// section of the `showProfile && (() => {...})()` IIFE at
// index.html L15271-L15577.
//
// Why ProfileShell receives `panels` instead of rendering them:
// each panel needs a different helpers bag (settings panel needs
// theme state, content panel needs the upload pipeline, etc.) — those
// helper bindings live in App() and are awkward to thread through a
// generic wrapper. App() builds the per-panel React.createElement
// calls itself and hands the resulting elements to ProfileShell as
// a { sectionKey: element } map.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  // NAV_ITEMS owned by the shell — it controls nav layout. The label
  // also drives the header's section-title text via ariaLabelledby.
  const NAV_ITEMS = [
    { val: "account",     label: "My Account" },
    { val: "scorecard",   label: "App Progress" },
    { val: "inspiration", label: "My Inspiration" },
    { val: "content",     label: "My Content" },
    { val: "history",     label: "Goal History" },
    { val: "reports",     label: "Habit Reports" },
    { val: "settings",    label: "App Settings" }
  ];

  function ProfileShell(props) {
    const A11yDialog = window.VerrocchioReactDialog;
    const cb = (props && props.callbacks) || {};
    const h = cb.helpers || {};
    // State
    const profileSection = h.profileSection || "account";
    const profileNavOpen = !!h.profileNavOpen;
    const panels = h.panels || {};
    // Setters
    const setProfileSection = h.setProfileSection || (() => {});
    const setProfileNavOpen = h.setProfileNavOpen || (() => {});
    const setShowProfile = h.setShowProfile || (() => {});

    if (!A11yDialog) return null;

    const navBtn = (item, on) => /*#__PURE__*/React.createElement("button", {
      key: item.val,
      onClick: () => { setProfileSection(item.val); setProfileNavOpen(false); },
      style: {
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "10px 12px", borderRadius: 8,
        background: on ? "#2d5a2d" : "transparent",
        color: on ? "#fff" : "var(--c-text-soft)",
        border: "none", cursor: "pointer", fontSize: 13,
        fontWeight: on ? 700 : 500, textAlign: "left",
        transition: "background .15s"
      }
    }, /*#__PURE__*/React.createElement("span", { style: { lineHeight: 1.2 } }, item.label));

    // Migrated to A11yDialog (Port #6+#9 batch 3): focus-trap + Escape
    // + return-focus. Multi-panel modal; the header section label
    // drives ariaLabelledby. Close X uses data-a11y-dialog-hide;
    // backdrop and Escape route through onHide.
    return /*#__PURE__*/React.createElement(A11yDialog, {
      onHide: () => setShowProfile(false),
      ariaLabelledby: "profile-section-title",
      overlayStyle: { background: "rgba(0,0,0,0.5)", zIndex: 300 },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: "20px 20px 0 0", maxWidth: 720, height: "88vh", maxHeight: "88vh", boxShadow: "0 -8px 40px rgba(0,0,0,.2)", display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }
    },
      /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }
      },
        /*#__PURE__*/React.createElement("button", {
          "aria-label": "Toggle navigation",
          onClick: () => setProfileNavOpen(p => !p),
          style: { background: profileNavOpen ? "var(--c-tint-success-bg)" : "var(--c-surface-muted)", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: profileNavOpen ? "#2d5a2d" : "var(--c-text-soft)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: 0 }
        },
          /*#__PURE__*/React.createElement("span", { style: { display: "block", width: 16, height: 2, borderRadius: 1, background: "currentColor" } }),
          /*#__PURE__*/React.createElement("span", { style: { display: "block", width: 16, height: 2, borderRadius: 1, background: "currentColor" } }),
          /*#__PURE__*/React.createElement("span", { style: { display: "block", width: 16, height: 2, borderRadius: 1, background: "currentColor" } })
        ),
        /*#__PURE__*/React.createElement("div", { id: "profile-section-title", style: { fontFamily: "'Lora',serif", fontSize: 14, fontWeight: 700, color: "#6b7280", textTransform: "capitalize" } },
          (NAV_ITEMS.find(n => n.val === profileSection) || {}).label || "Profile"),
        /*#__PURE__*/React.createElement("button", {
          "aria-label": "Close",
          "data-a11y-dialog-hide": true,
          style: { background: "var(--c-surface-muted)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }
        }, "×")
      ),
      /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", flex: 1, minHeight: 0 }
      },
        profileNavOpen && /*#__PURE__*/React.createElement("div", {
          style: { width: 150, flexShrink: 0, background: "var(--c-surface-raised)", borderRight: "1px solid #f3f4f6", padding: "12px 8px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }
        },
          NAV_ITEMS.map(n => navBtn(n, profileSection === n.val))
        ),
        /*#__PURE__*/React.createElement("div", {
          style: { flex: 1, minWidth: 0, padding: "10px 12px 14px", overflowY: "auto" }
        }, panels[profileSection] || panels.account)
      )
    );
  }

  window.ProfileShell = ProfileShell;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ProfileShell;
  }
})();
