<!-- ─────────── KARPATHY ADDENDUM (added 2026-05-23) ─────────── -->
# Karpathy Coding Guidelines (Addendum)

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

<!-- ─────────── END KARPATHY ADDENDUM ─────────── -->

# Verrocchio — Project Guidance for Claude

Single-file PWA habit tracker. **All app code lives in `index.html` (~25k lines, hand-rolled `React.createElement` — no JSX, no build step).** Pure date/streak math lives in `utils.js` and is dual-loaded (browser `<script>` + Node `require`) so the test suite shares the same source. iOS shell via Capacitor. Firestore for cross-device sync, scoped per `users/<uid>`. Optional Cloudflare Worker AI proxy at `ai-proxy/`.

## Stack reality check

| Layer | Actual choice |
|---|---|
| UI | React 18.3 UMD + manual `React.createElement` (NO JSX, NO Babel) |
| Bundler | None. Static file served directly. |
| Types | None. Plain JS. Don't add TypeScript. |
| Validation | None. Don't add Zod. |
| State | React hooks inline in `index.html`. No external store. |
| Storage | `localStorage` first, Firestore mirror at `users/<uid>` |
| Styling | Inline React styles + `var(--c-…)` design tokens. Dark mode via legacy `body.dark [style*="rgb(…)"]` substring overrides on un-tokenized colors. |
| Tests | `node --test` over `utils.js` (`tests/utils.test.mjs`) |
| iOS | Capacitor 8.3.3 (`cap sync ios`, `cap open ios`) |
| AI | Cloudflare Worker (`ai-proxy/worker.js`) |
| PWA | `manifest.json` + `service-worker.js` |

## Override notes — user-global rules that DON'T apply here

Several `~/.claude/rules/ecc/typescript/*` rules are injected by default. **Ignore the following for this repo:**

- "Use Zod for schema-based validation" — no validation lib, no need
- "Define component props with a named `interface` or `type`" — no TypeScript
- "Avoid `any`" / "Use `unknown`" — no TypeScript
- "Prettier auto-format hook" — single-file repo, hand-formatted
- "Repository Pattern" / generic `ApiResponse<T>` — overkill for a static SPA

**Still apply:**
- Immutability (spread, never mutate)
- No `console.log` in production code paths (debug logs ok during dev, strip before commit)
- Secret management via env vars (relevant only to `ai-proxy/worker.js` — Cloudflare Worker `wrangler.toml` secrets, never hardcode)

## Skill allowlist — what to use, when

Out of the ~265 available skills, **these are the ~12 that matter for verrocchio**:

### Workflow loop (superpowers — substantial work only)

| Skill | Invoke when |
|---|---|
| `superpowers:brainstorming` | Start of any new feature or major UX change. Skip for fixes. |
| `superpowers:writing-plans` | Multi-step work touching 3+ regions of `index.html` or crossing browser/iOS boundary |
| `superpowers:systematic-debugging` | Bug that didn't yield to first investigation. Layout regressions on iOS are the common case. |
| `superpowers:test-driven-development` | Any new date/streak/correlation logic in `utils.js` (it has real Node tests — write them first) |
| `superpowers:verification-before-completion` | Before claiming any UI change "done" — must include a browser visual check on desktop AND mobile width |
| `superpowers:requesting-code-review` | After substantial features, before commit |
| `superpowers:dispatching-parallel-agents` | When 2+ independent reviews (security/code/UI) can run in parallel |

### Reference / one-shot load (ECC)

| Skill | Invoke when |
|---|---|
| `everything-claude-code:frontend-patterns` | Touching layout, responsive breakpoints, or component patterns |
| `everything-claude-code:design-system` | Adding new color tokens, modifying dark-mode handling, or building reusable UI primitives |
| `everything-claude-code:browser-qa` | Visually verifying UI changes (use Playwright MCP — golden path + edge cases + dark mode) |
| `everything-claude-code:e2e-testing` | If we ever add Playwright tests beyond `utils.js` unit coverage |
| `everything-claude-code:seo` | If we ever ship a marketing page; not needed for the app itself |
| `everything-claude-code:claude-api` | Only when editing `ai-proxy/worker.js` |
| `verrocchio-frontend` (local) | Always relevant. Captures conventions for this codebase specifically. See `.claude/skills/verrocchio-frontend/SKILL.md`. |

### Explicitly NOT applicable (despite being listed globally)

`springboot-*`, `kotlin-*`, `rust-*`, `swift-*`, `python-*`, `csharp-*`, `flutter-*`, `dart-*`, `cpp-*`, `go-*`, `nextjs-*`, `nuxt-*`, `laravel-*`, `django-*`, `nestjs-*`, `jpa-*`, `postgres-*`, `clickhouse-*`, `springboot-tdd`, all healthcare/freight/energy/customs domain skills, `gradle-*`, `tdd-workflow` (Java-centric), `flutter-build`, `kotlin-build`, etc.

## Calibration — when to invoke a skill at all

**Substantial work — invoke from the loop above:**
- New feature (new habit type, new view, new analysis pattern)
- Refactor crossing 3+ regions of `index.html`
- Anything touching streak/correlation/cutoff math in `utils.js`
- Anything touching Firestore rules or sync logic
- Any change to the Capacitor iOS shell or AI proxy

**Routine — skip the ceremony:**
- Spacing, padding, color tweaks
- Single-component visual fix
- Copy edits
- Service worker version bumps
- Commit messages, CHANGELOG entries
- Answering "what does this code do?" questions

When in doubt: ask "would I write a plan for this if I were doing it alone?" If yes → invoke `brainstorming` or `writing-plans`. If no → just edit.

## Verification gate (mandatory for UI changes)

`superpowers:verification-before-completion` rule for this project: **never** claim a UI change is done from code inspection alone. Required evidence:

1. Browser screenshot at desktop width (>=1024px)
2. Browser screenshot at iOS width (~390px)
3. Dark-mode check if any color/border was touched
4. If logic in `utils.js`: `npm test` passes

Without these, the response is "implemented but unverified" — not "done".

## Parallel review pattern

For features bigger than a single edit, default to parallel agent dispatch:

```
Agent(security-reviewer) — review the Firestore rules/auth interaction, plus any new client-side validation
Agent(code-reviewer) — review the index.html / utils.js diff for quality
Agent(e2e-runner) OR browser-qa — visual + interaction smoke
```

All three in one message, running concurrently.

## Anti-patterns specific to this repo

- **Never** use `toISOString()` for date keys — UTC shifts break "today" near midnight for users east/west of UTC. Use `dk(d)` from `utils.js`.
- **Never** introduce a build step. No Vite, no esbuild, no Babel, no Webpack. The "single file you can open in any browser" property is the design.
- **Never** add JSX. `React.createElement(...)` calls are the convention. Adding JSX requires a transpiler, which kills the no-build property.
- **Never** introduce a UI framework (Tailwind, MUI, Chakra). Inline styles + design tokens is the system.
- **Never** mutate `h.completions` or `h.completionTimes` in place — always spread (immutability rule applies even without TypeScript enforcing it).
- **Don't** widen Firestore rules beyond `users/{uid}` without a reason and corresponding threat-model note in `firestore.rules`.

## File-size rule (MASTER, established 2026-05-23)

- **Hard cap: 1000 LOC per file.** Any change that pushes a file over 1000 lines is blocked — split first, then add the change.
- **Soft target: 500 LOC per file.** New files should aim under 500; existing files between 500 and 1000 are flagged as split candidates whenever you touch them.
- **Why:** Forces meaningful decomposition. Keeps every file holdable in a subagent's context without truncation. Reduces blast radius of any single edit. The rule is a forcing function for the same architectural goal the v75/v76 view-extraction work was already pursuing.
- **Current known violators (work them into follow-up plans):**
  - `index.html` ~30,000 LOC (massive; needs App() sub-system extraction — settings, AI sidebar, modals, onboarding)
  - `lib/views/HabitsView.js` 3,104 LOC (split into HabitCard / HabitRow / ReorderToolbar / NewHabitForm / FilterPills)
  - `lib/views/BriefView.js` 1,072 LOC
  - `lib/views/GoalsView.js` 955 LOC
  - `lib/views/CalendarView.js` 772 LOC
  - `lib/views/TodosView.js` 521 LOC (over soft target)
- **How to apply:** When you finish an edit, `wc -l` the touched files. If any cross the cap, do a follow-up split BEFORE the next feature commit. When extracting a new module, target 200-400 LOC.

## Quick commands

```powershell
# Run the test suite (browser-equivalent date/streak math)
npm test

# Local serve (PowerShell)
.\serve.ps1

# Capacitor iOS workflow
npm run cap:sync
npm run cap:open
```

## Reading order for someone new to this repo

1. `manifest.json`, `capacitor.config.json`, `package.json` — what kind of app
2. `firestore.rules` — security/threat model in a comment block
3. `utils.js` — pure date/streak/correlation logic (266 lines, fully tested)
4. `tests/utils.test.mjs` — what the math is supposed to do
5. `index.html` head (lines 1–~200) — CSS tokens, dark-mode strategy, loaded libs
6. The rest of `index.html` — Grep for specific feature names; never read top-to-bottom
