# TestFlight + Apple Developer — Step-by-Step

A focused walkthrough for taking Verrocchio (currently a PWA at v0.2.0) to **TestFlight** so you can install it on your iPhone like a real app and test before submitting to the App Store.

This is the practical "do these steps in order" version. The broader strategic context lives in [APP_STORE_PATH.md](APP_STORE_PATH.md).

**Time estimate:** 3-5 hours of focused work over 2-3 days (the long pole is the Apple Developer account approval, which can take 24-48h).

**You will need:**
- A Mac with macOS 14+ (Xcode 15+ requires it). *Required.*
- An Apple ID linked to a real legal name (used for the developer account).
- A credit card to pay the $99/year Apple Developer Program fee.
- A US tax ID (or your country's equivalent) for the App Store Connect agreement.

---

## Stage 1 — Apple Developer account ($99/yr) — 1 hour active + 24-48h wait

1. Open **https://developer.apple.com/programs/enroll/** in Safari (Apple sometimes rejects Chrome here).
2. Click **Start Your Enrollment**. Sign in with your Apple ID. If you don't have 2-factor enabled, Apple will force you to enable it now.
3. Choose **Individual** (not Organization). Organization requires a D-U-N-S number and proof of entity registration; Individual is fine for a solo app and lets you ship under your real name.
4. Fill in your legal name, address, and phone. **Use your real legal name** — it appears as the "Seller Name" on the App Store unless you also register as an Organization later.
5. Pay the **$99 annual fee** with a credit card. Apple charges immediately; renewal is automatic unless you cancel.
6. Wait. Apple sends a "your enrollment is being processed" email. Approval typically comes back in 24-48h, sometimes faster, sometimes (rarely) up to a week.
7. When approved, you'll get a "Welcome to the Apple Developer Program" email. **Save the membership confirmation PDF** — you'll need the team ID later.

While waiting, do Stage 2.

---

## Stage 2 — Get a Mac ready (parallel to Stage 1) — 30 min

1. Update macOS to 14.0+ (Sonoma or later). System Settings → General → Software Update.
2. Install **Xcode 15+** from the Mac App Store. **It's a 12 GB download** and a slow install — kick this off and let it run.
3. After Xcode installs, open it once, accept the license, and let it finish installing the iOS Simulator and command-line tools. (Xcode → Settings → Platforms → confirm "iOS 17+" is installed.)
4. Install **Node.js 20+** from https://nodejs.org/ (use the LTS pkg installer for macOS).
5. Install Capacitor's CLI globally:
   ```bash
   npm install -g @ionic/cli @capacitor/cli
   ```

---

## Stage 3 — Wrap the PWA with Capacitor — 30 min on Mac

**Already done on Windows (committed to the repo):**
- `npm install --save-dev @capacitor/cli @capacitor/core @capacitor/ios`
- `npx cap init Verrocchio com.verrocchio.app --web-dir=.`
- `capacitor.config.json` configured with `appId`, `appName`, `webDir`, `iosScheme: "capacitor"`, and iOS-specific defaults
- `package.json` has helper scripts: `cap:add:ios`, `cap:sync`, `cap:open`
- `.gitignore` excludes `node_modules/`, `ios/App/Pods/`, `ios/App/build/`, etc.

**You do this on the Mac (after `git pull` + Stage 2):**

### 3.1 Install dependencies

```bash
cd verrocchio
npm install   # picks up @capacitor/* devDependencies from package.json
```

### 3.2 Add the iOS platform (Mac-only — runs `pod install`)

```bash
npm run cap:add:ios
```

This is the step that REQUIRES macOS — it runs `pod install` to fetch the iOS-side CocoaPods. Creates an `ios/` directory with an Xcode project at `ios/App/App.xcworkspace`.

### 3.3 Sync your web assets into the iOS project

```bash
npm run cap:sync
```

Copies `index.html`, `manifest.json`, `service-worker.js`, `utils.js`, `apple-touch-icon-1024.png` (and currently every other file in the repo root) into `ios/App/App/public/`. The .mp3 / .pdf / .md files being copied is harmless inside the bundle. You can clean this up later by setting `webDir` to a build subdir.

### 3.4 Open the iOS project in Xcode

```bash
npm run cap:open
```

Xcode opens `App.xcworkspace`. **Always open the .xcworkspace, not the .xcodeproj** — the workspace knows about CocoaPods dependencies.

---

## Stage 4 — Configure the iOS project in Xcode — 45 min

In Xcode, click the top **App** entry in the left sidebar to open project settings.

### 4.1 General tab

- **Display Name**: `Verrocchio`
- **Bundle Identifier**: `com.verrocchio.app` (must match Stage 3.1)
- **Version**: `0.2.0`
- **Build**: `1` (bump every TestFlight upload)
- **Minimum Deployments → iOS**: `15.0` (covers iPhone 6s+, ~95% of active devices). Bump to `16.4` if you want guaranteed Wake Lock API support since the web app uses it.

### 4.2 Signing & Capabilities tab

- Check **"Automatically manage signing"**.
- **Team**: pick the team with your name.
- Xcode will auto-generate a provisioning profile. If it errors with "no team," wait — Stage 1's approval may not have propagated yet. Try again in 30 min.

### 4.3 Info tab — privacy strings

iOS rejects at submission time if you use any privacy-sensitive API without a usage description. Verrocchio uses the microphone for voice capture. Add:

- **NSMicrophoneUsageDescription**: `Verrocchio uses the microphone for voice capture — speak a journal entry, habit name, or to-do and it transcribes inline.`

If you ship audio playback in the background (the linked-media player on a habit), also add:

- **UIBackgroundModes** → check **Audio, AirPlay, and Picture in Picture**.

### 4.4 Encryption export compliance — skip the question

Add to Info.plist (Xcode → Info tab → + → Custom iOS Target Properties):

- **App Uses Non-Exempt Encryption** = **NO**

Skips the "Are you using encryption?" question on every TestFlight upload.

---

## Stage 5 — Generate the icon set — 30 min

The Capacitor project's icon is currently the default. Swap in your 1024×1024 master.

### Easiest: Capacitor Assets plugin

```bash
npm install --save-dev @capacitor/assets
mkdir resources
cp apple-touch-icon-1024.png resources/icon.png
npx capacitor-assets generate --ios
```

Regenerates the entire icon set in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.

### Manual fallback

App Icon Generator: https://www.appicon.co — feed it the 1024 PNG, download the zip, drag into Xcode → Assets.xcassets → AppIcon.

---

## Stage 6 — First build to your iPhone (sanity check) — 15 min

Before TestFlight, run on a real device once to confirm everything works.

1. Plug your iPhone into the Mac. Trust the computer when prompted.
2. In Xcode, top toolbar device dropdown → pick your iPhone.
3. Click **▶ Run**.
4. **First-time only**: open Settings on the phone → General → VPN & Device Management → trust your developer profile, then re-tap the app.
5. Sign in with your Firebase email/password. Confirm:
   - Sign-in works (Firebase auth)
   - Habits/goals/journal load
   - Voice capture works (microphone permission prompt should appear once)
   - Linked-media playback works
   - Cross-device file sync works (sign in on the desktop too)

Fix anything broken here BEFORE continuing — TestFlight builds take longer to upload.

---

## Stage 7 — Archive + upload to App Store Connect — 30 min

App Store Connect (appstoreconnect.apple.com) is Apple's web dashboard where TestFlight builds live.

### 7.1 Register the app in App Store Connect

1. **My Apps** → **+** → **New App**.
2. Platform: iOS · Name: `Verrocchio` · Primary Language: English (US) · Bundle ID: pick from dropdown · SKU: anything unique (e.g. `verrocchio-ios-001`) · User Access: Full Access.

### 7.2 Build the archive in Xcode

1. Top toolbar device dropdown → switch to **Any iOS Device (arm64)** (NOT a simulator and NOT your specific phone).
2. **Product** → **Archive**.
3. The Organizer window opens automatically when done (2-5 min).

### 7.3 Upload to App Store Connect

1. In Organizer, click **Distribute App**.
2. **App Store Connect** → **Next** → **Upload** → **Next**.
3. Accept defaults. Upload (5-15 min).
4. Apple processes the build for ~10-30 min. Email notification when ready.

### 7.4 Make the build available in TestFlight

1. App Store Connect → **My Apps → Verrocchio → TestFlight tab**.
2. Click the build under "Builds."
3. Fill in:
   - **Test Information**: short description.
   - **What to Test**: list of things you want testers to check.
   - **Sign-In Information**: real test account (since the app requires Firebase login).
4. **Internal Testing** group: you're added by default. Click **+** to add other Apple IDs (up to 100).
5. Each tester gets an email + the TestFlight app on their phone.

---

## Stage 8 — Install via TestFlight on your iPhone — 5 min

1. On the phone: App Store → search **TestFlight** → install.
2. Open the email from Apple → tap the redeem link.
3. TestFlight opens. Tap **Install** next to Verrocchio.
4. The app installs to your home screen with a small orange dot indicating TestFlight.
5. Each build expires after 90 days; you'll get warning emails.

---

## Stage 9 — Bug-fix iteration loop

When you find a bug:

1. Fix it in `index.html`.
2. `npx cap sync ios` to copy fresh assets.
3. Xcode: bump the **Build** number (General tab) by 1. Version stays the same.
4. **Product → Archive → Distribute → Upload** (Stage 7.2-7.3).
5. Testers get an in-app TestFlight notification "v0.2.0 build 2 available."

---

## Stage 10 — When you're ready for the App Store proper

After a week or two of TestFlight feedback and bug fixes, submit for App Store review. The privacy policy URL, screenshots, app description, keywords, age rating, etc. are all in [APP_STORE_PATH.md](APP_STORE_PATH.md) sections 4-15.

---

## Common things that go wrong

| Symptom | Fix |
|---|---|
| "No accounts have been added" in Xcode signing | Xcode → Settings → Accounts → +. Sign in with the Apple ID from Stage 1. |
| "Failed to register bundle identifier" | Bundle id is taken. Pick a different one in capacitor.config.ts and Xcode. |
| App opens with a blank white screen | `webDir` in capacitor.config.ts is wrong, or `npx cap sync ios` wasn't run after a change. |
| Microphone permission never prompts on voice capture | Missing `NSMicrophoneUsageDescription` in Info.plist (Stage 4.3). |
| Build uploads but doesn't appear in TestFlight | Apple's processing takes 10-30 min. If after an hour it's still "Processing," check email for an export-compliance question. |
| TestFlight build expires before you ship | Each TF build is good for 90 days. Upload a new build to refresh. |
| Cross-device sync doesn't work in iOS build | Firebase auth domain isn't authorized for `capacitor://` scheme. Firebase Console → Authentication → Settings → Authorized domains → add `capacitor.localhost` and `localhost`. |
| Storage upload fails on iOS but works in browser | Same cause — also add the bucket's CORS to allow the `capacitor://` origin: `gsutil cors set cors.json gs://verrocchio-1b116.firebasestorage.app` with a `cors.json` allowing the capacitor scheme. |

---

## What's NOT in TestFlight scope

- **Push notifications**: separate Capacitor plugin, separate Apple certificate. Not needed for v0.2.0.
- **In-app purchases / subscriptions**: not in the app today.
- **Sign in with Apple**: only required if you offer Google / Facebook social login. You currently use email/password only.
- **Widgets / Lock Screen**: separate Swift extension target. See [APP_STORE_PATH.md](APP_STORE_PATH.md) section 16.
