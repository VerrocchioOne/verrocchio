# Verrocchio — Founder Handoff

**Purpose:** Everything the founder must do personally, separated from the subagent-pure work in [docs/master-plan.md](master-plan.md).

**When to read:** The subagent work in `master-plan.md` runs end-to-end without waiting on this document. You can start any phase here at any time — the two streams are intentionally independent. The only real dependency is **Phase F (Sign + Archive + Upload)**, which requires the subagent's iOS shell prep to be done first.

**Why these tasks aren't subagent-executable:**

- Apple's developer ecosystem is tied to a verified human Apple ID — enrollment, signing certificates, ASC submission, and TestFlight invites all require the founder to be logged in personally.
- Firebase Console has a few settings that don't have an API (email enumeration protection, password policy).
- Legal identity decisions (entity name, contact email) require a human.

Everything else — code changes, builds, simulator testing, screenshots, regression tests, documentation drafts — is in the master plan and runs without you.

---

## Phase A — Apple Developer setup (one-time, ~1 hour active + 24-48h wait)

> **🟡 In flight 2026-05-13** — D-U-N-S application form submitted to Dun & Bradstreet. Free DUNS issuance can take ~30 business days (expedited paid path is ~5 days); Apple Developer Program enrollment as an Organization can't complete until the DUNS Number lands. Steps A1–A4 are blocked. Phases B, C, C2, D are not Apple-dependent and can proceed in parallel.
>
> **🟢 Pre-staged for the post-DUNS Mac session (2026-05-14):** while DUNS processes, two assets are now ready to drop into Xcode the moment `cap add ios` runs:
> - **[ios/PrivacyInfo.xcprivacy](../ios/PrivacyInfo.xcprivacy)** — full app privacy manifest. Drag into the Xcode App target after `cap add ios`. Header comment in the file describes the copy-into-Xcode steps.
> - **[ios/AppIcon.appiconset/](../ios/AppIcon.appiconset/)** — full app-icon asset catalog with all 9 required pixel sizes (20pt/29pt/40pt/60pt @ 2x and 3x, plus the 1024 marketing). After `cap add ios`, replace the auto-generated `ios/App/App/Assets.xcassets/AppIcon.appiconset/` with this directory. **One manual check required:** verify `AppIcon-1024.png` has no alpha channel and no rounded corners before App Store submit — Apple will reject otherwise. If it does, flatten via Preview's Export as PNG with "Alpha" unchecked, or run `sips -s format png --setProperty hasAlpha no AppIcon-1024.png` on the Mac.

| Step | What | Where | Time |
|---|---|---|---|
| A1 | Enroll in Apple Developer Program ($99/yr; DUNS verification can take 24-48h on first enrollment **once you have a DUNS Number — see DUNS application status above**) | developer.apple.com → Account → Membership | 30 min active + wait |
| A2 | Note your Team ID (10-character alphanumeric) | developer.apple.com → Membership → Team ID | 1 min |
| A3 | Generate App Store Connect API key (.p8 file + Key ID + Issuer ID) | App Store Connect → Users and Access → Integrations → App Store Connect API | 5 min |
| A4 | Save the `.p8` file to `~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8` (macOS) | local machine | 1 min |

**Output:** Team ID + Key ID + Issuer ID. Save these as environment variables or note them somewhere durable — you'll paste them into a couple of places in Phase F.

---

## Phase B — Privacy & legal fill-ins (~5 min)

**COMPLETE** as of 2026-05-12.

Both the contact email (`support@verrocchio.app`) and the legal entity (`Verrocchio LLC`) are already substituted by the subagent into `docs/PRIVACY_POLICY.md` and `ios/App/App/Info.plist` (the NSHumanReadableCopyright string will read `© 2026 Verrocchio LLC` when the iOS shell is generated in W2-T4).

Founder action remaining for this phase:
- Review and edit `docs/APP_STORE_CONNECT_VALUES.md` once the subagent generates it in Wave 3 — the ~4000-char description draft is the only piece needing your final voice.

---

## Phase C — Firebase Console settings (~10 min)

These are Console-only toggles with no public API. Steps C3 and C4 can optionally be delegated to the subagent if you provide credentials (see "Optional delegation" below); C1, C2, C5, C6 are Console-only.

| Step | What | Where |
|---|---|---|
| C1 | Enable "Email enumeration protection" | Firebase Console → Authentication → Settings → User actions |
| C2 | Set Password Policy minimum length to 8 characters | Firebase Console → Authentication → Settings → Password policy |
| C3 | Rotate the four demo account passwords (the literal `verrocchio-demo-1` is in git history and was leaked). After rotation, set the new value via `DEMO_PASSWORD` env var when the subagent runs `npm run build`. | Firebase Console → Authentication → Users → each demo user → Reset password |
| C4 | Optional: enable Firestore Point-In-Time Recovery (billed) | Firebase Console → Firestore → Settings |
| C5 | Optional: restrict the public Firebase API key by HTTP referrer + iOS bundle ID | Google Cloud Console → APIs & Services → Credentials |
| C6 | Optional: enroll in Firebase App Check (Console + reCAPTCHA v3 key creation). Once enabled, the subagent can wire the SDK on next iteration. | Firebase Console → App Check |

---

## Phase C2 — Firebase Hosting + Cloudflare DNS for custom domain `verrocchio.app` (~15 min active + 30-60 min cert wait)

The desktop / web build moves OFF GitHub Pages onto Firebase Hosting (your existing `verrocchio-1b116` Firebase project). Reasons: integrates with Firebase Auth, scales generously, supports SPA path-routing for the planned per-user URLs (`verrocchio.app/USERNAME`), and consolidates the public-facing stack.

| Step | What | Where |
|---|---|---|
| C2-1 | Run `npx firebase login` (one-time browser OAuth) | terminal on your machine |
| C2-2 | Run `npx firebase init hosting` from repo root. Public dir: `dist`. Single-page app: `Yes` (rewrites all paths to `/index.html` — critical for per-user URL routing). Don't overwrite the existing `firebase.json` if W3-T15 has already created one. | terminal |
| C2-3 | Run `npm run build && npx firebase deploy --only hosting` — first deploy lands at `https://verrocchio-1b116.web.app`. Verify the site loads there. | terminal |
| C2-4 | In Firebase Console, add `verrocchio.app` as a custom domain | Firebase Console → Hosting → Add custom domain |
| C2-5 | Firebase displays a TXT record for ownership verification. Add it in Cloudflare DNS (record type TXT, name = `@`, value = the string Firebase gave you). Proxy status: **DNS only / gray cloud**. | Cloudflare Dashboard → verrocchio.app → DNS |
| C2-6 | Wait ~5 min for Firebase to verify, then it shows two A records for `verrocchio.app`. Add them in Cloudflare DNS (record type A, name = `@`, the two IPv4 addresses Firebase provides). Set Proxy status to **DNS only / gray cloud, NOT orange** — Cloudflare proxying interferes with Firebase's auto-HTTPS cert provisioning. | Cloudflare DNS |
| C2-7 | Optional: add `www.verrocchio.app` as a second custom domain in Firebase + CNAME `www` → `verrocchio-1b116.web.app` in Cloudflare (gray cloud) | both |
| C2-8 | Wait ~15-60 min for Firebase to provision the SSL certificate. Until then, `https://verrocchio.app` returns a cert warning. Once provisioned, the site is live. | — |
| C2-9 | (Optional) Disable GitHub Pages: GitHub repo → Settings → Pages → "Unpublish site". The repo stays on GitHub for source control — only the public hosting moves. | GitHub repo settings |

After C2-8, the URLs `https://verrocchio.app/`, `https://verrocchio.app/privacy`, and `https://verrocchio.app/support` all resolve and serve the SPA. The default `verrocchio-1b116.web.app` continues to work too.

**Why Firebase Hosting over GH Pages / Cloudflare Pages:**
- Founder explicitly opted out of GitHub Pages for the public web build.
- Firebase Hosting integrates with the existing Firebase project (`verrocchio-1b116`) — no new vendor relationships, single billing surface.
- Auth domain matches hosting domain → no popup-blocker issues with Firebase Auth flows.
- SPA `rewrites: "**" → "/index.html"` is built-in — required for the planned `verrocchio.app/USERNAME` per-user URL pattern.
- Scales to tens of thousands of users on the Spark (free) tier; pricing kicks in at >10 GB/month bandwidth.

---

## Phase D — Cloudflare AI proxy (skip for v1.0; required for v1.1 AI features)

| Step | What | Where |
|---|---|---|
| D1 | `npx wrangler login` (browser OAuth) — or generate a Cloudflare API token | terminal |
| D2 | `cd ai-proxy && npx wrangler secret put ANTHROPIC_API_KEY` (paste your Anthropic key) | terminal |
| D3 | The subagent will then run `npx wrangler deploy` and update `AI_BACKEND_URL` in `index.html` | — |

**v1.0 ships with AI features disabled** (`AI_BACKEND_URL = null`, AI buttons hidden by the feature flag from W1-T10). Phase D becomes relevant only when you want to ship the v1.1 AI re-enable.

---

## Phase E — App Store Connect setup (~30-40 min)

| Step | What | Where |
|---|---|---|
| E1 | Create the app record. Platform: iOS. Name: `Verrocchio`. Primary Language: English (US). Bundle ID: `com.verrocchio.app`. SKU: `verrocchio-ios-1`. User Access: Full Access. | App Store Connect → My Apps → New App |
| E2 | Note the numeric Apple ID assigned to your new app — paste it into `.claude/state/founder-handoff.json` under `asc_apple_id` so the subagent can reference it in upload scripts. | — |
| E3 | Paste metadata values from `docs/APP_STORE_CONNECT_VALUES.md` (subagent generates this) into App Information fields: title, subtitle, keywords, description, promotional text, category, age rating, support URL, privacy URL, marketing URL, copyright. | ASC → My Apps → Verrocchio → App Information |
| E4 | Complete the App Privacy questionnaire using the checklist at `docs/APP_STORE_PRIVACY_LABEL.md` (subagent generates from the privacy audit). | ASC → My Apps → Verrocchio → App Privacy |
| E5 | Answer the export compliance questionnaire (no encryption custom code; HTTPS via Firebase only — "No" to most prompts). | ASC → 1.0 Prepare for Submission → Export Compliance |

---

## Phase F — Sign + Archive + Upload (~15 min, after subagent completes the master plan)

Prerequisites:
- Subagent has completed all 3 waves of the master plan (`ios/` project exists with all configuration; `npm test` green; physical-device smoke prep done).
- Phase A complete (Team ID + ASC API key in hand).
- Phase B complete (Info.plist `{{ENTITY}}` filled in).

| Step | What | Where |
|---|---|---|
| F1 | Open `ios/App/App.xcworkspace` in Xcode 16+ | `npx cap open ios` from repo root |
| F2 | App target → Signing & Capabilities → tick "Automatically manage signing" → select your Team | Xcode UI |
| F3 | App target → General → confirm Version `1.0.0`, Build `1` (subagent set these) | Xcode UI |
| F4 | Replace `{{TEAM_ID}}` placeholder in `ios/ExportOptions.plist` with your real Team ID | local file edit |
| F5 | Archive: Product → Archive (or terminal command below) | Xcode or terminal |
| F6 | Export Archive + Upload: in Organizer, select the archive → Distribute App → App Store Connect → Upload | Xcode Organizer |

Terminal alternative for F5 + F6:
```bash
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
  -archivePath build/App.xcarchive archive

xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportOptionsPlist ../ExportOptions.plist \
  -exportPath build/

xcrun altool --upload-app -f build/App.ipa -t ios \
  --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>
```

**Verify:** App Store Connect → TestFlight tab shows "Processing" → "Ready to Test" within 15-30 minutes. No upload-time validation errors.

---

## Phase G — TestFlight beta + Submit (varies, 24-72h beta + 24-48h review)

| Step | What | Where |
|---|---|---|
| G1 | Install TestFlight on your iPhone, install the build, run the physical-device smoke checklist below | TestFlight app |
| G2 | If smoke audit surfaces issues → log them in `.claude/memory/founder-feedback-tf-1.md`; subagent dispatches fix-mode tasks and produces TF #2 | — |
| G3 | Invite 1-3 external testers; gather feedback for 24-72h | ASC → TestFlight → External Testing |
| G4 | When ready: Submit for Review | ASC → My Apps → Verrocchio → 1.0 → Submit for Review |
| G5 | Wait for Apple review (typically 24-48h). Apple either approves (Ready for Sale) or requests changes. | — |
| G6 | If Apple requests changes → log feedback in `.claude/memory/apple-review-feedback.md`; subagent dispatches fixes; resubmit. | — |

### Physical-device smoke checklist (G1)

For each of the 5 tabs (Brief, Habits, Todos, Reflection, Goals) + Profile modal + auth screen + every modal/sheet you can reach:

- [ ] Top header doesn't overlap notch / Dynamic Island.
- [ ] Bottom nav doesn't overlap home indicator (you can swipe to home without tapping a tab).
- [ ] Sticky CTAs (e.g. "Add habit") aren't covered by the keyboard.
- [ ] Modal close buttons in the corners are reachable with one thumb.
- [ ] Pull-to-refresh / scroll behavior feels native.
- [ ] Dark mode toggles correctly per system setting.
- [ ] Sign-up + Sign-in + Forgot Password flows all work end-to-end.
- [ ] Delete Account flow works, including the "I forgot my password" branch.
- [ ] Demo persona buttons are NOT visible (production build).
- [ ] AI buttons are NOT visible (v1.0).

---

## Founder time budget — total ~2-3 hours active

Most can happen in parallel with subagent work. Strict orderings: Phase A blocks Phase F; Phase C2 blocks Phase E3 (because the privacy / support URLs go into ASC); Phase F blocks Phase G.

| Phase | Estimated active time |
|---|---|
| A — Apple Developer | ~40 min (+ DUNS wait if first time) |
| B — Privacy/legal (only `{{ENTITY}}` left to fill) | ~5 min |
| C — Firebase Console toggles | ~10 min |
| C2 — Cloudflare DNS → Firebase Hosting custom domain | ~10 min active + 15-60 min cert wait |
| D — Cloudflare AI proxy (deferred to v1.1) | ~5 min |
| E — ASC setup | ~35 min |
| F — Sign + Archive + Upload | ~15 min |
| G — TestFlight + Submit | ~10 min active + waiting |
| **Total active** | **~2 hours** core + ~1 hour of review |

---

## Optional delegation — let the subagent do more

If you'd rather minimize your own time, hand the subagent these credentials (one-time setup) and it'll do the corresponding phase work:

| Credential | Enables subagent to do | How to get it |
|---|---|---|
| Firebase Admin service-account JSON (`firebase-adminsdk-*.json`) | C3 (rotate demo passwords programmatically), bulk Firestore operations | Firebase Console → Project Settings → Service Accounts → Generate new private key |
| Firebase CLI token (`FIREBASE_TOKEN` env) | Rules deploy (`firebase deploy --only firestore:rules,storage`), Hosting deploy (`firebase deploy --only hosting`) | `firebase login:ci` from your machine, copy the token |
| Cloudflare API token (`CLOUDFLARE_API_TOKEN` env) | D1-D3 (wrangler authentication + secret put + deploy) | Cloudflare Dashboard → My Profile → API Tokens → "Edit Cloudflare Workers" template |
| App Store Connect API key (`.p8` + Key ID + Issuer ID — these you already have from Phase A) | F6 (altool upload). F1-F4 still require local Xcode. | A3 (above) |

**You cannot delegate**: Phase A (enrollment), Phase B (legal identity), most of Phase E (ASC app record requires Apple ID login), Phase F1-F4 (local Xcode signing setup), Phase G (TestFlight invites + submit).

---

## What "done" looks like

After Phase G5 returns "Ready for Sale," Verrocchio is live on the App Store. The subagent's master plan is then in maintenance mode — any v1.0.1 hotfixes follow the same dispatch pattern; v1.1 candidates (AI re-enable via Phase D, iPad support, Sign in with Apple, App Check enforcement) are catalogued in the closure memory file written by the final wave of the master plan.
