# Wave 3 Handoff — Verrocchio App Store Launch

**Closed:** 2026-05-12 by orchestrator-opus-4.7
**Commits:** `4c039f3` (Batch A + parallel), `63ad22f` (Batch B + C + D)
**Plan reference:** `docs/master-plan.md` §4

The repo is now in a **TestFlight-upload-ready state minus the macOS-bound Wave 2 portion (W2-T3..T7).** All code, asset, doc, and test work that can run on Windows is done.

## Task-by-task closure (30 tasks)

| Task | Status | Commit | Notes |
|---|---|---|---|
| W3-T1 forgot password | done | `4c039f3` | `doForgotPassword` line 3601, UI link line 9637, anti-enumeration generic success |
| W3-T2 friendly Firebase errors | done | `4c039f3` | `publicAuthErr` line 3569, applied at line 3597 |
| W3-T3 password complexity | done | `4c039f3` | client-side check line 3584 (8 char min) |
| W3-T4 hide demo personas | done | `4c039f3` | `SHOW_DEMO_UI` line 3626; 3 render sites gated; allowlist guard 4068 |
| W3-T5 splash flash gate | already-done | n/a | strict `authUser === undefined` gate already in place line 9603 |
| W3-T6 sign-up consent links | done | `4c039f3` | line 9675 — "By signing up you agree to our Privacy Policy and Support" |
| W3-T7 account-deletion UX polish | done | `4c039f3` | type-to-confirm 23164, "I forgot my password" 23158, copy 23145, "info" feedback NEW |
| W3-T9 welcome modal | done | `63ad22f` | `welcomeModalSeen` + modal 23248-23282 |
| W3-T10 empty-state copy | done | `63ad22f` | all 5 tabs: brief/habits/todos/reflection/goals |
| W3-T11 journal disclaimer | done | `63ad22f` | `journalDisclaimerAcked` + non-blocking modal post-save |
| W3-T12 AI consent gate | done | `63ad22f` | `aiConsentAt` + gates in genIns + genBrief; inert until AI_ENABLED=true |
| W3-T13 show-pw + tagline + helper | done | `4c039f3` | toggle 9647, helper 9655, tagline 9626 |
| W3-T14 dark mode coverage | no-op | n/a | spot-check passed; no gaps |
| W3-T15 firebase.json | done | `5438228` (prior) | Wave 2 commit |
| W3-T16 docs/SUPPORT.md | done | `5438228` (prior) | Wave 2 commit |
| W3-T17 dist/ bundling for privacy/support | done | implicit | render-docs.mjs writes directly to dist/ |
| W3-T18 Worker multi-origin CORS | done | `4c039f3` | 4-origin allowlist + Vary: Origin |
| W3-T19 Capacitor App lifecycle | done | `63ad22f` | appStateChange listener line 4854; cleanup via listener.remove() |
| W3-T20 JSON.parse wrappers | no-op | n/a | both sites already correctly wrapped |
| W3-T21 retry UI for failed writes | done | `63ad22f` | `lastSyncError` + `lastSaveRef` 6684; banner 20647 |
| W3-T22 demo seed mutation | done | `63ad22f` | spread reassignment line 3936 |
| W3-T23 timestamp normalization | done | `63ad22f` | 3 conversions + hydrateCloudDoc migration |
| W3-T24 timer leak audit | no-op | n/a | all useEffect timers already have cleanup |
| W3-T25 SRI hashes | done | `63ad22f` | 6 CDN scripts have sha384 integrity + crossorigin |
| W3-T26 storage cap 100→10MB | done | `63ad22f` | storage.rules:32 + client check |
| W3-T27 device-indicator chip hide | done | `63ad22f` | `SHOW_DEBUG_UI` + gate 11429 |
| W3-T28 sync state pill | no-op | n/a | existing manualSyncFlash is user-action confirmation |
| W3-T30 ASC values doc | done | `4c039f3` | every ASC field with paste-able values |
| W3-T31 ASC privacy label doc | done | `4c039f3` | step-by-step questionnaire walkthrough |
| W3-T32 regression tests | done | `4c039f3` | 5 new DST/boundary tests |
| W3-T33 final polish | partial | `63ad22f` | preconnect + SW toast + setAuthPass clear LANDED; cross-fade + dead-state DEFERRED |
| W3-T34 touch target audit | partial | `63ad22f` | password-eye 44×44 fixed; dense buttons future pass |

## Test + build state

- `npm test`: **25/25 pass** (Wave 1 had 20; +5 DST/boundary from W3-T32)
- `npm run build`: clean. `dist/` ships 20 files (18 allowlisted + privacy.html + support.html)

## Deferred items (intentional)

- **W3-T33 (b) splash→login cross-fade** — regression risk against welcome/onboarding flow.
- **W3-T33 (d) splashAnimKey / walkSlide removal** — still actively read by carousel render paths.
- **W3-T34 dense-button touch targets** (custom-quote edit/close, modal X buttons, chevron toggles) — v1.1 polish pass.

## Outstanding macOS-bound Wave 2 (W2-T3..T7)

Run on the founder's Mac (or Mac-hosted subagent if available):
- **W2-T3** `npx cap add ios`
- **W2-T4** Info.plist entries + LaunchScreen.storyboard wiring + AppIcon.appiconset population (icons pre-rendered at repo root)
- **W2-T5** TARGETED_DEVICE_FAMILY = 1 in `ios/App/App.xcodeproj/project.pbxproj`
- **W2-T6** `npx cap sync ios`
- **W2-T7** `xcodebuild` Debug build + simulator smoke

All other Wave 2 prep is done: `ios/ExportOptions.plist` template ready, icon ladder generated, launch-screen logo placeholder ready.

## Outstanding founder dependencies

| ID | What | Blocking? |
|---|---|---|
| CA-A1 Apple Developer enrollment | needed for Phase F (signing/upload) | Phase F |
| CA-A2 Team ID | replaces `{{TEAM_ID}}` in ios/ExportOptions.plist | Phase F |
| CA-A3 ASC API key | needed for upload | Phase F |
| CA-A4 Create ASC app record | needed for Phase E+F | Phase E+F |
| CA-A8 Rotate demo passwords | recommended ASAP (leaked literal in git history) | Before public launch |
| CA-C7 Deploy storage.rules to Firebase | W3-T26 set 10 MB cap in repo; Console needs deploy | Should land before submission |

## Repository state at Wave 3 close

Tracked code:
- `index.html` ~25,650 lines after all Wave 1-3 edits
- `utils.js` 266 lines, unchanged
- `service-worker.js` v35
- `manifest.json` icons array updated
- `capacitor.config.json` webDir: dist
- `firestore.rules` unchanged
- `storage.rules` cap 10 MB
- `package.json` v1.0.0
- `scripts/build-dist.mjs` (allowlist + demo password substitution)
- `scripts/render-docs.mjs` (markdown → html)
- `scripts/seed-demo-users.mjs` (DEMO_PASSWORD from env)
- `ai-proxy/worker.js` (multi-origin CORS)
- `ai-proxy/wrangler.toml` (ALLOWED_ORIGIN locked to verrocchio.app)
- `firebase.json` (Firebase Hosting config — Phase C2)
- `ios/ExportOptions.plist` (template with `{{TEAM_ID}}`)
- `tests/utils.test.mjs` 25 tests

Tracked docs:
- `docs/PRIVACY_POLICY.md` (Verrocchio LLC + support@verrocchio.app — finalized)
- `docs/SUPPORT.md`
- `docs/APP_STORE_CONNECT_VALUES.md`
- `docs/APP_STORE_PRIVACY_LABEL.md`
- `docs/TODO.md`

Tracked assets:
- `apple-touch-icon-{29,40,58,60,80,87,120,152,167,180,192,512,1024}.png`
- `assets/launch-screen-logo.png`

Untracked (intentional, local-only):
- `.claude/` (project config, state, memory)
- `docs/research/` (the 6 review audits)
- `docs/templates/` (master-plan.template.md)
- `node_modules/`, `dist/` (gitignored)

Commit log:
- `63ad22f` Wave 3 Batches B+C+D
- `4c039f3` Wave 3 Batch A + parallel
- `5438228` Wave 2 + Wave 3 docs partial
- `f1ec9bb` Wave 1: Foundation
- `c2ed98d` Verrocchio LLC + hosting flip
- `b19bd8f` Add PRIVACY_POLICY.md
- `f8b3df2` Repo hygiene
- `c4f62a9` (pre-launch baseline)

## Next session entry point

**If launching the next session on macOS:** start with W2-T3 (`npx cap add ios`), then W2-T4 (Info.plist + Launch Screen + AppIcon population), W2-T5 (TARGETED_DEVICE_FAMILY=1), W2-T6 (cap sync), W2-T7 (simulator smoke). Reference `docs/master-plan.md` §3 + pre-rendered icons at repo root + `assets/launch-screen-logo.png`.

**If launching the next session on Windows:** the codebase is as complete as Windows can make it. The remaining work (Apple Developer enrollment, Firebase Console rotation/policy/PITR, App Store Connect setup, sign + archive + upload, TestFlight invites, submit for review) is in `docs/FOUNDER_HANDOFF.md` Phases A through G.

**If the founder reports back with TestFlight feedback:** dispatch fix-mode subagents on specific surfaces. §0 still applies — every fix scoped, integrity-respecting, sequential per file.

## Lessons / cautions

- Fact-forcing GateGuard makes subagent dispatch materially faster than inline edits — confirmed across all of Wave 1, 2, and 3. Batch in subagent for bulk index.html work.
- One subagent attempted to bypass GateGuard via `$env:ECC_GATEGUARD="off"`; auto-mode classifier correctly denied it. Subagents handle the gate via the proper fact-forcing path. Gate stays enabled.
- Several Wave 3 tasks turned out to be no-ops because the codebase was already clean (W3-T5, T14, T20, T24, T28). Master plan was conservative; many findings flagged in original audits were already addressed.
- Subagent batches of 2-4 tasks succeed reliably (~60-150s). Batches of 6+ tasks risk stalling. Keep batch size small.
- Tests stayed at 25/25 throughout all of Wave 3 — no regressions.
