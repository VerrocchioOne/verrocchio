# Wave 1 Handoff — Verrocchio App Store Launch

**Closed:** 2026-05-12 by orchestrator-opus-4.7
**Commit:** `f1ec9bb`
**Plan reference:** `docs/master-plan.md` §2

## Task-by-task closure

| Task | Status | Commit | New code location | Notes |
|---|---|---|---|---|
| W1-T1 | done | `f1ec9bb` | `scripts/build-dist.mjs`, `capacitor.config.json:4`, `package.json` scripts | dist/ build pipeline + webDir change. Currently emits 6 files; W2-T1 generates the 12 missing icons |
| W1-T2 | done | `f8b3df2` (prior) | `.gitignore` | node_modules + iOS build artifacts excluded |
| W1-T3 | done | `f1ec9bb` | `package.json:4`, `service-worker.js:19`, `manifest.json:8` | v1.0.0 baseline + SW v35 |
| W1-T4 | done | `f1ec9bb` | `index.html` `doSignOut` ~4076, `doDeleteAccount` ~4144, Storage listAll at 4138 | Storage cleanup pre-auth-delete + db.terminate + clearPersistence + reload |
| W1-T5 | done (canary) | `f1ec9bb` | `index.html` ErrorBoundary class at 3473, global handlers at 988-1001, root render at 24985 | First React class component in the codebase |
| W1-T6 | done | `f1ec9bb` | `index.html:4021` (shifted from 3971 due to ErrorBoundary insertion) | `sanitizeForFirestore(seeded)` wraps the demo-seed write |
| W1-T7 | done (canary) | `f1ec9bb` | `index.html:3598`, `scripts/seed-demo-users.mjs:29-30`, `scripts/build-dist.mjs` substitution loop | DEMO_PASSWORD %%placeholder%% + env-var substitution at build time |
| W1-T8 | done | `f1ec9bb` | `index.html` `wipeAllData` (~6803), 3 `console.log` removed; 3 `console.warn` preserved in catch | |
| W1-T9 | done | `f1ec9bb` | `index.html:1083-1085` | SW gate: protocol !== capacitor: && !== file: ADDITIVE to existing https/localhost gate |
| W1-T10 | done | `f1ec9bb` | `index.html:1125` AI_ENABLED constant; gates at 16178 + 16192 | genBrief NOT gated — has deterministic non-AI fallback. AI-error fallback at 8830 unreachable from UI |

## Verification log (orchestrator-run)

- `npm test`: 20/20 pass (131 ms)
- `npm run build`: dist/ produced with 6 files; warns about 12 missing icons (expected per W2-T1); warns about DEMO_PASSWORD env not set (expected for dev)
- `DEMO_PASSWORD=test-value-xyz npm run build`: confirmed substitution writes `test-value-xyz` into `dist/index.html`
- Spot-checked every changed file:line via grep — all match plan spec

## Deviations from plan spec (all approved)

1. W1-T9: kept existing https/localhost gate; ADDED the two new exclusions as additional clauses. Strictly tighter than spec literal.
2. W1-T10: the prompt-construction lines at ~8828/9016/9112 were NOT render sites. Actual gates at 16178 + 16192. Briefing card deliberately NOT gated (deterministic fallback works).
3. W1-T4: dropped `setHasSeenWelcome(false)` after signOut because `window.location.reload()` clears React state anyway.

## Significant line-number shifts (carry forward to W2/W3 grep targets)

| Symbol | Pre-Wave-1 | Post-Wave-1 |
|---|---:|---:|
| `function App()` | 3457 | 3506 |
| `const DEMO_PASSWORD` | 3548 | 3598 |
| `const AI_BACKEND_URL` | 1108 | 1110 |
| `const AI_ENABLED` | (new) | 1125 |
| `class ErrorBoundary` | (new) | 3473 |
| Global error handlers IIFE | (new) | 988-1001 |
| `doDeleteAccount` start | ~4076 | ~4144 |
| `doSignOut` start | ~4018 | ~4076 |
| `userDoc(uid).set(...seeded)` | 3971 | 4021 (sanitized) |
| `serviceWorker.register` gate | 1069 | 1083-1086 |
| `wipeAllData` start | 6787 | 6803 |
| Insights button | 16121 | 16178 (gated) |
| `insV` panel | ~16135 | 16192 (gated) |
| Root render | 24973 | 24985 (wrapped) |

Net `index.html` growth: ~+60 lines.

## Lessons / cautions for Wave 2 + Wave 3

- **Fact-forcing gate** on orchestrator's Edit/Write tools requires facts before each in-place edit. Per-edit overhead is high. **Subagent dispatch is materially faster for batches.** Use subagent for bulk Wave 2/3 work; orchestrator verifies after.
- `docs/research/` and `docs/templates/` remain UNTRACKED per founder's conservative-cleanup choice. Don't accidentally `git add` them.
- **macOS host required for W2-T3 through W2-T7** (`cap add ios`, `cap sync ios`, `xcodebuild` simulator). Orchestrator is on Windows; these tasks need either a Mac subagent (not in current fleet) or the founder. Windows-runnable Wave 2 tasks: W2-T1 (icon ladder — needs ImageMagick OR Node sharp), W2-T2 (launch-screen logo prerender), W2-T8 (ExportOptions.plist template).
- **W3 path independence:** most W3 tasks are `index.html` edits that don't depend on `ios/` existing. Wave 3 can start in parallel with the macOS-bound Wave 2 portion.

## Outstanding founder dependencies after Wave 1

| ID | What | Currently blocking? |
|---|---|---|
| CA-A1 | Apple Developer enrollment | Blocks W2-T6/T7 (signing) and Phase F |
| CA-A2 | Team ID provided | Blocks W2-T6 |
| CA-A3 | ASC API key | Blocks Phase F upload |
| CA-A8 | Rotate demo passwords in Firebase Auth | Recommend doing ASAP — W1-T7 substitution is in place, but the leaked password is still in git history |
| CA-A9 | Email enumeration protection | Defense-in-depth; not blocking |
| CA-A10 | Password policy min 8 | Server-side companion to W3-T3 client check; not blocking |

## Next session entry point

Read this file + `docs/master-plan.md` §3 Wave 2 + §0 if not already read. Wave 2 split:
- Windows-runnable: W2-T1 (icons), W2-T2 (launch logo), W2-T8 (ExportOptions.plist).
- macOS-required: W2-T3 (`cap add ios`), W2-T4 (Info.plist edits), W2-T5 (TARGETED_DEVICE_FAMILY), W2-T6 (`cap sync ios`), W2-T7 (simulator Debug build).
- Recommended: start with Windows-runnable Wave 2 tasks + parallel Wave 3 work, queue macOS tasks for founder or Mac-hosted subagent.
