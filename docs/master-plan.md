# Verrocchio — App Store v1.0 Launch Master Plan (Subagent-Pure)

Run-id: `2026-05-12T07:00:00Z` · Plan generated: 2026-05-12 · Author: orchestrator
Plan amended 2026-05-12 18:00 — split founder-only items into `docs/FOUNDER_HANDOFF.md`. Every task in this document is subagent-executable end-to-end without waiting on the founder.

Inputs: `.claude/CLAUDE.md`, `.claude/skills/verrocchio-frontend/SKILL.md`, `docs/templates/master-plan.template.md`, six parallel subagent audits saved at `docs/research/2026-05-12-appstore-readiness/01–06`, `docs/PRIVACY_POLICY.md` (drafted), `docs/FOUNDER_HANDOFF.md` (out-of-band).

---

## Quick Start — If This Is Your First Session

**Stop. Do not dispatch anything yet.** This plan exists because a 25,000-line single-file PWA + first-ever Capacitor iOS shell + Apple App Store review board is a multi-failure-mode surface. A fresh agent skipping straight to dispatch will ship a broken IPA, trip on a security blocker, or stomp on working code.

**Plan amended 2026-05-12 18:00.** Founder dependencies moved to `docs/FOUNDER_HANDOFF.md`. **This document is now subagent-pure** — every task runs without founder input. Active workstreams:

- Wave 1 — Foundation (Security + Stability Core) — 10 tasks.
- Wave 2 — iOS Shell Preparation + Simulator Validation — 9 tasks.
- Wave 3 — Interior punch-list + Final Assets/Docs/Tests — 30 tasks.

Total: **49 tasks, all subagent-executable**. End state: a TestFlight-upload-ready repository with simulator-validated build, marketing screenshots, ASC metadata drafts, complete regression tests, and a privacy policy template. Founder picks up from `docs/FOUNDER_HANDOFF.md` Phase F (sign + archive + upload) when ready.

**For a fresh session continuing from 2026-05-12, 6 steps in order:**

1. **Read §0 Operating Discipline in full.** §0.0 lists 8 mandatory references. Read all of them. Confirm via state-file + chat acknowledgment.
2. **Read §1 Executive Summary + Realistic Timeline.**
3. **Read the active wave's section in full** — each task has WHAT/WHERE/HOW/VERIFY specs.
4. **Pick one task and dispatch via §0.3 sequential-only.** Subagent runs the VERIFY step; orchestrator independently re-verifies. Never two coding subagents on `index.html` at the same time.
5. **Founder-dependent work is NOT in this plan.** If a task you're about to dispatch seems to require Apple Developer credentials, Firebase Console access, or legal identity decisions, STOP and check: that work belongs in `docs/FOUNDER_HANDOFF.md`, not here.
6. **If §0 doesn't address your situation: STOP, escalate, do not iterate by inference.** (§0.7.)

---

## 0. Operating Discipline (READ FIRST — Authoritative)

> **This section overrides any conflicting guidance below.** If §0 says X and a later section says Y, X wins.

### 0.0 Mandatory reading before any dispatch

An agent who has not read all 8 of the following files **in order** is NOT authorized to dispatch any task, run any skill, or commit any code in this remediation. **Confirm via two channels** before proceeding:

- **State file:** write `.claude/state/appstore-launch-preflight.json` with `{ "mandatory_reads_complete": true, "agent": "<your-id>", "timestamp": "<ISO-8601>" }`. If the file already exists from a prior session, append to a `confirmations[]` array — do not overwrite.
- **Chat acknowledgment:** post `"§0.0 acknowledged: I have read all 8 mandatory references in order. Proceeding."` before any tool call that modifies repo state.

Both required.

1. **`.claude/CLAUDE.md`** — project constitution: single-file PWA invariant, no JSX/build/TS rule, anti-pattern list, override notes on global TS rules, the verification gate for UI changes.
2. **`.claude/skills/verrocchio-frontend/SKILL.md`** — codebase conventions: data model, persistence layering, React.createElement style, device profile system, auth flow, anti-patterns that caused regressions.
3. **`docs/research/2026-05-12-appstore-readiness/01-privacy.md`** — data inventory + Apple nutrition label + 8 findings.
4. **`docs/research/2026-05-12-appstore-readiness/02-ios-app-store.md`** — 10 iOS blockers, asset inventory, Capacitor + xcodebuild runbook, ASC metadata draft.
5. **`docs/research/2026-05-12-appstore-readiness/03-ux.md`** — 8 UX blockers, 10 highs, onboarding decision, AI-off recommendation, screenshots, safe-area audit, empty-state copy.
6. **`docs/research/2026-05-12-appstore-readiness/04-security.md`** — 1 CRITICAL, 5 HIGH, 6 MEDIUM, 5 LOW + App Check setup.
7. **`docs/research/2026-05-12-appstore-readiness/05-code-quality.md`** — anti-pattern violation count, ErrorBoundary + global handlers snippets, test-gap priorities.
8. **`docs/research/2026-05-12-appstore-readiness/06-pwa-build.md`** — `.gitignore` audit, `dist/` build script, SW gate, build pipeline runbook, AI proxy deploy runbook, Firebase Hosting `firebase.json`, version bump sequence.

WHY: the project skill and CLAUDE.md exist because the codebase has shipped regressions from agents working without context. The 6 research files exist because the orchestrator audited the codebase exhaustively in parallel before authoring this plan. Skipping any of them produces an agent that re-discovers the same findings under worse time pressure.

### 0.1 Subagent canary-first validation

For tasks that introduce a new pattern (first SW gate, first ErrorBoundary install, first `cap add ios` invocation, first xcodebuild simulator build), apply canary-first validation:

1. Dispatch the task as a single, scoped subagent action.
2. Orchestrator independently verifies the change.
3. Agree → accept and move on. Disagree → apply §0.6 9-step iteration on the **subagent's prompt template**, not on the source code that's working.

Skill validation triggers at: **W1-T5** (ErrorBoundary), **W1-T7** (demo-password env substitution), **W2-T3** (`npx cap add ios` — first time iOS shell is ever generated), **W2-T7** (xcodebuild Debug for simulator — first time a `.app` is produced), **W3-T17** (first Capacitor plugin runtime API).

### 0.2 Anti-spiral protection (integrity principle)

**The integrity principle: never modify something that is not broken.**

Most fixes are surgical — one file edit, one config line. The risk is a subagent dispatched to fix "no ErrorBoundary" decides to "while I'm here, also clean up the splash-phase loading screen." Unauthorized.

Hard rules:

- A subagent's prompt MUST specify the exact file(s) and line range to touch. No "and also fix anything else you notice."
- Forbidden phrases: "while I'm here," "let me clean this up," "improve the structure," "refactor for clarity," "tighten the wording," "for consistency." If any appear, the dispatch is rejected and re-issued with tighter scope.
- NOT forbidden: "apply the exact fix specified in W3-T1," "edit only line N to M," "add the snippet from §X."
- Step 0 cap: 3rd attempt on the same task = STOP and escalate (chat to user; document in `.claude/memory/`).

WHY: 25,000 lines of inline `React.createElement` is fragile. Any agent that decides a stable section "looks weird" and rewrites it has just shipped a regression.

### 0.3 Concurrency + verification roles

**Sequential dispatch ONLY** for tasks touching the same file. Parallel dispatch IS allowed for non-overlapping tasks (e.g., editing `firestore.rules` and authoring `firebase.json` simultaneously) but never for tasks that touch `index.html` concurrently.

Read-only parallel dispatch (audits, research) is fine.

**Verification role boundary:**
- Subagent runs the task's VERIFY step. Subagent fixes its own gate failures before claiming the task done.
- Orchestrator independently re-runs VERIFY. Green → accept. Red → fix-mode dispatch on the same task with the gate output as input.

### 0.4 Memory checkpoints

The plan has 49 tasks. A single session may not hold all. Mandatory memory write checkpoints:

- After **Wave 1 completes** — all 10 foundation tasks green; commit hashes recorded.
- After **Wave 2 completes** — `ios/` project generated, simulator smoke green.
- After **Wave 3 completes** — punch-list + screenshots + tests + docs all done; the repo is in a "TestFlight-upload-ready" state and the founder can pick up from `docs/FOUNDER_HANDOFF.md` Phase F.

Each memory file at `.claude/memory/appstore-launch-wave-N-handoff.md` MUST cover task-by-task status with commit hash, deviations from the plan with reasons, surfaced gaps, lessons. **Memory write happens BEFORE compaction, not after.**

### 0.5 Independence from founder

This plan is designed to run end-to-end **without waiting on founder input**. Whenever a task seemingly needs founder data (Team ID, ENTITY, Anthropic key, etc.), the task uses a **placeholder token** (`{{TEAM_ID}}`, `{{ENTITY}}`, `{{CONTACT_EMAIL}}`, `{{ANTHROPIC_API_KEY}}`) and proceeds. The founder substitutes real values per `docs/FOUNDER_HANDOFF.md` when they pick up the artifact.

If a task genuinely cannot proceed without external credentials (it would attempt a real Apple/Firebase/Cloudflare auth call), that task belongs in `docs/FOUNDER_HANDOFF.md`, not here. Audit before dispatch.

### 0.6 9-step iteration discipline (for plan or dispatch-template mods only)

If the master plan itself produces wrong output (a task's HOW field cites a non-existent file, VERIFY fails because the spec is wrong), the plan is iterated — NOT the working code.

Same 9 steps as the template's §0.6: cite failure, rule out non-plan causes, cite responsible line, articulate plan invariants, construct 3 test cases, write diff with justification, apply + re-test, commit with justification. Step 0 cap: 3rd attempt = STOP and escalate.

### 0.7 If §0 doesn't cover your situation — STOP

§0 cannot anticipate every edge case. When the right move feels obvious but isn't documented, two rules appear to conflict, or you're tempted to rationalize an "exception": **STOP.** Document the question, wait for direction, do not iterate partial work in the meantime.

---

## 1. Executive Summary

Verrocchio is **pre-production** — no live users on the iOS App Store yet. This plan sequences 3 engineering waves strictly by dependency order:

- **Wave 1 — Foundation (Security + Stability Core)** lands every fix that affects binary correctness, security, or build hygiene before the iOS shell is generated.
- **Wave 2 — iOS Shell Preparation + Simulator Validation** generates the Capacitor iOS project, configures Info.plist (with founder-fill placeholders for Team ID + entity), produces an icon ladder + launch screen, builds + runs the app in iOS Simulator for visual smoke + screenshot capture.
- **Wave 3 — Interior Punch-list + Final Assets/Docs/Tests** addresses every remaining UX, security, code quality, and privacy finding; generates marketing screenshots; drafts ASC metadata + privacy nutrition label checklist; writes regression tests.

The order is **foundation → shell-prep → polish-and-assets**. Building the iOS shell on top of unfixed security/stability issues (no ErrorBoundary, unsanitized Firestore writes, hardcoded demo password) means the first founder-archived IPA ships a known-broken binary.

After Wave 3 closes, the repo is **TestFlight-upload-ready**. The founder picks up from `docs/FOUNDER_HANDOFF.md` Phase F.

### Finding breakdown (from 6 parallel audits, 2026-05-12)

| Wave | Tasks | Subagent-executable | % of total |
|---|---:|---:|---:|
| Wave 1 (Foundation) | 10 | 10 | 20% |
| Wave 2 (Shell prep + simulator) | 9 | 9 | 19% |
| Wave 3 (Punch-list + final assets) | 30 | 30 | 61% |
| **Total** | **49** | **49** | **100%** |

Founder-only tasks (Apple Developer enrollment, ASC submission, Firebase Console settings, code-signing) live in `docs/FOUNDER_HANDOFF.md` — 7 phases, ~2-3 hours total, runs in parallel with subagent work.

Severity counts across audits (overlap collapsed): 1 CRITICAL, 33 BLOCKER, 41 HIGH, 31 MEDIUM, 22 LOW.

### Realistic timeline (anchored to task complexity)

| Phase | Estimated active-work days |
|---|---|
| Wave 1 | 1.5–2 days |
| Wave 2 | 1 day (no founder gates; macOS host required for `cap add ios` + simulator) |
| Wave 3 | 3–4 days |
| **Subtotal (subagent-pure)** | **5.5–7 days** |
| Founder handoff (parallel, see `FOUNDER_HANDOFF.md`) | ~2-3 hours active, can overlap any wave |
| Apple Review wait | 1-2 days |
| **Total to live on App Store** | **6.5–9 days** |

**Anti-spiral budget guardrails:** Per-task caps: 2-hour wall-clock average; 4-hour cap on any single task; 3 dispatch attempts max before escalation. If timeline drifts past 12 days, escalate to user.

### macOS host requirement

Tasks W2-T3 through W2-T8 (`npx cap add ios`, `cap sync ios`, `xcodebuild` simulator builds, simulator screenshot capture) require a macOS host with Xcode 16+. These remain subagent-executable — the subagent must run on macOS. They do NOT require founder input; only macOS access. If the orchestrator is on Windows, dispatch macOS-bound tasks to a Mac-hosted subagent. The Windows-bound subagent can complete every other task.

---

## 2. Wave 1 — Foundation (Security + Stability Core)

### Scope

Fix every blocker affecting binary correctness, security, or build hygiene BEFORE the iOS shell is generated. Surgical, single-file changes. No founder dependencies.

### Build order (dependency-respecting)

```
W1-T1 → W1-T2 → W1-T3 → W1-T8 (low-risk file shape changes first)
  → W1-T5 → W1-T6 (crash-resistance + Firestore sanitize)
  → W1-T4 (account deletion + sign-out IDB clear)
  → W1-T9 → W1-T10 (gating: SW + AI feature flag)
  → W1-T7 (demo password env substitution — depends on dist/ build script from T1)
```

### Pre-flight

**Step 1 — Verify §0.0 mandatory reads + two-channel confirmation.**

**Step 2 — Confirm baseline.** `npm test` must pass. `index.html` must open in a browser without console errors at the auth screen.

**Step 3 — Confirm in chat:** `"Wave 1 pre-flight complete. Baseline npm test green. Proceeding to W1-T1."`

### W1-T1 — Add `dist/` build script + update `capacitor.config.json` webDir

**Files:** Create `scripts/build-dist.mjs`. Modify `capacitor.config.json` line 4. Modify `package.json` scripts block.

**Why:** PWA-B-01. `webDir: "."` ships entire repo into IPA.

**How:** `capacitor.config.json` line 4: `"webDir": "."` → `"webDir": "dist"`. `package.json` scripts:
```json
"scripts": {
  "test": "node --test",
  "build": "node scripts/build-dist.mjs",
  "cap:add:ios": "cap add ios",
  "cap:sync": "npm run build && cap sync ios",
  "cap:open": "cap open ios"
}
```
`scripts/build-dist.mjs` from `06-pwa-build.md` §6.

**Verify:** `npm run build` produces `dist/` with the FILES list — no `node_modules`, `.git`, `docs`, `tests`.

### W1-T2 — Fix `.gitignore`

**Files:** Modify `.gitignore` (replace with content from `06-pwa-build.md` §5).

**Why:** `node_modules/` not currently excluded.

**Verify:** `git status` no longer shows `node_modules/` untracked.

### W1-T3 — Bump version markers to v1.0.0 baseline

**Files:** `package.json` line 4 → `"version": "1.0.0"`. `service-worker.js` line 19 → `CACHE_NAME = "verrocchio-shell-v35"`. `manifest.json` line 8 → `"start_url": "./?v=1.0.0",`.

**Why:** PWA-B-05.

**Verify:** Each grep returns the new value.

### W1-T4 — Account-deletion Storage cleanup + IDB clear on sign-out

**Files:** Modify `index.html` `doDeleteAccount()` ~line 4076-4099 + `doSignOut()` ~line 4018-4021.

**Why:** IOS-B-02, SEC-H-03, PRIV-01, SEC-M-03.

**How — `doDeleteAccount` (insert before `auth.currentUser.delete()`):**
```js
try {
  const listResult = await storage.ref("users/" + uidToNuke + "/content").listAll();
  await Promise.all(listResult.items.map(r => r.delete().catch(() => {})));
} catch (e) {
  try { console.warn("[verrocchio delete] storage cleanup failed:", e && e.code); } catch (_) {}
}
```

**How — `doSignOut`:**
```js
const doSignOut = async () => {
  if (demoMode) { exitDemo(); return; }
  try {
    await auth.signOut();
    await db.terminate();
    await db.clearPersistence();
  } catch (e) { /* non-fatal */ }
  finally { window.location.reload(); }
};
```

**Verify:** Manual sign-in → upload test file → delete account → Firebase Console Storage shows no `users/<uid>/content/`. Manual sign out → DevTools IndexedDB empty.

### W1-T5 — ErrorBoundary + global error handlers (canary-first per §0.1)

**Files:** Modify `index.html`. Paste global handlers (`05-code-quality.md` §8) in `<head>` before React loads. Paste ErrorBoundary class (`05-code-quality.md` §7) after React UMD loads. Wrap root render: `ReactDOM.createRoot(el).render(React.createElement(ErrorBoundary, null, React.createElement(App)))`.

**Why:** CQ-B-01, CQ-B-02.

**Verify (canary):** Temporarily `throw new Error("test-boundary")` in a button onClick — confirm fallback renders. Temporarily `Promise.reject(new Error("test-unhandled"))` — confirm `localStorage.getItem("v-last-error")` returns JSON. Remove test code before commit.

### W1-T6 — Fix unsanitized Firestore write at index.html:3971

**Files:** Modify `index.html:3971`.

**Why:** CQ-H-05.

**How:** `userDoc(auth.currentUser.uid).set(seeded)` → `userDoc(auth.currentUser.uid).set(sanitizeForFirestore(seeded))`.

**Verify:** `grep -nE "userDoc.*\.set\(seeded\)" index.html` → 0 matches.

### W1-T7 — Demo password environment substitution (canary-first per §0.1)

**Files:** Modify `index.html:3548`, `scripts/seed-demo-users.mjs:29`, `scripts/build-dist.mjs`.

**Why:** SEC-C-01 (CRITICAL).

**How:**

`index.html:3548`:
```js
// Replaced at build time by scripts/build-dist.mjs from env var DEMO_PASSWORD.
const DEMO_PASSWORD = "%%DEMO_PASSWORD%%";
```

`scripts/seed-demo-users.mjs:29`:
```js
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
if (!DEMO_PASSWORD) throw new Error("DEMO_PASSWORD env var required to seed demo users");
```

`scripts/build-dist.mjs` — append after copyFile loop:
```js
import { readFile, writeFile } from 'node:fs/promises';
const demoPw = process.env.DEMO_PASSWORD;
if (!demoPw) {
  console.warn("[build-dist] DEMO_PASSWORD env not set — dist/index.html retains %%DEMO_PASSWORD%% placeholder. Set before publishing.");
} else {
  const idx = path.join(DIST, 'index.html');
  let html = await readFile(idx, 'utf8');
  html = html.replace('%%DEMO_PASSWORD%%', demoPw);
  await writeFile(idx, html);
  console.log('[build-dist] demo password substituted');
}
```

**Independence note:** This task does NOT require the founder to rotate the actual Firebase passwords. The placeholder substitution + literal removal is the subagent half. Password rotation in Firebase Console is `FOUNDER_HANDOFF.md` Phase C3.

**Verify (canary):** `grep -n "verrocchio-demo-1" index.html scripts/seed-demo-users.mjs` → 0 matches. `DEMO_PASSWORD=test-value-xyz npm run build` → `grep "test-value-xyz" dist/index.html` → 1 match.

### W1-T8 — Strip `console.log` in `wipeAllData`

**Files:** Modify `index.html:6787, 6817, 6825`.

**Why:** CQ-B-03, SEC-M-04.

**How:** Delete the three console.log statements. Keep existing `console.warn` in catch.

**Verify:** Manual trigger of wipe in dev → no `[verrocchio wipe]` lines.

### W1-T9 — Service worker gate for Capacitor

**Files:** Modify `index.html` existing `navigator.serviceWorker.register` call.

**Why:** PWA-B-02, IOS-M-06, IOS-H-04.

**How:**
```js
if ('serviceWorker' in navigator
    && location.protocol !== 'capacitor:'
    && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).catch(() => {});
}
```

**Verify:** Browser opens index.html → SW registers (DevTools Application). Confirmed in W2-T7 (simulator) that SW does NOT register under `capacitor://`.

### W1-T10 — AI feature flag (hide all AI buttons in v1.0)

**Files:** Modify `index.html` near line 1108 + every AI-button render site.

**Why:** UX-B-01, IOS-H-03.

**How:** After `const AI_BACKEND_URL = null;`, add `const AI_ENABLED = !!AI_BACKEND_URL;`. Subagent greps to find every "Generate insight"/"Generate briefing"/AI button render (approximate sites at lines 8828, 9016, 9112). Wrap each render branch in `AI_ENABLED && (...)`. Leave click handlers in place for v1.1 activation.

**Verify:** Open app — no "Generate" or "AI insight" buttons visible. Fallback message about AI proxy should be unreachable.

### Wave 1 Exit criteria

1. All 10 W1 tasks complete; VERIFY passes (subagent + orchestrator).
2. `npm test` green.
3. `npm run build` produces clean `dist/`.
4. Commit: `feat(foundation): wave-1 security and stability — ErrorBoundary, doDeleteAccount Storage cleanup, demo-password substitution, AI feature flag, dist/ build`.
5. §0.4 memory checkpoint at `.claude/memory/appstore-launch-wave-1-handoff.md`.

### Findings absorbed by Wave 1

SEC-C-01 (subagent half), CQ-B-01, CQ-B-02, CQ-B-03, CQ-H-05, IOS-B-02, SEC-H-3, SEC-M-03, PWA-B-01, PWA-B-02, PWA-B-05, IOS-H-3, IOS-H-4, IOS-M-5, IOS-M-6, UX-B-01, PRIV-01, SEC-M-04 + .gitignore audit.

---

## 3. Wave 2 — iOS Shell Preparation + Simulator Validation

### Scope

Generate Capacitor iOS native project, configure all Info.plist values, produce icon ladder + launch screen, build for simulator (Debug — no signing required), run smoke tests, and prepare ExportOptions.plist template with founder-fill placeholders. **No founder gates inside this wave.**

### Pre-flight

**Step 1 — Confirm Wave 1 closure.** Read `.claude/memory/appstore-launch-wave-1-handoff.md`.

**Step 2 — Confirm macOS host with Xcode 16+ is available** for W2-T3 through W2-T8 (`cap add ios`, simulator builds). If orchestrator is on Windows, dispatch these tasks to a Mac-hosted subagent. The non-Mac tasks (icons, plist template prep) can run on either platform.

**Step 3 — Confirm in chat:** `"Wave 2 pre-flight complete. macOS host status: <available / dispatched to Mac subagent>. Proceeding."`

### W2-T1 — Generate full app icon ladder

**Files:** Create `apple-touch-icon-{180,167,152,120,87,80,60,58,40,29,192,512}.png`. Use existing `apple-touch-icon-1024.png` (verify no alpha).

**Why:** PWA-H-02, PWA-H-03, IOS-B-03, IOS-H-07.

**How:**
1. Verify alpha: `magick identify -format "%[channels]" apple-touch-icon-1024.png` → expect `rgb`. If `rgba`: `magick apple-touch-icon-1024.png -background white -alpha remove -alpha off apple-touch-icon-1024.png`.
2. Downscale: `for size in 180 167 152 120 87 80 60 58 40 29 192 512; do magick apple-touch-icon-1024.png -resize ${size}x${size} -strip apple-touch-icon-${size}.png; done`.
3. Update `manifest.json` icons array with 192 + 512 entries (PWA install requirement).
4. Expand `scripts/build-dist.mjs` FILES list.

**Verify:** All files exist with correct dimensions. 1024 has no alpha. `npm run build` copies all icons.

### W2-T2 — Pre-render Launch Screen logo

**Files:** Create `assets/launch-screen-logo.png` — 600×200 (3x retina), Verrocchio wordmark on transparent background.

**Why:** IOS-B-04, PWA-H-04. Storyboard edit happens in W2-T4 after `cap add ios`.

**Verify:** File exists; correct dimensions.

### W2-T3 — `npx cap add ios` (canary-first per §0.1, macOS-bound)

**Files:** Creates `ios/` tree.

**Why:** PWA-B-03, IOS-B-01.

**How:** `npm install` + `npx cap add ios`.

**Verify (canary):** `ls ios/App/` shows the standard Capacitor iOS tree. Open `ios/App/App.xcworkspace` in Xcode 16 — project loads without errors. Bundle ID = `com.verrocchio.app` (from `capacitor.config.json`).

**Independence note:** `npx cap add ios` runs entirely locally — no Apple credentials required. It only scaffolds the Xcode project files. Code signing (founder Phase F) happens later.

### W2-T4 — Configure Info.plist + Launch Screen + Status Bar

**Files:** Modify `ios/App/App/Info.plist`. Modify `ios/App/App/Base.lproj/LaunchScreen.storyboard`. Modify `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.

**Why:** IOS-H-08, IOS-M-03, IOS-B-04, IOS-B-05, UX-M-02.

**How — Info.plist entries (use placeholders for founder-fill items):**
```xml
<key>UISupportedInterfaceOrientations</key>
<array><string>UIInterfaceOrientationPortrait</string></array>
<key>NSHumanReadableCopyright</key>
<string>© 2026 Verrocchio LLC. All rights reserved.</string>
<key>UIStatusBarStyle</key>
<string>UIStatusBarStyleDefault</string>
<key>UIViewControllerBasedStatusBarAppearance</key>
<false/>
```

The copyright string already contains the real entity name (`Verrocchio LLC`) — no placeholder substitution needed at simulator build time.

DO NOT add any `NS*UsageDescription` keys. Remove any present.

Icons: copy generated PNGs into `AppIcon.appiconset/` per the auto-generated `Contents.json` filenames.

Launch Screen: edit storyboard for centered logo at 200pt on `#f8f7f4` background.

**Verify:** `plutil -p ios/App/App/Info.plist | grep -E "UISupportedInterfaceOrientations|NSHumanReadableCopyright"` shows expected keys; `| grep "NSCameraUsage"` returns nothing.

### W2-T5 — TARGETED_DEVICE_FAMILY = 1 (iPhone only)

**Files:** Modify `ios/App/App.xcodeproj/project.pbxproj`.

**Why:** IOS-H-09.

**How:** Grep and change `TARGETED_DEVICE_FAMILY = "1,2";` → `TARGETED_DEVICE_FAMILY = 1;`.

**Verify:** `grep TARGETED_DEVICE_FAMILY ios/App/App.xcodeproj/project.pbxproj` shows `= 1;`.

### W2-T6 — `npm run build && npx cap sync ios`

**Why:** Populates `ios/App/App/public/` from `dist/`.

**How:** `npm run build && npx cap sync ios`.

**Verify:** `ls ios/App/App/public/` matches FILES list. No leaked dirs (`docs/`, `tests/`, `node_modules/`, `.claude/`).

### W2-T7 — Simulator Debug build + smoke test (canary-first per §0.1)

**Why:** Catch obvious crashes / layout breaks. Debug builds do NOT require code signing — fully subagent-executable on macOS.

**How:**
```bash
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' build
xcrun simctl install booted build/Debug-iphonesimulator/App.app
xcrun simctl launch booted com.verrocchio.app
```

**Smoke checklist:**
- Auth screen renders.
- Sign in via `DEMO_PASSWORD` env-injected demo persona.
- Each of 5 tabs renders without crash.
- Profile modal opens without crash.
- Delete account dialog opens (do NOT confirm — we don't want to nuke the demo).
- Dark mode toggle.
- Rotate device → stays portrait.

If any step crashes, `xcrun simctl spawn booted log show --last 1m` captures device log; dispatch a fix-mode subagent on the specific surface.

### W2-T8 — Generate `ios/ExportOptions.plist` template with placeholder

**Files:** Create `ios/ExportOptions.plist`.

**Why:** Prepared in advance so when the founder runs Phase F, only a single placeholder replacement is needed.

**How:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>teamID</key>
  <string>{{TEAM_ID}}</string>
  <key>uploadSymbols</key>
  <true/>
  <key>signingStyle</key>
  <string>automatic</string>
</dict>
</plist>
```

Add to `.gitignore`: `ios/ExportOptions.local.plist` (so founder's filled-in version doesn't leak).

**Verify:** File exists. `grep "{{TEAM_ID}}" ios/ExportOptions.plist` → 1 match.

### W2-T9 — Document Wave-2 outputs in handoff log

**Files:** Create `.claude/state/founder-handoff.json` (or append if exists).

**Why:** Sync state file with what's now ready for the founder.

**How:**
```json
{
  "wave_2_complete": true,
  "ios_project_path": "ios/App/App.xcworkspace",
  "bundle_id": "com.verrocchio.app",
  "marketing_version": "1.0.0",
  "build_number": "1",
  "simulator_smoke": "passed",
  "next_founder_steps": "FOUNDER_HANDOFF.md Phase A (Apple Developer enrollment, if not done), then Phase F (sign + archive + upload) once Wave 3 closes"
}
```

**Verify:** File exists, JSON valid.

### Wave 2 Exit criteria

1. `ios/` generated and committed (excluding `ios/build/`, `ios/Pods/` per `.gitignore`).
2. Full app icon ladder; no alpha on 1024.
3. Info.plist configured with `{{ENTITY}}` placeholder for founder fill.
4. `TARGETED_DEVICE_FAMILY = 1`.
5. `cap sync` produces clean `ios/App/App/public/`.
6. Simulator Debug build succeeds.
7. Smoke checklist clean.
8. `ios/ExportOptions.plist` template with `{{TEAM_ID}}` placeholder.
9. `.claude/state/founder-handoff.json` documents state.
10. §0.4 memory checkpoint at `.claude/memory/appstore-launch-wave-2-handoff.md`.

### Findings absorbed by Wave 2

IOS-B-01, IOS-B-03, IOS-B-04, IOS-B-05, IOS-H-07, IOS-H-08, IOS-H-09, IOS-M-03, PWA-B-03, PWA-H-02, PWA-H-03, PWA-H-04, CQ-M-05.

---

## 4. Wave 3 — Interior Punch-list + Final Assets/Docs/Tests

### Scope

Every remaining finding from the 6 audits, plus final asset generation (screenshots), final documentation drafts (ASC metadata, privacy nutrition label checklist, support page), and regression tests. 30 tasks, interleavable under §0.3 sequential rule. After all land, the repo is **TestFlight-upload-ready** and the founder picks up from `FOUNDER_HANDOFF.md` Phase F.

### 4.1 Critical-path tasks (fix first)

#### W3-T1 — "Forgot password" flow with anti-enumeration

**Files:** Modify `index.html` login screen (~9520-9587) + add `doForgotPassword` near `doAuth`.

**Why:** SEC-H-02, UX-B-03.

**How:** Per `04-security.md` SEC-H-02. Add "Forgot password?" link below Log in; handler swallows errors and shows generic success message ("If that email is registered, a reset link has been sent.").

**Verify:** Click link with valid + invalid emails; both show same generic message; valid email triggers Firebase reset email.

#### W3-T2 — Friendly Firebase error mapping

**Files:** Modify `index.html` `doAuth()` ~line 3531.

**Why:** UX-B-04, SEC-L-03.

**How:** Add `publicAuthErr(e)` helper mapping `auth/invalid-email`, `auth/weak-password`, `auth/email-already-in-use`, `auth/invalid-credential` to friendly copy. Replace raw `e?.message?.replace("Firebase: ", "")` with `publicAuthErr(e)`.

**Verify:** Trigger each error path — no bracketed Firebase codes visible.

#### W3-T3 — Password complexity on signup (client-side)

**Files:** Modify `index.html` `doAuth()` signup branch ~line 3525.

**Why:** SEC-H-04.

**How:** Before `createUserWithEmailAndPassword`: `if (authMode === "signup" && authPass.length < 8) { setAuthErr("Password must be at least 8 characters."); return; }`.

**Independence note:** Server-side enforcement (Firebase Console password policy) is `FOUNDER_HANDOFF.md` Phase C2. Client-side check ships independently of that.

**Verify:** 6-char password rejected client-side.

#### W3-T4 — Hide demo personas in production builds

**Files:** Modify `index.html` near `DEMO_PERSONAS` render.

**Why:** UX-B-02, IOS-B-06.

**How:**
```js
const SHOW_DEMO_UI = location.hostname === 'localhost'
                  || location.hostname === '127.0.0.1'
                  || new URLSearchParams(location.search).get('demo') === '1';
```
Wrap persona buttons: `SHOW_DEMO_UI && (...)`. In `signInAsDemoUser`, retain allowlist guard (SEC-M-05): `if (!Object.prototype.hasOwnProperty.call(DEMO_PERSONAS, email)) return;`.

**Verify:** Production URL → no demo buttons. `localhost` or `?demo=1` → buttons visible.

#### W3-T5 — Splash → login flash gate

**Files:** Modify `index.html` `App()` top-level pre-auth render.

**Why:** UX-B-07.

**How:** Strict three-state flow: `authUser === undefined` → Splash; `authUser === null` → AuthScreen; object → App.

**Verify:** Throttle to 3G in DevTools, reload — splash holds until Firebase resolves, no login flash.

#### W3-T6 — Sign-up consent links

**Files:** Modify `index.html` sign-up form render.

**Why:** UX-B-08, PRIV-02.

**How:** Below Sign up button:
```js
React.createElement("p", {
  style: { fontSize: 11, color: "var(--c-text-faint)", marginTop: 8, textAlign: "center" }
},
  "By signing up you agree to our ",
  React.createElement("a", { href: "/privacy", target: "_blank", rel: "noopener noreferrer", style: { color: "var(--accent)" } }, "Privacy Policy"),
  " and ",
  React.createElement("a", { href: "/support", target: "_blank", rel: "noopener noreferrer", style: { color: "var(--accent)" } }, "Terms"),
  "."
)
```

**Verify:** Sign-up shows consent line; links resolve to the policy/support pages (after W3-T16 + W3-T17).

#### W3-T7 — Account-deletion UX polish

**Files:** Modify `index.html` delete-account modal (~22917+).

**Why:** UX §7, IOS-H-05, SEC-L-04.

**How:** Type-to-confirm field ("delete my account"); "I forgot my password" link → `sendPasswordResetEmail(auth.currentUser.email)`; clearer confirmation copy.

**Verify:** Delete disabled until phrase typed. Reset email arrives.

### 4.2 UX polish

#### W3-T8 — Safe-area-inset audit + fix

**Why:** CQ-B-04, UX §8.

**How:** Grep `position: ['\"]fixed['\"]|position: ['\"]sticky['\"]`. For each, ensure inline style includes appropriate `env(safe-area-inset-*)`. Specifics: top-sticky `padding-top: max(16px, env(safe-area-inset-top))`; bottom-fixed `padding-bottom: max(8px, env(safe-area-inset-bottom))`; `undoToast` `bottom: max(120px, calc(env(safe-area-inset-bottom) + 80px))`.

**Verify:** Re-run simulator smoke (W2-T7) on iPhone 14/15 Pro. Every overlay clears notch + home indicator in simulator.

#### W3-T9 — Single-screen welcome modal for new sign-ups

**Files:** Modify `index.html` App() — add modal gate.

**Why:** UX-H-08, UX §5.

**How:** On first signed-in render with `!data.habits?.length && !data.tourDone`: modal with "Welcome to Verrocchio" headline + body + CTA "Add my first habit" → routes to Habits + form open + "Skip for now" dismisses. On dismiss, set `tourDone: true`.

**Verify:** Fresh account → modal; tap "Add" routes correctly; sign in later → modal does not re-appear.

#### W3-T10 — Empty-state copy per tab

**Files:** Modify `index.html` each tab render.

**How:** Per `03-ux.md` §11. Brief / Habits / Todos / Reflection / Goals each get framing + CTA.

**Verify:** Fresh account; each tab shows empty-state with framing + CTA.

#### W3-T11 — Journal/health disclaimer modal

**Files:** Modify `index.html` Reflection tab + add `journalDisclaimerAcked` to `DD` and `hydrateCloudDoc`.

**Why:** PRIV-05.

**How:** First journal entry when `!journalDisclaimerAcked` → modal "Verrocchio is not a medical device. Your entries are stored in your private Firebase account and visible only to you." On ack, persist flag.

**Verify:** First entry → modal; second entry → no modal.

#### W3-T12 — AI consent gate (deferred activation, wired)

**Files:** Modify `index.html` AI settings toggle.

**Why:** PRIV-06.

**How:** On first AI-enable attempt, modal explains data flow (Anthropic via Cloudflare proxy, no training). Persist `aiConsentAt: Date.now()` in `DD`.

**Verify:** AI_ENABLED=false in v1.0 so unreachable; dev flip → consent flow gates first call.

#### W3-T13 — Show-password toggle + requirements helper + sign-up tagline

**Files:** Modify `index.html` auth screen.

**Why:** UX-H-03, UX-H-04, UX-H-05.

**How:** Eye button toggles password input `type` between `password` and `text`. Helper "At least 8 characters" below password (signup mode). Tagline above form: "Daily habits, weekly reflection, lifetime goals — phone-first."

**Verify:** Visual; eye toggles; requirement text visible in signup mode.

#### W3-T14 — Dark mode coverage audit

**Files:** Modify `index.html` surfaces with un-tokenized rgb colors.

**Why:** UX-M-07.

**How:** Open in dark mode in simulator. Visually scan Brief, Habits grid, Bottom nav, Profile, Reflection, Goals. For each white-on-cream artifact: migrate inline `rgb(...)` to `var(--c-*)` token OR add `body.dark [style*="rgb(...)"]` rule.

**Verify:** iOS sim dark mode shows no white card on cream; no invisible text.

### 4.3 Privacy + hosting + AI proxy code prep

#### W3-T15 — `firebase.json` for Firebase Hosting + privacy/support page generation

**Files:**
- Create: `firebase.json` (Firebase Hosting config — public dir, rewrites, security headers).
- Create: `scripts/render-docs.mjs` — markdown-to-html renderer.
- Modify: `scripts/build-dist.mjs` — call render-docs as part of build to emit `dist/privacy.html` + `dist/support.html`.
- Modify: `package.json` — add `marked` and `firebase-tools` (devDependency).

**Why:** PRIV-02, IOS-B-07. **Web hosting is Firebase Hosting** (not GitHub Pages — the founder has explicitly opted out of GH Pages for the public web build). Firebase Hosting integrates with the existing `verrocchio-1b116` Firebase project, provisions free HTTPS for the `verrocchio.app` custom domain, and scales easily into the thousands-of-users range (10 GB/month bandwidth free tier, then ~$0.15/GB).

**How — `firebase.json`** (from `06-pwa-build.md` §10):
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "cleanUrls": true,
    "trailingSlash": false,
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "geolocation=(), camera=(), microphone=()" }
        ]
      },
      {
        "source": "/service-worker.js",
        "headers": [{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }]
      },
      {
        "source": "**/*.@(js|css|png|jpg|woff2)",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      }
    ]
  }
}
```

Firebase Hosting's `cleanUrls: true` means `privacy.html` is reachable as both `/privacy.html` and `/privacy` — we'll use `/privacy` and `/support` in ASC and in-app links.

**How — `scripts/render-docs.mjs`:**
```js
import { readFile, writeFile } from 'node:fs/promises';
import { marked } from 'marked';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');

const TEMPLATE = (title, body) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title} — Verrocchio</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#2d5a2d">
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
  body{max-width:680px;margin:40px auto;padding:0 16px;font-family:Lora,Georgia,serif;line-height:1.6;color:#1f2937;background:#f8f7f4}
  h1,h2,h3{font-family:'Playfair Display',Georgia,serif;color:#111827}
  a{color:#2d5a2d}
  code{background:#eef2e9;padding:1px 4px;border-radius:3px}
  table{border-collapse:collapse;margin:16px 0}
  td,th{border:1px solid #c6dfc6;padding:6px 10px;text-align:left}
</style>
</head>
<body>
${body}
<p style="margin-top:60px;font-size:11px;color:#6b7280;text-align:center">
  <a href="/">← Back to Verrocchio</a>
</p>
</body>
</html>`;

for (const [src, dst, title] of [
  ['docs/PRIVACY_POLICY.md', 'privacy.html', 'Privacy Policy'],
  ['docs/SUPPORT.md', 'support.html', 'Support']
]) {
  try {
    const md = await readFile(src, 'utf8');
    await writeFile(path.join(DIST, dst), TEMPLATE(title, marked.parse(md)));
    console.log(`[render-docs] ${src} → dist/${dst}`);
  } catch (e) {
    console.warn(`[render-docs] skip ${src}: ${e.message}`);
  }
}
```

Call this from `scripts/build-dist.mjs` AFTER the FILES copy loop (so dist/ exists). Or wire it as a separate `npm run render-docs` and chain in the `build` script.

**Verify:**
- `npm run build` produces `dist/firebase.json` (no, that one stays at root), `dist/privacy.html`, `dist/support.html`, plus the existing FILES.
- `npx firebase emulators:start --only hosting` → `http://localhost:5000/privacy` renders the policy.

#### W3-T16 — Support page (`docs/SUPPORT.md`)

**Files:** Create `docs/SUPPORT.md`. Modify `index.html` Profile modal — add "Privacy Policy" + "Contact Support" links.

**Why:** IOS-M-02 + ASC support URL.

**How — `docs/SUPPORT.md`:** Sections — Common Questions (sign-in, sync, delete account, data export, dark mode), Contact (`support@verrocchio.app`), Bug reports template. Rendered to `dist/support.html` via W3-T15's `render-docs.mjs`.

**How — `index.html` Profile modal:**
```js
React.createElement("a", { href: "/privacy", target: "_blank", rel: "noopener noreferrer" }, "Privacy Policy"),
React.createElement("a", { href: "/support", target: "_blank", rel: "noopener noreferrer" }, "Contact Support")
```

Firebase Hosting's `cleanUrls: true` resolves `/privacy` → `privacy.html` automatically.

**Verify:** `npm run build` produces both HTML files in `dist/`. Profile modal links resolve under Firebase Hosting emulator.

#### W3-T17 — Capacitor `dist/` bundling for offline-capable static assets

**Files:** Modify `scripts/build-dist.mjs` (W1-T1) FILES list to include `privacy.html` + `support.html` (they're already in `dist/` after W3-T15 runs).

**Why:** `cap sync ios` copies `dist/` into the iOS bundle. The privacy/support pages must be local so they work offline inside the iOS WKWebView (linking to `/privacy` resolves against the bundled `privacy.html`).

**Verify:** After `npm run build && npx cap sync ios`, `ls ios/App/App/public/` includes `privacy.html` and `support.html`.

#### W3-T18 — Cloudflare Worker AI proxy code review (no deploy)

**Files:** Modify `ai-proxy/wrangler.toml` to set `ALLOWED_ORIGIN = "https://verrocchio.app"` (uncommented). Also modify `ai-proxy/worker.js` `cors()` to accept the Capacitor origin as a second allowed value (the iOS app calls the worker too, from `capacitor://localhost` — single-origin CORS would block it).

**Why:** SEC-H-01 prep — worker is ready for v1.1 AI re-enable. v1.0 ships without AI so deploy is deferred.

**How — `ai-proxy/wrangler.toml`:**
```toml
[vars]
FIREBASE_PROJECT_ID = "verrocchio-1b116"
ALLOWED_ORIGIN = "https://verrocchio.app"
```

**How — `ai-proxy/worker.js` `cors()` function:** Extend to allow either the web origin OR the Capacitor scheme:
```js
const ALLOWED_ORIGINS = new Set([
  "https://verrocchio.app",
  "https://verrocchio-1b116.web.app",  // backup; default Firebase domain still works
  "capacitor://localhost"              // iOS Capacitor WKWebView
]);
function cors(env, requestOrigin) {
  const fallback = (env && env.ALLOWED_ORIGIN) || "https://verrocchio.app";
  const allowed = ALLOWED_ORIGINS.has(requestOrigin) ? requestOrigin : fallback;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}
```

Update the two call sites that invoke `cors(env)` to pass `request.headers.get("Origin")` as the second argument.

**Independence note:** Actual `wrangler deploy` is `FOUNDER_HANDOFF.md` Phase D. Subagent prepares the configuration so the deploy is one command on the founder's side.

**Verify:** `grep ALLOWED_ORIGIN ai-proxy/wrangler.toml` shows the uncommented line. `grep -A8 "function cors" ai-proxy/worker.js` shows the new allowlist + Vary header.

### 4.4 Code quality + crash

#### W3-T19 — Capacitor App lifecycle hooks (canary-first)

**Files:** Modify `index.html` bootstrap + App() effect.

**Why:** CQ-H-06.

**How:**
```js
if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
  window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
    if (state.isActive) {
      try { auth.currentUser && auth.currentUser.getIdToken(true); } catch (_) {}
    }
  });
}
```

**Verify (canary):** Background/foreground in simulator; listener fires (add temporary `console.warn` for verification, remove after).

#### W3-T20 — JSON.parse try/catch wrappers

**Files:** Modify `index.html` — every `JSON.parse(localStorage.getItem(...))`.

**Why:** CQ-H-07.

**How:** Wrap each:
```js
let x;
try { x = JSON.parse(localStorage.getItem("v-foo")) || DEFAULT; } catch (_) { x = DEFAULT; }
```

**Verify:** Every `JSON.parse(localStorage` is inside try/catch with fallback.

#### W3-T21 — Retry UI for failed Firestore writes

**Files:** Modify `index.html` save() / userDoc.set() sites + add `lastSyncError` state.

**Why:** CQ-H-01.

**How:** Track `lastSyncError`; on `.catch(...)` of `.set()`, setLastSyncError. Render banner: "Couldn't save. Tap to retry." Retry re-runs last save. Auto-clear on success.

**Verify:** Offline → edit habit → banner. Restore + tap retry → banner clears.

#### W3-T22 — Demo seed mutation cleanup

**Files:** Modify `index.html:3828-3836`.

**Why:** CQ-H-04.

**How:**
```js
h = { ...h, completions: { ...h.completions, [k]: "done" }, completionTimes: { ...h.completionTimes, [k]: t } };
```

**Verify:** `grep -nE "h\.completions\[" index.html` → 0 mutation matches.

#### W3-T23 — Achievement timestamp normalization

**Files:** Modify `index.html:6956, 3865`.

**Why:** CQ-H-03, CQ-M-02.

**How:** Replace `new Date().toISOString()` (non-date-key uses) with `Date.now()`. Add `hydrateCloudDoc` migration for legacy ISO strings.

**Verify:** New achievement writes epoch ms; legacy doc still readable.

#### W3-T24 — Timer leak audit

**Files:** Modify `index.html`.

**Why:** CQ-B-05.

**How:** Audit every `setInterval` / `setTimeout` in `useEffect`. Add paired `clear*` in cleanup return.

**Verify:** `grep -c setInterval index.html` ≈ `grep -c clearInterval index.html` for effect uses.

#### W3-T25 — SRI hashes on CDN scripts

**Files:** Modify `index.html:23-35`.

**Why:** SEC-H-05.

**How:**
```bash
for url in \
  "https://unpkg.com/react@18.3.1/umd/react.production.min.js" \
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" \
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js" \
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js" \
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js" \
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"
do
  echo "$url"
  curl -sL "$url" | openssl dgst -sha384 -binary | openssl base64 -A
  echo
done
```
Add `integrity="sha384-..."` and `crossorigin="anonymous"` to each `<script>` tag.

**Verify:** `grep -n "integrity=" index.html` → 6 matches. Page loads without SRI failure.

#### W3-T26 — Storage cap 100MB → 10MB

**Files:** Modify `storage.rules:32` + matching `index.html` client check.

**Why:** SEC-M-06.

**How:** `100 * 1024 * 1024` → `10 * 1024 * 1024`.

**Independence note:** Subagent updates the file. Deploy to Firebase is `FOUNDER_HANDOFF.md` Phase C (or delegated subagent with `FIREBASE_TOKEN`).

**Verify:** `grep "10 \* 1024" storage.rules` shows the new cap.

#### W3-T27 — Hide device-indicator chip in production

**Files:** Modify `index.html`.

**Why:** UX-H-06.

**How:** Add `const SHOW_DEBUG_UI = location.hostname === 'localhost';`. Gate device-indicator render: `SHOW_DEBUG_UI && (...)`.

**Verify:** Production hostname → no chip. localhost → chip visible.

#### W3-T28 — Sync state pill on errors only

**Files:** Modify `index.html`.

**Why:** UX-H-07.

**How:** Render condition → only when `syncState === "error"` OR `lastSyncError != null`.

**Verify:** Normal → no pill. Offline → "Offline — changes saved locally."

### 4.5 Final assets, metadata drafts, regression tests

#### W3-T29 — Marketing screenshots via simulator (macOS-bound)

**Files:** Produce 5-7 PNG files at 1290×2796 (6.7" iPhone Pro Max).

**Why:** IOS-B-10.

**How:**
```bash
xcrun simctl boot "iPhone 15 Pro Max"
# Re-run W2-T6 + W2-T7 for this simulator if not already done
xcrun simctl install booted ios/App/build/Debug-iphonesimulator/App.app
xcrun simctl launch booted com.verrocchio.app
# Navigate to each frame manually, then:
xcrun simctl io booted screenshot ~/Desktop/verrocchio-screen-N.png
```

Frames per `03-ux.md` §9:
1. Brief tab (morning-consistent persona, 6:42am).
2. Habits tab mid-day (3/7 done).
3. Goals tab with SMART card open.
4. Reflection/Journal with sparkline.
5. Dark mode Brief tab.
6. Profile with custom accent.
7. Optional: Habits edit flow.

**Save to:** `assets/screenshots/v1.0/iphone-67/screen-N.png`.

**Verify:** All at 1290×2796, no rounded corners in image, no status bar artifacts.

#### W3-T30 — Generate `docs/APP_STORE_CONNECT_VALUES.md`

**Files:** Create `docs/APP_STORE_CONNECT_VALUES.md`.

**Why:** Founder copy-pastes these into ASC (Phase E3). Subagent drafts the values from `02-ios-app-store.md` §7, with URLs updated to the live custom domain.

**How:** Markdown document with each ASC field, the value, and a brief note. Include the 4000-char description draft, the keywords list, the categories, age rating decision. URLs use the custom domain (custom domain configured via `FOUNDER_HANDOFF.md` Phase C2 — points at GitHub Pages):
- Support URL: `https://verrocchio.app/support`
- Privacy Policy URL: `https://verrocchio.app/privacy`
- Marketing URL: `https://verrocchio.app`
- Copyright: `© 2026 Verrocchio LLC`
- Contact email (App Review Notes): `support@verrocchio.app`

**Verify:** File exists; covers every required ASC field. URLs use `verrocchio.app` not `verrocchio-1b116.web.app`.

#### W3-T31 — Generate `docs/APP_STORE_PRIVACY_LABEL.md`

**Files:** Create `docs/APP_STORE_PRIVACY_LABEL.md`.

**Why:** Founder ticks through ASC's privacy questionnaire (Phase E4). Subagent renders the nutrition label from `01-privacy.md` Artifact 2 into a step-by-step checklist matching ASC's UI flow.

**How:** Each ASC privacy questionnaire screen becomes a section: Data Types Collected (with sub-questions per category: Contact Info → Email Address → linked/tracking/purpose), Data Use, Data Sharing. Founder follows the doc top-to-bottom.

**Verify:** File exists; covers all Apple nutrition-label categories present in our data inventory.

#### W3-T32 — Regression test suite

**Files:** Add tests to `tests/utils.test.mjs`.

**Why:** Cover top 5 test gaps from `05-code-quality.md` §10.

**How:**
1. `sanitizeForFirestore` round-trip for habits with null/undefined/missing fields.
2. `dk()` across DST transitions (March 12 + November 5 2026).
3. `getStreak` mixed-frequency habits across DST.
4. JSON.parse fallback for corrupted localStorage entries.
5. `hydrateCloudDoc` migration for legacy doc shapes.

**Verify:** `npm test` green with new tests.

#### W3-T33 — Final polish batch

**Files:** Modify `index.html` for low-severity items.

**How:**
- `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` near head (UX-M-03).
- 200ms cross-fade splash → login (UX-H-01).
- "New version available" toast on SW `controllerchange` (UX-L-07).
- Logo/wordmark on splash (UX-L-08).
- Remove dead `splashAnimKey` / `walkSlide` state (UX-L-02, UX-L-03).
- Clear `authPass` on auth failure (UX-L-04).

**Verify:** Visual; `npm test` green.

#### W3-T34 — Touch target audit

**Files:** Modify `index.html`.

**Why:** UX §10.

**How:** Grep patterns from `03-ux.md` §10. For each match below 44×44, extend hit area with padding (not margin). Add `aria-label` to icon-only buttons.

**Verify:** Manual audit in simulator — every tappable element has a 44pt hit zone.

### Wave 3 Exit criteria

1. All 30 W3 tasks complete; VERIFY passes (subagent + orchestrator).
2. `npm test` green with regression suite added.
3. `npm run build` produces clean `dist/` including `privacy.html` and `support.html`.
4. `npx cap sync ios` updates `ios/App/App/public/` to latest dist.
5. Re-run simulator smoke (W2-T7) — every blocker from initial smoke cleared.
6. Marketing screenshots produced at `assets/screenshots/v1.0/`.
7. `docs/APP_STORE_CONNECT_VALUES.md` and `docs/APP_STORE_PRIVACY_LABEL.md` exist.
8. `.claude/state/founder-handoff.json` updated to `"wave_3_complete": true`.
9. §0.4 final memory checkpoint at `.claude/memory/appstore-launch-wave-3-handoff.md`. The repo is now **TestFlight-upload-ready**.

### Findings absorbed by Wave 3

SEC-H-01 (config prep), SEC-H-02, SEC-H-04 (client half), SEC-H-05, SEC-M-05, SEC-M-06 (file half), SEC-L-03, CQ-H-01, CQ-H-03, CQ-H-04, CQ-H-06, CQ-H-07, CQ-B-04, CQ-B-05, UX-B-02..08 (excluding B-01 in Wave 1), UX-H-01, UX-H-03..08, UX-M-03, UX-M-07, UX-L-01..08, PRIV-02, PRIV-05, PRIV-06, IOS-B-07, IOS-B-10, IOS-H-05, IOS-M-02, PWA-H-01.

---

## 5. Plan Exit — TestFlight-Upload-Ready State

When Wave 3 closes:

- **Code:** 25k-line `index.html` patched per all 49 task fixes; `utils.js` unchanged except for new tests in `tests/utils.test.mjs`; `firestore.rules` + `storage.rules` updated; `service-worker.js` v35; `manifest.json` v1.0.0.
- **Build artifacts:** `dist/` directory with index.html, utils.js, manifest, SW, icons (all sizes), privacy.html, support.html, splash-animation.html.
- **iOS shell:** `ios/App/` Xcode project ready, Info.plist configured (with `{{ENTITY}}` placeholder), icon set populated, launch screen storyboarded, `TARGETED_DEVICE_FAMILY = 1`, marketing version 1.0.0 / build 1.
- **iOS build prep:** `ios/ExportOptions.plist` template with `{{TEAM_ID}}` placeholder ready for founder fill.
- **Marketing assets:** `assets/screenshots/v1.0/iphone-67/screen-{1..7}.png` at 1290×2796.
- **Documentation:** `docs/PRIVACY_POLICY.md` (with `{{ENTITY}}` + `{{CONTACT_EMAIL}}` placeholders), `docs/APP_STORE_CONNECT_VALUES.md`, `docs/APP_STORE_PRIVACY_LABEL.md`, `docs/SUPPORT.md`.
- **State:** `.claude/state/founder-handoff.json` flagged `"wave_3_complete": true`.

**Next:** The founder reads `docs/FOUNDER_HANDOFF.md` and runs Phases A through G on their own timeline. Master plan execution is done. The orchestrator stands by to dispatch hotfix-mode subagents on any feedback from TestFlight or Apple Review.

### Optional credential delegation

If the founder pre-supplies any of these credentials (one-time setup), the orchestrator can extend its work into typically-founder territory:

- `FIREBASE_TOKEN` (from `firebase login:ci`) → subagent can run `firebase deploy --only firestore:rules,storage,hosting` after every relevant code change.
- Firebase Admin service-account JSON → subagent can rotate demo passwords programmatically.
- `CLOUDFLARE_API_TOKEN` → subagent can run `wrangler deploy` for the AI proxy AND manipulate DNS records on `verrocchio.app` (the domain is on Cloudflare). With this token the subagent can add the Firebase Hosting A records itself — Phase C2 in `FOUNDER_HANDOFF.md` becomes a single command. The founder still needs to add the domain in Firebase Console first (to retrieve the TXT verification value and A record IPs).
- App Store Connect API key (Phase A3) → subagent can run `xcrun altool --upload-app` (but Xcode signing setup F1-F4 still requires the founder personally).

When any of these are present, the orchestrator extends Wave 3 with deploy tasks (e.g., `W3-T35: deploy firestore rules`, `W3-T36: deploy Firebase Hosting`, `W3-T37: write Cloudflare DNS A records for verrocchio.app`). These are NOT enumerated in this plan — they are conditional extensions that activate only when credentials exist.

---

## 6. Appendix — Full Finding-to-Wave Mapping

| Finding ID | Severity | Wave | Task |
|---|---|---|---|
| SEC-C-01 | CRITICAL | W1 | W1-T7 (subagent half — placeholder substitution; Firebase password rotation is `FOUNDER_HANDOFF.md` C3) |
| SEC-H-01 | HIGH | W3 | W3-T18 (config prep) |
| SEC-H-02 | HIGH | W3 | W3-T1 |
| SEC-H-03 | HIGH | W1 | W1-T4 |
| SEC-H-04 | HIGH | W3 | W3-T3 (client half; server-side policy is Phase C2) |
| SEC-H-05 | HIGH | W3 | W3-T25 |
| SEC-M-01..06 | MEDIUM | W1/W3 | W1-T4, W3-T4, W3-T26 — and Phase C for Console-only items |
| SEC-L-01..04 | LOW | W3 | W3-T2 (L-03), others defer |
| IOS-B-01 | BLOCKER | W2 | W2-T3 |
| IOS-B-02 | BLOCKER | W1 | W1-T4 |
| IOS-B-03 | BLOCKER | W2 | W2-T1 |
| IOS-B-04 | BLOCKER | W2 | W2-T2 + W2-T4 |
| IOS-B-05 | BLOCKER | W2 | W2-T4 |
| IOS-B-06 | BLOCKER | W1+W3 | W1-T7 + W3-T4 |
| IOS-B-07 | BLOCKER | W3 | W3-T15, W3-T16 |
| IOS-B-09 | BLOCKER | W2 | W2-T4 (version + build set in pbxproj on `cap add ios`; Xcode UI fill in Phase F3) |
| IOS-B-10 | BLOCKER | W3 | W3-T29 |
| IOS-H-01..10 | HIGH | W2/W3 | W2-T4, W2-T5, W3-T7 |
| IOS-M-01..08 | MEDIUM | W2/W3 | W2-T4, W3-T17 |
| UX-B-01..08 | BLOCKER | W1/W3 | W1-T10, W3-T1..T7 |
| UX-H-01..10 | HIGH | W3 | W3-T9, T10, T13, T27, T28, T33 |
| UX-M-01..08 | MEDIUM | W3 | W3-T14, T33 |
| UX-L-01..08 | LOW | W3 | W3-T33 |
| CQ-B-01..05 | BLOCKER | W1/W3 | W1-T5, W1-T8, W3-T8, W3-T24 |
| CQ-H-01..08 | HIGH | W1/W3 | W1-T6, W3-T19..T23 |
| CQ-M-01..05 | MEDIUM | W3 | W3-T21, T33 |
| CQ-L-01..04 | LOW | W3 | various |
| PWA-B-01..05 | BLOCKER | W1/W2 | W1-T1, W1-T3, W1-T9, W2-T3 |
| PWA-H-01..06 | HIGH | W2/W3 | W2-T1, W3-T15 |
| PWA-M-01..05 | MEDIUM | W1/W3 | W1-T3, W3-T15 |
| PRIV-01..08 | mixed | W1/W3 | W1-T4, W3-T11, T12, T15, T16, T31 |

**Items not addressed by this plan (deferred to v1.1 or founder-side):**
- SEC-M-01 (Firebase App Check enrollment) — `FOUNDER_HANDOFF.md` C6 (optional).
- SEC-M-02 (App-Bound Domains) — deferred to v1.1.
- DID-1..5 (defense-in-depth recommendations) — `FOUNDER_HANDOFF.md` C4, C5 + Cloudflare rate limiting.
- CQ-H-02 (wipeAllData timeout) — deferred; destructive op, hang acceptable.
- SEC-L-04 (wipeAllData re-auth) — deferred.
- All `{{ENTITY}}`/`{{CONTACT_EMAIL}}`/`{{TEAM_ID}}`/`{{ANTHROPIC_API_KEY}}` substitutions — `FOUNDER_HANDOFF.md` Phases B + F.
