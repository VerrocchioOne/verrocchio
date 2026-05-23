// Tests for the pure READ-side derivations in lib/domains/todos.js
// (Phase B of v75 view extraction). Mirrors the createRequire pattern
// established by tests/merge.test.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { todosDomain } = require("../../lib/domains/todos.js");

const TODAY = "2026-05-23"; // matches the project's currentDate memory

// Build a small fixture: one overdue todo, one due today, one due in 3 days,
// one due 20 days out (still in May for THIS month), one due in July (later),
// one with no due date, one already done, and one archived.
function fx() {
  return {
    todos: [
      { id: "t1", text: "Overdue thing",      done: false, archived: false, dueDate: "2026-05-20" },
      { id: "t2", text: "Today thing",        done: false, archived: false, dueDate: TODAY },
      { id: "t3", text: "In 3 days",          done: false, archived: false, dueDate: "2026-05-26" },
      { id: "t4", text: "Later this month",   done: false, archived: false, dueDate: "2026-05-30" },
      { id: "t5", text: "Next month",         done: false, archived: false, dueDate: "2026-07-04" },
      { id: "t6", text: "No date",            done: false, archived: false },
      { id: "t7", text: "Already done",       done: true,  archived: false, dueDate: TODAY },
      { id: "t8", text: "Archived",           done: false, archived: true,  dueDate: "2026-05-21" }
    ],
    archive: [
      { id: "x1", text: "Completed 1", archivedAt: "2026-05-22T10:00:00Z" },
      { id: "x2", text: "Completed 2", archivedAt: "2026-05-22T11:00:00Z" }
    ]
  };
}

// ─────────────────────────────────────────────────────────────────────────
// pendingTodos
// ─────────────────────────────────────────────────────────────────────────

test("pendingTodos excludes done + archived", () => {
  const out = todosDomain.pendingTodos(fx());
  const ids = out.map(t => t.id);
  assert.deepEqual(ids, ["t1", "t2", "t3", "t4", "t5", "t6"]);
});

test("pendingTodos handles missing/empty data shapes", () => {
  assert.deepEqual(todosDomain.pendingTodos(null), []);
  assert.deepEqual(todosDomain.pendingTodos({}), []);
  assert.deepEqual(todosDomain.pendingTodos({ todos: [] }), []);
});

// ─────────────────────────────────────────────────────────────────────────
// getSection — single-todo classifier
// ─────────────────────────────────────────────────────────────────────────

test("getSection: no dueDate -> 'unassigned'", () => {
  assert.equal(todosDomain.getSection({ id: "x" }, TODAY), "unassigned");
});

test("getSection: overdue and due-today both bucket to 'today'", () => {
  assert.equal(todosDomain.getSection({ dueDate: "2026-05-22" }, TODAY), "today");
  assert.equal(todosDomain.getSection({ dueDate: TODAY }, TODAY), "today");
});

test("getSection: within current week -> 'week'", () => {
  // 2026-05-24 is a Sunday in 2026 -> end-of-week is the following Saturday,
  // so 2026-05-26 (Tuesday) falls into 'week'.
  const sunday = "2026-05-24";
  assert.equal(todosDomain.getSection({ dueDate: "2026-05-26" }, sunday), "week");
});

test("getSection: due later in same month -> 'month'", () => {
  assert.equal(todosDomain.getSection({ dueDate: "2026-05-30" }, TODAY), "month");
});

test("getSection: due in a future month -> 'later'", () => {
  assert.equal(todosDomain.getSection({ dueDate: "2026-07-04" }, TODAY), "later");
});

// ─────────────────────────────────────────────────────────────────────────
// byPriority
// ─────────────────────────────────────────────────────────────────────────

test("byPriority groups pending todos by section", () => {
  const g = todosDomain.byPriority(fx(), TODAY);
  assert.deepEqual(g.today.map(t => t.id),      ["t1", "t2"]);
  // 2026-05-23 (TODAY) is a Saturday in 2026; end-of-week = same day,
  // so "in 3 days" (2026-05-26) falls past end-of-week and into 'month'.
  // This matches the inline behavior exactly.
  assert.deepEqual(g.week.map(t => t.id),       []);
  assert.deepEqual(g.month.map(t => t.id),      ["t3", "t4"]);
  assert.deepEqual(g.later.map(t => t.id),      ["t5"]);
  assert.deepEqual(g.unassigned.map(t => t.id), ["t6"]);
});

test("byPriority: archived + done are never included", () => {
  const g = todosDomain.byPriority(fx(), TODAY);
  const all = [...g.today, ...g.week, ...g.month, ...g.later, ...g.unassigned];
  const ids = new Set(all.map(t => t.id));
  assert.equal(ids.has("t7"), false, "done excluded");
  assert.equal(ids.has("t8"), false, "archived excluded");
});

// ─────────────────────────────────────────────────────────────────────────
// overdue
// ─────────────────────────────────────────────────────────────────────────

test("overdue: returns only pending todos with dueDate < todayKey", () => {
  const out = todosDomain.overdue(fx(), TODAY);
  const ids = out.map(t => t.id);
  assert.deepEqual(ids, ["t1"]);
});

test("overdue: empty when nothing past-due", () => {
  const data = { todos: [{ id: "a", dueDate: TODAY, done: false, archived: false }] };
  assert.deepEqual(todosDomain.overdue(data, TODAY), []);
});

// ─────────────────────────────────────────────────────────────────────────
// dueSoon
// ─────────────────────────────────────────────────────────────────────────

test("dueSoon(data, 3) includes today + within-3-days, excludes overdue and beyond", () => {
  const out = todosDomain.dueSoon(fx(), 3, TODAY);
  const ids = out.map(t => t.id);
  // t1 overdue -> excluded. t2 today -> included. t3 in 3 days -> included.
  // t4 in 7 days -> excluded. t5 next month -> excluded. t6 no date -> excluded.
  assert.deepEqual(ids, ["t2", "t3"]);
});

test("dueSoon defaults to a 7-day window when `days` omitted", () => {
  const out = todosDomain.dueSoon(fx(), undefined, TODAY);
  const ids = out.map(t => t.id);
  // Default window = 7 days. t2 (today), t3 (+3d), t4 (+7d, 2026-05-30)
  // all qualify; t1 is past-due, t5 is 6 weeks out, t6 has no date.
  assert.deepEqual(ids, ["t2", "t3", "t4"]);
});

// ─────────────────────────────────────────────────────────────────────────
// hasUrgent — banner gating
// ─────────────────────────────────────────────────────────────────────────

test("hasUrgent: true when any pending todo is due within 3 days (today or past)", () => {
  assert.equal(todosDomain.hasUrgent(fx(), TODAY), true);
});

test("hasUrgent: false when no pending todos are inside the 3-day urgency window", () => {
  const data = {
    todos: [
      { id: "a", dueDate: "2026-06-10", done: false, archived: false },
      { id: "b", dueDate: null,         done: false, archived: false }
    ]
  };
  assert.equal(todosDomain.hasUrgent(data, TODAY), false);
});

// ─────────────────────────────────────────────────────────────────────────
// dueStatus — pill label/color helper
// ─────────────────────────────────────────────────────────────────────────

test("dueStatus: overdue date -> 'Overdue' label with red color", () => {
  const s = todosDomain.dueStatus("2026-05-20", TODAY);
  assert.equal(s.label, "Overdue");
  assert.equal(s.color, "#dc2626");
});

test("dueStatus: due-today -> 'Due today'", () => {
  const s = todosDomain.dueStatus(TODAY, TODAY);
  assert.equal(s.label, "Due today");
});

test("dueStatus: 'Due in Nd' format for 2..7 days out", () => {
  const s = todosDomain.dueStatus("2026-05-28", TODAY);
  assert.equal(s.label, "Due in 5d");
  assert.equal(s.color, "#0891b2");
});

test("dueStatus: returns null for no date", () => {
  assert.equal(todosDomain.dueStatus(null, TODAY), null);
});

// ─────────────────────────────────────────────────────────────────────────
// isTodoIncomplete
// ─────────────────────────────────────────────────────────────────────────

test("isTodoIncomplete: true when no dueDate, false otherwise", () => {
  assert.equal(todosDomain.isTodoIncomplete({ text: "x" }), true);
  assert.equal(todosDomain.isTodoIncomplete({ text: "x", dueDate: TODAY }), false);
  assert.equal(todosDomain.isTodoIncomplete(null), false);
});

// ─────────────────────────────────────────────────────────────────────────
// archivedTodos + completedArchive
// ─────────────────────────────────────────────────────────────────────────

test("archivedTodos returns only todos with archived=true", () => {
  const out = todosDomain.archivedTodos(fx());
  assert.deepEqual(out.map(t => t.id), ["t8"]);
});

test("completedArchive returns reversed slice capped at 15 by default", () => {
  const data = { archive: Array.from({ length: 20 }, (_, i) => ({ id: "c" + i, text: "Done " + i })) };
  const out = todosDomain.completedArchive(data);
  assert.equal(out.length, 15);
  // The inline UI reverses + slices the last 15, so the newest (c19) appears first.
  assert.equal(out[0].id, "c19");
  assert.equal(out[14].id, "c5");
});

test("completedArchive accepts custom cap", () => {
  const out = todosDomain.completedArchive(fx(), 5);
  assert.equal(out.length, 2); // fx only has 2 archive entries
  assert.equal(out[0].id, "x2"); // reversed
});

// ─────────────────────────────────────────────────────────────────────────
// Immutability — derivations never mutate inputs
// ─────────────────────────────────────────────────────────────────────────

test("byPriority does not mutate input data.todos", () => {
  const data = fx();
  const before = JSON.parse(JSON.stringify(data));
  todosDomain.byPriority(data, TODAY);
  assert.deepEqual(data, before);
});

test("completedArchive does not mutate data.archive", () => {
  const data = fx();
  const beforeArchive = data.archive.slice();
  todosDomain.completedArchive(data);
  assert.deepEqual(data.archive, beforeArchive);
});
