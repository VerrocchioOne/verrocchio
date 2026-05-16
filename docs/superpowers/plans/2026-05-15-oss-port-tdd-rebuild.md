# Verrocchio OSS-Leveraged TDD Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. EVERY production-code change MUST follow superpowers:test-driven-development (red → green → refactor) and EVERY bug discovered MUST be triaged via superpowers:systematic-debugging (root cause → pattern → hypothesis → fix-with-test).

**Goal:** Reduce verrocchio's hand-rolled code by ~35–50% and eliminate entire bug classes by replacing custom implementations with battle-tested, highly-rated OSS libraries — every replacement gated by a failing test written first.

**Architecture:** Three-phase rebuild on top of the existing single-file PWA. Phase 0 lays a real test harness (Node unit + Playwright E2E) and a systematic-debug cadence. Phase 1 dispatches parallel research subagents to pick OSS winners against strict vetting criteria. Phase 2 ports features in three waves (pure logic → UI primitives → architectural), each port a fresh subagent on its own branch with TDD enforced. Phase 3 is a recurring systematic-debug pass against the seams.

**Tech Stack (additions only):**
- Test: `node --test` (already present) + Playwright (new, browser-only — no JSX, no transpiler)
- OSS libs loaded via `<script>` UMD from CDN (no build step retained — see §Decision Gate)
- Concrete library winners (proposed; Phase 1 confirms): `ical.js`, `simple-statistics`, `cal-heatmap`, `superstruct`, `workbox-sw`, `notyf`, `emoji-picker-element`, `a11y-dialog`, `flatpickr`, `jose` (Worker only)

---

## Constraints (Non-Negotiable — from `.claude/CLAUDE.md`)

The following are HARD constraints. Every proposed OSS library must satisfy them or be rejected:

1. **NO build step.** No Vite/esbuild/Babel/Webpack/Rollup. The "single file you can open in any browser" property is the design.
2. **NO JSX.** `React.createElement(...)` only. JSX requires a transpiler.
3. **NO TypeScript.** Plain JS. JSDoc OK for clarity.
4. **NO UI framework.** No Tailwind/MUI/Chakra/Radix-as-components. Inline styles + `var(--c-…)` design tokens.
5. **NO `toISOString()` for date keys.** Use `dk(d)` from `utils.js` — UTC shifts break "today" near midnight.
6. **NO mutation.** Always spread.
7. **Firestore rules stay scoped to `users/{uid}`** unless threat model in `firestore.rules` is updated.

These constraints force OSS selection toward libraries that ship a UMD bundle on unpkg/jsdelivr and work as `window.X` globals. Libraries that only ship as ES modules requiring bundling are out.

---

## Vetting Criteria for OSS Candidates (used by every Research subagent)

A candidate library qualifies ONLY if it scores acceptably on ALL of:

| Criterion | Threshold | How to verify |
|---|---|---|
| GitHub stars | ≥ 1,000 (prefer ≥ 3,000) | `gh repo view <owner>/<repo> --json stargazerCount` |
| Last commit | ≤ 12 months ago | `gh repo view <owner>/<repo> --json pushedAt` |
| Open issues vs. closed | Closed-rate ≥ 60% | `gh repo view <owner>/<repo> --json issues,closedIssues` |
| License | MIT / Apache-2.0 / BSD / ISC / MPL-2.0 — never GPL/AGPL | `gh repo view <owner>/<repo> --json licenseInfo` |
| UMD on CDN | Loadable via `<script src="https://cdn.jsdelivr.net/npm/<pkg>@<ver>/dist/<bundle>.min.js">` | Test in a scratch HTML file |
| Has own tests | Visible `test/`, `tests/`, `__tests__/`, or `spec/` dir on default branch | `gh api repos/<owner>/<repo>/contents` |
| Gzipped size | ≤ 50 KB minified+gzipped (prefer ≤ 20 KB) | bundlephobia.com |
| Documented API | README has full API reference with examples | Inspect README |
| No transitive build req | Loads cleanly without npm install | Verify in scratch HTML |

**Tie-breaker priority:** smaller gzipped size > more stars > more recent commit.

**Reject** if: README requires Webpack/Vite, only ships ESM with bare specifiers, has unresolved CRITICAL security advisories, or has a sole maintainer who hasn't responded to issues in 6+ months.

---

## Feature Catalog (synthesized from four parallel Explore agents)

This is the complete inventory of features the rebuild must preserve. Each row maps to a numbered port in Phase 2 if hand-rolled code can be reduced, or to **KEEP** if already minimal.

### A. Pure logic (already factored, in `utils.js`)

| Feature | Where | Lines | Current state | Port? |
|---|---|---|---|---|
| Local date keys `dk`/`tk` | `utils.js:12-19` | ~10 | Tested | KEEP |
| Streak counter `getStreak` | `utils.js:51-86` | ~36 | Tested | KEEP |
| 30-day rate `getCR` | `utils.js:99-103` | ~5 | Tested | KEEP |
| Last-14 bitmap `getLast14` | `utils.js:105-112` | ~8 | Tested | KEEP |
| Clock parser `parseClock` | `utils.js:117-124` | ~8 | Tested | KEEP |
| Correlation engine `findCorrelations` | `utils.js:187-286` | ~100 | Tested, hand-rolled lift math | **Port #1** → `simple-statistics` |
| Off-schedule detector `detectOffSchedule` | `utils.js:295-372` | ~78 | Tested | KEEP (small, domain-specific) |
| Slot-ID builder `buildSlotIds` | `utils.js:175-185` | ~10 | Tested | KEEP |

### B. Data layer

| Feature | Where | Approx lines | Port? |
|---|---|---|---|
| Firebase Auth (email + anonymous + demo persona) | `index.html:3833-4560` | ~700 | **Partial port #2** → keep Firebase, thin wrapper over modular SDK |
| Firestore listener + echo-detection | `index.html:7486-7508` | ~25 | KEEP (small, idiomatic) |
| LocalStorage per-UID keys + legacy migration | `index.html:1277,7290,7324-7643` | ~320 | KEEP for now; revisit if IndexedDB needed |
| Cloud doc hydration `hydrateCloudDoc` | `index.html:3118-3359` | ~240 | **Port #3** → `superstruct` with `.defaults()` |
| Conflict merge `mergeRemoteWithLocalToday` | `index.html:3395-3454` | ~60 | KEEP (domain-specific) |
| Data sanitization before write | `index.html:7536-7546` | ~10 | KEEP |
| Base64 → Storage migration | `index.html:6573-6641` | ~70 | KEEP (one-time) |
| JSON export | `index.html:4668-4698` | ~30 | KEEP |
| iCalendar export | `index.html:4700-4962` | ~263 | **Port #4** → `ical.js` |
| Text summary export | `index.html:4624-4667` | ~44 | KEEP |

### C. PWA + Service Worker

| Feature | Where | Approx lines | Port? |
|---|---|---|---|
| Service worker caching | `service-worker.js` | 152 | **Port #5** → `workbox-sw` via `importScripts` |
| App update flow (poll + reload guard) | `index.html:1154-1188` | ~35 | KEEP (folds into Workbox port) |
| Manifest | `manifest.json` | 21 | KEEP |
| Device profile detection | `index.html:1099-1131` | ~32 | KEEP |

### D. UI views, modals, screens (45+ screens)

| Feature | Approx custom lines | Port? |
|---|---|---|
| Top-level tabs (Home/Goals/Habits/Todos/Reflect) | shared shell | KEEP |
| Edit-habit modal | ~200 | Folds into **Port #6/#9** (dialog primitive) |
| Add-goal / complete-goal modals | ~250 combined | Folds into **Port #6/#9** |
| Profile modal (6 sub-panels) | ~2400 | KEEP layout; each panel gets TDD coverage |
| Achievements modal | ~150 | KEEP |
| XP/Level chart modal | ~300 (custom + Chart.js) | KEEP (already Chart.js) |
| Reorder/organize modal | ~460 | KEEP (SortableJS handles d&d already) |
| Voice capture modal | ~300 | KEEP |
| Icon picker modal | ~150 | **Port #7** → `emoji-picker-element` |
| Habit stats modal (radar) | ~150 (Chart.js) | KEEP |

### E. Interaction primitives

| Feature | Approx custom lines | Port? |
|---|---|---|
| Drag & drop | SortableJS already | KEEP |
| Long-press / pillSheet | ~500 | **Port #8** → research-pick UMD long-press lib or KEEP |
| Modal/sheet/drawer + focus trap | ~600 | **Port #9** → `a11y-dialog` (UMD, ~4 KB, focus-trap built in) |
| Tabs/segmented controls | ~300 | KEEP (small) |
| Accordion/collapse | ~150 | KEEP (CSS-only) |
| Toast / banner | hand-rolled inline | **Port #10** → `notyf` |
| Calendar grid (month view) | ~150 | **Port #11** → research-pick UMD calendar lib |
| Date picker inputs | HTML5 `<input type=date>` | KEEP |
| Color picker | HTML5 `<input type=color>` | KEEP |
| Haptic feedback | `navigator.vibrate` | KEEP |

### F. Charts & visualization

| Feature | Approx custom lines | Port? |
|---|---|---|
| 14-day sparkline (custom SVG) | ~150 | **Port #12** → reuse already-loaded Chart.js |
| Year heatmap 7×53 | ~150 | **Port #13** → `cal-heatmap` |
| Weekly completion wave | ~40 | KEEP (tiny) |
| Radar chart | uses Chart.js | KEEP |
| Burndown chart | uses Chart.js | KEEP |

### G. AI proxy (`ai-proxy/worker.js`, 177 lines)

| Feature | Lines | Port? |
|---|---|---|
| Cloudflare Worker handler | ~80 | KEEP |
| Hand-rolled Firebase JWT verification | ~60 | **Port #14** → `jose` |
| Allowlist + CORS | ~30 | KEEP |

### H. Analytics / insights

| Feature | Where | Port? |
|---|---|---|
| Tip card / correlation surfacing | inline in index.html | Folds into Port #1 |
| AI daily briefing | inline ~440 lines | KEEP (small wrapper around fetch) |
| AI journal insights | inline ~36 lines | KEEP |

---

## Estimated impact (if all proposed ports land)

| Bucket | Custom lines today | After ports | Δ |
|---|---|---|---|
| `utils.js` correlation | ~100 | ~30 | −70 |
| `index.html` iCal export | ~263 | ~30 | −233 |
| `index.html` cloud hydration | ~240 | ~50 | −190 |
| `index.html` heatmap render | ~150 | ~20 | −130 |
| `index.html` sparkline | ~150 | ~40 | −110 |
| `index.html` modal primitive | ~600 | ~150 | −450 |
| `index.html` toast | ~120 | ~10 | −110 |
| `index.html` long-press | ~500 | ~100 | −400 |
| `index.html` emoji picker | ~150 | ~20 | −130 |
| `service-worker.js` | 152 | ~40 | −112 |
| `ai-proxy/worker.js` JWT | ~60 | ~15 | −45 |
| **Total approx** | **~2,485** | **~505** | **−1,980 lines** |

Roughly **~8% reduction of the entire 25k-line `index.html` plus a 75% reduction of `service-worker.js` and 35% reduction of the Worker.** Bug surface drops by the same order — every replaced library now owns the edge cases.

---

## Subagent Dispatch Protocol

### Phase 1 — Research wave (PARALLEL, read-only)

Dispatch **one Explore agent per feature port**. They run concurrently, take zero parameters beyond the prompt, and return a markdown report saved to `docs/oss-port/research/port-NN-<slug>.md`.

**Standard prompt template** (adapt the bracketed bits per port):

> You are a research agent finding a battle-tested OSS replacement for **[FEATURE]** in the Verrocchio PWA. Hard constraints: **NO build step, NO JSX, NO TypeScript** — the library MUST ship a UMD bundle loadable from a `<script>` tag via jsdelivr/unpkg.
>
> Current hand-rolled code: **[FILE:LINES]** (~**[N]** lines).
>
> Apply the vetting criteria in `docs/superpowers/plans/2026-05-15-oss-port-tdd-rebuild.md` §Vetting Criteria. Search `gh search repos` and `gh search code` for candidates. Return:
>
> 1. **Top 3 candidates** with: owner/repo, stars, last-commit date, license, gzipped UMD size, link to CDN bundle, snippet showing how it's loaded.
> 2. **Recommended winner** + rationale (smallest-that-fits wins ties).
> 3. **Code-reduction estimate**: lines saved vs. lines of glue code.
> 4. **Risks** (e.g. "depends on `customElements` — verify iOS Safari 15+ support").
> 5. **Minimal usage example** for the verrocchio context (5–15 lines).
>
> Do NOT write any production code. Return the report only.

Phase 1 dispatches **all research agents in a single message** (one block, N tool calls).

### Phase 2 — Implementation waves (PARALLEL per wave, TDD-enforced)

Each port becomes one **implementation subagent**. Contract:

> You are implementing **Port #[N]: [FEATURE]** per `docs/superpowers/plans/2026-05-15-oss-port-tdd-rebuild.md` and the chosen-library report in `docs/oss-port/research/port-NN-<slug>.md`.
>
> **You MUST follow superpowers:test-driven-development.** Sequence: write the failing test FIRST, run it, confirm it fails for the expected reason, then write minimal code to pass. No production code ahead of a red test.
>
> **You MUST follow superpowers:systematic-debugging** if any test that should pass doesn't, or any existing test that should stay green breaks. No fix without root cause.
>
> Deliverables:
> 1. New tests committed in `tests/<port-NN>-*.test.mjs` (Node) or `tests/e2e/<port-NN>-*.spec.js` (Playwright)
> 2. Library loaded via `<script>` tag in `index.html` `<head>` from a pinned CDN URL
> 3. Old hand-rolled code DELETED (not commented out — `git` is our reference)
> 4. Service-worker `CACHE_NAME` bumped + new CDN host added to `RUNTIME_CACHEABLE_HOSTS` if needed
> 5. Verification screenshots per `.claude/CLAUDE.md`: desktop ≥1024px, iOS ~390px, dark mode if any color/border touched
> 6. `npm test` passes; Playwright E2E for this port passes
> 7. PR-ready commit with conventional message
>
> Stop and report if any constraint forces a build step.

Waves run in this order, with parallelism within each wave:

- **Wave A — Pure logic ports (low risk, high test density):** Ports #1, #3, #14. Parallel.
- **Wave B — UI primitive ports (moderate risk):** Ports #4, #5, #9, #10, #13. Parallel after Wave A is green.
- **Wave C — Higher-coupled ports (sequential, ≤2 in parallel):** Ports #6, #7, #8, #11, #12, #2.

### Cross-cutting agents

- `everything-claude-code:code-reviewer` + `everything-claude-code:typescript-reviewer` after each wave (parallel).
- `everything-claude-code:security-reviewer` if the port touched auth/firestore (Ports #2, #5, #14).
- `everything-claude-code:e2e-runner` after Waves B and C against `serve.ps1` localhost.
- Weekly systematic-debug loop walking `docs/USER_REQUESTS.md` + `docs/TODO.md`.

---

## Phase 0 — Testing & Debug Foundation

**Goal:** Stand up the rails the rest of the plan rides on. After Phase 0, every line of new code is gated by a test that failed first, and every bug discovered runs through systematic debugging.

### Task 0.1: Confirm `npm test` green baseline

**Files:** none modified.

- [ ] **Step 1: Run the current test suite**

Run: `npm test`
Expected: PASS for every test in `tests/utils.test.mjs`. If any are red, stop and triage with superpowers:systematic-debugging before continuing.

- [ ] **Step 2: Record baseline test count**

Run: `node --test --test-reporter=tap 2>&1 | Select-String -Pattern "^ok " | Measure-Object -Line`
Expected: a positive integer. Save to a scratch note — used as a regression sentinel at end of each wave.

### Task 0.2: Add Playwright as a dev dependency

**Files:**
- Modify: `package.json` (add `@playwright/test` to `devDependencies`, add `test:e2e` script)
- Create: `playwright.config.js`
- Create: `tests/e2e/smoke.spec.js`

- [ ] **Step 1: Write the failing E2E test FIRST**

Create: `tests/e2e/smoke.spec.js`

```js
const { test, expect } = require("@playwright/test");

test("app loads and shows the splash or login surface", async ({ page }) => {
  await page.goto("http://localhost:8080/");
  await expect(page.locator("body")).toBeVisible();
  await expect(page).toHaveTitle(/Verrocchio/i);
});
```

- [ ] **Step 2: Run the test — confirm it fails for the right reason**

Run: `npx playwright test tests/e2e/smoke.spec.js`
Expected: FAIL with "Cannot find module '@playwright/test'" — proves Playwright isn't installed yet. If it fails for ANY OTHER reason, stop and run systematic-debugging.

- [ ] **Step 3: Install Playwright**

Run: `npm install --save-dev @playwright/test; npx playwright install chromium webkit`
Expected: clean install. WebKit is mandatory — verrocchio targets iOS Safari.

- [ ] **Step 4: Add `playwright.config.js`**

Create: `playwright.config.js`

```js
module.exports = {
  testDir: "./tests/e2e",
  timeout: 30000,
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    {
      name: "ios",
      use: {
        viewport: { width: 390, height: 844 },
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
      }
    }
  ],
  webServer: {
    command: "powershell -ExecutionPolicy Bypass -File ./serve.ps1",
    port: 8080,
    reuseExistingServer: true,
    timeout: 10000
  }
};
```

- [ ] **Step 5: Update `package.json` scripts**

Modify `package.json` to add:

```json
"scripts": {
  "test:unit": "node --test tests/*.test.mjs",
  "test:e2e": "playwright test",
  "test": "npm run test:unit && npm run test:e2e",
  "render-docs": "node scripts/render-docs.mjs",
  "build": "node scripts/build-dist.mjs && node scripts/render-docs.mjs",
  "cap:add:ios": "cap add ios",
  "cap:sync": "npm run build && cap sync ios",
  "cap:open": "cap open ios"
}
```

- [ ] **Step 6: Run the smoke test — confirm it passes**

Run: `npm run test:e2e`
Expected: PASS on both `desktop` and `ios` projects.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json playwright.config.js tests/e2e/smoke.spec.js
git commit -m "test: add Playwright E2E harness with desktop + iOS projects"
```

### Task 0.3: Add a systematic-debug log

**Files:**
- Create: `docs/DEBUG_LOG.md`

- [ ] **Step 1: Create the log skeleton**

Create: `docs/DEBUG_LOG.md` with content:

```markdown
# Systematic Debug Log

Append one entry per investigation. Newest first. Every bug fix in the codebase MUST have an entry here. No entry → no commit.

## Entry template

### YYYY-MM-DD — <one-line bug summary>

- **Phase 1 — Root cause:** what error, where reproduced, what changed recently, evidence gathered
- **Phase 2 — Pattern:** the working example I compared against, the differences
- **Phase 3 — Hypothesis:** "I think X is the cause because Y." Confirmed/refuted by minimal test.
- **Phase 4 — Fix:** test name in `tests/...` that captures the regression. Single change. Commit SHA.
```

- [ ] **Step 2: Commit**

```bash
git add docs/DEBUG_LOG.md
git commit -m "docs: add systematic-debug log; every fix logs root-cause trace"
```

### Task 0.4: Run combined `npm test`

- [ ] **Step 1: Run**

Run: `npm test`
Expected: PASS on unit tests, then PASS on E2E smoke.

- [ ] **Step 2: Commit if there were any package.json tweaks**

```bash
git add package.json
git commit -m "test: combine unit + E2E under npm test"
```

---

## Phase 1 — Research wave (one message, all agents parallel)

Dispatch **fourteen** Explore subagents in a single tool-call block. Each is read-only; each writes a report to `docs/oss-port/research/port-NN-<slug>.md`.

- [ ] **Step 1: Create the output directory**

Create: `docs/oss-port/research/.gitkeep` (empty file)

- [ ] **Step 2: Dispatch all research agents in parallel**

Dispatch fourteen agents (prompt template in §Subagent Dispatch Protocol). Each agent ports one row:

| Port # | Feature | Slug |
|---|---|---|
| 1 | Correlation math | correlation-math |
| 2 | Firebase auth wrapper | firebase-auth-wrapper |
| 3 | Cloud doc hydration / schema | schema-hydration |
| 4 | iCalendar export | icalendar-export |
| 5 | Service worker caching | service-worker |
| 6 | Modal/dialog primitive | dialog-primitive |
| 7 | Emoji picker | emoji-picker |
| 8 | Long-press / pillSheet | long-press |
| 9 | Focus-trap / a11y dialog | focus-trap-dialog |
| 10 | Toast / banner | toast |
| 11 | Calendar grid | calendar-grid |
| 12 | Sparkline | sparkline |
| 13 | Year heatmap | year-heatmap |
| 14 | JWT verification (Worker) | worker-jwt |

- [ ] **Step 3: Review the 14 reports as a batch**

For each report:
- Confirm the recommended library passes ALL vetting criteria.
- If any port has no qualifying library, mark it **KEEP** and remove from Phase 2.
- If two ports could share a library (e.g. one calendar lib covers Port #11), consolidate.

- [ ] **Step 4: Commit the research bundle**

```bash
git add docs/oss-port/research/
git commit -m "research: 14 OSS-port reports (vetted libraries per port)"
```

---

## Phase 2 — Replacement waves

> Every port below begins with a failing test. Watch it fail. Then write minimal code. Then refactor. Then verify screenshots per CLAUDE.md verification gate.

### Wave A — Pure logic ports (parallel)

Three independent ports, no UI changes, all gated by unit tests.

#### Port #1: Correlation math → `simple-statistics`

**Files:**
- Modify: `utils.js` (replace hand-rolled lift math in `findCorrelations`)
- Modify: `index.html` `<head>` (load `simple-statistics` UMD)
- Modify: `tests/utils.test.mjs` (extend correlation tests)
- Create: `tests/fixtures/correlation-known.json`

- [ ] **Step 1: Write the failing test FIRST**

Add to `tests/utils.test.mjs`:

```js
test("findCorrelations: lift matches simple-statistics for known fixture", () => {
  // Fixture: 60 days, habit A done-by-cutoff days 1-30, habit B done days 1-25.
  // Expected lift = (25/30) - (25/60) ≈ 0.4167
  const habits = require("./fixtures/correlation-known.json");
  const out = findCorrelations(habits, { today: new Date("2026-05-15T12:00:00") });
  const ab = out.find(r => r.aHabitId === "habit-A" && r.bHabitId === "habit-B");
  assert.ok(ab, "expected the A->B pair");
  assert.ok(Math.abs(ab.lift - 0.4167) < 0.01, `lift was ${ab.lift}`);
});
```

Also create `tests/fixtures/correlation-known.json` with deterministic data per the docstring.

- [ ] **Step 2: Run — confirm it fails for the right reason**

Run: `npm run test:unit -- --test-name-pattern="lift matches simple-statistics"`
Expected: FAIL — fixture missing or lift differs. Read the failure message; confirm it's the lift math, not a typo. If a typo, fix and re-run until the failure mode is "math doesn't match expected".

- [ ] **Step 3: Load `simple-statistics` UMD in `index.html`**

Add to `index.html` `<head>` (pinned version):

```html
<script src="https://cdn.jsdelivr.net/npm/simple-statistics@7.8.3/dist/simple-statistics.min.js"></script>
```

- [ ] **Step 4: Replace lift math in `utils.js`**

Add to top of `utils.js`:

```js
const ss = (typeof window !== "undefined" && window.simpleStatistics)
  || (typeof require === "function" && require("simple-statistics"));
```

Then in `findCorrelations`, replace the manual `conditional - base` block with the simple-statistics call confirmed by the Phase 1 research report (likely `ss.sampleCorrelation` over the bitmaps or `ss.phiCoefficient`-equivalent). Add `simple-statistics` to `devDependencies` so Node tests resolve it.

- [ ] **Step 5: Run unit tests — green**

Run: `npm run test:unit`
Expected: PASS on the new test AND all previously-passing tests still pass. If any prior test breaks → superpowers:systematic-debugging Phase 1.

- [ ] **Step 6: Delete the now-unused hand-rolled lift calc**

`git diff` must show net negative lines.

- [ ] **Step 7: Bump service-worker `CACHE_NAME` + add CDN to `RUNTIME_CACHEABLE_HOSTS`**

In `service-worker.js`: `CACHE_NAME = "verrocchio-shell-v63"`. Ensure `cdn.jsdelivr.net` is in `RUNTIME_CACHEABLE_HOSTS`.

- [ ] **Step 8: Run full test suite**

Run: `npm test`
Expected: ALL GREEN.

- [ ] **Step 9: Commit**

```bash
git add utils.js index.html service-worker.js package.json tests/utils.test.mjs tests/fixtures/
git commit -m "refactor(utils): port correlation lift math to simple-statistics (Port #1)"
```

#### Port #3: Schema hydration → `superstruct`

**Files:**
- Modify: `index.html` (`hydrateCloudDoc`, lines 3118–3359)
- Modify: `index.html` `<head>` (load superstruct UMD)
- Create: `lib/hydration.js` (extract for testing)
- Create: `tests/hydration.test.mjs`

- [ ] **Step 1: Write the failing test FIRST**

Create: `tests/hydration.test.mjs`

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { hydrateCloudDoc } = require("../lib/hydration.js");

test("legacy weekly-day habit becomes weekly with anchor day", () => {
  const legacy = { habits: [{ id: "h1", text: "Run", frequency: { type: "weekly-day", day: 3 } }] };
  const out = hydrateCloudDoc(legacy);
  assert.equal(out.habits[0].frequency.type, "weekly");
  assert.equal(out.habits[0].frequency.day, 3);
});

test("missing slotCompletionTimes defaults to {}", () => {
  const out = hydrateCloudDoc({ habits: [{ id: "h1", text: "X", slotSections: ["morning", "evening"] }] });
  assert.deepEqual(out.habits[0].slotCompletionTimes, {});
});

test("missing top-level fields seeded with defaults", () => {
  const out = hydrateCloudDoc({});
  assert.ok(Array.isArray(out.habits));
  assert.ok(Array.isArray(out.goals));
  assert.ok(typeof out.dailyRitual === "object");
});
```

- [ ] **Step 2: Extract `hydrateCloudDoc` into its own module (currently inline)**

Create: `lib/hydration.js` — copy the function from `index.html:3118-3359` verbatim. Add CommonJS export at bottom. Import into `index.html` via `<script src="./lib/hydration.js"></script>` so browser still sees `hydrateCloudDoc` as a global.

- [ ] **Step 3: Run the test — confirm green against the extracted-but-unchanged function**

Run: `npm run test:unit -- --test-name-pattern="hydration"`
Expected: PASS. If not, the extraction broke something — `git diff` and fix.

- [ ] **Step 4: Add `superstruct` UMD (or chosen alternative from Phase 1) to `index.html` `<head>`**

```html
<script src="https://cdn.jsdelivr.net/npm/superstruct@2.0.2/dist/index.js"></script>
```

(Confirm actual UMD path in the Phase 1 research report; if superstruct ships only ESM, swap for the recommended alternative.)

- [ ] **Step 5: Rewrite `lib/hydration.js` with superstruct schemas and `.defaults()`**

Replace imperative defaults with `struct({ habits: defaulted(array(habitSchema), []), goals: defaulted(array(goalSchema), []), ... })`. Tests from Step 1 stay green — same contract, smaller code.

- [ ] **Step 6: Run unit tests**

Run: `npm run test:unit`
Expected: ALL GREEN.

- [ ] **Step 7: Run full test suite + Playwright smoke**

Run: `npm test`
Expected: ALL GREEN.

- [ ] **Step 8: Commit**

```bash
git add lib/hydration.js index.html service-worker.js tests/hydration.test.mjs
git commit -m "refactor(hydration): replace 240-line hydrateCloudDoc with superstruct (Port #3)"
```

#### Port #14: Worker JWT → `jose`

**Files:**
- Modify: `ai-proxy/worker.js` (replace hand-rolled JWT verification, lines ~115–177)
- Modify: `ai-proxy/package.json` (add `jose` dependency)
- Create: `ai-proxy/tests/jwt.test.mjs`
- Create: `ai-proxy/tests/helpers/sign.js`

- [ ] **Step 1: Write the failing test FIRST**

Create: `ai-proxy/tests/jwt.test.mjs`

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { verifyFirebaseToken } = require("../worker.js");
const { signTestToken } = require("./helpers/sign.js");

test("rejects token with wrong audience", async () => {
  const token = await signTestToken({ aud: "wrong-project" });
  await assert.rejects(() => verifyFirebaseToken(token, "real-project"), /audience/);
});

test("accepts valid token", async () => {
  const token = await signTestToken({ aud: "real-project" });
  const payload = await verifyFirebaseToken(token, "real-project");
  assert.equal(payload.aud, "real-project");
});
```

`helpers/sign.js` uses `jose` to sign tokens with a generated RSA key the verifier can fetch from a local JWKS endpoint.

- [ ] **Step 2: Run — confirm fails for the right reason**

Run: `cd ai-proxy; node --test`
Expected: FAIL — function not exported or behavior differs.

- [ ] **Step 3: Install `jose` and rewrite verifier**

Run: `cd ai-proxy; npm install jose`

Replace `verifyFirebaseToken` + `getGoogleSigningKey` + `b64UrlDecode` + `b64UrlToBytes` with `jose.jwtVerify(token, jose.createRemoteJWKSet(jwksUrl), { issuer, audience })`. Delete the now-unused helpers. Export `verifyFirebaseToken` for testing.

- [ ] **Step 4: Run — green**

Run: `cd ai-proxy; node --test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ai-proxy/worker.js ai-proxy/package.json ai-proxy/package-lock.json ai-proxy/tests/
git commit -m "refactor(ai-proxy): replace 60-line JWT verifier with jose (Port #14)"
```

#### Wave A gate

- [ ] Run `npm test` + `cd ai-proxy; node --test`. Both ALL GREEN.
- [ ] Run `everything-claude-code:code-reviewer` agent on the diff. Address CRITICAL + HIGH findings.
- [ ] Update `docs/DEBUG_LOG.md` with any investigations triggered during Wave A.

### Wave B — UI primitive ports (parallel after Wave A green)

Every Wave B port follows the same TDD pattern: write failing E2E (or unit if pure) test first, run, observe correct red, install lib, write minimal code, re-run green, verification screenshots, commit. The detailed test code per port is generated by the implementing subagent from the Phase 1 research report.

#### Port #4: iCalendar export → `ical.js`

**Files:**
- Create: `lib/icalendar.js` (extract `buildICS` for testing)
- Modify: `index.html` (replace VEVENT-building lines 4700–4962 with `ical.js` calls; load UMD in `<head>`)
- Create: `tests/icalendar.test.mjs` (unit) + `tests/e2e/icalendar.spec.js` (download check)

Required test cases (must each have a named test):
- daily habit → `RRULE:FREQ=DAILY`
- weekly Mon/Wed → `RRULE:FREQ=WEEKLY;BYDAY=MO,WE`
- monthly day-15 → `RRULE:FREQ=MONTHLY;BYMONTHDAY=15`
- non-negotiable habit → `PRIORITY:1`
- sub-habits → `DESCRIPTION` contains each
- 5-min alarm before each event → `TRIGGER:-PT5M`

#### Port #5: Service worker → `workbox-sw`

**Files:**
- Modify: `service-worker.js` (rewrite using Workbox routes)
- Create: `tests/e2e/offline.spec.js`

Required test:

```js
test("app shell loads with network offline after first visit", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle(/Verrocchio/i);
});
```

Implementation imports Workbox via `importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.x.x/workbox-sw.js")`, declares: precache app shell, network-first for navigations, stale-while-revalidate for `RUNTIME_CACHEABLE_HOSTS`, bypass for Firebase/AI proxy.

#### Port #9: Dialog primitive → `a11y-dialog`

**Files:**
- Modify: `index.html` (replace hand-rolled modal open/close logic with `a11y-dialog` instances)
- Create: `tests/e2e/modal.spec.js`

Required tests:
- opening edit-habit modal moves focus into the dialog (within 200 ms)
- Tab is trapped within the dialog (cycling reaches the same first focusable element)
- Escape closes the dialog
- closing returns focus to the trigger

#### Port #10: Toast → `notyf`

**Files:**
- Modify: `index.html` (replace inline banner with `new Notyf({...})` instance)
- Create: `tests/e2e/toast.spec.js`

Required tests:
- "Saved" toast appears within 500 ms after habit edit save
- toast auto-dismisses within `duration + 200ms`
- two toasts queue in submission order

#### Port #13: Year heatmap → `cal-heatmap`

**Files:**
- Modify: `index.html` (replace 7×53 SVG renderer with `cal-heatmap` mount)
- Create: `tests/e2e/heatmap.spec.js`

Required tests:
- 365 cells render
- the cell for today has the "done" color when today's habit is completed
- cells respect dark mode (compare computed bg color in `body.dark`)

#### Wave B gate

- [ ] `npm test` ALL GREEN.
- [ ] Visual verification per CLAUDE.md: desktop ≥1024, iOS 390px, dark mode check on heatmap + toast.
- [ ] Parallel review: `everything-claude-code:code-reviewer` + `everything-claude-code:security-reviewer` (security needed because Port #5 SW affects offline auth state).
- [ ] Log any debug sessions in `docs/DEBUG_LOG.md`.

### Wave C — Higher-coupled ports (≤2 in parallel)

Same TDD pattern. Subagent reads Phase 1 research, writes specific failing test list, executes red-green-refactor for:

#### Port #7: Emoji picker → `emoji-picker-element`

#### Port #8: Long-press → research-pick UMD library (or KEEP if no qualifying lib)

#### Port #11: Calendar grid → research-pick UMD library

#### Port #12: Sparkline → reuse already-loaded Chart.js OR research-pick UMD

#### Port #2: Firebase auth wrapper — thin module reducing inline boilerplate

#### Port #6: Edit-habit/goal/complete-goal modal forms ported onto Port #9 dialog primitive

#### Wave C gate (final)

- [ ] `npm test` ALL GREEN.
- [ ] Full E2E suite on both desktop + iOS Playwright projects.
- [ ] Capacitor sync + open in Xcode simulator, manually verify all 5 tabs + at least one modal flow.
- [ ] Diff total `index.html` lines vs. baseline. Confirm net reduction ≥ 1,500 lines.
- [ ] Final review: dispatch `everything-claude-code:code-reviewer` + `everything-claude-code:security-reviewer` + `everything-claude-code:typescript-reviewer` in PARALLEL.

---

## Phase 3 — Systematic debugging cadence (ongoing after Phase 2)

A scheduled debug pass that runs WEEKLY against the seams created by the ports.

### Cadence

Use the `loop` skill or `everything-claude-code:autonomous-loops` to schedule the following every Monday at 09:00:

> Walk `docs/USER_REQUESTS.md` and `docs/TODO.md` for any new user-reported bug or behavior complaint. For each:
>
> 1. Apply superpowers:systematic-debugging Phase 1 — reproduce, gather evidence at each component boundary.
> 2. Apply Phase 2 — find a working analogue (a similar interaction that's NOT broken) and list the differences.
> 3. Apply Phase 3 — form ONE hypothesis, test it with the smallest possible change.
> 4. Apply Phase 4 — write the failing regression test FIRST, then fix, then verify.
> 5. Append the trace to `docs/DEBUG_LOG.md`.
> 6. If 3+ fix attempts fail, STOP and escalate — likely architectural.

### Triggered debug (per-port)

Every port subagent also runs a mini systematic-debug pass at the end of its work: read the diff, ask "what could break?", write one negative test for the most likely regression, run, confirm green. This is in addition to the existing tests.

---

## Decision Gate — should we keep the no-build constraint?

After Wave A is green, the team has hard data: how much code came out, how much glue went in, how much CDN load time grew. At that point, evaluate:

| | Stay no-build (this plan) | Introduce esbuild |
|---|---|---|
| Total code reduction estimate | ~1,980 lines | ~4,500–6,000 lines |
| First-paint time | Slightly worse (each lib is a `<script>` tag) | Better (bundled JS) |
| Maintenance burden | Low — open in any browser, edit, save | Medium — build step, source maps, dist/ |
| CLAUDE.md compliance | YES | NO — requires updating CLAUDE.md |
| iOS Capacitor compatibility | Already proven | Needs verification |
| Bug surface reduction | Same | Larger (unlocks JSX-only libs) |

**Recommendation:** Stay no-build through this plan. If after Wave C the team still wants the additional reduction unlocked by JSX-based libraries, write a NEW plan to introduce esbuild as Port #15 — at that point we have a fully tested baseline to migrate from safely. Don't change the foundation while replacing the walls.

---

## Self-Review (run by Claude before handoff)

**Spec coverage check:**

- "Catalog every feature" → Feature Catalog §A–H, 60+ rows. ✓
- "Organize subagents to find OSS code" → Phase 1 dispatch protocol, vetting criteria, 14 parallel agents. ✓
- "Verified and highly rated by human users" → ≥1,000 stars threshold; closed-issue rate; recency. ✓
- "Significantly less code" → ~1,980 lines projected out (~8% of index.html + 75% of SW + 35% of Worker). ✓
- "Significantly less bugs" → Each replacement is a library that owns its edge cases + Playwright E2E + recurring systematic-debug pass. ✓
- "Entire app built around TDD" → Every port has a "write failing test FIRST" step; Phase 0 builds the harness; the Iron Law is restated in the dispatch prompt. ✓
- "Regular systematic debugging" → Weekly loop + per-port mini pass + `docs/DEBUG_LOG.md` mandatory. ✓

**Placeholder scan:**

- Port #1 Step 4 names "sampleCorrelation or phiCoefficient" — the Phase 1 research subagent confirms which simple-statistics function fits the bitmap data; the test fixture defines the expected lift independent of the function name, so the test is the contract.
- Wave C ports are intentionally lighter on TDD bullets because each implementing subagent generates them from the Phase 1 research report it reads first. The structure (red → green → refactor → verify) is identical to Wave A/B.

**Signature consistency:**

- `hydrateCloudDoc(data)` returns the same shape it accepts across Port #3 and tests.
- `findCorrelations(habits, opts)` keeps its public signature across Port #1; only internal math changes.
- `buildICS(habits)` signature preserved across Port #4.
- `verifyFirebaseToken(token, projectId)` signature preserved across Port #14.

**Anti-pattern check (from `.claude/CLAUDE.md`):**

- No `toISOString()` introduced. ✓
- No build step introduced. ✓
- No JSX. ✓
- No new UI framework. ✓
- All mutations spread-based in template snippets. ✓
- Firestore rules untouched. ✓

Plan ready.

---

## Execution Handoff

Plan saved at `docs/superpowers/plans/2026-05-15-oss-port-tdd-rebuild.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per port + two-stage review between waves. Best for quality and parallelism. Uses superpowers:subagent-driven-development.

2. **Inline Execution** — execute tasks in this session with checkpoints. Best if you want to steer mid-task. Uses superpowers:executing-plans.

Pick one and I'll start with Phase 0 Task 0.1 (baseline `npm test`).
