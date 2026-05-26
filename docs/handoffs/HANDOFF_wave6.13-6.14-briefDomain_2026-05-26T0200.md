# Handoff: Wave 6.13-6.14 — briefDomain expanded (nextRitualState + deterministicBriefing)

**Wrapped at:** 2026-05-26 ~02:00 -05:00
**Branch:** main (pushed to origin/main at `ef728bb`)
**Working-tree state:** clean
**Supersedes:** `HANDOFF_v79-css-extraction-plus-medium_2026-05-26T0130.md`

---

## What just happened — 1 commit covering 2 waves

Both waves touch lib/domains/brief.js so they ship as one commit:

```
ef728bb  Wave 6.13 + 6.14:
         - nextRitualState(data, todayKey, patch) -> dailyRitual map
         - deterministicBriefing(opts) -> string
```

### Wave 6.13 — `nextRitualState` -> `briefDomain`
- Pure shape function for updateRitual. Shallow-merges `patch` into
  today's entry; preserves other days by reference.
- App's `updateRitual` becomes a 1-liner: `nextRitualState` + `save(...)`.
- 7 new tests pinning the merge, the reference-preservation of other
  days, null/undefined input tolerance, and the input-not-mutated
  invariant.

### Wave 6.14 — `deterministicBriefing` -> `briefDomain`
- The no-AI Morning Brief renderer (120-LOC IIFE inside `genBrief`'s
  `if (!AI_BACKEND_URL)` branch) lifted into briefDomain.
- Drives every real user's Home tab in v1.0 (`AI_ENABLED` is false)
  AND the demo personas' opening view. Previously had ZERO test
  coverage despite being the user-visible briefing.
- API takes precomputed inputs (today, pastDays30, dataDays,
  habitTypeAreas, correlations, isDone) so the function is
  straight-line + trivially testable. App-scope wrapper passes the
  same vars genBrief had already computed for the AI prompt path.
- 13 new tests covering: multi-paragraph shape; all 3 tone openings
  + "no excuses" tough-love empty-list line; task list display
  (<=3 vs 4+); streak presence + suppression; top-correlation
  pattern paragraph with noon/6pm/bedtime cutoff phrasing;
  conditional/base % rendering; anchor-habit threshold; slipping-
  habit threshold; parked + avoid-section exclusion; empty-data
  smoke.

## Where things stand

| Metric                | Before 6.13 | After 6.14 |
|---|---|---|
| `index.html` LOC      | 14,328 | **14,222** (-106) |
| `lib/domains/brief.js`| 597    | 767                |
| App() body            | ~13,919 | ~13,815           |
| Tests                 | 384    | **404/404 unit + 20/20 desktop E2E pass** |
| SHELL_VERSION         | v79    | v79 (no cache flush — purely additive refactor) |
| Unpushed commits      | 0      | **0** — origin/main at ef728bb |

## Cumulative since the v77 wrap-up (handoff `wrap_2026-05-25T1359`)

| Metric                | v77 (eec0e7a) | Now (ef728bb) | Delta |
|---|---|---|---|
| `index.html` LOC      | 15,655 | 14,222 | **-1,433 (-9.2%)** |
| Tests                 | 279    | 404    | **+125** |
| New domain modules    | 0      | 4 new (history, achievements, quotes, slots) + briefDomain & habitsDomain & lib/views/HabitsActionButton substantially expanded | - |
| Archive snapshots     | through v78 | through v79 | +1 |

## Follow-up candidates for next session

| Priority | Item | Notes |
|---|---|---|
| Medium | Onboarding sub-tree (~320 LOC, index.html L7525-7844) | Whole `if (!data.onboardingComplete)` block. Extract as `lib/views/OnboardingFlow.js` similar to existing view-extractions. Risky (many App-scope closures: save, tk, dk, DEFAULT_TIME_RANGES, ~10 setters) — worth a brainstorming pass before cutting. Highest-LOC opportunity remaining. |
| Medium | Guided tour (~from L9167 in earlier counts, may have shifted) | Similar pattern to onboarding. Probably 300+ LOC. Same closure-density concern. |
| Medium | `genBrief` prompt builder | Now that the deterministic path is extracted, the AI prompt construction (~lines 6740-6792 area: toneLine + the `const prompt = …` template) is its own pure function. Extract as `briefDomain.aiBriefingPrompt(opts)` -> { systemPrompt, userPrompt } so the prompt itself becomes testable. Independent of network. |
| Low | `callAiForDebrief` (and twin in `genIns`) | Network-coupled. Could split prompt builder from sender like above. Lower urgency. |
| Low | App settings panel inline blocks | Audit for size; some likely remain. |
| Low | `lib/views/HabitsHabitCard.js` 1170 LOC | Soft-cap candidate; only touch if making other edits to this file. |

## Reference points

- `CLAUDE.md` — file-size cap (hard 1000, soft 500), no JSX/Build/UI-framework,
  immutability + `dk()` rule.
- `verrocchio-frontend` skill at `.claude/skills/verrocchio-frontend/SKILL.md`
  — codebase conventions; dual-load pattern for testable utilities;
  "helpers bag" pattern for view extractions.
- Memory entry `feedback_no_session_breaks` — don't pause for checkpoint
  reports between extractions. Commit + push + continue.
- Memory entry `feedback_archive_on_large_push` — large pushes get an
  `archive/index.v###.html` snapshot. v79 was the last bump (CSS
  extraction); 6.13/6.14 are additive refactors under v79.

## How to resume

1. Open Claude Code in this repo.
2. Paste:

> Read `HANDOFF_wave6.13-6.14-briefDomain_2026-05-26T0200.md` under
> docs/handoffs and pick a Medium-priority candidate to ship next.

If you want the biggest remaining LOC cut, attack the **onboarding
sub-tree** — but spend the first half hour brainstorming the extraction
contract before writing code. The closure-density risk is real (cf.
the v76 HabitsView extraction's Habits-tab crash that took a follow-up
session to fix).
