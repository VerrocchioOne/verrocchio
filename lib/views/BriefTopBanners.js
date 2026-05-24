// lib/views/BriefTopBanners.js
//
// Three secondary signal cards that render above the main brief-view
// grid. Extracted from BriefView.js to keep that file under the 1000-LOC
// cap (see CLAUDE.md "File-size rule"):
//
//   1. Morning debrief entry banner   — pre-debrief CTA
//   2. Evening debrief entry banner   — gated on enabled + after 6pm
//   3. Additive-crowding insight card — gated on 7-day non-repeat window
//
// All three are render-time gated; the parent renders an empty fragment
// when none apply. Behavior is byte-identical to the inline blocks they
// replace at the equivalent BriefView positions.
//
// Props bundle:
//   data                    — full app data object
//   todayK                  — today's date key (YYYY-MM-DD via dk())
//   cb                      — BriefView callbacks bundle
//   detectAdditiveCrowding  — h.detectAdditiveCrowding helper from App

(function () {
  if (typeof window === "undefined" || !window.React) return;
  const R = window.React;

  function BriefTopBanners({ data, todayK, cb, detectAdditiveCrowding }) {
    data = data || {};
    cb = cb || {};
    detectAdditiveCrowding = detectAdditiveCrowding || (() => null);

    // ── Morning debrief entry ────────────────────────────────────────
    const debriefEntry = (function () {
      const ritD = (data.dailyRitual && data.dailyRitual[todayK]) || {};
      if (ritD.debriefCompletedAt) return null;
      return R.createElement("div", {
        key: "debrief-entry",
        style: {
          background: "var(--c-tint-info-bg, #eff6ff)",
          border: "1px solid var(--c-tint-info-border, #bfdbfe)",
          borderRadius: 12, padding: "14px 16px", marginBottom: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
        }
      },
        R.createElement("div", null,
          R.createElement("div", {
            style: { fontSize: 11, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 4 }
          }, "Morning ritual"),
          R.createElement("div", {
            style: { fontSize: 14, color: "var(--c-text-strong)" }
          }, "Run today's debrief — 4 quick steps")
        ),
        R.createElement("button", {
          onClick: () => cb.onStartDebrief && cb.onStartDebrief(),
          style: {
            padding: "8px 14px", background: "var(--accent, #2d5a2d)", color: "#fff",
            border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap"
          }
        }, "Start")
      );
    })();

    // ── Evening debrief entry ────────────────────────────────────────
    const eveningDebriefEntry = (function () {
      if (!data.eveningDebriefEnabled) return null;
      const now = new Date();
      if (now.getHours() < 18) return null;
      const ritD = (data.dailyRitual && data.dailyRitual[todayK]) || {};
      if (ritD.eveningDebriefCompletedAt) return null;
      return R.createElement("div", {
        key: "evening-debrief-entry",
        style: {
          background: "var(--c-tint-purple-bg, #f5f3ff)",
          border: "1px solid var(--c-tint-purple-border, #ddd6fe)",
          borderRadius: 12, padding: "14px 16px", marginBottom: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
        }
      },
        R.createElement("div", null,
          R.createElement("div", {
            style: { fontSize: 11, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 4 }
          }, "Evening ritual"),
          R.createElement("div", {
            style: { fontSize: 14, color: "var(--c-text-strong)" }
          }, "Close the day — 3 quick steps")
        ),
        R.createElement("button", {
          onClick: () => cb.onStartEveningDebrief && cb.onStartEveningDebrief(),
          style: {
            padding: "8px 14px", background: "var(--c-tint-purple-fg, #7c3aed)", color: "#fff",
            border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap"
          }
        }, "Start")
      );
    })();

    // ── Additive-crowding insight card ───────────────────────────────
    const crowdingPair = (function () {
      const recentShown = new Set();
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = dk(d);
        const r = (data.dailyRitual && data.dailyRitual[k]) || {};
        (r.crowdingPromptsShown || []).forEach(p => recentShown.add(p));
      }
      const det = detectAdditiveCrowding((data.habits || []).filter(h0 => !h0.parked), new Date());
      if (!det) return null;
      const key = det.additive.id + "-" + det.nonNeg.id;
      if (recentShown.has(key)) return null;
      return det;
    })();
    const crowdingCard = crowdingPair && R.createElement("div", {
      key: "crowding-card",
      style: {
        background: "var(--c-tint-warn-bg, #fffbeb)",
        border: "1px solid var(--c-tint-warn-border, #fde68a)",
        borderRadius: 12, padding: 16, marginBottom: 12, color: "var(--c-text-strong)"
      }
    },
      R.createElement("div", {
        style: { fontSize: 11, color: "var(--c-tint-warn-fg, #b45309)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, fontWeight: 600 }
      }, "Habit pattern"),
      R.createElement("div", {
        style: { fontSize: 14, lineHeight: 1.5, marginBottom: 8 }
      }, "Are any of the habits you're nailing distracting you from the ones that matter most?"),
      R.createElement("div", {
        style: { fontSize: 13, color: "var(--c-text-soft)", marginBottom: 12, fontStyle: "italic" }
      }, "You've done “" + crowdingPair.additive.text + "” " + crowdingPair.additiveDone + "/14 days, but “" + crowdingPair.nonNeg.text + "” only " + crowdingPair.nonNegDone + "/14."),
      R.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
        crowdingPair.nonNeg.section === crowdingPair.additive.section && R.createElement("button", {
          onClick: () => cb.onReorderCrowdingPair && cb.onReorderCrowdingPair(crowdingPair.nonNeg.id, crowdingPair.additive.id),
          style: { padding: "8px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }
        }, "Move “" + crowdingPair.nonNeg.text + "” above “" + crowdingPair.additive.text + "”"),
        R.createElement("button", {
          onClick: () => cb.onDismissCrowdingPair && cb.onDismissCrowdingPair(crowdingPair.additive.id, crowdingPair.nonNeg.id),
          style: { padding: "8px 14px", background: "transparent", color: "var(--c-text-soft)", border: "1px solid var(--c-border)", borderRadius: 8, fontSize: 13, cursor: "pointer" }
        }, "Dismiss")
      )
    );

    return R.createElement(R.Fragment, null,
      debriefEntry,
      eveningDebriefEntry,
      crowdingCard
    );
  }

  window.BriefTopBanners = BriefTopBanners;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { BriefTopBanners };
  }
})();
