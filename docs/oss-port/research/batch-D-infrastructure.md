# Research Batch D — Heavy infrastructure

Read-only research for ports #2 (Firebase auth wrapper), #4 (iCalendar export), #5 (service worker → Workbox). All candidates evaluated against the non-negotiable Verrocchio constraints: **no build step, no JSX, no TypeScript, no npm runtime** — every browser-side dependency must ship as a UMD/IIFE-style global (or, for the SW, be `importScripts`-compatible) from a public CDN.

---

## Port #2 — Firebase auth wrapper

**Current state.** `index.html:3833–4560` runs ~700 lines of inline Firebase Auth logic against the compat SDK (`firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js` loaded from `gstatic.com/firebasejs/10.7.1/`). Behaviors covered:

- `auth.onAuthStateChanged(...)` listener with mutual-exclusion against demo mode
- email signup / signin / password reset with `auth/*` error-code → user-string mapping
- anonymous + demo-persona sign-in
- pending-writes flush before sign-out
- account deletion with re-auth

### Candidate A — `react-firebase-hooks` (CSFrequency)

| Field | Value |
|---|---|
| owner/repo | `CSFrequency/react-firebase-hooks` |
| Stars | 3,637 |
| Last pushed | 2024-04-22 (stagnant ~2 years) |
| License | Apache-2.0 |
| Latest version | 5.1.1 |
| `package.json` | no `main`, no `module`, no `unpkg`, no `jsdelivr` — pure subpath-exports ESM (`./auth`, `./firestore`) |
| CDN UMD | **None.** No bundled global. Designed for Webpack / Vite / Next consumers. |
| Verdict | **FAIL** — requires a bundler. |

### Candidate B — `reactfire` (FirebaseExtended)

| Field | Value |
|---|---|
| owner/repo | `FirebaseExtended/reactfire` |
| Stars | 3,572 |
| Last pushed | 2026-05-12 (active) |
| License | Apache-2.0 |
| Latest version | 4.2.3 |
| CDN | `dist/index.umd.cjs` exists on jsdelivr (200 OK, 51 KB) |
| Real-world fit | Built for the **modular** Firebase SDK (`firebase/auth`, `firebase/firestore` v9+). We load `firebase-auth-compat` and use `auth.signInWithEmailAndPassword(...)` (namespace style). Mixing reactfire's `useUser`/`useAuth` hooks with compat objects is not supported and the UMD bundle expects modular peers loaded via ESM. |
| Verdict | **FAIL** — UMD exists but is incompatible with our compat SDK. Switching to modular Firebase is a separate, larger port (and modular Firebase does not ship a UMD bundle for browsers at all). |

### Candidate C — thin in-repo wrapper

Since neither qualifying library exists, the honest answer is to **write a small wrapper module** (`lib/auth.js`, dual-loaded same as `utils.js`) that:

1. Exports a `useAuth(auth)` hook returning `{ user, loading, error }` driven by `auth.onAuthStateChanged`.
2. Exports `mapAuthError(code)` — collapses the `publicAuthErr` switch (currently ~10 cases) into one shared map.
3. Exports `signOutWithFlush(auth, firestore)` — wraps `firestore.waitForPendingWrites()` + `auth.signOut()`.
4. Exports `deleteAccountWithReauth(auth, password)` — wraps the re-auth + delete flow.

Estimated wrapper size: ~120 lines. Estimated `index.html` reduction: 300–400 lines (the `useState`/listener boilerplate, the error switch, the pending-writes orchestration, the re-auth dance — each duplicated inline). Wrapper is testable under `node --test` against a mocked `auth` shim, the way `utils.js` is.

### Verdict for Port #2

**RECOMMEND-CUSTOM-WRAPPER.** No qualifying UMD library exists. `react-firebase-hooks` is unmaintained-ish and bundler-only; `reactfire` is bundler-or-modular-only and incompatible with our compat SDK. Writing a 120-line in-repo wrapper following the `utils.js` dual-load convention captures the same hook ergonomics, drops 300+ lines from `index.html`, and adds a `tests/auth.test.mjs` unit-test surface we don't currently have.

---

## Port #4 — iCalendar export

**Current state.** `index.html:4700–4962` builds an `.ics` file as a `lines.push(...)` array: PRODID, RRULE composition for `daily | weekdays | weekly | monthly | quarterly | annual`, sub-habit `DESCRIPTION` bullets, `PRIORITY` mapping, 5-min `VALARM`, `escapeICS()` for commas/semicolons/newlines, CRLF assembly, `Blob` + download. Branchy but small (~263 lines).

### Candidate A — `ical.js` (kewisch / mozilla-comm)

| Field | Value |
|---|---|
| owner/repo | `kewisch/ical.js` |
| Stars | 1,167 |
| Last pushed | 2026-05-15 (active — Mozilla / Thunderbird upstream) |
| License | MPL-2.0 (file-level copyleft; safe to import unmodified) |
| Latest version | 2.2.1 (2025-08-08) |
| CDN v2.2.1 | `https://cdn.jsdelivr.net/npm/ical.js@2.2.1/dist/ical.min.js` — 200 OK, 76 KB raw / **~23 KB gzipped** — but **ESM-only** (`export { Yt as default };`, no `window.ICAL`). |
| CDN v1.5.0 (legacy UMD) | `https://cdn.jsdelivr.net/npm/ical.js@1.5.0/build/ical.min.js` — 200 OK, 81 KB raw / ~22 KB gzipped — exposes `window.ICAL` global. Published 2022-01-06. |
| API mapping | `ICAL.Component('vcalendar')` for the wrapper; `comp.addSubcomponent(new ICAL.Component('vevent'))`; `vevent.addPropertyWithValue('summary', ...)`, `'description'`, `'priority'`, `'categories'`, `'rrule', new ICAL.Recur({freq:'WEEKLY', byday:['MO','WE','FR']})`; `'dtstart', ICAL.Time.fromJSDate(date)`; sub-`valarm` component for the 5-min trigger; `comp.toString()` returns RFC-5545-correct CRLF output. Replaces every hand-rolled formatter (`pad`, `escapeICS`, `localStamp`, `buildRRULE`, manual `BEGIN:/END:` push). |
| Verdict | **TENTATIVE.** UMD path exists only on the v1.5.0 build (~4 years old). v2.x is ESM. To stay no-build we must either (a) pin to `ical.js@1.5.0` for its UMD bundle, or (b) load v2.2.1 from `https://esm.sh/ical.js@2.2.1` as an ES module via `<script type="module">` — which is supported in all our target browsers but means the consuming code in `index.html` either lives in a separate `<script type="module">` block that calls into the main React tree via a global, or we accept the staleness of v1.5.0. |
| Code reduction | ~263 lines → ~120 lines. Saves all the manual escape / pad / RRULE-string-assembly code. |
| Migration risk | RFC-5545 compliant output may differ in small ways from our handcrafted output — specifically (i) `ical.js` re-orders properties alphabetically inside a VEVENT in some places, which Google Calendar and Apple Calendar both tolerate; (ii) `PRIORITY` semantics differ across calendar apps (Apple shows a flag; Google ignores it) — same risk as current code; (iii) `TZID=` handling: `ical.js` requires a registered `ICAL.TimezoneService` entry for any non-UTC tzid, whereas the current code emits a bare `TZID=America/Los_Angeles` reference that calendar apps resolve locally. This is the load-bearing migration risk and needs a side-by-side `.ics` byte-diff before merge. |

### Candidate B — `ics` (sebbo2002 / adamgibbons)

| Field | Value |
|---|---|
| Latest | 3.12.0 |
| CDN | jsdelivr `dist/index.js` returns 404; no `unpkg` or `jsdelivr` package.json field. CJS-only on npm. |
| Verdict | **FAIL** — no UMD bundle. |

### Candidate C — `ical-generator` (sebbo2002)

| Field | Value |
|---|---|
| Latest | 10.2.0 (v7.2.0 referenced; we resolved current to v10) |
| CDN | `dist/index.cjs` is the package main; no UMD/browser field declared; jsdelivr returns 404 on the typical bundle paths. The `https://cdn.jsdelivr.net/npm/ical-generator@7.2.0/` directory is browsable (47 KB index) but the package is explicitly Node-only (uses `node:fs`, `Buffer`). |
| Verdict | **FAIL** — Node-targeted, no browser UMD. |

### Verdict for Port #4

**TENTATIVE — `ical.js@1.5.0` via UMD CDN** is the only no-build path, and it's a 4-year-old build of an otherwise-active library. The cleaner long-term option is `ical.js@2.2.1` consumed as an ES module from `esm.sh`, which forces us to add a small `<script type="module">` block in `index.html` that exposes a single global (e.g. `window.__icalLib = ICAL;`). This is **not** a build step (no transpiler, no bundler — the browser does the ESM load natively), so it stays inside the project's hard rules. Recommend the v2.2.1 + esm.sh path; fallback is v1.5.0 UMD.

---

## Port #5 — Service worker → Workbox

**Current state.** `service-worker.js` (152 lines): precache `APP_SHELL`, network-first for same-origin navigations, cache-first for same-origin static assets, stale-while-revalidate for whitelisted CDN hosts (unpkg, cdnjs, gstatic, googleapis fonts), apex `/` bypass, GET-only.

### Candidate — `workbox-sw` (GoogleChrome / Workbox)

| Field | Value |
|---|---|
| owner/repo | `GoogleChrome/workbox` |
| Stars | 12,944 |
| Last pushed | 2026-05-09 (active) |
| License | MIT |
| Latest version | 7.3.0 |
| CDN loader | `https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js` — `curl -sI` → **HTTP/1.1 200 OK**, gzipped ~750 bytes (loader only) |
| CDN submodules (auto-fetched by loader) | `workbox-core.prod.js`, `workbox-precaching.prod.js`, `workbox-routing.prod.js`, `workbox-strategies.prod.js` — all 200 OK from `storage.googleapis.com/workbox-cdn/releases/7.3.0/` |
| Import path | Inside the SW: `importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');` then `workbox.routing.registerRoute(...)` — submodule fetches happen lazily via `importScripts` on first reference. No bundling. |
| Gzipped size | Loader 750 B; full runtime once core+precaching+routing+strategies are loaded ~25 KB gzipped total. |
| API mapping | • Precache `APP_SHELL` on install → `workbox.precaching.precacheAndRoute([{url:'./index.html', revision:'v62'}, ...])` <br> • Network-first same-origin navigations → `workbox.routing.registerRoute(({request}) => request.mode === 'navigate' && new URL(request.url).pathname !== '/', new workbox.strategies.NetworkFirst({cacheName:'pages'}))` <br> • Cache-first same-origin static → `registerRoute(({url}) => url.origin === self.location.origin, new workbox.strategies.CacheFirst({cacheName:'static'}))` <br> • Stale-while-revalidate CDN hosts → `registerRoute(({url}) => RUNTIME_CACHEABLE_HOSTS.has(url.hostname), new workbox.strategies.StaleWhileRevalidate({cacheName:'cdn'}))` <br> • Apex `/` bypass → list pathname in `setDefaultHandler` with a manual filter, or skip registration so the default fetch passes through <br> • Cache versioning → `workbox.core.setCacheNameDetails({prefix:'verrocchio', suffix:'v62'})` plus precache revisions per-URL |
| Verdict | **PASS.** Exact 1:1 coverage of every current SW behavior. |
| Code reduction | 152 lines → ~50 lines (mostly the route table). |
| Migration risk | (i) Workbox precache uses URL-keyed revisions, so the per-deploy "version bump" workflow shifts from bumping one `CACHE_NAME` constant to bumping per-file revision strings — easy to script but a habit change. (ii) Workbox `precacheAndRoute` will respond to navigation requests for any precached URL by default; we'll need `urlManipulation: ({url}) => url.pathname === '/' ? [] : [url]` to preserve the apex-bypass behavior. (iii) `skipWaiting()` semantics differ — Workbox prefers explicit `self.addEventListener('message', ev => ev.data === 'SKIP_WAITING' && self.skipWaiting())` with client-side coordination; current code calls `self.skipWaiting()` in the install handler unconditionally. Decide whether the new SW should keep that aggressiveness. |

### Verdict for Port #5

**PASS — Workbox 7.3.0 via `storage.googleapis.com/workbox-cdn`.** Verified live with `curl -sI` (200 OK on loader + every required submodule). Behavior parity is 1:1. No build step.

---

## Cross-port observations

1. **CDN cache busting.** Adding the Workbox CDN host (`storage.googleapis.com`) to the SW's stale-while-revalidate set is unnecessary — Workbox-sw and its submodules are loaded only by the SW itself via `importScripts`, which has its own HTTP cache and bypasses the SW's `fetch` listener entirely. No SW interaction.

2. **SW versioning vs. new CDN scripts.** Port #4 introduces a new CDN script in `index.html` (either `cdn.jsdelivr.net/npm/ical.js@1.5.0/...` or `esm.sh/ical.js@2.2.1`). The Workbox-rewritten SW's stale-while-revalidate route should be widened to include `cdn.jsdelivr.net` and `esm.sh` (whichever path we take). Currently neither is in `RUNTIME_CACHEABLE_HOSTS`, so the iCal port and the Workbox port should ship together or in adjacent commits to avoid an interim window where `ical.js` is uncached cross-origin.

3. **Honesty principle.** Two of three ports yield a "real" OSS swap (Workbox PASS; ical.js TENTATIVE). The third (Firebase auth) honestly has no UMD-shaped library and should ship as an in-repo wrapper with the same dual-load pattern as `utils.js`. Forcing a bundler for one port would violate the core architectural property of the project.

---

## Recommended winners

- **Port #2 — Firebase auth wrapper: RECOMMEND-CUSTOM-WRAPPER.** Write `lib/auth.js` (dual-loaded, ~120 lines) using only the existing compat `firebase` SDK; add `tests/auth.test.mjs`. No UMD library qualifies.
- **Port #4 — iCalendar export: `ical.js@2.2.1` via `https://esm.sh/ical.js@2.2.1` (preferred), or `ical.js@1.5.0` via `https://cdn.jsdelivr.net/npm/ical.js@1.5.0/build/ical.min.js` (fallback UMD).** ~23 KB gzipped either way. Migration risk centers on `TZID=` handling — needs a byte-diff QA pass against Apple/Google/Outlook before merge.
- **Port #5 — Workbox 7.3.0: `https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js` (verified 200 OK).** Loader gzipped ~750 B; runtime ~25 KB gzipped after lazy submodule loads. 1:1 API parity with the hand-rolled SW.
