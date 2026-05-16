# Systematic Debug Log

Append one entry per investigation. Newest first. Every bug fix in the codebase MUST have an entry here. No entry → no commit.

## Entry template

### YYYY-MM-DD — <one-line bug summary>

- **Phase 1 — Root cause:** what error, where reproduced, what changed recently, evidence gathered
- **Phase 2 — Pattern:** the working example I compared against, the differences
- **Phase 3 — Hypothesis:** "I think X is the cause because Y." Confirmed/refuted by minimal test.
- **Phase 4 — Fix:** test name in `tests/...` that captures the regression. Single change. Commit SHA.
