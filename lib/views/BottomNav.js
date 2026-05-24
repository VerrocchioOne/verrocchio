// lib/views/BottomNav.js
//
// Fixed liquid-glass bottom nav. 5 tabs (Home / Goals / Habits /
// To-Dos / Reflect), each with an inline SVG icon. Active-state color
// follows the user's accent (custom mode + unlocked) or falls back to
// the brand green #2d5a2d.
//
// Wave 4.2.3. Originally inline at index.html L21679-L21876.
//
// Props (via state/callbacks):
//   tab — current active tab id
//   settingsMode, themeLocked, accentColor — color theming inputs
//   setTab — tab setter

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function BottomNav({ data, dispatch, deviceProfile, state, callbacks }) {
    const s = state || {};
    const cb = callbacks || {};
    const tab = s.tab;
    const setTab = cb.setTab || (() => {});
    const settingsMode = s.settingsMode;
    const themeLocked = !!s.themeLocked;
    const accentColor = s.accentColor;

    const tabs = [{
      key: "brief",
      label: "Home",
      icon: a => {
        const accent = a ? (settingsMode === "custom" && !themeLocked ? accentColor : "#2d5a2d") : "#9ca3af";
        return React.createElement("svg", {
          width: "22", height: "22", viewBox: "0 0 24 24",
          fill: "none", stroke: accent,
          strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"
        },
          React.createElement("path", { d: "M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1z" })
        );
      }
    }, {
      key: "goals",
      label: "Goals",
      icon: a => {
        const accent = a ? (settingsMode === "custom" && !themeLocked ? accentColor : "#2d5a2d") : "#9ca3af";
        return React.createElement("svg", {
          width: "22", height: "22", viewBox: "0 0 24 24",
          fill: "none", stroke: accent,
          strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round"
        },
          React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
          React.createElement("circle", { cx: "12", cy: "12", r: "6" }),
          React.createElement("circle", { cx: "12", cy: "12", r: "1.6", fill: accent, stroke: "none" }),
          React.createElement("path", { d: "M22 2L13 11" }),
          React.createElement("path", { d: "M13 11L11.6 11.4M13 11L12.6 12.4" }),
          React.createElement("path", { d: "M22 2L18.6 2.6M22 2L21.4 5.4" })
        );
      }
    }, {
      key: "habits",
      label: "Habits",
      icon: a => React.createElement("svg", {
        width: "22", height: "22", viewBox: "0 0 24 24",
        fill: a ? (settingsMode === "custom" && !themeLocked ? accentColor : "#2d5a2d") : "#9ca3af"
      },
        React.createElement("rect", { x: "3.25",  y: "18",   width: "4", height: "3", rx: "0.6" }),
        React.createElement("rect", { x: "7.75",  y: "18",   width: "4", height: "3", rx: "0.6" }),
        React.createElement("rect", { x: "12.25", y: "18",   width: "4", height: "3", rx: "0.6" }),
        React.createElement("rect", { x: "16.75", y: "18",   width: "4", height: "3", rx: "0.6" }),
        React.createElement("rect", { x: "5.5",   y: "14.5", width: "4", height: "3", rx: "0.6" }),
        React.createElement("rect", { x: "10",    y: "14.5", width: "4", height: "3", rx: "0.6" }),
        React.createElement("rect", { x: "14.5",  y: "14.5", width: "4", height: "3", rx: "0.6" }),
        React.createElement("rect", { x: "7.75",  y: "11",   width: "4", height: "3", rx: "0.6" }),
        React.createElement("rect", { x: "12.25", y: "11",   width: "4", height: "3", rx: "0.6" }),
        React.createElement("rect", { x: "10",    y: "7.5",  width: "4", height: "3", rx: "0.6" })
      )
    }, {
      key: "todos",
      label: "To-Dos",
      icon: a => React.createElement("svg", {
        width: "22", height: "22", viewBox: "0 0 24 24",
        fill: "none",
        stroke: a ? (settingsMode === "custom" && !themeLocked ? accentColor : "#2d5a2d") : "#9ca3af",
        strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"
      },
        React.createElement("path", { d: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" }),
        React.createElement("rect", { x: "8", y: "2", width: "8", height: "4", rx: "1" }),
        React.createElement("path", { d: "M8.5 12l1.5 1.5L13 10.5" }),
        React.createElement("path", { d: "M8.5 17l1.5 1.5L13 15.5" })
      )
    }, {
      key: "reflection",
      label: "Reflect",
      icon: a => React.createElement("svg", {
        width: "22", height: "22", viewBox: "0 0 24 24",
        fill: "none",
        stroke: a ? (settingsMode === "custom" && !themeLocked ? accentColor : "#2d5a2d") : "#9ca3af",
        strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"
      },
        React.createElement("path", { d: "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" }),
        React.createElement("path", { d: "M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" })
      )
    }];

    return React.createElement("div", {
      className: "lg",
      style: {
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderTop: "1px solid rgba(255,255,255,0.65)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 -2px 16px rgba(0,0,0,.06)",
        paddingBottom: "env(safe-area-inset-bottom,0px)"
      }
    }, React.createElement("div", {
      style: {
        display: "flex", justifyContent: "space-around", alignItems: "center",
        paddingTop: 8, paddingBottom: 8,
        maxWidth: 1100, margin: "0 auto"
      }
    }, tabs.map(t => {
      const active = tab === t.key;
      const labelColor = active ? (settingsMode === "custom" && !themeLocked ? accentColor : "#2d5a2d") : "#9ca3af";
      return React.createElement("button", {
        key: t.key,
        onClick: () => setTab(t.key),
        "aria-label": t.label,
        title: t.label,
        style: {
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "none", border: "none", cursor: "pointer",
          padding: "4px 10px 2px", minWidth: 52,
          WebkitTapHighlightColor: "transparent"
        }
      },
        t.icon(active),
        React.createElement("span", {
          style: { fontSize: 10, fontWeight: active ? 700 : 500, color: labelColor, marginTop: 2, letterSpacing: 0.2, lineHeight: 1 }
        }, t.label)
      );
    })));
  }

  window.BottomNav = BottomNav;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { BottomNav };
  }
})();
