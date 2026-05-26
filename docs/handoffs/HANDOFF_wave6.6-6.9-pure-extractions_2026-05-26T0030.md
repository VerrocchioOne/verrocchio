# Handoff: Wave 6.6-6.9 — 4 more pure slices out of App()

**Wrapped at:** 2026-05-26 ~00:30 -05:00
**Branch:** main (pushed to origin/main at `d376d41`)
**Working-tree state:** clean
**Supersedes:** `HANDOFF_wave6-pure-extractions_2026-05-25T1400.md` (Waves 5.19-6.5)

---

## What just happened — 4 commits, all on origin/main

Continued the Wave 6 "extract pure helpers out of App() and pin them
with tests" pattern. Each wave is one commit:

```
d376d41  6.9  quotesDomain (mergeQuotes + quoteForDate)             index.html  -7, +10 tests
f798bfe  6.8  achievementsDomain.computeAchievementStats             index.html -65, +19 tests
2868b53  6.7  habitsDomain.sortAreasByProgress                       index.html -16,  +6 tests (incl. getCR dual-load shim)
d9861bc  6.6  historyDomain.flatHistoryEvents (new domain module)    index.html -35, +10 tests
```

## Where things stand

| Metric                | Before 6.6 | After 6.9  |
|---|---|---|
| `index.html` LOC      | 15,468 | **15,345** (-123 across these 4 waves)        |
| App() body            | ~14,062 | ~13,939                                         |
| lib/ files            | ~80 | **~83** (added historyDomain, achievementsDomain, quotesDomain) |
| Tests                 | 322 | **367/367 unit + 20/20 desktop E2E pass**       |
| SHELL_VERSION         | v78 | v78 (no archive snapshot bumped this session — purely additive refactors) |
| Unpushed commits      | 0 | **0** — origin/main at d376d41                    |

## New domain modules established

| Module                            | Exports                                    | LOC |
|---|---|---|
| `lib/domains/history.js` (new)    | `flatHistoryEvents(data)`                  | 105 |
| `lib/domains/achievements.js` (new) | `computeAchievementStats(data, opts?)`, `isSmartComplete(g)` | 124 |
| `lib/domains/quotes.js` (new)     | `mergeQuotes(custom, presets, includesPresets)`, `quoteForDate(quotes, dateKey)` | 68 |
| `lib/domains/habits.js` (extended)| added `sortAreasByProgress(habits, areas, opts?)` + `_habitsGetCR` dual-load shim | 257 -> 304 |

## Why this round was high-value

Each of the four extracted units was a `useMemo` body in App() that:
- Ran on every change of its dep array (some on every `data` change),
- Was load-bearing for either a Profile-sheet render (history events),
  the Achievement unlock effect (stats), the default Goals-tab sort
  order (area progress), or the splash-screen quote (daily pick), AND
- Had ZERO unit-test coverage.

The hash-by-date logic in `quoteForDate` is the most subtle of the
four: any change to the left-fold formula would shift every user's
daily quote. The test pins `2026-05-26 -> idx 7 of 10` byte-for-byte
so future tweaks can't drift it silently.

## Follow-up candidates for next session

Sorted by what's left in the App() body that's both pure and
mid-priority:

| Priority | Item | Notes |
|---|---|---|
| Medium | `isFutureHabit(h)` (index.html:8294) | Still the only App-scope predicate injected into a domain function (`briefDomain.allYesterdayHabitsReviewed`). Parameterizing as `isFutureHabit(h, todayKey)` and moving to habitsDomain would clean up the injection. ~25 call sites — invasive but unblocks more domain composition. |
| Medium | `dismissCrowdingPair` + `reorderCrowdingPair` (index.html:7657-7706) | The pure reorder calculation (~10 LOC, lines 7679-7690) inside `reorderCrowdingPair` is the kernel; the side-effects (save + ritual + telemetry) need to stay in App() but the kernel could move to `briefDomain.reorderForCrowdingPair(habits, nonNegId, additiveId) -> habits \| null`. |
| Medium | `memoedOffSchedule` IIFE (~3 LOC inline, index.html:5118) | Wraps `detectOffSchedule` from utils.js. Already pure; the inline part is just the parked-habit filter + per-habit map. Could absorb into habitsDomain as `offScheduleHabits(habits)`. |
| Low | `dueYesterdayHabits` / similar gate predicates near the brief area | Several "filter habits by some daily-state predicate" snippets — incremental candidates if you spot a duplicated pattern. |
| Low | Per-tab "soft-cap" view-file violations are still: BriefView 970, GoalsView 956, CalendarView 784, MyContentPanel 761, AppSettingsPanel 700, HabitsFilterPills 658, TodosView 522. None over the 1000 hard cap. |

## Reference points

* `CLAUDE.md` — file-size cap (hard 1000, soft 500), no JSX/Build/UI-framework,
  immutability + `dk()` rule.
* `verrocchio-frontend` skill at `.claude/skills/verrocchio-frontend/SKILL.md`
  — "helpers bag" pattern + dual-load convention for testable utilities.
* Memory entry `feedback_no_session_breaks` — don't pause for checkpoint
  reports between extractions. Commit + push + continue.
* Memory entry `feedback_archive_on_large_push` — large pushes get an
  `archive/index.v###.html` snapshot. Skipped this session: no
  SHELL_VERSION bump (purely additive refactor; the cache is still
  serving v78 from the prior wrap-up).

## How to resume

1. Open Claude Code in this repo.
2. Paste:

> Read `HANDOFF_wave6.6-6.9-pure-extractions_2026-05-26T0030.md` under
> docs/handoffs and pick a "Medium" follow-up to ship next.

If you'd rather pivot: the architectural goal is unchanged — keep
shrinking App() in index.html and adding pinned tests for previously-
uncovered pure logic. App() is down from ~14,212 LOC (v77 wrap) to
~13,939 LOC (v78 + 4 Wave-6 commits), a ~2% reduction with high
test-coverage uplift. There's still plenty of pure logic in the file.
