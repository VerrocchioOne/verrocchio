// lib/views/profile/ScorecardPanel.js
//
// Profile > App Progress panel: shows which app features the user has
// tried, grouped by category, with a percentage hero. Sources data from
// FEATURES (constant declared in index.html L1366 — currently still on
// the classic-script global) and data.featureAccess (a per-feature
// last-touched timestamp map maintained by touchFeature()).
//
// Wave 4.4.3. Originally inline at index.html L17545-L17607.
//
// VERBATIM body extraction with helpers-bag pattern (same as
// AccountPanel / InspirationPanel): the JSX-equivalent tree is copied
// 1:1 from the inline source; a destructuring prelude re-binds the
// few App-scope identifiers the body references.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function ScorecardPanel(props) {
    const cb = (props && props.callbacks) || {};
    const h = cb.helpers || {};
    const data = h.data || {};
    const sectionTitle = h.sectionTitle;
    const labelS = h.labelS;
    const FEATURES_LIST = h.FEATURES || (typeof FEATURES !== "undefined" ? FEATURES : []);

    const access = (data && data.featureAccess) || {};
    const byCat = {};
    for (const f of FEATURES_LIST) {
      if (!byCat[f.cat]) byCat[f.cat] = [];
      byCat[f.cat].push(f);
    }
    const usedCount = FEATURES_LIST.filter(f => access[f.id]).length;
    const pct = FEATURES_LIST.length ? Math.round(usedCount / FEATURES_LIST.length * 100) : 0;
    const fmtWhen = ms => {
      if (!ms) return "Not yet";
      const days = Math.floor((Date.now() - ms) / 86400000);
      if (days <= 0) return "Today";
      if (days === 1) return "Yesterday";
      if (days < 7) return days + "d ago";
      return new Date(ms).toLocaleDateString();
    };
    return /*#__PURE__*/React.createElement("div", null,
      sectionTitle("App Progress"),
      /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, color: "#6b7280", marginBottom: 12 } }, "Which parts of Verrocchio you've tried. Anything with an ✗ is worth a look."),
      /*#__PURE__*/React.createElement("div", {
        style: { padding: "14px", background: "var(--c-tint-success-bg)", borderRadius: 10, marginBottom: 18, textAlign: "center" }
      },
        /*#__PURE__*/React.createElement("div", { style: { fontFamily: "'Lora',serif", fontSize: 28, fontWeight: 700, color: "#2d5a2d" } }, pct, "%"),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, marginTop: 4 } }, usedCount + " of " + FEATURES_LIST.length + " features tried")
      ),
      Object.entries(byCat).map(([cat, items]) => /*#__PURE__*/React.createElement("div", { key: cat, style: { marginBottom: 16 } },
        /*#__PURE__*/React.createElement("div", { style: labelS }, cat),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
          items.map(f => {
            const ms = access[f.id];
            const used = !!ms;
            return /*#__PURE__*/React.createElement("div", {
              key: f.id,
              style: {
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px",
                background: used ? "var(--c-surface-raised)" : "var(--c-surface, #fff)",
                border: "1px solid " + (used ? "#c6dfc6" : "var(--c-border)"),
                borderRadius: 8,
                minHeight: 44
              }
            },
              /*#__PURE__*/React.createElement("span", {
                style: {
                  width: 22, height: 22, borderRadius: "50%",
                  background: used ? "#2d5a2d" : "var(--c-surface-muted)",
                  color: used ? "#fff" : "#9ca3af",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0
                }
              }, used ? "✓" : "✗"),
              /*#__PURE__*/React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                /*#__PURE__*/React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--c-text)" } }, f.label),
                f.tipDesc && !used ? /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginTop: 2 } }, f.tipDesc) : null
              ),
              /*#__PURE__*/React.createElement("div", { style: { fontSize: 10, color: "#9ca3af", fontWeight: 500, flexShrink: 0 } }, fmtWhen(ms))
            );
          })
        )
      ))
    );
  }

  window.ScorecardPanel = ScorecardPanel;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ScorecardPanel;
  }
})();
