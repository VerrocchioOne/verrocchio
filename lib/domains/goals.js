// lib/domains/goals.js — Pure READ-side derivations for the Goals view.
//
// Extracted from index.html's `tab === "goals"` render block (Phase B of v75).
// All functions are pure: inputs are plain `data`-shaped objects (and small
// scalar args); outputs are derived values or new arrays/objects. Nothing
// here touches React, the DOM, Firestore, localStorage, or `latestData`.
//
// WRITE-side helpers (addGoal, svEGoal, delGoal, completeGoal, reordGoals,
// the SMART form state, toggleGoalSub, etc.) stay in App() — they reference
// save / pushUndo / touchFeature / latestData.current / useState setters.
// They are exposed to GoalsView via the `callbacks` prop bag.
//
// dual-load guard at the bottom; mirror tests/merge.test.mjs structure.

// ─────────────────────────────────────────────────────────────────────
// habitGoalIds / habitLinkedToGoal — re-implemented here as pure helpers.
// Source-of-truth lives in index.html (~line 1780). Keep the contract
// identical so a habit doc carrying either the new `goalIds: number[]`
// shape or the legacy `goalId: number` scalar resolves the same way.
// ─────────────────────────────────────────────────────────────────────
function habitGoalIds(h) {
  if (!h) return [];
  if (Array.isArray(h.goalIds)) return h.goalIds.filter(x => x != null);
  if (h.goalId != null) return [h.goalId];
  return [];
}

function habitLinkedToGoal(h, goalId) {
  return habitGoalIds(h).some(gid => String(gid) === String(goalId));
}

// ─────────────────────────────────────────────────────────────────────
// smartCompleteness(goal) — returns which of the 5 SMART letters are
// present + filled count + missing array. Used by the goal card's
// "S.M.A.R.T. Framework" sub-header (renders "{filled}/5" plus a red
// title when filled < 5).
//
// Matches the inline counting at index.html:20374-20382 exactly:
//   - M is "filled" if either `measurable` OR `measurableUnit` has a
//     non-empty trimmed value (unit alone still counts as info).
//   - The other 4 letters count their own field only.
// ─────────────────────────────────────────────────────────────────────
const SMART_KEYS = ["specific", "measurable", "achievable", "relevant", "timebound"];

function _hasVal(v) {
  return v != null && String(v).trim().length > 0;
}

function smartCompleteness(goal) {
  const sm = (goal && goal.smart) || {};
  const mFilled = _hasVal(sm.measurable) || _hasVal(sm.measurableUnit);
  const present = {
    specific:   _hasVal(sm.specific),
    measurable: mFilled,
    achievable: _hasVal(sm.achievable),
    relevant:   _hasVal(sm.relevant),
    timebound:  _hasVal(sm.timebound)
  };
  const missing = SMART_KEYS.filter(k => !present[k]);
  const filled  = SMART_KEYS.length - missing.length;
  const hasAny  = filled > 0;
  return { present, missing, filled, total: SMART_KEYS.length, hasAny };
}

// ─────────────────────────────────────────────────────────────────────
// isLinkedGoalIncomplete(habit, goals) — used for the habit-card ⚠️
// warning emoji. Mirrors the stricter `isLinkedGoalIncomplete(goal)`
// at index.html:8200 plus the per-habit walk used at the habit-card
// render site: returns true if ANY of the habit's linked goals is
// missing text, S, M, A, R, or T.
//
// Pure: takes the habit + the full goals array, resolves the linked
// goal ids, and checks each. False when the habit has no linked goals.
// ─────────────────────────────────────────────────────────────────────
function _goalMissingAnyRequired(goal) {
  if (!goal) return false;
  if (!goal.text || !String(goal.text).trim()) return true;
  const s = goal.smart || {};
  for (const k of SMART_KEYS) {
    if (k === "measurable") {
      if (!_hasVal(s.measurable) && !_hasVal(s.measurableUnit)) return true;
    } else if (!_hasVal(s[k])) {
      return true;
    }
  }
  return false;
}

function isLinkedGoalIncomplete(habit, goals) {
  const ids = habitGoalIds(habit);
  if (ids.length === 0) return false;
  const list = Array.isArray(goals) ? goals : [];
  for (const gid of ids) {
    const g = list.find(x => String(x.id) === String(gid));
    if (g && _goalMissingAnyRequired(g)) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────
// isGoalCardIncomplete(goal) — looser variant matching index.html:8183
// (`isGoalIncomplete`). Used for the per-goal-card 🚨 glyph. Returns
// true when: no area-of-life, OR zero SMART fields touched, OR no
// time-bound date. Distinct from isLinkedGoalIncomplete (which gates
// on EVERY SMART field) so the two surfaces nudge for different rigor.
// ─────────────────────────────────────────────────────────────────────
function isGoalCardIncomplete(goal) {
  if (!goal) return false;
  if (!goal.type) return true;
  const sm = goal.smart || {};
  const anyTouched = SMART_KEYS.some(k => _hasVal(sm[k]));
  if (!anyTouched) return true;
  if (!_hasVal(sm.timebound)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────
// bySectionGroup(data, opts) — goals grouped by Area-of-Life (the goal's
// `type` field), each group enriched with its linked habits.
//
// "Section" in this view = Area-of-Life value. Returns:
//   {
//     groups: [{ type, goals: [{ goal, linkedHabits, linkedTodos }] }, …],
//     untyped: [{ goal, linkedHabits, linkedTodos }, …],   // goals with no type
//     future:  [goal, …]                                   // no active linked habit
//   }
//
// Mirrors the inline filtering at index.html:20294-20306:
//   - isActiveGoal: at least one linked habit that ISN'T parked
//   - future bucket: opposite (no active habits)
//   - parked habits are excluded from each group's linkedHabits
//     (§6 Future Habits — parked habits don't count toward momentum)
//
// `opts.includeParkedHabits` (default false) flips that filter for
// callers that want the full link set.
// ─────────────────────────────────────────────────────────────────────
function bySectionGroup(data, opts) {
  const includeParked = !!(opts && opts.includeParkedHabits);
  const goals  = (data && data.goals)  || [];
  const habits = (data && data.habits) || [];
  const todos  = (data && data.todos)  || [];

  const linkedHabitsFor = (goalId) => {
    return habits.filter(h => habitLinkedToGoal(h, goalId) && (includeParked || !h.parked));
  };
  const linkedTodosFor = (goalId) => {
    return todos.filter(t => String(t.goalId) === String(goalId));
  };
  const isActiveGoal = (g) => linkedHabitsFor(g.id).length > 0;

  // Bucket the active goals by their `type`, preserving the original
  // goals[] order within each bucket (the view applies its own sort
  // on top). Untyped (no `type`) goals get their own "General" group.
  const byType = new Map();
  const untyped = [];
  const future = [];

  for (const g of goals) {
    if (!isActiveGoal(g)) {
      future.push(g);
      continue;
    }
    const enriched = {
      goal: g,
      linkedHabits: linkedHabitsFor(g.id),
      linkedTodos: linkedTodosFor(g.id)
    };
    if (!g.type) {
      untyped.push(enriched);
      continue;
    }
    if (!byType.has(g.type)) byType.set(g.type, []);
    byType.get(g.type).push(enriched);
  }

  const groups = [];
  for (const [type, goalsInType] of byType.entries()) {
    groups.push({ type, goals: goalsInType });
  }

  return { groups, untyped, future };
}

// ─────────────────────────────────────────────────────────────────────
// linkedHabitsFor(data, goalId, opts) — convenience pure helper used by
// GoalsView's per-card linked-habits list. Same parked-exclusion rule as
// bySectionGroup. Extracted so the view doesn't have to repeat the
// `.filter(h => habitLinkedToGoal(h, id) && !h.parked)` line.
// ─────────────────────────────────────────────────────────────────────
function linkedHabitsFor(data, goalId, opts) {
  const includeParked = !!(opts && opts.includeParkedHabits);
  const habits = (data && data.habits) || [];
  return habits.filter(h => habitLinkedToGoal(h, goalId) && (includeParked || !h.parked));
}

// ─────────────────────────────────────────────────────────────────────
// linkedTodosFor(data, goalId) — pending todos linked to a goal.
// ─────────────────────────────────────────────────────────────────────
function linkedTodosFor(data, goalId) {
  const todos = (data && data.todos) || [];
  return todos.filter(t => String(t.goalId) === String(goalId));
}

const goalsDomain = {
  bySectionGroup,
  smartCompleteness,
  isLinkedGoalIncomplete,
  isGoalCardIncomplete,
  linkedHabitsFor,
  linkedTodosFor,
  habitGoalIds,
  habitLinkedToGoal,
  SMART_KEYS
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { goalsDomain };
} else if (typeof window !== "undefined") {
  window.goalsDomain = goalsDomain;
}
