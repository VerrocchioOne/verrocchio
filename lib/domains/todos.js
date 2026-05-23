// lib/domains/todos.js — Pure READ-side derivations for the Todos view.
//
// Extracted from index.html's `tab === "todos"` render block (Phase B of v75).
// All functions are pure: inputs are plain `data`-shaped objects (and small
// scalar args); outputs are derived values or new arrays/objects. Nothing
// here touches React, the DOM, Firestore, localStorage, or `latestData`.
//
// WRITE-side helpers (addTodo, chkTodo, delTodo, archiveTodo, restoreTodo,
// svETodo, reordTodos) stay in App() — they reference save / pushUndo /
// touchFeature / latestData.current and a clutch of useState setters. They
// are exposed to TodosView via the `callbacks` prop bag.

// Day difference between two YYYY-MM-DD keys, computed in LOCAL time so the
// day boundary matches dk(). Avoids parsing through UTC, which would shift
// the result by ±1 near midnight for users east/west of UTC.
function dayDiff(dueKey, todayKey) {
  if (!dueKey || !todayKey) return null;
  const dm = /^(\d{4})-(\d{2})-(\d{2})/.exec(dueKey);
  const tm = /^(\d{4})-(\d{2})-(\d{2})/.exec(todayKey);
  if (!dm || !tm) return null;
  const due = new Date(+dm[1], +dm[2] - 1, +dm[3]);
  due.setHours(0, 0, 0, 0);
  const today = new Date(+tm[1], +tm[2] - 1, +tm[3]);
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

// Pending todos — not yet completed and not archived. Mirrors the inline
// `pending = data.todos.filter(t => !t.done && !t.archived)` exactly so a
// later refactor that swaps in this helper produces the same list.
function pendingTodos(data) {
  return ((data && data.todos) || []).filter(t => t && !t.done && !t.archived);
}

// Single-todo section classifier — same buckets as the inline `getSec`:
// "today" (due today or earlier), "week" (within current week), "month"
// (within current month), "later" (further out), "unassigned" (no due
// date). Inline used `eow` = end-of-current-week and `eom` =
// end-of-current-month based on the local clock; we accept an explicit
// `todayKey` so callers (and tests) can pin a deterministic "today".
function getSection(todo, todayKey) {
  if (!todo || !todo.dueDate) return "unassigned";
  const diff = dayDiff(todo.dueDate, todayKey);
  if (diff == null) return "unassigned";
  if (diff <= 0) return "today";
  const tm = /^(\d{4})-(\d{2})-(\d{2})/.exec(todayKey);
  if (!tm) return "unassigned";
  const today = new Date(+tm[1], +tm[2] - 1, +tm[3]);
  today.setHours(0, 0, 0, 0);
  // End of this week (Sat at 23:59:59), matching inline: today + (6 - getDay()).
  const eow = new Date(today);
  eow.setDate(today.getDate() + (6 - today.getDay()));
  // End of this month (last calendar day).
  const eom = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const dm = /^(\d{4})-(\d{2})-(\d{2})/.exec(todo.dueDate);
  if (!dm) return "unassigned";
  const due = new Date(+dm[1], +dm[2] - 1, +dm[3]);
  due.setHours(0, 0, 0, 0);
  if (due <= eow) return "week";
  if (due <= eom) return "month";
  return "later";
}

// Group pending todos by the same {today, week, month, later, unassigned}
// buckets the Todos tab renders. Returns a flat object — callers iterate
// in the canonical SECS order (defined in the view).
function byPriority(data, todayKey) {
  const out = { today: [], week: [], month: [], later: [], unassigned: [] };
  const pending = pendingTodos(data);
  for (const t of pending) {
    const sec = getSection(t, todayKey);
    (out[sec] || out.unassigned).push(t);
  }
  return out;
}

// Pending todos with a due date strictly before `todayKey`. Excludes
// archived + completed. Useful for any "overdue" surface (Brief, banners).
function overdue(data, todayKey) {
  return pendingTodos(data).filter(t => {
    if (!t.dueDate) return false;
    const diff = dayDiff(t.dueDate, todayKey);
    return diff != null && diff < 0;
  });
}

// Pending todos due within the next `days` calendar days (today inclusive,
// past-due excluded). When `days = 3`, this matches the inline
// "todoHasUrgent" banner detector.
function dueSoon(data, days, todayKey) {
  const n = typeof days === "number" ? days : 7;
  return pendingTodos(data).filter(t => {
    if (!t.dueDate) return false;
    const diff = dayDiff(t.dueDate, todayKey);
    return diff != null && diff >= 0 && diff <= n;
  });
}

// True when the home "urgent todos" card still has unreviewed items —
// mirrors the inline `todoHasUrgent` check (any pending todo with a due
// date within 3 days, including past-due). Used by the "return to home
// review" banner gating.
function hasUrgent(data, todayKey) {
  return ((data && data.todos) || []).some(t => {
    if (!t || t.completedDate || t.done || t.archived || !t.dueDate) return false;
    const diff = dayDiff(t.dueDate, todayKey);
    return diff != null && diff <= 3;
  });
}

// Pure version of the inline `dueStatus(d)` helper: returns the pill
// label + color tokens for a given due date, or null if no date.
function dueStatus(dueKey, todayKey) {
  if (!dueKey) return null;
  const diff = dayDiff(dueKey, todayKey);
  if (diff == null) return null;
  if (diff < 0)  return { label: "Overdue",      color: "#dc2626", bg: "#fef2f2" };
  if (diff === 0) return { label: "Due today",    color: "#d97706", bg: "#fffbeb" };
  if (diff === 1) return { label: "Due tomorrow", color: "#d97706", bg: "#fffbeb" };
  if (diff <= 7)  return { label: `Due in ${diff}d`, color: "#0891b2", bg: "#f0f9ff" };
  // Fall-through: format month/day for long-out dates. Uses local Date
  // construction (not UTC) so the month name matches the user's clock.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dueKey);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(dueKey);
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    color: "#6b7280",
    bg: "var(--c-surface-raised)"
  };
}

// "No due date" predicate — the inline UI shows a 🚨 glyph for todos
// missing a due date. Kept here as a pure check so the same definition
// is testable + reusable.
function isTodoIncomplete(todo) {
  if (!todo) return false;
  if (!todo.dueDate) return true;
  return false;
}

// Archived (but not deleted, not completed) todos — the "View archive"
// drawer's contents.
function archivedTodos(data) {
  return ((data && data.todos) || []).filter(t => t && t.archived);
}

// Completed-archive list rendered in the "Completed (N)" footer. The
// inline reverses + slices the last 15; we keep the cap configurable
// so the same helper can power a "show more" path in future.
function completedArchive(data, limit) {
  const cap = typeof limit === "number" ? limit : 15;
  const arch = (data && data.archive) || [];
  return arch.slice().reverse().slice(0, cap);
}

const todosDomain = {
  byPriority,
  dueSoon,
  overdue,
  pendingTodos,
  getSection,
  hasUrgent,
  dueStatus,
  isTodoIncomplete,
  archivedTodos,
  completedArchive
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { todosDomain };
} else if (typeof window !== "undefined") {
  window.todosDomain = todosDomain;
}
