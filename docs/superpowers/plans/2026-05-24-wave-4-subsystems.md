# Wave 4 — App() sub-system extractions

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`. Each sub-task ships independently. Each sub-system is its own commit. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Extract the App() sub-systems still inline in `index.html` to `lib/modals/*` and `lib/views/*` modules of 200–800 LOC each. Largest single payoff in the full-decomposition plan: an estimated **6,000–9,000 LOC** removed from `index.html` (from ~24,160 down to ~15,000–18,000).

**Architecture:** Continue the dual-load pattern (`<script src>` global + `module.exports`). No build step. No JSX. No new UI framework. Every new module follows `docs/superpowers/patterns/view-extraction.md` exactly — FROZEN prop signature `{ data, dispatch, deviceProfile, callbacks }`.

**Tech Stack:** Plain JS, React 18.3 UMD, hand-rolled `React.createElement`.

**Pre-condition:** Waves 2 (component extractions) and 3 (constants/helpers) are shipped and `index.html` is in a clean state. **This plan was written 2026-05-24 while agents are actively working on Waves 2 and 3.** Do not begin Wave 4 execution until those waves are merged and `index.html` is unmodified in `git status`.

---

## Where we are (2026-05-24, snapshot)

- `wc -l index.html` = **24,160** LOC (target after Wave 4: ~15,000)
- HabitsView: 3,108 LOC (Wave 5 territory)
- All other `lib/views/*.js`: between 486 and 1,072 LOC
- `lib/components/Sparkline14.js` (58 LOC) shipped — Wave 2 bisect probe **succeeded**
- `lib/components/A11yDialog.js` (94 LOC) — untracked, wave-2 work in progress

## Pattern: A11yDialog modal call-site (the dominant Wave 4 shape)

There are **19 `React.createElement(A11yDialog, ...)` instances** in `index.html`. Each is a "modal" sub-system in the Wave 4 sense. All follow the same call shape:

```js
<stateVariable> && /*#__PURE__*/React.createElement(A11yDialog, {
  onHide: () => set<stateVariable>(null),
  ariaLabelledby: "...",
  overlayStyle: { ... },
  cardStyle: { ... }
},
  // ... inline body ...
)
```

The standard Wave 4 modal extraction transforms this into:

```js
/* call site in index.html */
<stateVariable> && /*#__PURE__*/React.createElement(window.<Name>Modal, {
  data, dispatch, deviceProfile: window.__deviceProfile,
  state: { /* whatever the modal reads */ },
  callbacks: {
    onClose: () => set<stateVariable>(null),
    /* plus modal-specific callbacks */
  }
})
```

```js
/* lib/modals/<Name>Modal.js */
(function () {
  const R = (typeof window !== "undefined" && window.React) || require("react");
  const Dialog = (typeof window !== "undefined" && window.A11yDialog) || require("../components/A11yDialog.js");

  function <Name>Modal({ data, dispatch, deviceProfile, state, callbacks }) {
    // body — uses A11yDialog wrapper
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = <Name>Modal;
  } else if (typeof window !== "undefined") {
    window.<Name>Modal = <Name>Modal;
  }
})();
```

The `&&` guard at the call site stays — the modal module is only mounted when state is truthy, so internal hooks don't run when closed. This preserves the current behavior exactly.

---

## Sub-system inventory

### Tier 1 — Modals (parallel-safe, ~50–250 LOC each)

| # | Line | State trigger | File | Est. LOC |
|---|---:|---|---|---:|
| 4.1.1 | 17380 | `confirmExitDemo` | `lib/modals/ConfirmExitDemoModal.js` | ~100 |
| 4.1.2 | 17482 | `completeGoalModal` | `lib/modals/CompleteGoalModal.js` | ~280 |
| 4.1.3 | 20193 | `goalMoreMenu` | `lib/modals/GoalMoreMenuModal.js` | ~60 |
| 4.1.4 | 20215 | `goalJournal` | `lib/modals/GoalJournalModal.js` | ~140 |
| 4.1.5 | 20353 | `showXpChart` | `lib/modals/XpChartModal.js` | ~290 |
| 4.1.6 | 20642 | `showAchievements` | `lib/modals/AchievementsModal.js` | ~130 |
| 4.1.7 | 20771 | `addCatModal` | `lib/modals/AddCatModal.js` | ~55 |
| 4.1.8 | 20825 | `confirmWipe` | `lib/modals/ConfirmWipeModal.js` | ~70 |
| 4.1.9 | 20895 | `confirmDeleteAcct` | `lib/modals/ConfirmDeleteAcctModal.js` | ~70 |
| 4.1.10 | 20964 | `calendarDetailDate` | `lib/modals/CalendarDetailDateModal.js` | ~90 |
| 4.1.11 | 21054 | `!welcomeModalSeen` | `lib/modals/WelcomeModal.js` | ~40 |
| 4.1.12 | 21095 | `showJournalDisclaimer` | `lib/modals/JournalDisclaimerModal.js` | ~25 |
| 4.1.13 | 21121 | `showAiConsent` | `lib/modals/AiConsentModal.js` | ~650 |
| 4.1.14 | 21775 | `timeEntry` | `lib/modals/TimeEntryModal.js` | ~115 |
| 4.1.15 | 21931 | `myCoach` | `lib/modals/MyCoachModal.js` | ~65 |
| 4.1.16 | 21997 | `linkedMediaPlayer` | `lib/modals/LinkedMediaPlayerModal.js` | ~225 |
| 4.1.17 | 22222 | `voiceCaptureOpen` | `lib/modals/VoiceCaptureModal.js` | ~125 |
| 4.1.18 | 22349 | `reorderCtx` | `lib/modals/ReorderCtxModal.js` | ~155 |

**Estimated reduction: ~2,700 LOC.** No two modals depend on each other — Tier 1 is fully parallelizable across subagents.

> **Note on AiConsentModal (4.1.13).** At ~650 LOC it's by far the largest modal. If it crosses the 1000 LOC hard cap after extraction (it shouldn't, but watch), split into shell + body sub-component during the same task.

### Tier 2 — Bottom nav + chrome (~1,200 LOC together)

| # | Line | What | File | Est. LOC |
|---|---:|---|---|---:|
| 4.2.1 | 12777–12836 | Tour exit banner + demo banner + shake hint | `lib/views/AppChrome.js` | ~80 |
| 4.2.2 | 12837–13783 | Sticky header (brand + streak + profile pill + Day-N) | `lib/views/Header.js` | ~950 |
| 4.2.3 | 18122–end of nav | Bottom-nav `tabBtn` + container | `lib/views/BottomNav.js` | ~200 |

**Estimated reduction: ~1,200 LOC.** Sequential within Tier 2 — they're adjacent in the render tree and share the outer wrapper.

### Tier 3 — Guided tour overlay (~1,000 LOC)

| # | Line | What | File | Est. LOC |
|---|---:|---|---|---:|
| 4.3.1 | 12222–12450 (render) + 5733–6525 (state/effects) | `TOUR_STEPS`, spotlight, tooltip, gated callout, autoAdvance | `lib/views/TourOverlay.js` + `lib/domains/tour.js` | ~1,000 |

**Note:** Tour has 11+ effects that read `tourStep`. The DOMAIN module gets the pure step transitions; the VIEW module gets the overlay rendering. Effects stay in `App()` for this wave — they're Wave 6 territory.

**Estimated reduction: ~1,000 LOC.**

### Tier 4 — Profile shell with 7 sub-panels (~2,400 LOC)

| # | Line | What | File | Est. LOC |
|---|---:|---|---|---:|
| 4.4.0 | 17797–20184 | Profile A11yDialog shell + nav drawer | `lib/views/profile/ProfileShell.js` | ~250 |
| 4.4.1 | 17830–18044 | `accountPanel` (name, stats, sign-out) | `lib/views/profile/AccountPanel.js` | ~215 |
| 4.4.2 | 18045–18169 | `inspirationPanel` (links + quotes editor) | `lib/views/profile/InspirationPanel.js` | ~125 |
| 4.4.3 | 18170–19170 | `myContentPanel` (files, audio, custom content) | `lib/views/profile/ContentPanel.js` | ~1,000 → likely split |
| 4.4.4 | 19171–19422 | `historyPanel` (archived goals) | `lib/views/profile/HistoryPanel.js` | ~250 |
| 4.4.5 | 19423–19441 | `reportsPanel` (habit reports stub) | `lib/views/profile/ReportsPanel.js` | ~20 |
| 4.4.6 | 19442–20079 | `appSettingsPanel` (theme, accent, dark, demo, wipe, delete, export, import) | `lib/views/profile/AppSettingsPanel.js` | ~640 |
| 4.4.7 | 20080–20142 | `scorecardPanel` (App Progress metrics) | `lib/views/profile/ScorecardPanel.js` | ~65 |

**Estimated reduction: ~2,400 LOC.** ProfileShell is the top-level coordinator and depends on each panel via window globals — so panels must ship BEFORE the shell. Order: 4.4.1 → 4.4.2 → 4.4.3 → 4.4.4 → 4.4.5 → 4.4.6 → 4.4.7 → 4.4.0.

> **Note on ContentPanel (4.4.3).** At an estimated ~1,000 LOC it sits right at the 1000-line hard cap. Plan to split during the SAME task into:
> - `lib/views/profile/ContentPanel.js` — shell + linked-content rendering (~500 LOC)
> - `lib/views/profile/ContentUploadForm.js` — file picker, upload progress, audio capture (~500 LOC)
>
> Keep both under 800 LOC.

### Tier 5 — Pre-app surfaces (~600 LOC)

| # | Line | What | File | Est. LOC |
|---|---:|---|---|---:|
| 4.5.1 | 11442–11491 | Splash (pyramid + wordmark) | `lib/views/Splash.js` | ~50 |
| 4.5.2 | 11503–11700 (approx) | Onboarding 3-screen carousel | `lib/views/Onboarding.js` | ~350 |
| 4.5.3 | 3636–4900 (auth state) + render block before main return | Auth surface (sign-in form, magic-link, demo entry) | `lib/views/AuthSurface.js` | ~200 |

**Estimated reduction: ~600 LOC.**

---

## Total Wave 4 reduction estimate

| Tier | Estimated LOC removed from index.html |
|---|---:|
| 4.1 Modals | ~2,700 |
| 4.2 Chrome (header, banners, bottom nav) | ~1,200 |
| 4.3 Tour overlay | ~1,000 |
| 4.4 Profile shell + 7 panels | ~2,400 |
| 4.5 Splash + Onboarding + Auth | ~600 |
| **Total** | **~7,900** |

Post-Wave-4 `index.html` target: **~16,000 LOC**. Still over the 1000-line cap, but Wave 5 (HabitsView re-split) and Wave 6 (hooks/effects extraction) chip away the remainder.

---

## Execution order and constraints

**Hard ordering:**

1. **Wave 4.1 ships first.** Modals are leaf nodes — they have zero downstream dependencies. Subagent-driven, parallel-safe across modals.
2. **Wave 4.2 then 4.3** — Chrome is independent of the tour overlay but the tour banner sits inside the chrome wrapper, so Chrome lands first.
3. **Wave 4.4 panels then 4.4.0 shell.** Each panel can ship independently before the shell extraction; the shell pulls them in via `window.<Name>Panel` globals.
4. **Wave 4.5 last** — pre-app surfaces touch auth state which is read by every other surface. Lowest risk to extract last when everything else has stabilized.

**Concurrency constraint:** Only one subagent should edit `index.html` at a time during a given Wave 4 sub-task. Multiple subagents can each be **writing** new `lib/` files in parallel, but the call-site edit in `index.html` is the serialization point. Use the worktree-isolation pattern from `superpowers:using-git-worktrees` if multiple sub-tasks must run truly concurrently.

**Risk gates:**

- **Bisect probe (per the Wave 2 incident, parent plan note line 44).** Before ANY new `<script src>` tag is added, run the bisect probe: trivial file added to head only, no body edit, full E2E pass required.
- **Test count must not drop.** Baseline `npm run test:unit && npx playwright test --project=desktop` before each commit. Net unit count ≥ 259, E2E ≥ 20.
- **Browser smoke per the verification gate in CLAUDE.md.** Desktop + iOS-width screenshots after each commit. Dark-mode check if any color or border was touched.
- **Capacitor allowlist.** Every new `lib/` file added in Wave 4 must be appended to the FILES array in `scripts/build-dist.mjs` so it's copied to the iOS shell.

---

## Per-task pattern (FROZEN)

Every Wave 4 sub-task follows this exact 7-step pattern. Subagents executing Wave 4 work should copy this checklist into their TodoWrite list and tick each box.

### Tier 1 (modal) task template

````markdown
### Wave 4.1.<N>: Extract <Name>Modal

**Files:**

- Create: `lib/modals/<Name>Modal.js`
- Modify: `index.html` (one `<script src>` line in head + one inline-body replacement at the modal's line range)
- Modify: `scripts/build-dist.mjs` (append `"lib/modals/<Name>Modal.js"` to FILES)

- [ ] **Step 1: Bisect probe** (skip if a previous Wave 4.1.N has already passed it in this session)

```bash
echo "(function(){})();" > lib/modals/<Name>Modal.js
# add <script src="./lib/modals/<Name>Modal.js"></script> to <head>
npm run test:unit && npx playwright test --project=desktop
# Expected: 259/259 unit pass, 20/20 E2E pass
```

If green, proceed. If red, revert and root-cause the script-tag regression before continuing.

- [ ] **Step 2: Write `lib/modals/<Name>Modal.js`**

Use the FROZEN modal template at the top of this plan. Lift the inline body from index.html line range exactly. Convert closure-captured state to incoming `state` prop entries; convert closure-captured setters to `callbacks.<name>` entries.

- [ ] **Step 3: Replace the inline body** in `index.html` at the original line range with the new call-site form (see "Pattern" section above).

- [ ] **Step 4: Append the file path** to FILES in `scripts/build-dist.mjs`.

- [ ] **Step 5: Verify**

```bash
npm run test:unit && npx playwright test --project=desktop
# Expected: 259/259 + 20/20 GREEN
```

Also: open the app, trigger the modal in the browser at desktop AND iOS-width (390px). Verify visual parity with pre-extraction screenshot. Dark-mode check if any token was touched.

- [ ] **Step 6: Update file-size dashboard**

```bash
wc -l lib/modals/<Name>Modal.js index.html
# <Name>Modal.js must be ≤ 800 LOC (soft target) and ≤ 1000 LOC (hard cap)
# index.html must be strictly LESS than the previous wc -l
```

- [ ] **Step 7: Commit**

```bash
git add lib/modals/<Name>Modal.js index.html scripts/build-dist.mjs
git commit -m "refactor(modals): extract <Name>Modal to lib/modals/<Name>Modal.js (Wave 4.1.<N>)"
```
````

### Tier 2/3/4/5 (full view) task template

Same as Tier 1 but the file lives under `lib/views/` or `lib/views/profile/` and uses the FROZEN view prop signature `{ data, dispatch, deviceProfile, callbacks }`. Reference `docs/superpowers/patterns/view-extraction.md` exactly.

For multi-file extractions (Profile shell + panels, InspirationPanel split), each file gets its own bisect probe in Step 1.

---

## Definition of done for Wave 4

- All 18 modals extracted to `lib/modals/*.js`.
- All 7 profile panels + ProfileShell extracted to `lib/views/profile/*.js`.
- Header, AppChrome, BottomNav extracted to `lib/views/*.js`.
- TourOverlay extracted to `lib/views/TourOverlay.js` (effects stay in App() for now).
- Splash, Onboarding, AuthSurface extracted to `lib/views/*.js`.
- `wc -l index.html` ≤ 17,000 (the budget; aim for 16,000).
- Every new `lib/**/*.js` ≤ 1000 LOC (hard cap), most ≤ 500 LOC (soft target).
- `npm run test:unit` ≥ 259 green; `npx playwright test --project=desktop` ≥ 20 green.
- Each tier's commits are self-contained and revertible.
- `scripts/build-dist.mjs` FILES array contains every new module.
- SHELL_VERSION bumped per the archive-on-large-push rule once the wave is fully shipped.

---

## Risks specific to Wave 4

| Risk | Mitigation |
|---|---|
| Modal extraction breaks A11yDialog focus return because `<Name>Modal` unmounts before A11yDialog's destroy() runs | Keep the `&&` guard at the call site so React unmounts the wrapper, not just the inner content. Verified by Wave 2 A11yDialog behavior. |
| ProfileShell extraction misses one of the 7 panels (silently shows blank) | Step-2 grep audit: before committing the shell, `grep -n "panels\." lib/views/profile/ProfileShell.js` must show all 7 entries: `account, scorecard, inspiration, content, history, reports, settings`. |
| AiConsentModal closure dependency on `localStorage("v-ai-consent")` + Firestore write race | Extract pure consent-state to `lib/domains/aiConsent.js` first; modal is just the UI. |
| TourOverlay extraction breaks tour autoAdvance because effects move out of App() | Effects DO NOT MOVE in Wave 4. Only the render tree leaves. Effects stay inline until Wave 6. |
| Header extraction breaks streak-flame animation | Streak math is in `utils.js` and exposed via `callbacks` prop. View only renders. |
| Multiple modals shipped in parallel cause merge conflicts in index.html call-site region | Serialize the index.html edit step. Modals can each be written in parallel worktrees, but each `git commit` must rebase onto the latest main before the index.html edit lands. |
| Hidden closure dep on `latestData.current` inside a modal body | Standard pattern: replace `latestData.current` reads with `data` prop reads (the modal is mounted only when state is truthy, so `data` is current at mount time). Verify by grepping the lifted body for `latestData` before commit. |

---

## Not in scope (parent plan items that turned out to be already-handled or non-existent)

The parent plan at `docs/superpowers/plans/2026-05-23-full-decomposition.md` mentions a few sub-systems that aren't real Wave 4 work:

- **"AI sidebar"** — no AI sidebar exists. The AI integration is inline in BriefView (Daily Brief generation) and ReflectView (journal insights). It lives behind `data.aiConsentAt` gating, not behind a sidebar surface. If a future feature adds a sidebar, that's net-new product work, not extraction. **Skip.**
- **"Backup/restore" as a separate domain** — export/import/account-deletion UI lives inside `appSettingsPanel` (Wave 4.4.6). The pure backup logic could be extracted to `lib/domains/backup.js` if `AppSettingsPanel.js` exceeds 800 LOC after extraction. Decide at write time. **Folded into 4.4.6.**
- **"Social / partners"** — `tab === "social"` is dead code (`false && tab === "social"` at L16305). This belongs to Wave 1 dead-code cleanup, not Wave 4 extraction. Strip the dead `false &&` branch with the next dead-code commit. **Skip.**

## Reference

- `docs/superpowers/patterns/view-extraction.md` — the FROZEN module contract
- `docs/superpowers/plans/2026-05-23-full-decomposition.md` — the parent multi-wave plan
- `CLAUDE.md` § "File-size rule (MASTER, established 2026-05-23)" — the 1000-LOC hard cap
- `.claude/skills/verrocchio-frontend/SKILL.md` — repo-specific conventions

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-05-24-wave-4-subsystems.md`. Two execution options:

1. **Subagent-Driven (recommended)** — One subagent per Tier 1 modal in parallel for maximum throughput. Serialize the index.html call-site edits. Then sequential through Tiers 2–5.
2. **Inline Execution** — Single-threaded through 4.1.1 → 4.1.2 → ... → 4.5.3 in one session. Lower coordination cost but slower wall-clock.

Wave 4 cannot start until Waves 2 and 3 are merged.
