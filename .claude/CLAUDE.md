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
