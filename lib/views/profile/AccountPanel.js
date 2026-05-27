// lib/views/profile/AccountPanel.js
//
// Profile > My Account panel: avatar, name field, lifetime stats grid,
// summary/calendar export, leave-a-review, danger-zone wipe, about row,
// sign-out.
//
// Wave 4.4.1. Originally inline at index.html L15404-L15579 (inside the
// `showProfile && (() => {})()` IIFE).
//
// VERBATIM body extraction with helpers-bag pattern (same as Header /
// TourOverlay): the JSX-equivalent tree is copied 1:1 from the inline
// source; a destructuring prelude re-binds every App-scope identifier
// the body references so render output is bit-identical.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function AccountPanel(props) {
    const cb = (props && props.callbacks) || {};
    const h = cb.helpers || {};
    const data = h.data;
    const demoMode = !!h.demoMode;
    const profileName = h.profileName || "";
    const setProfileName = h.setProfileName || (() => {});
    const setData = h.setData || (() => {});
    const authUser = h.authUser;
    const getStreak = h.getStreak || (() => 0);
    const exportSummary = h.exportSummary || (() => {});
    const exportHabitsICS = h.exportHabitsICS || (() => {});
    const openReviewLink = h.openReviewLink || (() => {});
    const setConfirmWipe = h.setConfirmWipe || (() => {});
    const setConfirmWipeTyped = h.setConfirmWipeTyped || (() => {});
    const setShowProfile = h.setShowProfile || (() => {});
    const doSignOut = h.doSignOut || (() => {});
    const sectionTitle = h.sectionTitle;
    const labelS = h.labelS;
    const inputS = h.inputS;
    const APP_VERSION = h.APP_VERSION;
    const SHELL_VERSION = h.SHELL_VERSION;
    const SUPPORT_EMAIL = h.SUPPORT_EMAIL;

    return /*#__PURE__*/React.createElement("div", null,
      sectionTitle("My Account"),
      /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 12 }
      }, /*#__PURE__*/React.createElement("div", {
        "data-brand": demoMode ? "1" : null,
        style: { width: 64, height: 64, borderRadius: "50%", background: "#2d5a2d", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }
      }, demoMode ? /*#__PURE__*/React.createElement("span", { style: { color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: .4 } }, "Demo") : profileName ? /*#__PURE__*/React.createElement("span", { style: { color: "#fff", fontSize: 28, fontWeight: 700 } }, profileName.charAt(0).toUpperCase()) : /*#__PURE__*/React.createElement("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "2" }, /*#__PURE__*/React.createElement("path", { d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "7", r: "4" }))),
      authUser ? /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, color: "#6b7280" } }, authUser.email) : null),
      /*#__PURE__*/React.createElement("div", { style: { marginBottom: 12 } },
        /*#__PURE__*/React.createElement("div", { style: labelS }, "Your Name"),
        /*#__PURE__*/React.createElement("input", {
          value: profileName,
          onChange: e => {
            const v = e.target.value;
            setProfileName(v);
            try { localStorage.setItem("v-profile-name", v); } catch (err) {}
            setData(d => ({ ...d, profileName: v }));
          },
          placeholder: "Enter your name...",
          style: inputS
        })),
      (() => {
        const hs = data.habits || [];
        const gs = data.goals || [];
        const archived = (data.goalArchive || data.archive || []);
        const activeH = hs.filter(h2 => h2.section !== "avoid");
        const bestStreakLive = activeH.length ? Math.max(0, ...activeH.map(h2 => getStreak(h2))) : 0;
        const bestStreakEver = Math.max(bestStreakLive, ...Object.values(data.bestStreaks || {}), 0);
        const daysActive = (data.dayVisits && data.dayVisits.length) || 0;
        const statCell = (value, label) => /*#__PURE__*/React.createElement("div", { style: { textAlign: "center" } },
          /*#__PURE__*/React.createElement("div", { style: { fontFamily: "'Lora',serif", fontSize: 20, fontWeight: 700, color: "#2d5a2d" } }, value),
          /*#__PURE__*/React.createElement("div", { style: { fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" } }, label)
        );
        return /*#__PURE__*/React.createElement("div", {
          style: { padding: "12px", background: "var(--c-tint-success-bg)", borderRadius: 10, marginBottom: 12 }
        },
          /*#__PURE__*/React.createElement("div", {
            style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10 }
          },
            statCell(hs.length, "Habits"),
            statCell(gs.length, "Goals"),
            statCell((data.xp || 0).toLocaleString(), "XP")
          ),
          /*#__PURE__*/React.createElement("div", {
            style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, paddingTop: 10, borderTop: "1px solid #c6dfc6" }
          },
            statCell(bestStreakEver, "Best streak"),
            statCell(archived.length, "Completed"),
            statCell(daysActive, "Days active")
          ),
          /*#__PURE__*/React.createElement("div", {
            style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, paddingTop: 10, marginTop: 10, borderTop: "1px solid #c6dfc6" }
          },
            statCell((data.userContent || []).length, "Content"),
            statCell((data.todos || []).length, "To-dos"),
            statCell((data.journal || []).length, "Journal")
          )
        );
      })(),
      /*#__PURE__*/React.createElement("div", { style: { marginBottom: 12 } },
        /*#__PURE__*/React.createElement("div", { style: labelS }, "Export summary"),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#9ca3af", marginBottom: 8 } }, "A plain-text victory-lap summary — aggregate counts only, no habit titles, journal entries, or daily completion logs."),
        /*#__PURE__*/React.createElement("button", {
          type: "button",
          onClick: exportSummary,
          style: { minHeight: 44, width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-surface-raised)", color: "var(--c-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }
        }, "Download summary (.txt)")
      ),
      /*#__PURE__*/React.createElement("div", { style: { marginBottom: 12 } },
        /*#__PURE__*/React.createElement("div", { style: labelS }, "Export to calendar"),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#9ca3af", marginBottom: 8, lineHeight: 1.5 } }, "Download an iCalendar (.ics) file you can open in Apple Calendar, Mail, Google Calendar, or Outlook. Each habit becomes a recurring event — morning at 6 AM, afternoon at 12 PM, evening at 6 PM, stacked by duration. Daily Completion habits become all-day events. Avoid habits are skipped."),
        /*#__PURE__*/React.createElement("button", {
          type: "button",
          onClick: exportHabitsICS,
          style: { minHeight: 44, width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-surface-raised)", color: "var(--c-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }
        }, "Download habits (.ics)")
      ),
      /*#__PURE__*/React.createElement("div", { style: { marginBottom: 12 } },
        /*#__PURE__*/React.createElement("div", { style: labelS }, "Leave a review"),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#9ca3af", marginBottom: 8 } }, "If Verrocchio's been useful, a rating helps other people find it."),
        /*#__PURE__*/React.createElement("button", {
          type: "button",
          onClick: () => openReviewLink(),
          style: { minHeight: 44, width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #2d5a2d", background: "var(--c-tint-success-bg)", color: "#2d5a2d", fontSize: 13, fontWeight: 700, cursor: "pointer" }
        }, "★ Rate Verrocchio")
      ),
      !demoMode && /*#__PURE__*/React.createElement("div", {
        style: { marginTop: 4, paddingTop: 14, borderTop: "1px solid var(--c-border)" }
      },
        /*#__PURE__*/React.createElement("div", {
          style: { fontSize: 11, fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }
        }, "Danger Zone"),
        /*#__PURE__*/React.createElement("div", {
          style: { fontSize: 11, color: "#9ca3af", marginBottom: 8, lineHeight: 1.5 }
        }, "Permanently erase every goal, habit, to-do, journal entry, and saved date on this account. Your sign-in stays intact — only the data is wiped."),
        /*#__PURE__*/React.createElement("button", {
          onClick: () => { setConfirmWipeTyped(""); setConfirmWipe("1"); },
          style: {
            background: "var(--c-tint-danger-bg)", border: "1px solid var(--c-tint-danger-border)",
            color: "var(--c-tint-danger-fg)", borderRadius: 8,
            padding: "8px 14px", fontSize: 12, fontWeight: 700,
            cursor: "pointer"
          }
        }, "Delete All Data")
      ),
      /*#__PURE__*/React.createElement("div", {
        style: { marginTop: 4, paddingTop: 14, borderTop: "1px solid var(--c-border)", fontSize: 11, color: "var(--c-text-faint)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }
      },
        /*#__PURE__*/React.createElement("span", null,
          "Verrocchio ",
          SHELL_VERSION || ("v" + APP_VERSION),
          SHELL_VERSION ? (" · " + APP_VERSION) : ""
        ),
        /*#__PURE__*/React.createElement("a", {
          href: "mailto:" + SUPPORT_EMAIL + "?subject=Verrocchio%20feedback%20(" + (SHELL_VERSION || ("v" + APP_VERSION)) + ")",
          rel: "noopener",
          style: { color: "#2d5a2d", textDecoration: "none", fontWeight: 600 }
        }, "Send feedback →")
      ),
      /*#__PURE__*/React.createElement("div", {
        style: { marginTop: 18 }
      },
        /*#__PURE__*/React.createElement("button", {
          type: "button",
          onClick: () => { setShowProfile(false); doSignOut(); },
          style: {
            width: "100%", minHeight: 44,
            padding: "12px 14px", borderRadius: 10,
            border: "1px solid var(--c-tint-danger-border)",
            background: "var(--c-tint-danger-bg)",
            color: "var(--c-tint-danger-fg)",
            fontSize: 13, fontWeight: 700, cursor: "pointer"
          }
        }, demoMode ? "Exit demo" : "Sign out")
      )
    );
  }

  window.AccountPanel = AccountPanel;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = AccountPanel;
  }
})();
