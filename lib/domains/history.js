// lib/domains/history.js — pure history-timeline aggregator.
//
// Builds the flat timeline feeding the Profile sheet's History panel.
// Reads three collections off `data`:
//   - goalArchive[]                  -> "goal-completed" events
//   - goals[].history[]              -> "goal-edited" events
//   - habits[].history[]             -> "habit-edited" events
// and returns a single array sorted descending by `ts`.
//
// Lifted out of App()'s memoedHistoryEvents IIFE so the aggregator is
// unit-testable. The useMemo wrapper stays in App() because it
// depends on React.
//
// Loaded as a classic browser script (puts `historyDomain` on Script
// scope + window) AND requireable in Node via the CJS guard at the
// bottom (mirrors lib/domains/calendar.js).

(function () {
"use strict";

// ─────────────────────────────────────────────────────────────────────
// flatHistoryEvents(data) -> [{ ts, kind, ... }] sorted ts-desc.
//
// Event shapes:
//   { ts, kind: "goal-completed", name, type, nextGoal, id }
//   { ts, kind: "goal-edited",    name, type, prevText, id }
//   { ts, kind: "habit-edited",   name, type, prevText, prevImp, prevSec,
//                                  habitId, archived, id }
//
// Skips snapshots / archived goals lacking a finite numeric `ts`. Treats
// missing arrays (data.goalArchive / data.goals / data.habits) as []
// so the function never throws on partially-hydrated cloud docs.
// ─────────────────────────────────────────────────────────────────────
const flatHistoryEvents = (data) => {
  const out = [];
  const goalArchive = (data && data.goalArchive) || [];
  const goals       = (data && data.goals) || [];
  const habits      = (data && data.habits) || [];

  for (const g of goalArchive) {
    if (!g) continue;
    const ts = g.archivedAt ? new Date(g.archivedAt).getTime() : 0;
    if (!ts || !isFinite(ts)) continue;
    const nextGoal = goals.find(ng => ng && ng.parentGoalId === g.id);
    out.push({
      ts,
      kind: "goal-completed",
      name: g.text,
      type: g.type,
      nextGoal: nextGoal || null,
      id: "gc-" + g.id
    });
  }

  for (const g of goals) {
    if (!g) continue;
    for (const snap of (g.history || [])) {
      if (!snap || typeof snap.ts !== "number") continue;
      out.push({
        ts: snap.ts,
        kind: "goal-edited",
        name: g.text,
        type: g.type,
        prevText: snap.text,
        id: "ge-" + g.id + "-" + snap.ts
      });
    }
  }

  for (const h of habits) {
    if (!h) continue;
    for (const snap of (h.history || [])) {
      if (!snap || typeof snap.ts !== "number") continue;
      // §VersionTimeline — carry habitId so the History panel can
      // expand the row into the full per-habit version timeline.
      // `archived` propagates the archive flag (set by the §StreakChoice
      // "This is a new habit" path) so the UI can mark old definitions
      // as superseded.
      out.push({
        ts: snap.ts,
        kind: "habit-edited",
        name: h.text,
        type: h.type,
        prevText: snap.text,
        prevImp: snap.importance,
        prevSec: snap.section,
        habitId: h.id,
        archived: !!h.archived,
        id: "he-" + h.id + "-" + snap.ts
      });
    }
  }

  return out.sort((a, b) => b.ts - a.ts);
};

const historyDomain = { flatHistoryEvents };

if (typeof module !== "undefined" && module.exports) {
  module.exports = { historyDomain };
} else if (typeof window !== "undefined") {
  window.historyDomain = historyDomain;
}

})();
