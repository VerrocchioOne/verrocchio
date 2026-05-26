# Onboarding Path B Dedupe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the ~320-LOC inline onboarding block at `index.html` L7442-7761 and replace it with a single `React.createElement(window.Onboarding, {...})` callsite that mirrors Path A at L7426 — eliminating a byte-for-byte duplicate of `lib/views/Onboarding.js` (Wave 4.5.2).

**Architecture:** Single source of truth for onboarding render. Two entry conditions (`!hasSeenWelcome` and `hasSeenWelcome && !data.onboardingComplete`) now both route through the already-shipped, already-exercised `lib/views/Onboarding.js`. `finishOnboarding` stays inline at each callsite (App() lexical scope) — no new closure-threading required, sidestepping the v76 HabitsView crash class entirely.

**Tech Stack:** Plain JS + React 18 UMD (no JSX, no build step), `node --test` for unit tests, Playwright for E2E.

**Spec:** [docs/superpowers/specs/2026-05-26-onboarding-path-b-dedupe-design.md](../specs/2026-05-26-onboarding-path-b-dedupe-design.md)

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `index.html` | Modify L7442-7761 | Replace 320-LOC inline duplicate with ~15-LOC callsite |
| `service-worker.js` | Modify (SHELL_VERSION) | Bump v79 → v80 to flush SW cache |
| `tests/e2e/sw-migration.spec.js` | Modify (fixture) | Sync hardcoded SHELL_VERSION to v80 |
| `tests/e2e/onboarding-render.spec.js` | Create | Smoke test: app→splash→onboarding step 0 renders |
| `archive/index.v80.html` | Create | Snapshot per `feedback_archive_on_large_push` memory |
| `lib/views/Onboarding.js` | UNCHANGED | Already correct; do not touch |
| `lib/views/Splash.js` | UNCHANGED | Already correct; do not touch |

---

## Phase 1 — Pre-flight verification

### Task 1: Confirm `finishOnboarding` bodies are byte-equivalent

**Files:**
- Read: `index.html:7411-7425` (Path A's `finishOnboarding`)
- Read: `index.html:7449-7469` (Path B's `finishOnboarding`)

- [ ] **Step 1: Diff the two `finishOnboarding` bodies**

Run:
```bash
sed -n '7411,7425p' index.html > /tmp/finA.txt
sed -n '7449,7469p' index.html > /tmp/finB.txt
diff /tmp/finA.txt /tmp/finB.txt
```

Expected: diff shows only comment-line differences. Both define `const intent`, `const todayKey`, `const existingRitual`; both call `save({...data, userIntent, dailyRitual: <conditional intention backfill>, timeRanges: data.timeRanges || DEFAULT_TIME_RANGES, onboardingComplete: true})`.

If non-comment behavioral lines differ, STOP and update the spec — the dedupe is not a pure refactor.

- [ ] **Step 2: Confirm `window.Onboarding`'s callbacks contract**

Read `lib/views/Onboarding.js:18-28`. Confirm the signature is:
```
({ data, dispatch, deviceProfile, state: { onboardStep, walkSlide, onbIntent }, callbacks: { setOnboardStep, setWalkSlide, setOnbIntent, onFinish } })
```

Expected: matches Path A's call at `index.html:7426-7430` exactly. If signature has drifted, update Step 4 below to match.

- [ ] **Step 3: Confirm closure availability at the Path B callsite**

Run:
```bash
grep -n "const \[\(onboardStep\|walkSlide\|onbIntent\)" index.html
grep -n "const tk \|const save " index.html | head -5
grep -n "DEFAULT_TIME_RANGES" lib/time-of-day.js
```

Expected: `onboardStep`/`walkSlide`/`onbIntent` are App()-scope useState (around L469-L471); `tk` and `save` are App()-scope helpers; `DEFAULT_TIME_RANGES` is exported by `lib/time-of-day.js` and available at script-scope.

This is the v76-HabitsView precaution: we are NOT introducing a new module, but we ARE constructing a callsite that depends on identifiers being in lexical scope. Confirm they are before editing.

---

## Phase 2 — Smoke test (regression lock)

### Task 2: Write E2E smoke test for the splash → onboarding render path

**Files:**
- Create: `tests/e2e/onboarding-render.spec.js`

- [ ] **Step 1: Write the test**

Create `tests/e2e/onboarding-render.spec.js`:

```javascript
// Smoke test for the splash -> onboarding transition.
//
// Both onboarding entry paths in index.html (Path A: !hasSeenWelcome,
// Path B: hasSeenWelcome && !data.onboardingComplete) route through
// window.Onboarding after the v80 dedupe. This test pins the closure
// surface of lib/views/Onboarding.js: if any identifier the component
// needs is missing, the page will throw and step-0 carousel text won't
// appear.
//
// Cited precedent: v76 HabitsView extraction shipped with 4 missing
// closures and crashed the Habits tab silently for a session. This
// test would have caught it within seconds.

const { test, expect } = require("@playwright/test");

test("onboarding step-0 carousel renders after splash completes", async ({ page }) => {
  const errors = [];
  page.on("pageerror", err => errors.push(err.message));

  await page.goto("/");

  // Splash holds for ~2.4s, then transitions to onboarding step 0.
  // "Welcome to Verrocchio" is the step-0 carousel's first slide heading.
  await expect(page.getByText("Welcome to Verrocchio")).toBeVisible({ timeout: 8000 });

  // Body copy proves the full slide-0 render completed (not just partial paint).
  await expect(page.getByText(/A habit tracker for people who are serious/)).toBeVisible();

  // No JS errors during splash -> onboarding. A missing closure (e.g.,
  // setOnboardStep undefined) would surface here.
  expect(errors).toEqual([]);
});

test("onboarding step-1 balanced-life primer is reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Welcome to Verrocchio")).toBeVisible({ timeout: 8000 });

  // Advance: 3 carousel sub-slides, then 1 click to step 1 = 4 Next clicks.
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Next" }).click();
  }

  await expect(page.getByText("A balanced life")).toBeVisible();
});
```

- [ ] **Step 2: Run the test against the CURRENT (pre-refactor) code**

Run:
```bash
npx playwright test tests/e2e/onboarding-render.spec.js --project=desktop
```

Expected: BOTH tests PASS. This proves the test is wired correctly and the current Path-A render works end-to-end. The test will continue passing after the Path B dedupe because Path A's render path is preserved verbatim.

If the test FAILS pre-refactor, the test selectors are wrong (page text drifted) — fix the selectors before proceeding. Do NOT proceed to Phase 3 until both tests pass on unmodified code.

- [ ] **Step 3: Commit the test**

```bash
git add tests/e2e/onboarding-render.spec.js
git commit -m "test(e2e): pin onboarding splash -> step 0 -> step 1 render"
```

---

## Phase 3 — The dedupe edit

### Task 3: Replace inline Path B with a `window.Onboarding` callsite

**Files:**
- Modify: `index.html:7442-7761`

- [ ] **Step 1: Read the surrounding context one more time**

Read `index.html:7430-7770`. Confirm:
- L7431 closes the `if (!hasSeenWelcome)` block.
- L7442 opens `if (!data.onboardingComplete)`.
- L7761 closes that block.
- L7763 onward is the guided-tour block (unrelated; leave alone).

- [ ] **Step 2: Edit the file — replace the inline block**

Use the Edit tool. `old_string` is L7442-7761 (the entire `if (!data.onboardingComplete) { ... }` body, all ~320 lines including the closing brace at L7761). `new_string` is:

```javascript
  /* NEW-USER ONBOARDING FLOW (Path B entry: hasSeenWelcome && !data.onboardingComplete)
     v80: deduped against lib/views/Onboarding.js. Both entry conditions
     (Path A at L7426 for !hasSeenWelcome; this block for the post-welcome
     incomplete-onboarding case) now route through the same React
     component. finishOnboarding stays inline so the save closure picks
     up data/tk/save/DEFAULT_TIME_RANGES from App() lexical scope. */
  if (!data.onboardingComplete) {
    const finishOnboarding = () => {
      const intent = onbIntent.trim();
      const todayKey = tk();
      const existingRitual = (data.dailyRitual && data.dailyRitual[todayKey]) || {};
      save({
        ...data,
        userIntent: intent,
        dailyRitual: intent ? {
          ...(data.dailyRitual || {}),
          [todayKey]: { ...existingRitual, intention: existingRitual.intention || intent }
        } : (data.dailyRitual || {}),
        timeRanges: data.timeRanges || DEFAULT_TIME_RANGES,
        onboardingComplete: true
      });
    };
    return /*#__PURE__*/React.createElement(window.Onboarding, {
      data, dispatch, deviceProfile: window.__deviceProfile,
      state: { onboardStep, walkSlide, onbIntent },
      callbacks: { setOnboardStep, setWalkSlide, setOnbIntent, onFinish: finishOnboarding }
    });
  }
```

This is intentionally byte-equivalent to Path A's callsite at L7426-7430, with the same `finishOnboarding` body inlined.

- [ ] **Step 3: Verify LOC reduction with `wc -l`**

Run:
```bash
wc -l index.html
```

Expected: ~13,920 (down from 14,245 — net ~320 LOC removed minus ~25 LOC kept for the new callsite + comment).

If LOC delta is wildly off (e.g., +/- 50 from expected), STOP — the edit removed too much or too little.

---

## Phase 4 — Version bump and snapshot

### Task 4: Bump SHELL_VERSION v79 → v80

**Files:**
- Modify: `service-worker.js` (SHELL_VERSION constant)
- Modify: `tests/e2e/sw-migration.spec.js` (fixture)

- [ ] **Step 1: Find current SHELL_VERSION line**

Run:
```bash
grep -n "SHELL_VERSION" service-worker.js | head -5
```

- [ ] **Step 2: Bump v79 → v80**

Use Edit to change `const SHELL_VERSION = "v79"` to `const SHELL_VERSION = "v80"` (or the equivalent in the actual syntax — verify with the grep above).

- [ ] **Step 3: Bump the sw-migration fixture**

Run:
```bash
grep -n "v79" tests/e2e/sw-migration.spec.js
```

Use Edit to change the matching `"v79"` reference to `"v80"`. There should be exactly one such reference (the hardcoded prior-version fixture).

### Task 5: Snapshot archive/index.v80.html

**Files:**
- Create: `archive/index.v80.html`

- [ ] **Step 1: Copy current index.html to the v80 archive**

Run (PowerShell, since this is a Windows host):
```powershell
Copy-Item index.html archive/index.v80.html
```

Per `feedback_archive_on_large_push` memory: large pushes get an `archive/index.v###.html` snapshot where `###` matches SHELL_VERSION.

---

## Phase 5 — Verification

### Task 6: Run unit tests

- [ ] **Step 1: Run the unit suite**

Run:
```bash
node --test tests/*.test.mjs tests/domains/*.test.mjs
```

Expected: 404/404 pass. No new pure logic was added, no existing pure logic was changed.

If any test fails, the dedupe inadvertently touched shared code — investigate before proceeding.

### Task 7: Run desktop E2E suite

- [ ] **Step 1: Run E2E desktop project**

Run:
```bash
npx playwright test --project=desktop
```

Expected: 22/22 pass (the 20 prior tests + 2 new onboarding-render tests from Task 2).

If `sw-migration.spec.js` fails with a v79/v80 mismatch, the fixture in Task 4 step 3 wasn't bumped — fix and re-run.

### Task 8: Browser verify at desktop and iOS widths (per CLAUDE.md gate)

**Files:**
- None (manual / Playwright MCP verification)

- [ ] **Step 1: Start the dev server**

Run:
```bash
node scripts/serve.mjs &
```

(Or `.\serve.ps1` per CLAUDE.md.)

- [ ] **Step 2: Desktop verification (≥1024px)**

Open http://localhost:8080 in a browser at 1280x800. Wait for splash to complete. Confirm:
- Carousel step 0 renders ("Welcome to Verrocchio" + body)
- "Next" advances through 3 sub-slides
- "Next" past the last sub-slide advances to step 1 ("A balanced life" + 7 area chips)
- "Next" advances to step 2 ("Why are you here?" + textarea)
- Typing in the textarea updates `onbIntent`
- "Enter Verrocchio" advances past onboarding to the main app

Screenshot the carousel step 0 and the intent textarea.

- [ ] **Step 3: iOS-width verification (~390px)**

Open http://localhost:8080 in a browser at 390x844 (or use device emulation). Repeat the flow from Step 2. Confirm visual parity with desktop — same content, mobile-friendly card width (maxWidth: 440), no horizontal overflow.

Screenshot the carousel step 0 and the intent textarea at iOS width.

- [ ] **Step 4: Dark mode check**

Toggle dark mode (via the app's settings, or `localStorage.setItem("v-dark-mode", "1")` then reload). Confirm the onboarding card adapts correctly (background, text colors). No un-tokenized rgb regressions.

### Task 9: Commit + push

- [ ] **Step 1: Stage and commit the implementation**

```bash
git add index.html service-worker.js tests/e2e/sw-migration.spec.js archive/index.v80.html docs/superpowers/specs/2026-05-26-onboarding-path-b-dedupe-design.md docs/superpowers/plans/2026-05-26-onboarding-path-b-dedupe.md
```

(Note: the smoke test in `tests/e2e/onboarding-render.spec.js` was already committed in Task 2 Step 3.)

```bash
git commit -m "refactor: dedupe onboarding Path B against lib/views/Onboarding.js (v80)

Replaces the 320-LOC inline duplicate at index.html L7442-7761 with a
single React.createElement(window.Onboarding, {...}) callsite mirroring
Path A at L7426. The inline block was a leftover from Wave 4.5.2, when
Onboarding.js was extracted but the original copy was never deleted.

Closure surface unchanged - finishOnboarding stays inline at the
callsite, picking up data/tk/save/DEFAULT_TIME_RANGES from App()
lexical scope. Sidesteps the v76 HabitsView crash class (no new module
boundary, no new closure-threading) by routing through the
already-exercised window.Onboarding module.

LOC: index.html 14,245 -> ~13,920 (-325).
SHELL_VERSION: v79 -> v80.
Tests: 404/404 unit pass + 22/22 desktop E2E pass (added 2 onboarding-render smoke tests).
Snapshot: archive/index.v80.html.
"
```

- [ ] **Step 2: Push**

```bash
git push origin main
```

- [ ] **Step 3: Confirm clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean` + `Your branch is up to date with 'origin/main'`.

---

## Self-Review

**Spec coverage:**
- Delete index.html L7442-7761 → Task 3
- Replace with ~15-line callsite → Task 3 Step 2 (shows the actual replacement)
- Add smoke test for Path B entry condition → Task 2 (pins splash → onboarding render; both Path A and post-refactor Path B route through this render path)
- Bump SHELL_VERSION v79 → v80 → Task 4
- Snapshot archive/index.v80.html → Task 5
- npm test:unit + desktop E2E + browser verify at desktop + iOS widths → Tasks 6, 7, 8
- Cites v76 HabitsView crash precedent → Plan header + Task 2 Step 1 test comment

**Placeholder scan:** No TBDs, no "implement later", every code step shows the actual code.

**Type consistency:** `finishOnboarding`, `onbIntent`, `onboardStep`, `walkSlide`, `setOnboardStep`, `setWalkSlide`, `setOnbIntent`, `tk`, `save`, `DEFAULT_TIME_RANGES`, `window.Onboarding` all named consistently across tasks. Callsite shape matches Path A's existing callsite verbatim (Phase 1 Task 1 Step 2 verifies this before edit).

**Open consideration:** The smoke test in Task 2 exercises the splash → onboarding-step-0 render path. This is Path A's path pre-refactor. After the refactor, Path B routes through the same component, so a single smoke test pins both. A separate test that forces the `hasSeenWelcome=true && !data.onboardingComplete` entry condition would require a Firebase auth mock, which the existing E2E suite doesn't have scaffolding for — out of scope per the spec's "Out of scope" section. If a future regression slips through, add the auth-mocked test then.
