// lib/domains/achievements.js — pure derived stats feeding ACHIEVEMENTS.
//
// Single read function: computeAchievementStats(data, opts?). Returns a
// flat record of the numbers the Achievement tier list compares against
// (visits, bestStreak, goals, habitsActive, xp, smartGoals, goalsCreated,
// activeGoalsCleared, habitPerGoal, featuresExplored).
//
// Lifted out of App()'s achievementStats useMemo so the aggregator can be
// unit-tested independently of React + the live data sync. The useMemo
// wrapper stays in App() because it's React-coupled.
//
// Loaded as a classic browser script (puts `achievementsDomain` on Script
// scope + window) AND requireable in Node via the CJS guard at the
// bottom (mirrors lib/domains/calendar.js).

(function () {
"use strict";

// getStreak dual-load. Browser: utils.js sets a script-scope `getStreak`
// global; we re-bind it for use inside the IIFE-scoped function. Node:
// tests require this file directly, so we require utils.js explicitly.
// computeAchievementStats accepts opts.getStreak for deterministic tests
// without building real completion histories.
let _achGetStreak;
if (typeof require !== "undefined") {
  try { _achGetStreak = require("../../utils.js").getStreak; } catch (_) {}
}
if (!_achGetStreak && typeof globalThis !== "undefined" && typeof globalThis.getStreak === "function") {
  _achGetStreak = globalThis.getStreak;
}

// A goal qualifies as SMART-complete when every SMART field carries a
// non-empty value. `measurable` is the trickiest — the UI splits it into
// a number field + a unit field, so BOTH must be filled for the M to
// count.
const isSmartComplete = (g) => {
  const s = g && g.smart;
  if (!s) return false;
  const measurableOk = String(s.measurable     || "").trim().length > 0
                    && String(s.measurableUnit || "").trim().length > 0;
  return measurableOk
    && String(s.specific    || "").trim().length > 0
    && String(s.achievable  || "").trim().length > 0
    && String(s.relevant    || "").trim().length > 0
    && String(s.timebound   || "").trim().length > 0;
};

// ─────────────────────────────────────────────────────────────────────
// computeAchievementStats(data, opts?) -> { visits, bestStreak, goals,
//   habitsActive, xp, smartGoals, goalsCreated, activeGoalsCleared,
//   habitPerGoal, featuresExplored }
//
// opts:
//   getStreak: (h) => number  override the dual-loaded utils.js helper.
//                              Tests use this to score on a habit's own
//                              `_streak` field without building completions.
// ─────────────────────────────────────────────────────────────────────
const computeAchievementStats = (data, opts) => {
  const o = opts || {};
  const getStreak = typeof o.getStreak === "function" ? o.getStreak : _achGetStreak;
  const habitsArr  = (data && data.habits) || [];
  const goalsArr   = (data && data.goals) || [];
  const archiveArr = (data && data.goalArchive) || [];

  // Streak — max of (current per-habit streak across all habits) vs
  // (cached best from data.bestStreaks). The cache means streaks earned
  // and later reset still count toward the achievement.
  const currentBest = (typeof getStreak === "function" && habitsArr.length)
    ? Math.max(0, ...habitsArr.map(h => getStreak(h)))
    : 0;
  const cachedBest = Math.max(0, ...Object.values((data && data.bestStreaks) || {}), 0);

  // §6 Future Habits — only ACTIVE (non-parked) habits count for the
  // Builder achievement + the habit-per-goal check. Parked habits
  // mustn't satisfy either.
  const activeHabitsArr = habitsArr.filter(h => h && !h.parked);
  const linkedGoalIds = new Set(
    activeHabitsArr.map(h => h && h.goalId).filter(Boolean).map(String)
  );
  // habitPerGoal: 1 when there's at least one goal AND every live goal's
  // id appears as a goalId on at least one active habit. Empty workspace
  // stays locked (otherwise zero goals would trivially pass .every).
  const habitPerGoal = (goalsArr.length >= 1
    && goalsArr.every(g => linkedGoalIds.has(String(g.id)))) ? 1 : 0;

  const smartGoals = goalsArr.filter(isSmartComplete).length
                   + archiveArr.filter(isSmartComplete).length;
  const goalsCreated = goalsArr.length + archiveArr.length;
  // activeGoalsCleared: 1 at the "zero active, ≥1 archived" clean-slate
  // moment, else 0. Boolean-as-threshold so the existing `statVal >=
  // threshold` unlock check works unchanged.
  const activeGoalsCleared = (goalsArr.length === 0 && archiveArr.length >= 1) ? 1 : 0;

  // featuresExplored: number of FEATURES entries the user has actually
  // touched at least once. touchFeature writes a timestamp into
  // data.featureAccess keyed by feature id — so the count of non-empty
  // entries is a direct read of "how much of the app has been
  // discovered".
  const fa = (data && data.featureAccess) || {};
  const featuresExplored = Object.keys(fa).filter(k => !!fa[k]).length;

  return {
    visits: ((data && data.dayVisits) || []).length,
    bestStreak: Math.max(currentBest, cachedBest),
    goals: archiveArr.length,
    habitsActive: activeHabitsArr.length,
    xp: (data && data.xp) || 0,
    smartGoals,
    goalsCreated,
    activeGoalsCleared,
    habitPerGoal,
    featuresExplored
  };
};

const achievementsDomain = { computeAchievementStats, isSmartComplete };

if (typeof module !== "undefined" && module.exports) {
  module.exports = { achievementsDomain };
} else if (typeof window !== "undefined") {
  window.achievementsDomain = achievementsDomain;
}

})();
