---
name: verrocchio-frontend
description: Use when editing the Verrocchio habit-tracker codebase (any change to index.html, utils.js, firestore.rules, service-worker.js, manifest.json, ai-proxy/, or scripts/). Captures the conventions you cannot reverse-engineer from a single read of the 25k-line index.html — data model, persistence layering, React-without-JSX style, device profile system, auth flow, PWA update cadence, and the specific anti-patterns that have caused regressions.
---

# Verrocchio Frontend Conventions

This codebase is a **single-file PWA** (`index.html` ~25k lines) with a shared pure-JS utility file (`utils.js` ~266 lines) and per-platform shells (Capacitor iOS, Cloudflare Worker AI proxy). It runs as static files — there is **no build step, no JSX, no TypeScript, no bundler**. Read the conventions below before making any change; many of them exist because of a specific past regression.

## 1. Architecture at a glance

```
index.html         <- all UI + state + Firebase wiring (one file)
utils.js           <- pure date/streak/correlation math, dual-loaded
                     (browser <script> + Node require)
tests/utils.test.mjs <- node --test runner over utils.js
firestore.rules    <- per-user (users/<uid>) hard isolation
storage.rules      <- per-user Firebase Storage scoping
service-worker.js  <- offline app shell + update polling
manifest.json      <- PWA install metadata
capacitor.config.json <- iOS shell wrapper
ai-proxy/worker.js <- Cloudflare Worker that proxies AI calls
scripts/seed-demo-users.mjs <- seeds demo accounts in Firestore
```

The "single static file you can open in any browser" property is **architectural**, not incidental. Never propose introducing a build step (Vite/esbuild/Babel/Webpack), JSX, TypeScript, or a UI framework (Tailwind/MUI/Chakra). All of those break the property.

## 2. Data model & persistence (the most-misunderstood part)

### Storage layers (in priority order at read time)

1. **In-memory React state** (`data` in `App()`) — the working truth during a session
2. **localStorage** — survives reload, per-uid keyed: `${SK}-${uid}` where `SK = "verrocchio-v1"` (and a legacy un-suffixed key for pre-multi-user data, migrated on first cloud read)
3. **Firestore** at `users/<uid>` — the durable cross-device mirror; subscribed via `onSnapshot` for realtime updates
4. **Firebase Storage** at `users/<uid>/content/<itemId>-<fileName>` — large blobs that won't fit in a 1 MB Firestore doc; the Firestore entry stores `storagePath + downloadURL`, never raw bytes

### Sync flow

- **Boot**: `userDoc(uid).get()` resolves once → hydrate `data`. Also reads localStorage as a fallback if Firestore is offline.
- **Steady state**: `userDoc(uid).onSnapshot(snap => ...)` keeps `data` live across devices.
- **Writes**: every meaningful state change calls `userDoc(uid).set(sanitizeForFirestore(stamped))`. Local writes to `localStorage.setItem(SK + "-" + uid, JSON.stringify(data))` happen alongside.
- **Always wrap `localStorage.setItem` / `removeItem` in try/catch** — Safari private mode throws `QuotaExceededError` on every write.
- **Always call `sanitizeForFirestore(doc)` before `.set()`** — Firestore rejects `undefined` and non-serializable values; this helper strips them.

### Shape

`DD` (Default Data, defined around line 2977 in `index.html`) is the canonical shape. New top-level fields must be added there AND in `hydrateCloudDoc(p)` (which backfills missing fields on legacy cloud docs returning from Firestore) so existing users don't get `undefined` reads.

### Habit completion shape

```js
habit = {
  id, text, section, // "morning" | "afternoon" | "evening" | "avoid"
  startDate,         // "YYYY-MM-DD"
  frequency: {       // see utils.js getStreak() for all types
    type: "daily" | "weekdays" | "weekly-day" | "weekly" | "monthly" | "quarterly" | "annual",
    days,            // [0..6] for "weekdays"
    day,             // 0..6 for "weekly"
    monthDay,        // 1..31
    month            // 0..11
  },
  completions: { "2026-05-11": "done" },        // value is "done" or true
  completionTimes: { "2026-05-11": "07:30" }    // local HH:MM 24h
}
```

**Never** mutate `completions` or `completionTimes` in place. Always spread:

```js
// CORRECT
const next = { ...habit, completions: { ...habit.completions, [key]: "done" } };
// WRONG — mutates shared reference, breaks React reconciliation and Firestore diff
habit.completions[key] = "done";
```

### Date keys

Use `dk(date)` from `utils.js` for any "YYYY-MM-DD" key. **Never `toISOString().slice(0,10)`** — that converts to UTC first and silently shifts the day boundary by ±1 for users east/west of UTC, breaking streaks, today-lookups, and calendar keys.

## 3. React conventions in this repo

### No JSX

All elements are explicit `React.createElement(tag, props, ...children)` calls. There are 2200+ of them in `index.html`. Don't introduce JSX in new code — it would require a transpile step.

### Component memoization

Frequently-rerendered visual components are wrapped in `React.memo`:

```js
const Sparkline14 = React.memo(function Sparkline14({ habit, width, height, color }) { ... });
```

Use this for any chart/avatar/streak/heatmap component. Reserve unwrapped function components for one-shot UI (modals, sections, forms).

### State hooks with localStorage lazy init

When state mirrors a `v-*` localStorage key:

```js
const [darkMode, setDarkMode] = useState(() => localStorage.getItem("v-dark-mode") === "1");
```

The `() => ...` lazy initializer matters — without it, `getItem` runs on every render.

### useEffect for localStorage writes

Don't `setItem` inside the setter — use a paired `useEffect` so it runs on every state change including external updates:

```js
useEffect(() => {
  localStorage.setItem("v-dark-mode", darkMode ? "1" : "0");
}, [darkMode]);
```

### Settings key naming convention

All app-owned localStorage keys are prefixed `v-`: `v-dark-mode`, `v-settings-mode`, `v-accent-color`, `v-tour-done`, `v-profile-name`, `v-profile-goal`, `v-mycontent-sort`, `v-social-partners`, etc. The user data doc uses the un-prefixed `SK = "verrocchio-v1"` (with `-${uid}` suffix for multi-user).

## 4. Styling system

### CSS custom-property tokens

The `:root` block in `index.html` defines `--c-*` tokens (e.g. `--c-surface-raised`, `--c-tint-success-bg`, `--c-text-faint`). New code should use these tokens so dark mode is a single token flip.

### Dark mode

- Token-aware code: a `body.dark` selector overrides `--c-*` values; everything that reads `var(--c-…)` flips automatically.
- Legacy substring-match overrides: `body.dark [style*="rgb(...)"]` pairs exist for un-tokenized inline rgb colors. As inline styles migrate to tokens, the matching override row can be deleted.
- **Don't** add new un-tokenized rgb colors expecting dark mode to "just work" — use a token or accept that you'll need a substring override.

### Inline styles + tokens

```js
React.createElement("div", {
  style: {
    background: "var(--c-surface-raised)",
    color: "var(--c-text-strong)",
    border: "1px solid var(--c-border)"
  }
}, ...)
```

This is the system. Don't reach for CSS-in-JS libraries or className-based design systems.

## 5. Device profile system

`classifyDevice()` (around line 1018 in `index.html`) runs once at boot and re-runs on resize + hover-MQL change. Four profiles:

| Profile | Width | Hover-capable |
|---|---|---|
| `phone` | < 900 | no |
| `tablet` | >= 900 | no |
| `desktop` | 900–1299 | yes |
| `desktop-wide` | >= 1300 | yes |

Exposed two ways so both CSS and JS can target without DOM peeking:

- **CSS**: `body[data-device="desktop-wide"] .foo { ... }`
- **JS / React effects**: `window.__deviceProfile`

Hover detection accepts ANY precise pointer (`hover`, `any-hover`, `pointer: fine`, `any-pointer: fine`) so Windows touch-laptops with a mouse classify as `desktop`, not `tablet`. Don't tighten this — it was deliberately loosened.

## 6. Auth & multi-user

`auth.onAuthStateChanged` is the source of truth:

```js
const [authUser, setAuthUser] = useState(undefined);
// undefined -> still resolving; null -> signed out; object -> signed in
```

**The three-state pattern matters** — `undefined` lets the splash/loading screen distinguish "still checking" from "definitely not logged in".

### Demo mode invariant

Demo mode and a real signed-in user MUST NEVER coexist. The auth listener forces `setDemoMode(false)` when `u` resolves to a real user. If you add a new demo-mode-gated surface, follow the same gate or the Profile pill, save() path, and persona flow can show "Demo" stuck on a real account.

### Per-uid Firestore document

`userDoc(uid) = db.collection("users").doc(uid)`. Every read/write of user data goes through this. The legacy `users/main` doc is never read or written anymore — don't restore it.

Firestore rules (`firestore.rules`) enforce per-uid isolation at the server. Client-side `userDoc(uid)` is convention; the rules are the actual security boundary.

## 7. PWA & service worker

```js
navigator.serviceWorker.register("service-worker.js", { updateViaCache: "none" })
```

- `updateViaCache: "none"` bypasses GitHub Pages' 10-min HTTP cache so SW updates arrive fast after deploy
- Explicit `reg.update()` on load + every 60s while the tab is open
- `controllerchange` listener does a one-shot `location.reload()` when a new SW takes over, so users immediately get the new bundle without manual navigation

When bumping the SW version, do it in `service-worker.js` (cache version constant) AND verify the install path: the controlling SW gets replaced, `controllerchange` fires, the page reloads, and the user sees the new build.

## 8. Performance patterns to preserve

- **Lazy Chart.js**: `ensureChartJs()` loads Chart.js on demand the first time the Habit Stats radar opens. Saves ~190 KB on cold boot. Home uses a hand-rolled SVG sparkline instead. Don't import Chart.js eagerly.
- **DOM confetti, not a library**: `fireConfetti()` uses ~90 absolutely-positioned divs and one CSS keyframe. Respects `prefers-reduced-motion`. Don't add `canvas-confetti` or similar.
- **React.memo** on every chart/avatar/sparkline.
- **Firestore offline persistence**: `db.enablePersistence({ synchronizeTabs: true })` runs once at module load. Don't add another persistence call — it fails noisily if not called first.

## 9. Common task recipes

### Adding a new top-level data field

1. Add to `DD` with a sensible default
2. Add a backfill in `hydrateCloudDoc(p)` so legacy cloud docs don't return `undefined`
3. If it's user-facing, mirror to localStorage with a `v-*` key + lazy init + useEffect write
4. Read paths reference `data.theNewField`; never destructure into a new variable at top of App() unless you also handle the loading state

### Adding new date/streak math

1. Write it in `utils.js` as a pure function
2. Export via the CommonJS guard at the bottom of `utils.js`
3. Add tests in `tests/utils.test.mjs` (use `node --test` syntax — see existing tests for fixtures)
4. Run `npm test` — must pass before claiming done

### Adding a new view / tab

1. Branch in the `tab` switch inside `App()` render
2. New components prefer `React.memo(function Name(props) { ... })` for any visual that re-renders often
3. Respect device profile: use `window.__deviceProfile` or `body[data-device="..."]` to choose layout, don't hard-fork on width

### Changing dark-mode color

1. Prefer adding/editing a `--c-*` token in `:root` + the matching `body.dark` override
2. If the color is in an inline style as raw rgb, either:
   - Migrate the style to use `var(--c-...)`, OR
   - Add a matching `body.dark [style*="rgb(...)"]` row in the substring-override block

### Adding a Firestore write

1. Always `sanitizeForFirestore(doc)` first
2. `.catch()` with a non-throwing handler — sync errors must not crash the UI
3. Don't write per-keystroke; throttle/debounce or write on commit boundaries

## 10. Hard "don't"s — these caused real regressions

- `toISOString()` for date keys → use `dk(d)`
- Mutating `h.completions` in place → spread
- `localStorage.setItem` without try/catch → Safari private mode crashes
- `.set()` without `sanitizeForFirestore` → Firestore rejects `undefined`
- Eager Chart.js import → 190 KB cold-boot regression
- Tightening hover detection to only `(hover: hover)` → Windows touch laptops fall into `tablet` profile and lose desktop layout
- Adding JSX or a build step → kills the "open any browser, it works" property
- Restoring writes to `users/main` → cross-user data contamination
- Skipping `hydrateCloudDoc` for new fields → legacy users get `undefined` reads on next sync

## 11. Verification before claiming a UI change is "done"

1. **Desktop screenshot** at >= 1024px
2. **Mobile screenshot** at ~390px
3. **Dark-mode check** if any color/border touched
4. **`npm test`** passes if `utils.js` touched

Code inspection alone is not verification for this repo. Layout regressions on iOS Capacitor have shipped multiple times from "looks right in code" claims.

## 12. Quick file map for fast navigation

| I need to change... | Look in... |
|---|---|
| Streak/correlation/date logic | `utils.js` + `tests/utils.test.mjs` |
| Firestore security | `firestore.rules` |
| Storage security | `storage.rules` |
| PWA install metadata | `manifest.json` |
| Service worker / offline | `service-worker.js` |
| iOS shell | `capacitor.config.json` + `cap sync ios` |
| AI proxy endpoint | `ai-proxy/worker.js` + `ai-proxy/wrangler.toml` |
| Demo user seeding | `scripts/seed-demo-users.mjs` |
| Default data shape | `index.html` near line 2977 (`const DD = {...}`) |
| Auth flow / `App()` | `index.html` near line 3457 |
| Device profile | `index.html` near line 1018 (`classifyDevice`) |
| Firebase init | `index.html` near line 989 |
| CSS tokens | `index.html` `:root` block (~line 47) |
