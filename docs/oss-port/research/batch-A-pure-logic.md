# Research Batch A — Pure logic & crypto

Research date: 2026-05-15 · Branch: `feat/oss-port-tdd-rebuild`

Three ports investigated against the §"Vetting Criteria" gate from the OSS-port plan. Hard constraints recap: NO build step, NO JSX, NO TypeScript. Library must ship UMD (browser `<script>`) and/or be importable from Node (`require`) or — for the Worker — as ESM in a Workers-runtime module.

---

## Port #1 — Correlation lift math

Replaces hand-rolled `conditional - base` lift computation inside `findCorrelations` (`utils.js:187-286`, ~100 lines). The desired behavior is to take two binary vectors (`onTime` set for habit A, `any` set for habit B over the windowed days array) and compute a correlation/association metric exceeding a threshold.

### Candidate: `simple-statistics`

- **owner/repo**: `simple-statistics/simple-statistics`
- **Stars**: 3,503
- **Last commit / pushed**: 2026-03-10 (2 months stale — PASS)
- **License**: ISC (compatible — PASS)
- **Latest npm version**: `7.8.9`
- **CDN UMD bundle**: `https://cdn.jsdelivr.net/npm/simple-statistics@7.8.9/dist/simple-statistics.min.js` — verified `HTTP 200`, 24,095 bytes raw
- **Gzipped size**: 9,208 bytes (≈ 9 KB) — well under 20 KB target
- **API mapping**: `ss.sampleCorrelation(x, y)` computes the Pearson sample correlation between two numeric arrays. For our binary on/off vectors this collapses to the **phi coefficient** (Pearson on two binary variables ≡ phi), which is the statistically clean replacement for the current `conditional - base` lift. Both arrays are derived from the same windowed-days iteration we already do, so the migration is: build two `Array<0|1>` per pair → call `sampleCorrelation` → threshold. `ss.sampleCovariance` and `ss.sampleStandardDeviation` are also exposed if a manual phi build is preferred. `chiSquaredGoodnessOfFit` is available for significance testing later.
- **Has own tests**: Yes — extensive `test/*.test.js` directory (one test file per src module).
- **Module shape**: `umd:main`, `unpkg`, and `browser` fields all point at the UMD min bundle. Loads as `window.ss` via `<script>`; `require("simple-statistics")` works in Node (used by `tests/utils.test.mjs`).
- **Verdict**: **PASS**

---

## Port #3 — Cloud doc hydration / schema validation

Replaces `hydrateCloudDoc` (`index.html:3118-3359`, ~240 lines) — imperative defaulting + array/object type-guard repair on Firestore docs read from older schema versions. Wanted: a runtime schema lib with declarative `.defaults()` (so missing fields auto-seed) that ships **UMD** AND CommonJS.

### Candidate: `superstruct`

- **owner/repo**: `ianstormtaylor/superstruct`
- **Stars**: 7,144
- **Last commit / pushed**: 2024-10-01. **This is ~19 months stale at research time — fails the ≤12-month bar.** Latest release commit was 2.0.2 in Jul 2024; only doc/typo PRs since.
- **License**: MIT — PASS
- **Latest npm version**: `2.0.2`
- **CDN UMD bundle**: `https://cdn.jsdelivr.net/npm/superstruct@2.0.2/dist/index.cjs` — verified `HTTP 200`, 36,814 bytes raw. Inspection of the file head confirms it is a **true UMD wrapper** (`typeof exports === 'object' ... define.amd ... global.Superstruct = {}`), not bare CJS. Works as both `<script>` global and `require()`.
- **Gzipped size**: 7,370 bytes (≈ 7 KB) — excellent
- **API mapping**: `defaulted(struct, fallback)` provides the declarative defaulting we need. Example: `object({ habits: defaulted(array(habitStruct), () => SEED_HABITS), goals: defaulted(array(goalStruct), () => SEED_GOALS), journal: defaulted(array(), () => []), bestStreaks: defaulted(record(string(), number()), () => ({})), ... })`. The single call `create(rawDoc, CloudDoc)` returns a hydrated doc, replacing 240 lines of `if (!Array.isArray(p.x)) p.x = ...` with ~30 lines of declarative schema. Type-guard repair (rejecting arrays where objects are expected) is handled by struct constraints. The `string→number` migration for legacy `achievementsUnlocked` timestamps would still need a custom coercer (superstruct supports `coerce(struct, sourceStruct, fn)`).
- **Has own tests**: Yes — `test/index.test.ts` plus `test/api/*` directory.
- **Issue health**: 220 closed / 81 open issues = 73% closed-rate — PASS ≥60% bar.
- **Verdict**: **TENTATIVE — qualifies on every criterion EXCEPT last-commit recency.** No active alternative does what we need:
  - `valibot@1.4.0` (8,659 stars, 2026-05 pushed, MIT, 1.4 KB tree-shaken): ships ESM-first with a non-UMD CJS bundle (`dist/index.cjs` is bare CJS, not wrapped) → **no `<script>` browser global** → FAIL hard constraint #1.
  - `zod@4.4.3`: dropped UMD bundle in v4 (only ESM + CJS) → FAIL.
  - `yup@1.7.1`: no UMD field; ESM/CJS only → FAIL.
  - **superstruct is the only mature option that ships a real UMD bundle and provides `.defaulted()` declarative defaults.**
  - Practical mitigation: pin to `2.0.2` (immutable on jsdelivr), document the staleness, plan to revisit if a CVE appears. The library is feature-complete and small enough to fork/maintain if abandoned.

---

## Port #14 — Cloudflare Worker JWT verification

Replaces `verifyFirebaseToken` and `getGoogleSigningKey` (`ai-proxy/worker.js:115-177`, ~60 lines of hand-rolled JWT split/decode/claim-check + JWK fetch + `crypto.subtle.verify`). `worker.js` is already an ES module (`export default { ... }`) so ESM imports from a CDN are native — no UMD needed for this port.

### Candidate: `jose`

- **owner/repo**: `panva/jose`
- **Stars**: 7,590
- **Last commit / pushed**: 2026-05-15 (same day — extremely active) — PASS
- **License**: MIT — PASS
- **Latest npm version**: `6.2.3`
- **CDN entry point**: ESM imports such as `import { jwtVerify, createRemoteJWKSet } from "https://cdn.jsdelivr.net/npm/jose@6.2.3/dist/webapi/index.js"`. Workers natively support remote ESM imports during deploy via wrangler bundling; the more idiomatic approach is `npm install jose` + `import { jwtVerify, createRemoteJWKSet } from "jose"` inside `ai-proxy/` and let wrangler bundle. (The plan's "no build step" rule applies to the SPA `index.html`, not to the Worker, which is already deployed via wrangler.)
- **Gzipped size**: 18,007 bytes for the main barrel (~18 KB gz, 65 KB raw) — under 50 KB limit; tree-shakes to ~5–7 KB when only `jwtVerify` + `createRemoteJWKSet` are used.
- **Workers compatibility**: **explicitly supported.** The package README's first line lists Cloudflare Workers as a target runtime. The default `exports` entry resolves to `dist/webapi/index.js`, which uses Web Crypto (`crypto.subtle`) — exactly the API our Worker already calls. Issue #265 is the long-running Workers-runtime tracker; the WebAPI build has been Worker-clean for years.
- **API mapping**: Replace the 60-line custom block with:
  ```js
  import { jwtVerify, createRemoteJWKSet } from "jose";
  const JWKS = createRemoteJWKSet(new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  ));
  async function verifyFirebaseToken(idToken, projectId) {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });
    return payload;
  }
  ```
  `createRemoteJWKSet` already does kid-based caching with TTL — drops our hand-rolled `keyCache` Map. `jwtVerify` enforces `exp`, `iss`, `aud`, `alg` declaratively and throws typed errors (`JWTExpired`, `JWTClaimValidationFailed`, etc.) which the existing error-mapping in worker.js can switch over.
- **Has own tests**: Yes — `test/{jwe,jwk,jwks,jws,jwt}` subdirectories with comprehensive coverage.
- **Verdict**: **PASS**

---

## Cross-port observations

1. **The UMD constraint is the bottleneck.** ESM-first libraries are dominating the 2025–26 npm ecosystem; valibot/zod-v4/yup have all dropped or never shipped UMD bundles. The plan should treat any "no UMD on jsdelivr" finding as a hard FAIL for browser-loaded ports and look at the CJS shape to see whether it's UMD-wrapped or bare. Verify with a quick `head -5` of the dist file — true UMD opens with the `(function (global, factory) { ... })` IIFE.
2. **simple-statistics covers more than Port #1.** `stdev`, `mean`, `linearRegression`, `chiSquaredGoodnessOfFit`, and `kMeans` are already in the bundle — they could replace any future hand-rolled streak-percentile or weekly-trend math without adding KB.
3. **Worker port is the cleanest win.** `jose` is actively maintained (same-day commit), Workers-blessed by its own README, and the migration is mechanical: 60 lines → 8 lines, with stricter security (typed errors, library-vetted timing-safe signature checks).
4. **Superstruct staleness is a known risk worth accepting now and re-evaluating later.** No alternative satisfies (UMD + declarative defaults) today. If the project later relaxes the no-build-step constraint, valibot becomes a stronger candidate.

---

## Recommended winners

- **Port #1**: `simple-statistics@7.8.9` — `https://cdn.jsdelivr.net/npm/simple-statistics@7.8.9/dist/simple-statistics.min.js` — 9.2 KB gz
- **Port #3**: `superstruct@2.0.2` — `https://cdn.jsdelivr.net/npm/superstruct@2.0.2/dist/index.cjs` — 7.4 KB gz — **TENTATIVE** (last commit 2024-10, no maintained alternative meets UMD+defaults requirement)
- **Port #14**: `jose@6.2.3` — `import { jwtVerify, createRemoteJWKSet } from "jose"` (ESM, wrangler-bundled in `ai-proxy/`) — 18 KB gz main, tree-shakes lower; Workers-supported per upstream README
