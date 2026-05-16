# OSS-Port Research Synthesis — Phase 2 Dispatch Order

**Date:** 2026-05-15
**Inputs:** `batch-A-pure-logic.md`, `batch-B-ui-primitives.md`, `batch-C-visualization.md`, `batch-D-infrastructure.md`

Out of 14 original candidate ports, **10 advance to Phase 2** and **4 are dropped** (insufficient ROI or no qualifying library). Total projected reduction: ~2,000 hand-rolled lines for ~85 KB additional gzipped JS spread across CDN scripts (cached by the service worker after first load).

## Decisions

| Port | Feature | Verdict | Library | Wave | Notes |
|---|---|---|---|---|---|
| #1 | Correlation lift math | **GO** | `simple-statistics@7.8.9` | A | Clean PASS. `sampleCorrelation(x,y)` on binary vectors → phi coefficient. |
| #3 | Cloud doc hydration | **GO** | `superstruct@2.0.2` | A | TENTATIVE accepted. Last push 2024-10-01 fails 12-mo bar, but every UMD alternative also fails. Mitigate via immutable jsdelivr pin. |
| #14 | Worker JWT | **GO** | `jose@6.2.3` | A | Clean PASS. Workers explicitly supported. |
| #5 | Service worker | **GO** | `workbox-sw@7.3.0` | B | Clean PASS. 1:1 API parity. 152 → ~50 lines. |
| #6 + #9 | Modal + focus trap | **GO** | `a11y-dialog@8.1.5` | B | Clean PASS. Drops ~1,150 lines. Biggest single win. |
| #11 | Calendar grid | **GO** | `vanilla-calendar-pro@3.1.0` | B | Clean PASS. Zero deps. |
| #7 | Emoji picker | **GO** | `emoji-picker-element@1.29.1` | C | Clean PASS. Custom element, Shadow-DOM-isolated. |
| #4 | iCalendar export | **GO** | `ical.js@2.2.1` via `esm.sh` | C | TENTATIVE. Modern v2 is ESM-only; we use `esm.sh/ical.js@2.2.1` mediator (no build step). TZID migration risk — Phase 2 implementer compares VEVENT output diff for one daily + one weekly habit before deleting hand-rolled code. |
| #10 | Toast | **GO** | `toastify-js@1.12.0` | C | TENTATIVE accepted. Last push Aug 2024 = ~9 mo, just inside 12-mo bar. Library-injected CSS handled with scoped `body.dark .toastify {}` override. |
| #2 | Firebase auth wrapper | **GO** (custom) | in-repo `lib/auth.js` | C | No qualifying OSS lib (react-firebase-hooks/reactfire both fail UMD). Custom thin wrapper dual-loaded like `utils.js`. Drops 300+ lines from `index.html` and adds Node test surface. |
| #8 | Long-press | **DROP / KEEP** | — | — | Best candidate (`long-press-event@2.5.2`) has only 351 stars, below the 1k floor. Hand-rolled stays. |
| #10 (alt) | — | — | — | — | `notyf` rejected (last push 2023-01, well outside 12 mo). |
| #12 | 14-day sparkline | **DROP / KEEP** | — | — | Hand-rolled is only 25 lines; any library needs more glue. Chart.js reuse rejected (per-row canvases). |
| #13 | Year heatmap | **DROP / KEEP** | — | — | Hand-rolled is only 52 lines; cal-heatmap brings 200 KB of d3+popper transitively. Net negative. |

## Phase 2 dispatch order

### Wave A — Pure-logic ports (sequential, package.json + SW conflicts force serial)

1. **Port #1** — `simple-statistics` in `utils.js`/`tests/utils.test.mjs`
2. **Port #14** — `jose` in `ai-proxy/worker.js`
3. **Port #3** — `superstruct` in new `lib/hydration.js` (extracted from `index.html`)

### Wave B — UI primitives (sequential, all touch `index.html`)

4. **Port #5** — Workbox in `service-worker.js` (smallest blast radius, do first)
5. **Port #6 + #9** — `a11y-dialog` (biggest win; touches many modal sites)
6. **Port #11** — `vanilla-calendar-pro`

### Wave C — Higher-coupled ports (sequential)

7. **Port #7** — `emoji-picker-element`
8. **Port #4** — `ical.js` via `esm.sh`
9. **Port #2** — Custom `lib/auth.js` wrapper
10. **Port #10** — `toastify-js`

## Why sequential, not parallel

The subagent-driven-development skill forbids parallel implementer dispatch. The conflicts are real even between disjoint files:

- Every port bumps `service-worker.js` `CACHE_NAME` → serializes
- Most ports add devDeps to `package.json` → serializes
- Most ports add a `<script>` tag to `index.html` `<head>` → serializes

Wave-level parallelism comes from running multiple **reviews** at once after each implementer returns, not from running multiple implementers concurrently.

## Risk register

| Risk | Mitigation |
|---|---|
| `superstruct` unmaintained → unfixed bugs | Pin immutable jsdelivr URL. Schema is small surface — we can fork if needed. |
| `ical.js` v2 via esm.sh proxy fails for offline iOS | Test offline iCal export in Wave C Port #4 implementer's Playwright spec. Fallback: pin v1.5.0 UMD. |
| `toastify-js` library CSS conflicts with dark mode | Scoped CSS override in `index.html` `<style>` block — already noted by Batch B. |
| `vanilla-calendar-pro` CSS imports break offline | Library CSS goes into service-worker precache list. |
| Workbox bundle size adds initial-paint cost | Bundle is precached on first visit — second visit and beyond are cache-hits. |

## Net code-reduction projection (revised)

| Port | Lines out | Lines in (glue) | Δ |
|---|---|---|---|
| #1 | −70 | +20 | −50 |
| #14 | −60 | +15 | −45 |
| #3 | −240 | +50 | −190 |
| #5 | −152 | +50 | −102 |
| #6 + #9 | −1,150 | +200 | −950 |
| #11 | −90 | +20 | −70 |
| #7 | −130 | +20 | −110 |
| #4 | −230 | +30 | −200 |
| #2 | −300 | +120 | −180 |
| #10 | −80 | +15 | −65 |
| **Total** | **−2,502** | **+540** | **−1,962** |

~2,000 hand-rolled lines retire, ~85 KB gzipped JS arrives via CDN (cached). On top of that, all 10 ports gain TDD coverage they don't have today.
