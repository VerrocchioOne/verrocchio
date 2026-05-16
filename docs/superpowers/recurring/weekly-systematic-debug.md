# Weekly Systematic-Debug Protocol

Operationalizes Phase 3 of the OSS-port TDD rebuild (`docs/superpowers/plans/2026-05-15-oss-port-tdd-rebuild.md` §"Phase 3 — Systematic debugging cadence").

## What runs

Every Monday at 09:00 (local), this procedure runs against `feat/oss-port-tdd-rebuild` (or whatever the current development branch is) and emits one new entry per investigated bug into `docs/DEBUG_LOG.md`.

## How to schedule

Run the following in Claude Code once to activate:

```
/schedule
```

When prompted, paste this routine config:

- **Name:** `verrocchio-weekly-debug`
- **Cron:** `0 9 * * 1` (every Monday at 09:00)
- **Prompt:** the full procedure block below (under "Procedure")
- **Working directory:** `c:\Users\User\Developer\verrocchio`
- **Branch policy:** read-only — investigations propose fixes but commit only via subsequent dispatched implementer subagents that follow superpowers:test-driven-development.

## Procedure

Each Monday at 09:00:

1. **Read the inbox.** Open `docs/USER_REQUESTS.md` and `docs/TODO.md`. List every entry that looks like a bug report, behavior complaint, or regression — anything saying "X is broken" / "X doesn't work" / "X used to work but now". Cap at 5 investigations per session to keep the loop bounded.

2. **For each candidate, apply superpowers:systematic-debugging in order:**

   - **Phase 1 — Root cause.** Reproduce the bug in `serve.ps1` localhost. Gather evidence at each component boundary (network tab, console, React state, Firestore writes, SW cache). Do NOT propose a fix until the failure mode is reproducible.

   - **Phase 2 — Pattern.** Find a working analogue (a similar interaction that's NOT broken) and list the differences. The difference IS the root cause.

   - **Phase 3 — Hypothesis.** Form ONE hypothesis. Express it as "I think X is the cause because Y." Test it with the smallest possible change in a scratch branch — proves the hypothesis without committing.

   - **Phase 4 — Fix with failing test FIRST.** Write a failing regression test in the appropriate suite (`tests/*.test.mjs` for pure logic, `tests/e2e/*.spec.js` for UI/integration). Run; observe red for the right reason. Then apply the fix. Run; observe green. Commit only with the test attached.

3. **Append the trace to `docs/DEBUG_LOG.md`** using the entry template at the top of that file:

   ```markdown
   ### YYYY-MM-DD — <one-line bug summary>

   - **Phase 1 — Root cause:** what error, where reproduced, what changed recently, evidence gathered
   - **Phase 2 — Pattern:** the working example I compared against, the differences
   - **Phase 3 — Hypothesis:** "I think X is the cause because Y." Confirmed/refuted by minimal test.
   - **Phase 4 — Fix:** test name in `tests/...` that captures the regression. Single change. Commit SHA.
   ```

4. **Stop conditions** (any one halts the loop):
   - 3+ fix attempts fail on the same hypothesis → STOP and escalate to the user. The bug is likely architectural and needs design discussion, not iteration.
   - Tests that should pass don't (regression in unrelated code) → STOP and triage as a separate session.
   - Any change touches `firestore.rules`, `ai-proxy/`, or service-worker security boundaries → STOP and require a human security review before commit.
   - 5 investigations already done this run → STOP and resume next week.

5. **Reporting back:** at end of run, append a one-line summary to `docs/USER_REQUESTS.md` under a heading `### Weekly debug pass — YYYY-MM-DD` listing investigated items, status (fixed / triaged / escalated), and commit SHAs for any fixes.

## What this loop does NOT do

- Does not refactor for code reduction. That's the rebuild's job, not the debug loop's.
- Does not write new features. New feature requests in `USER_REQUESTS.md` stay there; only bug-shaped entries get pulled.
- Does not push commits. The user reviews and pushes manually.
- Does not modify CLAUDE.md, SYNTHESIS.md, or the plan doc. Those are governance; the loop is execution.

## Companion files

- `docs/DEBUG_LOG.md` — every investigation appends here (the template lives at the top of that file)
- `docs/USER_REQUESTS.md` — the inbox the loop reads from each Monday
- `docs/TODO.md` — secondary inbox
- `.claude/CLAUDE.md` §"Verification gate" — the loop honors this before claiming any UI fix is done (browser screenshots at desktop + iOS widths, dark mode if colors touched, `npm test` green)
