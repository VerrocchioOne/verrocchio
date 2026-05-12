# Verrocchio — iOS App Store Readiness Audit

**Date:** 2026-05-12
**Source:** parallel review subagent (iOS App Store, lean)
**Status:** authoritative input for master-plan.md §3 (Wave 2) iOS shell tasks and §5 (Wave 4) App Store Connect submission.

## 1. BLOCKERS

- **IOS-B-01 — `ios/` native project does not exist.** `npx cap add ios` has never been run. Owner: subagent.
- **IOS-B-02 — Account deletion does not purge Firebase Storage blobs at `users/<uid>/content/`.** Apple 5.1.1(v) requires full deletion. Owner: subagent (code edit in index.html ~line 4076).
- **IOS-B-03 — No iOS app icon set.** Only `apple-touch-icon-1024.png`. Xcode 16 asset catalog needs the full ladder (see §4). Owner: subagent (image generation).
- **IOS-B-04 — No iOS launch screen.** Capacitor scaffolds `LaunchScreen.storyboard` on `cap add ios`; replace placeholder with Verrocchio wordmark. Owner: subagent.
- **IOS-B-05 — Info.plist usage-string vacuum.** Confirm Info.plist has no unused permissions strings to avoid future-SDK rejection. Owner: subagent.
- **IOS-B-06 — Demo mode (`verrocchio-demo-1` creating real Firebase users) risks 5.1.1 / 2.3.1 rejection.** Convert to true read-only sandbox OR gate behind production-off flag and provide reviewer credentials in App Review Notes. Owner: founder decision then subagent edit.
- **IOS-B-07 — Privacy Policy URL is absent.** App Store Connect requires a live, public URL. Owner: subagent (host privacy policy at Firebase Hosting `/privacy`).
- **IOS-B-08 — Apple Developer Program enrollment + signing certs.** Owner: founder-only ($99/yr, 24-48h DUNS).
- **IOS-B-09 — Bundle version + marketing version unset.** Set `CFBundleShortVersionString: 1.0.0`, `CFBundleVersion: 1`. Owner: subagent (post-cap-add).
- **IOS-B-10 — App Store screenshots not produced.** Min 6.7" iPhone set required. Owner: subagent (Playwright/simulator) + founder approval.

## 2. HIGH

- **IOS-H-01 — `limitsNavigationsToAppBoundDomains: false`** — leave for v1.0; document domains needed.
- **IOS-H-02 — Hardcoded Firebase web config** is acceptable; call out in App Review Notes.
- **IOS-H-03 — `AI_BACKEND_URL = null` dead AI buttons** — strip / feature-flag off before submission.
- **IOS-H-04 — Service worker conflicts with WKWebView** — gate registration under `capacitor://`.
- **IOS-H-05 — Account deletion has no password-reset fallback.** Add "send password reset, return to delete."
- **IOS-H-06 — `NSAppTransportSecurity` default is fine** — verify no `http://` URLs slip through.
- **IOS-H-07 — App icon must have no alpha channel and no rounded corners.**
- **IOS-H-08 — Portrait-only lock in manifest must match `UISupportedInterfaceOrientations` in Info.plist.**
- **IOS-H-09 — iPhone-only at launch** (`TARGETED_DEVICE_FAMILY = 1`) — avoids iPad layout-review failures.
- **IOS-H-10 — TestFlight cycle mandatory before App Store push.**

## 3. MEDIUM

- **IOS-M-01 — Defer crash reporting** (no SDK at launch).
- **IOS-M-02 — Add a "Contact Support" mailto link in-app.**
- **IOS-M-03 — Add `NSHumanReadableCopyright`** in Info.plist.
- **IOS-M-04 — `webDir: "."` ships repo into IPA.** Switch to `dist/` (see PWA report PWA-B-01).
- **IOS-M-05 — Add `@capacitor/status-bar`** plugin and match brand color.
- **IOS-M-06 — Disable SW under WKWebView** (gate in index.html).

## 4. Asset inventory

**App icon set (Xcode 16 asset catalog):**
- 1024×1024 — App Store marketing (no alpha)
- 180×180 — iPhone @3x (60pt)
- 120×120 — iPhone @2x (60pt) + Spotlight @3x (40pt)
- 80×80 — Spotlight @2x (40pt)
- 87×87 — Settings @3x (29pt)
- 58×58 — Settings @2x (29pt)
- 60×60, 40×40, 29×29 — 1x variants (optional in single-size mode)

**Launch screen:** `LaunchScreen.storyboard` (auto-generated). Solid `#f8f7f4` background + centered Verrocchio logo at 200pt.

**App Store Connect screenshots:**
- 6.7" iPhone (15 Pro Max / 14 Plus) — **1290×2796 px portrait** — REQUIRED
- 6.1" iPhone — 1170×2532 — optional
- 12.9" iPad Pro — only if iPad supported (recommend NOT)
- 3–10 screenshots per device, no transparency, no rounded corners in the image itself

## 5. Capacitor + xcodebuild runbook

```bash
# On a Mac with Xcode 16+ and an Apple Developer account signed in
cd /path/to/verrocchio
npm install
npx cap add ios                                # creates ios/App/App.xcworkspace
# Drop generated icon set into ios/App/App/Assets.xcassets/AppIcon.appiconset/
# Drop LaunchScreen assets / edit storyboard in Xcode
npx cap sync ios                               # copies web assets + plugins

# Open once in Xcode to set signing team, bundle version, capabilities
npx cap open ios                               # ⚠ FOUNDER: select Team, set version 1.0.0 / build 1

# Headless archive + export
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive                                       # ⚠ requires signing identity in keychain

xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build/ipa \
  -exportOptionsPlist ExportOptions.plist       # ⚠ ExportOptions.plist needs teamID — FOUNDER

# Upload to App Store Connect
xcrun altool --upload-app -f build/ipa/App.ipa \
  -t ios --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>  # ⚠ FOUNDER App Store Connect API key
```

## 6. App Store Connect metadata draft

- **Title (30):** `Verrocchio — Habits & Goals` (27)
- **Subtitle (30):** `Daily reflection, gentle habits` (30)
- **Keywords (100):** `habit,tracker,goal,journal,reflection,routine,daily,wellness,mindful,streak,planner,growth`
- **Promotional Text (170):** `Build habits that fit your real life. Track streaks, journal, and review goals — quietly, in one calm space. No ads, no tracking.`
- **Description (4000):** orchestrator drafts and locks during Wave 4 task W4-T2.
- **Primary Category:** Health & Fitness
- **Secondary Category:** Lifestyle
- **Age Rating:** 4+ (UGC: No / private-only; Web Access: No)
- **Support URL:** `https://verrocchio-1b116.web.app/support`
- **Privacy Policy URL:** `https://verrocchio-1b116.web.app/privacy`
- **Marketing URL (optional):** `https://verrocchio-1b116.web.app`

## 7. Apple Sign-In (4.8) decision

**Not required.** Triggers only when third-party/social login is offered. Firebase email+password is first-party and does not invoke 4.8.

## 8. Account-deletion (5.1.1(v))

Current flow re-auths with password then deletes Auth user. Gaps:
1. Storage blobs at `users/<uid>/content/` are NOT deleted — submission blocker (IOS-B-02).
2. No password-reset fallback for forgotten password (IOS-H-05).

Fix lives in master-plan §2 Wave-1 task **W1-T4**.

## 9. App-Bound Domains

`limitsNavigationsToAppBoundDomains: false` — leave for v1.0. Revisit in v1.1 once domain set is stable.
