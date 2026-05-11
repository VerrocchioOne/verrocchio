# Verrocchio → App Store path

A practical punch list for taking the current PWA to a real iOS App Store submission. This is the work that exists *outside* the design review — it's metadata, accounts, packaging, and review compliance, not source-level rework.

The honest framing: a file split (`theme.css` / `firebase-init.js` / `app.js`) helps maintainability before and after submission. It is **not** an App Store requirement, so it's deferred. Below is what *is* required, in roughly the order you'll hit it.

---

## 1. Wrapper choice — Capacitor

Capacitor is the right call for this codebase:
- The app is already a self-contained `index.html` + manifest + service worker.
- Capacitor uses WKWebView with `capacitor://` scheme — no `file://` issues.
- Service workers are supported in WKWebView (iOS 14+), so `service-worker.js` keeps working.
- React is loaded via UMD CDN; Capacitor doesn't care, you just bundle the static files.

PWABuilder is a faster alternative that produces a similar Capacitor project. Either works; Capacitor gives more long-term control (push notifications, background tasks, native plugins).

**Action:** `npm install -g @ionic/cli && cap init Verrocchio com.verrocchio.app && cap add ios`. Copy `index.html`, `manifest.json`, `service-worker.js`, `utils.js`, `apple-touch-icon-1024.png`, and the two audio files into the Capacitor `web/` directory.

## 2. Apple Developer account — $99/year

Required before anything else. Submission, TestFlight, and code-signing all flow through this. If the user doesn't have one yet, this is the long-pole item (account approval can take 24–48h, sometimes longer for individual accounts).

## 3. Bundle identifier + signing

- Pick a stable bundle id (`com.verrocchio.app` or `com.<owner>.verrocchio`).
- Generate a Distribution certificate + App Store provisioning profile in the Apple Developer portal.
- In Xcode: open the Capacitor-generated `ios/App/App.xcworkspace`, set the team, set the bundle id, set version + build number.

## 4. Icon set

The marketing icon (1024×1024) is in place: `apple-touch-icon-1024.png`. iOS native builds also need a full icon set in the asset catalog:

| Size | Use |
|---|---|
| 1024×1024 | App Store marketing |
| 180×180   | iPhone home screen @3x |
| 120×120   | iPhone home screen @2x, Spotlight @3x |
| 167×167   | iPad Pro home @2x |
| 152×152   | iPad home @2x |
| 76×76     | iPad home @1x |
| 60×60     | Settings @2x/@3x |
| 40×40     | Spotlight @2x |
| 29×29     | Settings @1x |

**Action:** feed the existing 1024 master through any icon-set generator (Capacitor Assets plugin, App Icon Generator, Asset Catalog Creator). The raster source you already have is enough.

**Verify:** the current 1024 PNG is `apple-touch-icon-1024.png` — confirm it has a safe zone (~10% padding around the brand mark) so the maskable variant doesn't crop the tip of the pyramid on circular masks. If not, regenerate with padding.

## 5. Launch screen

The Ink-V splash plays *after* the OS launch image. The OS launch must be a **static** brand mark, not the animated splash, otherwise the user sees a flash of static + animated (jarring).

Capacitor ships a `LaunchScreen.storyboard` with a centered image. Drop in a 1024 cream-background PNG of the wordmark + pyramid lockup — same lockup the splash ends with — so the OS launch dissolves seamlessly into the animated splash.

## 6. Privacy policy URL — **required**

App Store Connect requires a public URL. Currently no policy exists in the repo. The policy must cover:

- **Email Address** — collected at sign-up via Firebase Auth.
- **User Content** — habits, goals, journal entries, reflections, audio listens. Stored in Firestore at `users/<uid>/...` (rules already lock this to the owner — see `firestore.rules`).
- **Identifiers** — Firebase UID; no IDFA, no advertising IDs.
- **Third parties** — Google Firebase (auth + database), Cloudflare (AI proxy at `ai-proxy/worker.js`), Anthropic (the proxy forwards prompts to api.anthropic.com — disclose this).
- **No tracking** — confirm no analytics, no ad networks, no SDKs that collect Usage Data.

Host on a simple static page (Cloudflare Pages, GitHub Pages, Notion). Link from the auth screen footer and Settings.

## 7. App Store privacy nutrition labels

In App Store Connect → App Privacy:

| Data type | Linked to user | Used for tracking | Purpose |
|---|---|---|---|
| Email Address | Yes | No | App Functionality (auth) |
| User Content (text) | Yes | No | App Functionality |
| Audio recordings | No (none recorded) | — | — |
| Identifiers (UID) | Yes | No | App Functionality |
| Usage Data | — | — | None collected |

The two `.mp3` files in the repo are *played*, not *recorded*, so audio recording is "Not Collected."

## 8. Sign-in with Apple — **not yet required**

Apple Guideline 4.8 only triggers if the app offers a third-party social login (Google, Facebook, Twitter). Verrocchio currently uses Firebase email/password only — no social provider. **Status: not required.** If you ever add Google sign-in, you must also add Sign in with Apple.

## 9. Encryption export compliance

The app uses HTTPS only, no custom crypto. In `Info.plist`:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

This skips the export-compliance question on every TestFlight build.

## 10. Background audio

The repo includes:
- `Grounding Guided Morning Meditation 10 Minutes.mp3`
- `Energy Breathwork 6 Min Breathing to Activate Your Energy Naturally (3 Rounds).mp3`

If these are intended to play with the screen off / app backgrounded, add to `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array><string>audio</string></array>
```

If foreground-only, no declaration needed. **Decision required from the user.**

⚠ **Licensing risk:** confirm these mp3s are owned, licensed, or royalty-free. App Store reviewers don't audit content rights, but a copyright complaint post-submission removes the app. Note the source / license alongside each file.

## 11. Service worker behavior in Capacitor

`service-worker.js` precaches `index.html`, `utils.js`, `manifest.json`, etc. and runtime-caches CDN scripts (React, Firebase, Chart.js, Google Fonts).

In a Capacitor wrapper, this is largely **redundant** — Capacitor serves all bundled assets natively and they're already on disk. The CDN fetches still benefit from the SW cache. No action needed; just be aware that the precache adds to the first launch but doesn't break anything.

If you want to slim the wrapper: have Capacitor host the React/Firebase scripts as bundled files instead of CDN, then delete the service worker entirely on iOS builds.

## 12. AI proxy — already locked

`ai-proxy/worker.js` requires a Firebase ID token before forwarding to Anthropic. Good. Two follow-ups:
- Set a per-user rate limit on the Worker (currently any signed-in user can spam it — KV-backed counter on `auth.uid` is a 30-line addition).
- Document the AI processing in the privacy policy (item 6).

## 13. App Store metadata

You'll need:
- **App name** (30 chars): "Verrocchio"
- **Subtitle** (30 chars): something like "Habits, goals, daily ritual"
- **Promotional text** (170 chars, can update without resubmitting): write the elevator pitch
- **Description** (4000 chars): full pitch — focus on the daily ritual + ladder from habits to goals
- **Keywords** (100 chars, comma-separated): habits, goals, journal, productivity, mindfulness, streak, reflection, meditation, breathwork, planner
- **Support URL** + **Marketing URL** (can be the same landing page)
- **Screenshots:** required sizes are 6.7" iPhone (1290×2796) and 6.5" iPhone (1284×2778). 5–10 screenshots each. Use real production data, not lorem.

## 14. Build + TestFlight

1. `npm run build` (or whatever assembles the static files).
2. `npx cap sync ios`.
3. Open `ios/App/App.xcworkspace` in Xcode.
4. Product → Archive.
5. Upload to App Store Connect via Organizer.
6. Submit to TestFlight, install on a real iPhone, run through every screen with a fresh Firebase user.
7. Once happy: submit for App Store review.

First review typically takes 24–72h. Common rejections to pre-empt:
- Missing privacy policy URL → handled in #6.
- Crashes on launch on a clean install → test offline first-run.
- "App appears incomplete" if any tab is empty — make sure there's some seed content / tutorial state.

## 15. Post-submission

- Set up App Store Connect "App Analytics" (optional, no SDK needed — Apple aggregates).
- Plan version 1.1: bug-fix turnaround on real reviewer feedback.

---

## 16. Widgets + Lock Screen (iOS 16+) — separate workstream

**Reality check:** WebKit/PWAs cannot ship iOS widgets. WidgetKit is Swift-only and runs in a separate extension process. To ship widgets you need a small **native Swift extension target** alongside the Capacitor wrapper. The web app stays the main UI; the widget is a separate Swift target that reads shared data via App Group user defaults or shared keychain.

### What you can ship with one extension

| Surface | Sizes | Use |
|---|---|---|
| Home Screen widget | small / medium / large | "Today" — top 3 habits + count of how many done today |
| Lock Screen widget | circular / rectangular / inline | Quick daily streak, % done today, or single primary habit |
| Dynamic Island Live Activity | compact / expanded | Active meditation / breathwork session timer when an audio is playing |
| Control Center toggle (iOS 18+) | one-shot button | "Mark today's morning ritual reviewed" |

### Architecture pattern

```
Capacitor app (web UI)
  ↓ writes via App Group UserDefaults
shared container ("group.com.verrocchio.app")
  ↓ read by
Widget extension (Swift, WidgetKit, no JS)
  ↓ writes user actions back via Deep Link
Capacitor app handles deep link → updates Firestore
```

Widgets cannot make network calls reliably (iOS aggressively backgrounds them). They read pre-computed snapshots the main app writes when it saves. Plan for a "widget snapshot" object the web app writes on every `save()` containing only what each widget surface needs:

```json
{
  "lastUpdated": "2026-05-10T12:30:00Z",
  "today": {
    "habitsTotal": 12,
    "habitsDone": 7,
    "streakDays": 18,
    "primaryHabit": { "id": "...", "text": "Morning meditation", "done": true }
  }
}
```

### Concrete next steps

1. **Add the `WidgetExtension` target in Xcode** to the Capacitor-generated project. (~15 min in Xcode UI; produces `WidgetExtension/` folder with one Swift file per widget kind.)
2. **Configure App Group** in Apple Developer portal + both targets' entitlements (`group.com.verrocchio.app`). Both the Capacitor main app AND the widget extension must opt in to the same group.
3. **Bridge plugin: write snapshot from JS to App Group**. Use Capacitor Preferences plugin with the App Group identifier OR write a tiny Swift plugin that wraps `UserDefaults(suiteName: "group.com.verrocchio.app")`. Trigger from inside `save()` whenever data changes meaningfully.
4. **Build the widgets in Swift**. Each widget kind = one `Widget` struct + `TimelineProvider` that reads the shared UserDefaults. Keep visuals simple — Lock Screen widgets are stark by design.
5. **Live Activity for audio playback**. When the user plays a linked-media audio (BgAudio or LinkedMediaPlayer), start a Live Activity with the title + remaining time. End it on audio end. Requires `ActivityKit` (iOS 16.1+) and a separate target.
6. **Deep links back into the app**. Widget tap → `verrocchio://habit/<id>` → Capacitor handler → Open the right tab + scroll to habit row.

### Widget design constraints worth knowing now

- **Lock Screen text** is monochrome (just opacity tints of a single accent color picked by the OS based on wallpaper). Don't design with brand greens — design for contrast against any background.
- **Refresh frequency** is OS-budgeted. Plan for ~15-min staleness; the app's main save() write keeps the snapshot fresh whenever the user has the app open.
- **No interactive content inside widgets** (iOS 17+ added limited interactivity, but it's a `Button` calling an `AppIntent` — single tap only, no scrolling). Habit toggle from a widget is feasible; habit list scroll is not.
- **AppIntents** (iOS 16+) let you expose habit-toggle and quick-log as Siri Shortcuts. Cheap to add once the snapshot-write path exists.

### Estimated effort

- Snapshot plugin + App Group setup: **half-day**.
- One Home Screen widget (today's count): **half-day**.
- One Lock Screen widget (streak): **2-3 hours**.
- Live Activity for audio: **1-2 days** (state management is the hard part).
- Deep-link handler in the web app: **2-3 hours**.

Total to ship widgets + lock screen + audio Live Activity: **~1 week** of focused Swift work after the App Store submission lands.

---

## What was already done in this branch (no further work needed)

- `manifest.json` — id, scope, lang, dir, categories, separated `any` + `maskable` icons.
- `index.html` `<head>` — `mobile-web-app-capable`, `format-detection` (suppresses iOS auto-linking inside journal text), light + dark `theme-color`.
- Firestore rules — already locked to per-user reads/writes.
- Storage rules — owner-scoped per-UID under `users/{uid}/content/...` with 100 MB per-file cap (deployed via Firebase Console).
- AI proxy — already requires Firebase ID-token auth.
- Apple touch icon — 1024×1024 raster present.
- Service worker (v10) — network-first for HTML, cache-first for static assets, runtime-cache for CDN scripts.
- Firebase Storage cross-device file sync (My Content). Auto-migration of legacy base64 entries on first load.
- Owner allowlist (`FILE_UPLOAD_ALLOWLIST`) gates file upload UI; non-owner accounts can attach URL links only.
- Voice-to-text durability: 30-min cap, cross-session dedupe, tuned relaunch debounce on iOS Safari silence.
- Linked-media player with auto-complete: tapping a habit's ▶ chip plays linked audio; on audio end the habit auto-checks (skips if user already marked done/missed).
- My Content as Spotify-style library: search + type chips + sort + grid of thumbnail cards + inline detail panel.
- Display name as first-class concept: file's title in My Content drives every linked-content surface.
- Single "Link to" button in detail panel with sub-menu (Habits / Goals / To-dos / General).

## Current app version: v0.2.0 (May 2026)

Key features as of v0.2.0:
- Daily ritual home tab with morning briefing, intention, yesterday review, weekly review.
- Habits with frequency, target, sub-units, streaks, sparkline + week-dot visualizations.
- Goals with SMART form, area-of-life types, history, follow-up successor goals, momentum chart.
- To-dos with section filters (today / this week / this month / later / no-due) and goal linkage.
- Journal with mood, tag, voice capture; AI insights via Cloudflare Worker proxy.
- Habit/goal/todo/journal voice capture: hold mic, speak, pick where the transcript lands.
- My Content library (audio, video, image, PDF, link) with cross-device sync via Firebase Storage.
- Linked-media play-to-complete: link an mp3 to a habit, tap habit ▶ chip, audio plays, habit auto-completes.
- Achievements (XP, tiers, categories), demo mode with seeded personas, account management (sign out / delete account / wipe data), iCalendar export of habits, plain-text summary export.
- PWA install + service worker + offline-capable read.

## Desktop browser (URL-based laptop version) — current state

The PWA is the same URL on phone and desktop — there's no separate
build. As of v0.2.0 (SW v18) the layout constraints are:

- Phone (default): single column, full viewport width.
- Tablet / small laptop (`min-width: 900px`): scrolling content
  centered with `max-width: 760px`, side gutters of 24px so the
  column doesn't hug the screen edge. Header + bottom nav inner
  rows centered to match.
- Wide desktop (`min-width: 1200px`): same shape, `max-width: 920px`
  for slightly more breathing room.

This is intentionally a CSS-only pass — the same `index.html` ships
to phone and laptop, the React tree is identical, and the layout
adapts via media queries on existing class names (`.fade-in` for tab
content, `.lg[style*="sticky|fixed"]` for header/nav). No JSX changes,
no Capacitor concerns, no new build target.

What's NOT desktop-optimized yet (deferred follow-ups):
- Habits tab: still single-column even on a 1440 screen. A 2-column
  grid for habit cards on `min-width: 1100px` would let users see
  ~30 habits without scrolling. Would need to disable the swipe
  gesture on hover-pointer devices (`@media (hover: hover)`) since
  side-by-side cards make horizontal swipe ambiguous.
- Goals tab: same. Goals are taller than habits so 2-up needs more
  thought (gap, alignment, expanded-card behavior).
- Sidebar nav option: bottom-fixed nav still works on laptop, but a
  left sidebar would feel more native. Would replace the bottom nav
  via `@media (min-width: 1100px)`.
- Calendar modal: already full-screen overlay; reads fine on
  desktop without changes.
- My Content grid: already responsive (`auto-fill, minmax(96px, 1fr)`)
  so it gracefully expands on wide screens.

## Out of scope for App Store readiness (defer)

- File split into `theme.css` / `firebase-init.js` / `app.js`. Helps maintenance, doesn't help submission.
- Tightening the substring-override CSS layer further (real fix is migrating inline styles to `var(--c-tint-*)` tokens — already started, can be incremental).
- Performance optimizations beyond Chart.js lazy-load + linkedContentIndex memo (already done).
- A11y batch 2: ~95 form inputs without labels, modal focus traps. Fixable in one sweep before public launch but not a reviewer block.
- Email-in for content (PDF emailed to the user's address shows up in My Content) — needs paid inbound email infra. Deferred.
