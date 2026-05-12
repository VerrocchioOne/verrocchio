# Verrocchio — PWA + Build Pipeline Audit

**Date:** 2026-05-12
**Source:** parallel review subagent (PWA + build, lean)
**Status:** authoritative input for master-plan.md Wave 2 (iOS shell + build pipeline) and Wave 4 (App Store Connect submission).

## 1. Executive Summary

- **Works:** SW v34 has correct strategy; manifest standalone-portrait; Capacitor 8.3.3 deps pinned; AI proxy structured with secrets in wrangler.
- **Works:** `.gitignore` excludes secrets (`*.p8`, `*.p12`, `*.mobileprovision`, `.wrangler/`, service-account JSON).
- **Missing:** `ios/` directory, `firebase.json`, `dist/` staging, version bump, SW gate for `capacitor:` scheme.
- **Top blockers:** `webDir: "."` ships repo into IPA; SW will attempt to register on `capacitor://localhost`; no hosting target chosen.

## 2. BLOCKERS

- **PWA-B-01 — `webDir: "."` ships entire repo into .ipa.** Fix: introduce `dist/` staging; set `webDir: "dist"`; add `npm run build` allowlist script.
- **PWA-B-02 — Service worker registers on `capacitor://localhost`.** Gate registration.
- **PWA-B-03 — `ios/` directory does not exist.** `npx cap add ios` (subagent on macOS).
- **PWA-B-04 — No web hosting target chosen.** Blocks locking `AI_BACKEND_URL` and `ALLOWED_ORIGIN`. Recommend Firebase Hosting.
- **PWA-B-05 — `package.json` is `0.0.0`, SW is `v34`.** Align for v1.0.0 + CFBundleShortVersionString.

## 3. HIGH

- **PWA-H-01 — No CSP / security headers.** Add to `firebase.json` headers.
- **PWA-H-02 — Single 1024×1024 apple-touch-icon insufficient.** iOS needs 180/167/152/120 + full AppIcon ladder.
- **PWA-H-03 — `manifest.json` lacks 192 + 512 PNG icons.**
- **PWA-H-04 — No iOS splash images.** Use `LaunchScreen.storyboard`.
- **PWA-H-05 — `limitsNavigationsToAppBoundDomains: false`** — leave for v1.0.
- **PWA-H-06 — Explicit allowlist `dist/` copy** to prevent leaking `tests/`, `docs/`, `scripts/`, `serve.ps1`, `.claude/`.

## 4. MEDIUM

- **PWA-M-01 — `start_url`** — set `start_url: "./?v=1.0.0"` for cache-bust.
- **PWA-M-02 — `theme_color` vs splash bg** verify match.
- **PWA-M-03 — SW `controllerchange` listener** optional update toast.
- **PWA-M-04 — `robots.txt`** add `Disallow: /` if app meant private.
- **PWA-M-05 — `serve.ps1` and `tests/`** must not leak to `dist/`.

## 5. `.gitignore` audit + corrected content

**Verified:** `node_modules/` is NOT excluded today. Add reproducible build artifacts + iOS build output to the policy.

**Corrected `.gitignore` (applied in Wave 2 task W2-T2):**

```gitignore
# gitignore policy: secrets, machine-specific, and reproducible build output.

# ── Secrets ────────────────────────────────────────────────────────────────
.env
.env.*
!.env.example

# Keys, certs, signing material
*.pem
*.key
*.p8
*.p12
*.crt
*.mobileprovision

# Service-account credentials
firebase-adminsdk-*.json
serviceAccountKey.json
secrets.json

# Cloudflare Wrangler local auth + dev vars
.wrangler/
ai-proxy/.dev.vars

# ── Reproducible build artifacts ──────────────────────────────────────────
node_modules/
dist/
ai-proxy/node_modules/

# iOS build output (keep ios/App/ source, ignore generated)
ios/build/
ios/App/Pods/
ios/App/Podfile.lock
ios/DerivedData/

# Archives + installers
*.ipa
*.xcarchive
*.dSYM.zip

# ── Private / machine-specific ─────────────────────────────────────────────
ios/App/App.xcworkspace/xcuserdata/
ios/App/App.xcodeproj/xcuserdata/
android/local.properties
.idea/
.vscode/

# ── OS metadata ────────────────────────────────────────────────────────────
.DS_Store
Thumbs.db
```

## 6. `webDir: "."` fix — `dist/` build script

**Update `capacitor.config.json`:** `"webDir": "dist"`.

**Update `package.json` scripts:**
```json
"build": "node scripts/build-dist.mjs",
"cap:sync": "npm run build && cap sync ios"
```

**Create `scripts/build-dist.mjs`:**
```js
import { mkdir, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = process.cwd();
const DIST = path.join(SRC, 'dist');
const FILES = [
  'index.html',
  'utils.js',
  'manifest.json',
  'service-worker.js',
  'splash-animation.html',
  'apple-touch-icon-1024.png',
  'apple-touch-icon-180.png',
  'apple-touch-icon-192.png',
  'apple-touch-icon-512.png'
];

if (existsSync(DIST)) await rm(DIST, { recursive: true });
await mkdir(DIST, { recursive: true });

for (const f of FILES) {
  const src = path.join(SRC, f);
  if (!existsSync(src)) { console.warn('skip missing:', f); continue; }
  await copyFile(src, path.join(DIST, f));
}
console.log('dist/ built with', FILES.length, 'files');
```

## 7. Service Worker gate for Capacitor

Paste in `index.html` near existing SW registration:

```js
// Skip SW inside Capacitor — native shell serves local assets.
if ('serviceWorker' in navigator
    && location.protocol !== 'capacitor:'
    && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).catch(() => {});
}
```

## 8. Build pipeline runbook (.ipa for App Store)

```bash
# 1. [subagent] Install deps + build dist
npm install
npm run build          # creates dist/

# 2. [subagent on macOS, first time only] Add iOS platform
npx cap add ios

# 3. [subagent] Render full icon ladder + splash
node scripts/render-icons.mjs

# 4. [subagent] Sync web assets into Xcode project
npx cap sync ios

# 5. [founder] Open Xcode, set Team, version, build
npx cap open ios

# 6. [subagent on Mac with creds] Archive
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App -configuration Release \
  -archivePath build/App.xcarchive archive

# 7. [subagent] Export .ipa
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath build/

# 8. [founder] Upload
xcrun altool --upload-app -f build/App.ipa -t ios \
  --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>
```

`ios/ExportOptions.plist`:
```xml
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>XXXXXXXXXX</string>
  <key>uploadSymbols</key><true/>
  <key>signingStyle</key><string>automatic</string>
</dict></plist>
```

## 9. AI Proxy Deploy Runbook

```bash
# 1. [founder] Login (interactive)
cd ai-proxy
npm install
npx wrangler login

# 2. [founder] Put the Anthropic secret
npx wrangler secret put ANTHROPIC_API_KEY

# 3. [subagent] Deploy
npx wrangler deploy
# → outputs https://verrocchio-ai-proxy.<account>.workers.dev

# 4. [subagent] Wire URL into index.html
# Edit AI_BACKEND_URL constant

# 5. [subagent] Lock CORS
# Uncomment ALLOWED_ORIGIN in wrangler.toml
npx wrangler deploy
```

## 10. Firebase Hosting — `firebase.json` starter

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "cleanUrls": true,
    "trailingSlash": false,
    "rewrites": [
      { "source": "/privacy", "destination": "/privacy.html" },
      { "source": "/support", "destination": "/support.html" },
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

Deploy: `npx firebase deploy --only hosting` (founder one-time `npx firebase login`).

## 11. v1.0.0 Version Bump

| File | Field | Value |
|---|---|---|
| `package.json` | `version` | `1.0.0` |
| `service-worker.js` | `CACHE_NAME` | `verrocchio-shell-v35` |
| `manifest.json` | `start_url` | `./?v=1.0.0` |
| `ios/App/App/Info.plist` | `CFBundleShortVersionString` | `1.0.0` (Xcode) |
| `ios/App/App/Info.plist` | `CFBundleVersion` | `1`, increment per TestFlight |

## 12. Cannot automate (founder)

- Apple Developer Program enrollment ($99/yr, 24-48h DUNS).
- Code-signing certificate generation / .p12 export.
- App Store Connect: app record, category, age rating, privacy nutrition labels.
- App Store Connect API key (.p8 + Key ID + Issuer ID).
- TestFlight tester invites.
- Cloudflare `wrangler login` (browser OAuth).
- Anthropic API key value (`wrangler secret put` interactive).
- Firebase Console: App Check, password policy, PITR, demo password rotation.
- Firebase Hosting custom domain DNS (if not staying on `*.web.app`).
