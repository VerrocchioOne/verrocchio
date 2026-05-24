// lib/modals/AchievementsModal.js
//
// Full-screen achievements browser grouped by category. Shows each
// achievement's tier, progress vs threshold, unlock date if earned.
//
// Wave 4.1.6. Originally inline at index.html L20031-L20155.
//
// Identifiers referenced from the shared classic-script global lexical
// environment (defined in body inline script of index.html, available
// at render time):
//   ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_TIERS,
//   FEATURES, Glyph

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function AchievementsModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const achievementStats = s.achievementStats || {};
    const onClose = cb.onClose || (() => {});

    const earnedCount = ACHIEVEMENTS.filter(a => (achievementStats[a.stat] || 0) >= a.threshold).length;

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "achievements-title",
      overlayStyle: { background: "rgba(0,0,0,0.5)", zIndex: 320 },
      cardStyle: { background: "#fff", borderRadius: "20px 20px 0 0", maxWidth: 720, height: "88vh", maxHeight: "88vh", boxShadow: "0 -8px 40px rgba(0,0,0,.2)", display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }
    },
      React.createElement("div", {
        style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }
      },
        React.createElement("div", null,
          React.createElement("div", { id: "achievements-title", className: "card-title", style: { fontSize: 18, color: "var(--c-text-strong)" } }, "Achievements"),
          React.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginTop: 2 } }, earnedCount + " of " + ACHIEVEMENTS.length + " unlocked")
        ),
        React.createElement("button", {
          "data-a11y-dialog-hide": true,
          "aria-label": "Close",
          style: { background: "var(--c-surface-muted)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }
        }, "×")
      ),
      React.createElement("div", {
        style: { flex: 1, overflowY: "auto", padding: "16px 18px 80px", display: "flex", flexDirection: "column", gap: 18 }
      },
        ACHIEVEMENT_CATEGORIES.map(cat => {
          const catAchievements = ACHIEVEMENTS.filter(a => a.cat === cat);
          if (catAchievements.length === 0) return null;
          const earnedInCat = catAchievements.filter(a => (achievementStats[a.stat] || 0) >= a.threshold).length;
          const statLabel = (() => {
            const sName = catAchievements[0].stat;
            if (sName === "visits") return achievementStats.visits + (achievementStats.visits === 1 ? " day opened" : " days opened");
            if (sName === "bestStreak") return "Best streak: " + achievementStats.bestStreak + "d";
            if (sName === "goals") return achievementStats.goals + " goal" + (achievementStats.goals === 1 ? "" : "s") + " completed";
            if (sName === "habitsActive") return achievementStats.habitsActive + " active habit" + (achievementStats.habitsActive === 1 ? "" : "s");
            if (sName === "xp") return achievementStats.xp.toLocaleString() + " XP earned";
            if (sName === "smartGoals") return achievementStats.smartGoals + " SMART-filled goal" + (achievementStats.smartGoals === 1 ? "" : "s");
            if (sName === "goalsCreated") return achievementStats.goalsCreated + " goal" + (achievementStats.goalsCreated === 1 ? "" : "s") + " created";
            if (sName === "activeGoalsCleared") return achievementStats.activeGoalsCleared ? "Clean slate reached" : "Active goals in play";
            if (sName === "habitPerGoal") return achievementStats.habitPerGoal ? "Every goal has a habit" : "Some goals need a habit";
            if (sName === "featuresExplored") return achievementStats.featuresExplored + " / " + FEATURES.length + " parts discovered";
            return "";
          })();
          return React.createElement("div", { key: cat },
            React.createElement("div", {
              style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }
            },
              React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--c-text-strong)", textTransform: "uppercase", letterSpacing: .5 } }, cat),
                React.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginTop: 2 } }, statLabel)
              ),
              React.createElement("div", {
                style: { fontSize: 11, fontWeight: 700, color: earnedInCat === catAchievements.length ? "#2d5a2d" : "#9ca3af" }
              }, earnedInCat + "/" + catAchievements.length)
            ),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
              catAchievements.map(a => {
                const statVal = achievementStats[a.stat] || 0;
                const earned = statVal >= a.threshold;
                const tier = ACHIEVEMENT_TIERS[a.tier] || ACHIEVEMENT_TIERS.Bronze;
                const pct = Math.min(100, Math.round((statVal / a.threshold) * 100));
                const unlockedAt = (data && data.achievementsUnlocked && data.achievementsUnlocked[a.id]) || null;
                return React.createElement("div", {
                  key: a.id,
                  style: {
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    background: earned ? tier.bg : "var(--c-surface-raised)",
                    border: "1px solid " + (earned ? tier.border : "var(--c-border)"),
                    borderRadius: 12,
                    opacity: earned ? 1 : .75
                  }
                },
                  React.createElement("div", {
                    style: {
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: earned ? "#fff" : "var(--c-surface-muted)",
                      border: "2px solid " + (earned ? tier.color : "#d1d5db"),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: earned ? tier.color : "#6b7280",
                      filter: earned ? "none" : "grayscale(1) opacity(.55)"
                    }
                  }, Glyph(a.icon, { size: 22, color: "currentColor", stroke: 1.6 })),
                  React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 } },
                      React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "var(--c-text-strong)" } }, a.name),
                      React.createElement("span", {
                        style: { fontSize: 9, fontWeight: 700, color: tier.color, background: tier.bg, border: "1px solid " + tier.border, padding: "1px 6px", borderRadius: 8, textTransform: "uppercase", letterSpacing: .3 }
                      }, a.tier)
                    ),
                    React.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginBottom: 4, lineHeight: 1.4 } }, a.desc),
                    earned
                      ? React.createElement("div", {
                          style: { fontSize: 10, color: tier.color, fontWeight: 600 }
                        },
                          "✓ Unlocked",
                          unlockedAt ? " · " + new Date(unlockedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""
                        )
                      : React.createElement("div", null,
                          React.createElement("div", {
                            style: { height: 4, background: "var(--c-border)", borderRadius: 2, overflow: "hidden", marginBottom: 3 }
                          },
                            React.createElement("div", {
                              style: { height: "100%", width: pct + "%", background: tier.color, borderRadius: 2, transition: "width .4s ease" }
                            })
                          ),
                          React.createElement("div", {
                            style: { fontSize: 10, color: "#9ca3af", fontWeight: 600 }
                          }, statVal + " / " + a.threshold)
                        )
                  )
                );
              })
            )
          );
        })
      )
    );
  }

  window.AchievementsModal = AchievementsModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { AchievementsModal };
  }
})();
