# Verrocchio — Master To-Do List

> Captured from product-owner brain dumps starting 2026-05-12. Each section is scoped so a single subagent (or PR) can pick up an item with minimal additional context. Items are NOT in priority order — see the **Priority** tag inside each item.
>
> **Document structure:** 6 parts, 23 sections. Strategy & product-identity sections come first because they constrain everything downstream. Read [Part I](#part-i--strategy--product-identity) before reading any other part.

---

## Table of Contents

### [Part I — Strategy & Product Identity](#part-i--strategy--product-identity)
1. [Monetization Strategy — Free / Paid Split + Referral Unlock](#1-monetization-strategy--free--paid-split--referral-unlock)
2. [Social & Community Layer — Anchor Pillar of the App](#2-social--community-layer--anchor-pillar-of-the-app)

### [Part II — Core App Surface](#part-ii--core-app-surface)
3. [Onboarding & New-User Experience](#3-onboarding--new-user-experience)
4. [Home Page — Tips & Reminders](#4-home-page--tips--reminders)
5. [Habits & Goals — Cards, Bugs, Organization](#5-habits--goals--cards-bugs-organization)
6. [Future Goals & Future Habits — Brainstorm Staging Area](#6-future-goals--future-habits--brainstorm-staging-area)
7. [Reflect Tab — Journaling Redesign](#7-reflect-tab--journaling-redesign)
8. [Urgent To-Do](#8-urgent-to-do)
9. [Calendar Day Detail View](#9-calendar-day-detail-view)
10. [Version History](#10-version-history)
11. [My Profile, Account & App Settings](#11-my-profile-account--app-settings)

### [Part III — Cross-Platform UX Consistency](#part-iii--cross-platform-ux-consistency)
12. [Mobile Layout & Spacing Fixes](#12-mobile-layout--spacing-fixes)
13. [Desktop Input Parity — Mobile-Gesture Fallbacks](#13-desktop-input-parity--mobile-gesture-fallbacks)

### [Part IV — Intelligent / AI Features](#part-iv--intelligent--ai-features)
14. [AI Features](#14-ai-features)

### [Part V — iOS Platform & Cross-App Integration](#part-v--ios-platform--cross-app-integration)
15. [iOS Widgets, Lock Screen & Surface Glances](#15-ios-widgets-lock-screen--surface-glances)
16. [Siri / App Intents / Apple Intelligence](#16-siri--app-intents--apple-intelligence)
17. [Third-Party App Integration on iOS — Deep Links + Auto-Completion](#17-third-party-app-integration-on-ios--deep-links--auto-completion)
18. [Calendar Integration — Two-Way Sync & Voice Scheduling](#18-calendar-integration--two-way-sync--voice-scheduling)
19. [Apple Watch Companion App — Future](#19-apple-watch-companion-app--future)

### [Part VI — Infrastructure, Distribution & Operations](#part-vi--infrastructure-distribution--operations)
20. [Infrastructure & Scaling — Cost-Efficient to Thousands of Users](#20-infrastructure--scaling--cost-efficient-to-thousands-of-users)
21. [Payment Backend — Subscriptions / Paid Tier](#21-payment-backend--subscriptions--paid-tier)
22. [App Store Submission via TestFlight](#22-app-store-submission-via-testflight)
23. [Cross-Cutting QA](#23-cross-cutting-qa)

### [Appendix](#appendix)
- [How to use this document](#how-to-use-this-document)

---

# Part I — Strategy & Product Identity

> The two load-bearing strategic decisions. Every downstream feature, infra choice, and pricing decision references these. **Read these before anything else.**

---

## 1. Monetization Strategy — Free / Paid Split + Referral Unlock

### 1.0 Strategic framing — zero marketing budget, network-effect growth
**Acquisition channel = the product itself.** No paid ads, no influencer spend, no SEO machine. Growth comes from users inviting other users in exchange for app access. The referral ladder is therefore not a side feature — it is **the entire marketing strategy**. Two implications:
- The free → paid funnel matters less than the free → free-but-invited funnel. We're optimizing for *invites sent that convert to active users*, not just paid conversions.
- Every UX decision on the upgrade prompt, the share sheet, the unlock ladder, and the invitee onboarding directly impacts CAC (which is effectively $0 if this works). Treat 1.6 as the most leveraged surface in the app.

### 1.1 Headline model
A **three-state lifecycle per user**, in order:
1. **Free trial (1 week)** — full access to every feature in the app, no payment info required.
2. **Referral-unlocked free tier** — when the trial ends, the user is prompted to **invite contacts** to download the app. Each successful invite extends or unlocks continued access, scaling all the way up to **lifetime free Pro** at the top of the ladder (per 1.6).
3. **Paid (Pro)** — bypasses the referral requirement; unlocks the full feature set as long as the subscription is active.

This is a **growth-loop monetization model**, not a pure freemium model. The referral mechanic doubles as the entire user-acquisition engine.

### 1.2 What's in the always-free tier
The "table stakes" features that should never sit behind any wall — they're what defines the app's core value proposition:
- Creating, editing, organizing habits and goals (count caps per 1.5)
- Marking habits complete / missed / skipped
- Daily journal entry (single, freeform)
- The home page, today view, calendar view, basic streak math
- Local-only data + cross-device Firestore sync
- Manual habit/goal version history (basic)
- Privacy/account controls, data export
- Minimum social slice — see [§2.11](#211-priority--anchor-pillar-v1-minimum-slice-required)

### 1.3 What's behind the **referral wall** (free-but-must-invite to keep using)
Features the user gets during the trial, loses when the trial ends, and **earns back per invite**:
- Unlimited habits / goals (beyond the free count cap from 1.5)
- Reflect tab — multiple journal entries per day, goal-linked entries
- Habit reports / long-term analytics (read-only access; 30-day window for free, longer with invites)
- Linking content (URLs / short text) to habits and goals — count-limited for free, expanded per invite

### 1.4 What's behind the **paid wall** (Pro-only)
Features that have a real ongoing cost-per-user or are genuinely advanced:
- **AI features** — all of them. Tips, routine optimizer ([§14.1](#141-habit-routine-optimizer-based-on-neglected-habits)), additive-vs-non-negotiable detection ([§14.3](#143-detect-additive-habits-crowding-out-non-negotiables)), AI-personalized prompts. *(These cost real money per call per [§20.5](#205-ai-proxy-cloudflare-worker--usage-cap-per-user).)*
- **Image attachments** on habits/goals/journal entries *(per [§20.3](#203-user-saved-content--the-real-cost-question) cost model)*
- **Calendar integration** *(per [§18](#18-calendar-integration--two-way-sync--voice-scheduling))*
- **Voice-driven AI scheduling** *(per [§18.3](#183-voice-driven-ai-scheduling))*
- **Advanced reports** — multi-month trends, correlations between habits, goal-velocity metrics
- **Interactive widgets + Apple Watch complications** *(per [§15.8](#158-free-vs-paid-split))*
- **Direct third-party integrations** (Strava, Garmin, etc.) *(per [§17.8](#178-free-vs-paid-split))*
- **Audio reflections** (when/if shipped — high cost)
- **Unlimited content/storage** within hard caps from [§20.9](#209-open-questions-to-resolve-before-building-user-saved-content)

### 1.5 Free-tier limits (proposed numerical caps)
- **Habits:** 5 active habits
- **Goals:** 3 active goals
- **Journal entries:** 1 per day; 30-day history visible
- **Linked content per habit/goal:** 3 URLs / short-text snippets
- **User-uploaded content storage:** **25 MB total per account** (text + images + any future attachments). Beyond this cap, the user must upgrade to Pro or invite friends ([§1.6](#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime)) to expand the limit. See [§20.3](#203-user-saved-content--the-real-cost-question) for the full per-tier storage matrix and enforcement details.

These caps act as the **soft gate** that creates the upgrade decision moment. Each invite earned via 1.6 can grant +X on one of these limits.

### 1.6 The referral mechanic (1-week trial → invite-to-extend → invite-to-lifetime)
- **Trial:** 7 days of full Pro-equivalent access on first sign-up. No payment info required.
- **Day 7 prompt:** Modal explains the choice — *"Your trial is up. Pick one: subscribe, or invite friends to keep using the app for free."*
- **Invite mechanism:**
  - Generate a unique referral link tied to the user's UID (`https://verrocchio.app/r/<short-code>`).
  - Share targets: native share sheet (iOS Capacitor share API) covering iMessage, WhatsApp, email, X, etc.
  - **Counts only when the invitee installs the app AND creates an account AND remains active for ≥3 days.** Cheaper signup-only counting invites fraud — the 3-day activity gate kills the throwaway-account farm.
- **Unlock ladder — primary axis (free tier expansion):**
  - **3 invites converted:** Unlock the referral-walled feature set (1.3) for 30 days. Caps lift to: 10 habits, 6 goals, unlimited journal entries, 90-day journal history.
  - **5 invites converted:** **Permanent unlock** of the 1.3-tier features + caps lifted to 15 habits, 10 goals, 180-day journal history.
- **Unlock ladder — Pro axis (free months of premium features):**
  - **10 invites converted:** 1 month of free Pro (AI features, image attachments, calendar, advanced reports).
  - **25 invites converted:** 6 months of free Pro.
  - **50 invites converted:** 12 months of free Pro.
  - **100 invites converted:** **Lifetime free Pro.** This is the "evangelist" tier — a user who brings in 100 active accounts has paid for themselves many times over in CAC-equivalent value and earns the top reward.
  - Months stack additively below the lifetime threshold (e.g., 30 invites = 6 months + 1 month bonus = 7 months banked). Above 100, the user is Pro forever; further invites no longer accrue Pro time but **do** still earn other perks (see 1.6b).
- **Lifetime trigger fine print:**
  - "Lifetime" = as long as Verrocchio LLC operates the service. We make no promise the service operates forever; we promise the user pays nothing while it does. Document this in the ToS.
  - Lifetime is **non-transferable** and tied to the original Firebase Auth UID/email. Account deletion forfeits it.
  - Lifetime users still pay through Apple if they ever want to gift Pro to someone else.
- **Bonus for inviter when an invitee independently subscribes (vs free):** **+3 months Pro** stacked onto the inviter's account. Stronger reward than a free invitee converting because the LLC actually got revenue.
- **Abuse controls:**
  - Deduplicate by device/IP heuristics + Firebase Auth email verification + phone verification at the high tiers (50+, 100+).
  - 3-day activity gate (above).
  - Block known disposable email domains.
  - Manual review queue for any account claiming the 100-invite lifetime tier — fraud here is asymmetric (a successful fraud = permanent free Pro), so a human checks before granting.
  - Cap invites credited per 24h to ~5 to slow obvious automation.

### 1.6b Non-Pro perks above the lifetime threshold
Once a user has earned lifetime Pro, they keep gaining status-only rewards for continued advocacy:
- Badge / title on their profile (e.g., "Founding 100 Club", "Verrocchio Evangelist").
- Early access to new features (TestFlight-equivalent for non-iOS users).
- Optional credit in an "Acknowledgments" section of the app.
- These cost the LLC nothing and keep top advocates engaged.

### 1.7 Hard floor — what a user who never invites and never pays keeps
After the trial ends, if the user neither invites nor pays:
- **Option A (gentler):** Drop to the always-free tier (1.2) with the limits in 1.5. Periodic prompts to invite or upgrade.
- **Option B (firmer):** Read-only mode — can view existing data, can't add new habits/goals/journal entries. Forces a decision.
- **Recommended:** Option A. Verrocchio's value compounds with daily use; locking users out kills the only thing that creates upgrade demand later. **Open question to decide before launch.**

### 1.8 Pricing (placeholder — to validate)
- **Monthly:** $4.99
- **Annual:** $39.99 (~33% off vs monthly × 12) — most users on annual; better LTV economics.
- **Lifetime:** Skip for v1. Lifetime deals look like revenue but cap upside; revisit later.
- **Free trial via Apple:** Apple supports a 1-week intro trial at $0. Use this for the v1 trial mechanic only if 1.9 says so — otherwise the custom-trial variant applies.

### 1.9 Trial without auto-charge variant
A subtle but important design choice: **does the 1-week trial require credit-card / Apple ID payment method upfront?**
- **With payment method (Apple's standard intro trial):** Higher conversion rate, but lower top-of-funnel trial starts. Users feel "tricked into a subscription."
- **Without payment method (custom trial timer in app):** Lower friction at signup, but no Apple-native trial → user actively chooses to upgrade on day 7. Lower conversion but higher signup rate.
- **Recommended for verrocchio:** **Custom trial without payment method.** The whole growth-loop model assumes most users will go the referral route, not pay. Asking for a credit card upfront kills the referral conversion path. Save Apple's intro-trial mechanic for users who *choose* to subscribe later.

### 1.10 Cross-cutting implementation hooks
- **Entitlement helper from [§21](#21-payment-backend--subscriptions--paid-tier):** Extend `isPro(user)` into a richer entitlement object: `entitlements(user)` → `{ tier: 'trial'|'free'|'referral_unlocked'|'pro', limits: {...}, expiresAt }`.
- **Per-feature gate:** Every premium-locked feature reads from this central entitlement helper. No scattered conditionals.
- **Referral state:** Store in Firestore at `users/<uid>.referrals = { sent: [...], converted: [...], unlocksEarned: N }`.
- **Trial timer:** Server-trusted, not client. Stored at `users/<uid>.trial = { startedAt, expiresAt }` — never recompute from device clock (anti-cheat).
- **Analytics required from day one:** Track funnel — signup → day-7 prompt → invite-action vs subscribe-action vs do-nothing — so we can iterate on the model with real data.

### 1.11 Priority
- **Strategic decision needs to be ratified before paywall infra ([§21](#21-payment-backend--subscriptions--paid-tier)) is built.** The entitlement architecture in §21 assumes a tier model; the tier model is defined here. Lock 1.1–1.6 before writing any payment code.

### 1.12 Free-to-paid conversion playbook — lessons from prior apps
**Question:** How have apps in the past grown a very large free user base and later monetized it (or forced users to start paying) while minimizing attrition / churn?

**Successful patterns (apps that converted free users well):**
- **Spotify** — free with ads; sunk cost = curated playlists. Users don't leave because they'd lose their playlists. Conversion to Premium driven by ad annoyance + offline listening, not paywall.
- **Dropbox** — generous free tier (2 GB), paid for more storage. Slow-burn upsell triggered when the user *hits the limit naturally*, not when the company decides. Sunk cost = files already in the cloud.
- **Duolingo** — free with ads; paid (Super Duolingo) removes ads + adds streak protection. The streak is the sunk cost. Loss aversion converts.
- **Slack** — free up to N messages; older messages become hidden but not deleted. Teams pay to "unlock" their own past. B2B leverage, but the pattern applies: don't delete sunk cost, just hide it.
- **Notion** — extremely generous free tier; conversion driven by team/org features (network effect inside the org, not consumer).
- **LinkedIn** — free social network; paid (Premium / Recruiter) for productivity. The free tier serves the data network; paid serves a different job.
- **Substack** — free for readers; takes a cut of writers' paid subscriptions. Monetizes a different side of the marketplace than it acquires.
- **Wikipedia** — never monetized via paywall; donation model. Works because the free product has unique social value. Inapplicable here, but a useful baseline.

**Failure patterns (apps that mismanaged the transition):**
- **Evernote** — overly generous free tier for years, then aggressive paywalls + price hikes after the company struggled. Massive churn; users felt betrayed. Lesson: **don't take away what users already have.**
- **Twitter / X** — long-time free users found core features (verification, edit, longer posts) suddenly behind paywall. Mass goodwill collapse. Lesson: **gate *new* features behind paid; never take features *back*.**
- **MoviePass** — unsustainable free-equivalent pricing → forced restrictions → death spiral. Lesson: the unit economics have to make sense; don't subsidize forever and hope to make it up later.
- **Strava** — gradually moved popular features (segments, leaderboards, route planning) behind paywall. Survived but bled goodwill. Lesson: gating *engagement features* (the things users love) creates more churn than gating *infrastructure features* (storage, API, advanced reports).

**Synthesized playbook for Verrocchio:**
1. **Grandfather early users.** Anyone who signs up in v1 keeps their current tier indefinitely, even if pricing or limits change later. This buys goodwill cheaply and turns early adopters into evangelists (who are also the [§1.6](#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime) referral engine).
2. **Add value before extracting.** Months of free use → "here's a great new AI feature, it's Pro" reads as *progress*. "This feature you've been using is now Pro" reads as *betrayal*. Always gate **new** features.
3. **Use the streak as sunk cost.** Long streaks create loss aversion. The Day-7 prompt ([§1.6](#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime)) lands well because the user has just spent a week building something they don't want to lose. Streaks are Verrocchio's "playlist moment."
4. **Use social connections as sunk cost.** Once a user has [§2 accountability partners](#2-social--community-layer--anchor-pillar-of-the-app) in the app, leaving costs them those relationships. This is the strongest possible retention mechanism — engineering for it in v1 is high-leverage.
5. **Soft gates > hard gates.** Limits that bite at the *adding* step ("you've used 5 of 5 habits — invite a friend or upgrade to add more") are tolerable. Limits that bite at the *using* step ("you can't see your data unless you pay") destroy goodwill.
6. **Telegraph upcoming changes.** Any future pricing/tier change ships with ≥30 days of in-app notice + email. Surprises are the kill shot.
7. **Make the free tier genuinely useful**, not crippled. A useful free tier funds the referral engine ([§1.0](#10-strategic-framing--zero-marketing-budget-network-effect-growth)); a crippled free tier kills network effects before they start.
8. **Don't gate things with $0 marginal cost.** Outbound app launchers ([§17.8](#178-free-vs-paid-split)), basic Siri intents ([§16.9](#169-free-vs-paid-split)), basic widgets ([§15.8](#158-free-vs-paid-split)) — gating these is petty and signals greed without recouping spend. Gate the things with real per-user cost (AI, storage, OAuth integrations) instead.
9. **Convert when the user has invested, not when they're new.** The Day-7 prompt is the right moment, not Day-0. The 30-day analytics window is the right moment, not the first session.

**Research agent task (defer to [§14.2](#142-research-agent-top-10-best-selling-books-on-habits--goals--discipline)-style dispatch):**
- Dispatch agents to research the top 10 mobile / SaaS apps that successfully grew a large free user base and later monetized.
- For each: capture the free → paid conversion mechanism, the percentage of free users who eventually paid (LTV-to-CAC ratio if public), and what behavior of the company drove the most churn.
- Deliverable: a 1-page playbook to validate or revise the 9 points above with quantitative backing.

**Acceptance:**
- Synthesized playbook above lives in this doc as the working strategy.
- Research agent dispatch is queued (see [§14.2](#142-research-agent-top-10-best-selling-books-on-habits--goals--discipline) for the agent pattern).
- Findings update this section by reference rather than rewrite (preserves an audit trail of how thinking evolved).
- **Priority:** High — this directly informs how aggressive the v1 limits in [§1.5](#15-free-tier-limits-proposed-numerical-caps) and the Day-7 prompt in [§1.6](#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime) should be. Locking these before launch is much cheaper than re-tuning under churn pressure later.

### 1.13 iOS contacts integration — fast-invite flow
- **Problem:** The referral loop is the entire marketing strategy ([§1.0](#10-strategic-framing--zero-marketing-budget-network-effect-growth)), yet today the only invite path is the native share sheet (open share → pick Messages → pick contact → type message → send). Multi-step friction kills throughput. To send 10 invites a user has to repeat 10× through the share sheet.
- **Concept:** Add a "Invite from Contacts" action that triggers an in-context iOS Contacts permission prompt and then a native multi-select contact picker. User picks N contacts in one step → reviews/edits a pre-filled invite message → sends to all selected in one batch.
- **Flow:**
  1. User taps "Invite friends" anywhere it appears (Day-7 modal, soft-cap prompts, profile "share Verrocchio" affordance).
  2. App requests Contacts permission with a clear in-app explanation modal **before** triggering iOS's system prompt — Apple reviewers prefer this pattern ("priming the permission"). Sample copy: *"Verrocchio uses your contacts only to help you invite friends. Your contacts stay on your device — we never upload your contact list."*
  3. On grant: native iOS multi-select contact picker opens. Pre-filtered to contacts with at least a phone or email (so the user only sees actionable rows).
  4. User selects 1–N contacts → editable message screen with default text + the user's unique referral link (`https://verrocchio.app/r/<short-code>`) → sends.
  5. Send goes via iOS Messages (SMS/iMessage) by default; email-only contacts fall back to mailto: pre-fill.
  6. App records sent count + timestamps at `users/<uid>.referrals.sent` — **count and timestamps only, never the contact PII itself**.
- **On permission denial:**
  - Fall back gracefully to the existing share sheet flow.
  - Do not re-prompt aggressively. After the user successfully sends ≥1 invite via the share sheet, offer one reframe: *"Want to invite more at once? Allow contacts access in Settings."* — never more than once per week.
- **Privacy constraints (non-negotiable):**
  - **All contact processing happens on-device.** Contacts never reach Firestore, the AI proxy, analytics, or any other server.
  - `Info.plist` key `NSContactsUsageDescription` must be specific: *"Verrocchio uses your contacts to help you invite friends. Your contacts stay on your device."* Apple reviewers reject vague descriptions like *"for app functionality"*.
  - Settings tab needs a "Contacts access: [status] — Manage" link that deep-links to the iOS Settings app's permission page for Verrocchio (Capacitor `App.openSettings()` or equivalent).
  - If/when we ever build a "find friends already on Verrocchio" feature (hashed-email matching against a server-side index), that's a **separate feature with its own privacy review** — out of scope here.
- **Capacitor integration:**
  - Plugin: `@capacitor-community/contacts` (verify maintainer activity + iOS 17/18 support before adopting; if stale, evaluate `capacitor-plugin-contacts` or write a thin native bridge).
  - iOS native bridge: presents `CNContactPickerViewController` (Apple's stock multi-select picker). No custom UI needed for the picker itself.
  - Web side (verrocchio.app PWA) has no equivalent API — web users always hit the share-sheet path (`navigator.share` where available, `mailto:` / `sms:` / copy-link otherwise).
- **Pre-filled invite message — proposed default:**
  > *"I've been using Verrocchio — it's a habit and goal tracker built around disciplined practice rather than streaks/gamification. Try it: https://verrocchio.app/r/<short-code>"*
  - User can edit before sending. Default kept short to fit one SMS without splitting.
- **Attribution into §1.6:**
  - Each contacts-flow invite generates the same referral link format as the share-sheet flow. Conversion gating ([§1.6](#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime): install + sign up + ≥3 days active) is identical and channel-agnostic.
  - Invites earned via this flow count toward the unlock ladder ([§1.6](#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime)) without distinction.
- **Abuse considerations:**
  - The 24h invite-credit cap from [§1.6](#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime) (~5/day) applies regardless of channel. A user can't bulk-send 200 contacts in one session and earn 200 invite credits — Firestore tracks the rate.
  - Block sending to the user's own phone/email (self-invite). Trivial check on the send action.
- **App Store review risk:**
  - Apple scrutinizes apps that request Contacts. Common rejection reasons we must avoid:
    - Vague usage description in `NSContactsUsageDescription`.
    - Contact list uploaded to a server without explicit user disclosure.
    - Contacts used for purposes beyond what's stated (e.g., marketing emails to non-users).
  - Our position is clean: on-device only, narrow stated purpose, in-app revocation path. Document this clearly in the App Store review notes ([§22](#22-app-store-submission-via-testflight)).
- **Priority:** **High** — directly serves the most leveraged surface in the app ([§1.0](#10-strategic-framing--zero-marketing-budget-network-effect-growth)). Without it, the referral loop is throttled by per-invite friction. Worth doing **before App Store launch** — adding a new permission post-launch requires another App Store review cycle.
- **Cross-references:**
  - [§1.0](#10-strategic-framing--zero-marketing-budget-network-effect-growth) — strategic framing of the referral loop as the marketing strategy
  - [§1.6](#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime) — the unlock ladder this surfaces feed into
  - [§3](#3-onboarding--new-user-experience) — onboarding should mention the social/invite concept so this isn't a surprise when surfaced later
  - [§22](#22-app-store-submission-via-testflight) — review notes need to address contacts permission usage explicitly

---

## 2. Social & Community Layer — Anchor Pillar of the App

> **📐 Implementation spec:** [docs/SOCIAL_LAYER_V1.md](SOCIAL_LAYER_V1.md) — minimum-shippable-slice with concrete Firestore schemas, security rules pseudocode, client API surface, UI flows, test plan, and rollout sequence. The strategy below remains authoritative; the spec doc is the implementer's blueprint.


### 2.0 Strategic framing — social is core, not bolted on
**The social/community/accountability layer is an anchor pillar of the product, alongside the habit/goal tracking core itself.** It is not a future "phase 2" feature, not a paid add-on tacked onto a private tracker. The product's identity is *the habit tracker your friends help you keep* — alone-mode and with-friends-mode are equally first-class.

Implications that propagate through every other roadmap section:
- **Data model** ([§20.2](#202-firestore--keep-reads-cheap)): designed for social-graph reads from day one. The per-user blob → per-resource subcollections migration should happen **before** the social layer ships, not after. Painful retrofit otherwise.
- **Onboarding** ([§3.1](#31-animated-genesis-sequence-before-onboarding)): introduces the social/accountability concept up front — not buried in a settings page. New users should understand within the first session that the app expects them to bring people along.
- **Growth loop** ([§1.0](#10-strategic-framing--zero-marketing-budget-network-effect-growth)): the invite-to-unlock ladder and the accountability connections are the **same mechanism viewed two ways** — every invite is both a referral *and* a potential accountability partner. Design them together.
- **v1 cannot ship without a minimum social slice.** Shipping a private-only v1 and then trying to bolt on social later sends the wrong product message ("this is a solo app, social is an extra") and misses the chance to seed the network effect from day one. A small, well-scoped social slice is **required for v1** (see 2.11).
- **Pricing strategy** ([§1](#1-monetization-strategy--free--paid-split--referral-unlock)): social is *not* gated entirely behind the paywall. Limited social functionality must be available on the free tier so the network effect actually compounds. Premium scales the social functionality — it does not bouncer it.
- **Privacy posture** ([§2.4](#24-privacy--safety--non-trivial-surface)): elevated importance. This is *the* feature that turns a benign personal tracker into a surface with real interpersonal stakes. Sloppy privacy here would kill the product's reputation faster than any technical bug.

### 2.1 Concept
Open the app from a strictly private tool into a **selectively shareable accountability tool.** Users can share specific habits or goals with chosen contacts, who then get visibility (and optionally nudge rights) into the user's progress. The combination of *visibility + opt-in nudges* is the accountability mechanic.

This is **opt-in per habit/goal**, never automatic. The default state of all data remains private. Social participation is encouraged by design but never forced.

### 2.2 Strategic fit with the rest of the roadmap
- **Anchor pillar (per 2.0)** — drives product identity, not just feature surface area.
- **Reinforces the network-effect growth strategy ([§1.0](#10-strategic-framing--zero-marketing-budget-network-effect-growth)):** social features give referred users a reason to also sign up (they need an account to be an accountability partner). The invite-to-unlock model from 1.6 and the social-graph model here compound each other — every invite is also a candidate accountability connection.
- **Tiered monetization, not gated:** the free tier includes a meaningful social slice so the network effect functions for non-paying users. Premium increases the scale/quality of social functionality (more connections, group accountability, partner-triggered pushes). See 2.8.

### 2.3 Core feature set
**Sharing primitives:**
- **Share a habit or goal with one or more contacts.** Each share is granted by the owner and revocable at any time.
- **Permission levels per share:**
  - **Viewer** — sees the habit/goal name, current streak, and recent completions.
  - **Cheerleader** — viewer + can send pre-defined encouragement messages ("Proud of you", "Don't break the chain"), no freeform text.
  - **Accountability Partner** — cheerleader + can send a freeform check-in prompt ("Did you do your run today?") and see if the user has marked the habit complete that day.
- **Group accountability:** create a small group (≤8 users) around a shared goal/habit theme. Each member sees each other's progress on the shared item only.

**Check-in & notification primitives:**
- **Daily / weekly check-in cadence per shared item** — owner chooses how often partners can prompt (e.g., "check on me daily about my run"; "weekly about my reading").
- **Auto-nudge:** if the owner misses a habit two days in a row, partners can be auto-notified ("Your partner missed their run yesterday") — owner toggle, off by default.
- **Reactions instead of full messages by default** — emoji reactions on completions / journal entries from partners. Low-friction for the partner, low-stakes for the owner. Freeform DMs are scope creep for v1; keep out.

### 2.4 Privacy & safety — non-trivial surface
**This is the single biggest privacy expansion the app will undergo.** Treat it accordingly.

- **Default-private everything:** no habit, goal, journal entry, or completion is shared unless the user explicitly shares it. The current `users/<uid>` per-user-doc model already enforces this; sharing requires new collections, *not* widening existing rules.
- **No public profiles in v1:** users only see other users via direct, mutual share. No discovery, no leaderboards, no friend-of-friend. Discovery features can come later if there's demand.
- **Block & report:** every shared relationship must be unilaterally severable by either side. Add a "Block user" path with full data revocation. Apple App Review requires block/report mechanisms for any user-to-user interaction app — non-negotiable.
- **Journal entries default to private even when a habit/goal is shared.** Sharing a habit ≠ sharing the prose. Each journal entry needs its own per-entry share toggle.
- **No PII leakage in notifications:** push payloads should not contain the partner's habit text; they should be generic ("Your partner has an update") with details revealed only after auth in-app.
- **Minor protection:** age-gate at 13+. If we ship social features, the under-13 protection becomes much more important — verify before launch.
- **Privacy policy update required:** [docs/PRIVACY_POLICY.md](PRIVACY_POLICY.md) must be updated before any social feature ships, disclosing what gets shared, how, and with whom.

### 2.5 Data model
- **Connection record:** `connections/{connId}` doc with `{ owner: uid, partner: uid, status: 'pending'|'active'|'blocked', createdAt }`. Bidirectional consent — partner accepts before status flips to active.
- **Per-item share:** `shares/{shareId}` doc with `{ itemKind: 'habit'|'goal', itemId, ownerUid, partnerUid, permission: 'viewer'|'cheerleader'|'accountability', cadence: 'daily'|'weekly'|'on-miss', createdAt }`. Revoke = delete this doc.
- **Reactions/check-ins:** `interactions/{id}` doc with `{ shareId, fromUid, toUid, kind: 'reaction'|'check-in'|'cheer', payload, createdAt }`. Keep payload minimal; never store freeform text in v1.
- **Firestore rules become considerably more complex.** Sharing means reading another user's data — but only the slice they've shared. This is the most common rules-vulnerability vector; **mandatory security review before any social feature ships.**

### 2.6 Push notifications — net-new infra
- **iOS:** Requires APNs entitlements added to the Capacitor iOS shell, a backend service to send pushes, and explicit user opt-in (Apple permission prompt). Add to the App Store Connect record before submitting.
- **Web:** Web Push API works on iOS Safari 16.4+ for installed PWAs. Different code path.
- **Sender service options:**
  - Firebase Cloud Messaging (FCM) — already in the Firebase ecosystem, free, easy to integrate. **Recommended.**
  - APNs direct — more control, more work. Skip for v1.
- **Throttling:** rate-limit per-user push frequency aggressively to prevent harassment via spammy partner. E.g., max 10 partner-originated pushes per user per day.

### 2.7 Cost implications (cross-ref [§20](#20-infrastructure--scaling--cost-efficient-to-thousands-of-users))
Social features change the Firestore cost profile:
- **Read fan-out:** showing a partner's progress requires reading their habit/share docs. Per-user blob model from [§20.2](#202-firestore--keep-reads-cheap) becomes painful here — subcollections become more attractive.
- **Write fan-out:** a single check-in writes to interactions + potentially triggers a push. Throttle aggressively.
- **Push notifications via FCM:** free at low volume; need to confirm pricing at scale.
- **New tripwire alerts needed for share/interaction collections.**

### 2.8 Free vs Paid split for social features
Slots into [§1 Monetization](#1-monetization-strategy--free--paid-split--referral-unlock):
- **Free tier:** Up to **2 accountability connections** total, viewer permission only, daily reaction-style interactions, no group accountability.
- **Referral-unlocked (per 1.6 ladder):** Up to **5 connections**, cheerleader permission, weekly check-ins, no groups.
- **Pro:** **Unlimited connections**, full accountability partner permission, group accountability up to 8 members, customizable check-in cadence, partner-triggered push reminders.

This makes accountability a strong reason to invite friends (you need them in the app to use it with) and a strong reason to upgrade (limits bite quickly).

### 2.9 Scope discipline — what NOT to build in v1 of social
The temptation will be to ship a social network. Resist:
- ❌ No public profiles or discovery
- ❌ No global feed
- ❌ No "follow" model — only mutual connections
- ❌ No freeform DMs (use reactions + canned phrases)
- ❌ No leaderboards (gamification adds toxicity; revisit later if demand emerges)
- ❌ No photo/video uploads in social context (privacy + cost — defer per [§20.3](#203-user-saved-content--the-real-cost-question))

The narrow scope keeps moderation cost ≈ $0 and keeps the app's identity as a *tool*, not a social network.

### 2.10 App Store review implications
Social features change the review picture:
- **App Store Review category likely shifts** to include user-generated content rules.
- **Block/report flow is mandatory.**
- **Terms of Service** must include user-conduct rules.
- **Anti-harassment commitment** in App Privacy section.
- **EULA must reference** that users may interact with each other and the LLC isn't liable for partner behavior.

### 2.11 Priority — anchor pillar, v1-minimum slice required
- **Highest strategic value.** Per [§2.0](#20-strategic-framing--social-is-core-not-bolted-on), this is an anchor pillar, not a future feature.
- **v1-minimum social slice (must ship at launch):**
  - Connection model + accept/decline flow
  - Share a single habit or goal with one connection at viewer permission
  - Reaction-only interactions (no freeform check-ins, no groups, no pushes yet)
  - Block/report flow (App Store requirement — non-negotiable)
  - Privacy policy updated
- **v1.x (immediately post-launch):** push notifications, accountability-partner permission, weekly check-ins.
- **v2:** group accountability, customizable cadence, partner-triggered reminders, the full tier-scaling matrix from 2.8.
- **Data model (2.5) is the gating decision:** the move from per-user blob to per-resource subcollections ([§20.2](#202-firestore--keep-reads-cheap)) must happen **before** any social work begins. The schema choice here is load-bearing across the rest of the roadmap.

### 2.12 Open questions to resolve before building
- Will the connection model be invite-by-link (simple), invite-by-username (requires usernames), or invite-by-phone-contact (best UX, hardest privacy)?
- Where do journal entries fit? Sharable per-entry? Never sharable in v1?
- Do we surface the partner's *streak* or just *whether they did it today*? Streak surfacing might shame relapsing users.
- Push notification UX: how much can partners "nag" before it becomes harassment? Hard upper bound + user-side mute is essential.
- Does the user know their accountability partner saw they missed a day? (Transparency vs comfort tradeoff.)

---

# Part II — Core App Surface

> The features and bugs that live inside the main app window. Organized by user journey: onboarding → home → habits/goals → reflection → other tabs → profile/settings.

---

## 3. Onboarding & New-User Experience

### 3.1 Animated genesis sequence before onboarding
- **Note for future build:** New users should see an **animated intro** explaining the genesis of the app and its purpose **before** the standard onboarding flow begins.
- **Status:** Spec only — animation assets and timing TBD.
- **Audio direction (proposal):** Underscore the genesis animation with **harp or lyre** — period-appropriate Renaissance string instruments that subtly echo Andrea del Verrocchio's Florentine setting (1435–1488). The instrument choice reinforces the brand origin without being on-the-nose. Soft, plucked, sparse — not orchestral, not symphonic. ~10–20 seconds, looping seamlessly under the animation. Mix should sit *behind* the pronunciation audio from [§3.3](#33-audio-pronunciation-of-verrocchio), not compete with it.
- **Implementation note:** royalty-free lyre/harp clip from a stock-audio source (or a custom 20-second commission — likely <$200). Bundle as a small AAC/MP3 file (<200 KB) shipped with the app; no streaming.
- **Accessibility:** all audio in the genesis sequence (music + pronunciation + any narration) must respect the system "reduce motion" / silent-mode settings. Visual + text alternative must convey the same content.

### 3.2 Surface the social/accountability concept in onboarding
- Per [§2.0](#20-strategic-framing--social-is-core-not-bolted-on), the social pillar must be introduced during onboarding, not buried in settings. New users should understand the app expects them to bring people along.
- **Acceptance:** at least one onboarding screen frames Verrocchio as a tool for accountability with others, not solely as a private tracker.

### 3.3 Audio pronunciation of "Verrocchio"
- **Goal:** Users learn to pronounce the app name correctly the first time they open it. "Verrocchio" (named after Andrea del Verrocchio, the Renaissance sculptor and Leonardo da Vinci's teacher) is non-obvious to most English speakers.
- **Behavior:**
  - Play a short audio clip of the word "Verrocchio" (Italian pronunciation: *ver-ROCK-kee-oh*) during the genesis sequence ([§3.1](#31-animated-genesis-sequence-before-onboarding)) or as part of the welcome screen.
  - Pair audio with a phonetic spelling on-screen for accessibility (e.g., *ver-ROCK-kee-oh*).
  - One-tap "play again" button next to the brand name for users who want to hear it once more.
  - Provide a brief one-line attribution: "Named after Andrea del Verrocchio (1435–1488), Leonardo da Vinci's master."
- **Accessibility:** the audio plays automatically only with sound enabled; users with sound off see the phonetic spelling without missing context. Provide a closed-caption-style label.
- **Implementation:** small static audio file (MP3 or AAC, <50 KB) bundled into the app — no streaming or external dependency. Same audio asset used wherever the brand name needs a pronunciation cue (settings → "About", help section, etc.).
- **Priority:** Medium — brand quality / memorability item, not blocking.

### 3.4 Quick onboarding for users converting from another habit / productivity tracker
**Problem:** A meaningful share of new users are switching from another tool (Streaks, HabitBull, Strides, Way of Life, Productive, Habitica, Notion habit trackers, Apple Reminders/Health, Todoist, Things, etc.). Forcing them to manually re-create every habit, goal, and streak is the single biggest migration friction. Many will abandon partway through and revert to the old tool.

**Goal:** During onboarding, offer a clear "I'm switching from another app" path that bulk-imports the user's existing habits, goals, and (where possible) streak history with minimum friction.

**Import mechanisms — three complementary paths, user picks whichever is easiest:**

**Path A — Screenshot the other app's habit/goal list; AI imports it. *(Recommended primary path — works on everything.)***
- User takes screenshots of their current habits and goals from the other app — any app, any layout. Multiple screenshots supported (scroll the source app and capture several).
- Verrocchio uploads the images to the AI proxy ([§20.5](#205-ai-proxy-cloudflare-worker--usage-cap-per-user)); the AI OCRs and structures the content into the canonical Verrocchio schema (habits with frequency, current streak if shown, goals with SMART fields where derivable).
- Preview screen lets the user correct anything the AI misread before commit.
- **Why this is the lead path:** it requires zero cooperation from the source app, zero technical knowledge from the user, and works even for apps with no export feature. The user already has the data on their screen; the AI just translates it.
- **Cost framing:** OCR runs through the AI proxy and costs a few cents per image. **Offer the first import free** as a goodwill / acquisition hook (recommended). Subsequent re-imports gated to Pro per [§1.4](#14-whats-behind-the-paid-wall-pro-only).
- **Limits:** if a screenshot only shows habit *names* (no streak data), Verrocchio imports the names and starts fresh streaks. Lossy but functional.

**Path B — Pair the other app via OAuth / API where it cooperates.**
For competitors that expose a public API or OAuth, offer a "Sign in with [App]" flow. Verrocchio reads the user's data from the source's API and imports it. Far richer than OCR — streaks, completion history, categories all come across cleanly.
- **Apple Health** (HealthKit per [§17.3](#173-inbound-auto-completion-the-hard-high-leverage-half) Tier A) — mindfulness minutes, workouts, sleep — auto-suggest habits from the historical data and pull last 30+ days of completions.
- **Apple Reminders / EventKit / Things / Todoist** — read via documented APIs; import as to-dos ([§8 Urgent To-Do](#8-urgent-to-do)).
- **Habitica** — well-documented public REST API; "Sign in with Habitica → import habits + streaks" flow.
- **Notion** — Notion's public API can read a habit-tracker table the user has set up.
- **Strava / Garmin / Whoop** (where overlap exists with [§17.3](#173-inbound-auto-completion-the-hard-high-leverage-half) Tier C) — OAuth for the historical data.
- **Honest limit on this path:** iOS sandboxing means Verrocchio **cannot read** another app's private storage or screen contents without that app's explicit cooperation. There is no "grant Verrocchio permission to enter Streaks and copy the data" mechanism — iOS prevents it. Path B works **only** for apps that expose a public API or OAuth endpoint, or that participate in iOS interoperability standards (HealthKit, EventKit, Reminders). For apps without that cooperation (the majority of small/indie habit trackers), Path A (screenshot OCR) is the workable solution.

**Path C — CSV / native-export import (the explicit-export route).**
For users who can export from the source app themselves: accept a CSV or JSON file with a documented schema (`name`, `frequency`, `start_date`, `current_streak`, `category`, `notes`, etc.). Provide a downloadable template + clear field-mapping UI. Universal fallback — works for any competitor that supports exporting, including Streaks, Way of Life, Strides, Productive, HabitBull, Notion (CSV export), and Google Sheets-based trackers.
- iOS share-sheet integration: if a competitor app supports "Share file → Verrocchio" via the iOS share sheet, Verrocchio registers as a destination for CSV/JSON, and the import runs without leaving the source app's flow.

**Picking the right path during onboarding:**
The "switching from another app" flow presents these as choices in friction order — *easiest first*:
1. *"Take a screenshot of your habits"* (Path A — Recommended, works on anything)
2. *"Sign in with [App] to import"* (Path B — only shows apps Verrocchio has integrations for)
3. *"I have a CSV file"* (Path C — power-user path)

The default sell is Path A: it works universally and requires nothing from the user except snapping a photo of a screen they already have open.

**Mapping rules — competitor concepts → Verrocchio:**
- **Habit / streak in the source** → habit record in Verrocchio with the same name, frequency, and current streak preserved (mark all imported completions as `source: 'imported'` for auditing).
- **Goal / target in the source** → Goal record. If SMART fields are missing, flag with the ⚠️ from [§5.6](#56-warning-emoji-on-habits-linked-to-incomplete-goals).
- **To-do item** → Urgent To-Do ([§8](#8-urgent-to-do)).
- **Note / journal entry** → Reflect entry ([§7](#7-reflect-tab--journaling-redesign)).
- **Anything that doesn't map cleanly** → land in the **Future Goals/Habits staging area** ([§6](#6-future-goals--future-habits--brainstorm-staging-area)), not the active list, so the imported user still hits the focused-onboarding cap from [§3.5](#35-focused-goal-setting-onboarding-apply-behavioral-science).

**UX flow during onboarding:**
1. Welcome screen offers two paths: *"I'm new to habit trackers"* (→ §3.5 focused goal-setting) or *"I'm switching from another app"* (→ this section).
2. The switcher path asks which app, with the top 5–10 options as buttons + an "Other (CSV upload)" option + a "Screenshot upload" option.
3. Walks the user through the export step in the source app (linked instructions per source).
4. Imports the file, shows a **preview screen** (not silent insert) — *"We found 8 habits and 3 goals. Here they are. Edit or remove any before continuing."*
5. **Apply the focused-onboarding cap from [§3.5](#35-focused-goal-setting-onboarding-apply-behavioral-science) here too:** if the user has 15 habits in the imported data, prompt them to **pick their top 2–3 to activate** and move the rest into the **Future Habits** staging area ([§6](#6-future-goals--future-habits--brainstorm-staging-area)). The behavioral-science rationale (start small, scale up) applies *more* to converting users, not less — they're the most prone to importing 20 habits and abandoning a week later.
6. Confirms import → drops them into the standard Day 1 home view.

**Privacy & security:**
- Imported data follows the same privacy model as user-created data — stays in `users/<uid>` ([§20.2](#202-firestore--keep-reads-cheap)).
- Screenshots used for OCR are processed via the AI proxy ([§20.5](#205-ai-proxy-cloudflare-worker--usage-cap-per-user)) and **deleted from any cache within 24h**; never persisted.
- OAuth-based imports (Habitica, etc.) request **read-only** scope; revocable from §11.

**Cross-references:**
- **[§3.5 Focused goal-setting](#35-focused-goal-setting-onboarding-apply-behavioral-science):** the cap applies to imported users too — surplus habits land in §6.
- **[§6 Future Goals & Habits](#6-future-goals--future-habits--brainstorm-staging-area):** the destination for imported items beyond the initial cap.
- **[§17.3 HealthKit](#173-inbound-auto-completion-the-hard-high-leverage-half):** Apple Health is technically a special-case import source that becomes an *ongoing* integration rather than a one-shot migration. Both work together — initial seed from HealthKit history, ongoing auto-completion from HealthKit going forward.
- **[§14 AI features](#14-ai-features):** OCR import from screenshots uses AI; budget per [§20.5](#205-ai-proxy-cloudflare-worker--usage-cap-per-user).

**Free vs paid:**
- **Free:** CSV import + Apple Health/Reminders import + 1 free screenshot OCR import (acquisition hook).
- **Pro:** unlimited screenshot OCR imports; ongoing automated re-sync (for users who want to dual-run for a transition period).

**Acceptance:**
- During onboarding, "switching from another app" is a top-level path equal in prominence to "I'm new."
- CSV template documented; importer handles 5+ common formats out of the box.
- Imported habits/goals exceed the focused-onboarding cap → surplus auto-routed to Future bucket.
- All imports show a preview before commit; no silent insertions.
- Source attribution (`source: 'imported_from_streaks'` etc.) preserved on each record for audit + analytics.

**Priority:** **High.** Migration friction is a top reason users abandon onboarding for a competitor's app. Solving this well is a direct conversion-rate boost. Build CSV + Apple Health for v1; add competitor-specific parsers as user volume justifies.

### 3.5 Focused goal-setting onboarding (apply behavioral science)
- **Problem:** New users overload themselves on day one — setting 10 habits and 5 goals at once. Goal-setting research is consistent: starting small and committing to a tightly scoped set drives long-term adherence; starting broad collapses quickly.
- **Onboarding constraints:**
  - **Cap the initial setup** at **1 goal + 2 habits** (or **2 goals + 3 habits**, max). The app refuses to add more *during the onboarding flow* — not as a paywall, but as a behavioral guardrail.
  - Show this cap to the user explicitly with framing: *"Start small. You can always add more once these stick."*
  - **Defer further setup with a clear path:** after the cap is hit, the user proceeds and is told they can add additional habits/goals from the main app, with an optional in-app prompt at +7 days suggesting they consider adding more.
- **Apply the science:**
  - **Specific-and-measurable framing:** the onboarding asks SMART-style follow-ups (per [§5.5](#55-smart-framework-display-under-goals)) rather than letting users enter vague goals.
  - **Implementation intentions ("when-then" planning):** ask the user to specify *when* and *where* each habit will happen — proven to ~2x adherence over plain goal-setting.
  - **Identity-based framing:** encourage habits framed as "I am the kind of person who…" rather than "I will do X" — anchored in James Clear's *Atomic Habits* research.
  - **One non-negotiable, others additive:** during onboarding, ask the user to mark **one** of their initial habits as a non-negotiable (per [§14.3](#143-detect-additive-habits-crowding-out-non-negotiables) — this also seeds the AI's prioritization signal).
- **Reference research to ground the design:**
  - Locke & Latham's goal-setting theory (specific + difficult goals > vague + easy).
  - Gollwitzer's implementation intentions.
  - Fogg's behavior model — start tiny, scale up.
  - BJ Fogg's *Tiny Habits* + Clear's *Atomic Habits* — both consistent on "start absurdly small."
  - *(This is also the input deliverable for the AI research agent in [§14.2](#142-research-agent-top-10-best-selling-books-on-habits--goals--discipline) — dispatch that work to validate the onboarding constraints quantitatively before locking the cap numbers.)*
- **Acceptance:**
  - Onboarding flow enforces the cap with a friendly explanation, not a hard error.
  - Each habit prompt includes "when" and "where" fields.
  - One habit gets a non-negotiable star/badge during onboarding.
  - +7-day re-prompt to add more is opt-in via a soft notification, not nagging.
- **Priority:** High — the onboarding funnel is the single highest-leverage UX surface for long-term retention. Bad onboarding = churned user. Locking the cap is cheap; un-locking it later is also easy.

---

## 4. Home Page — Tips & Reminders

### 4.1 Remove "review yesterday's habit" tip
- **Reason:** There is already a separate module dedicated to this.
- **Action:** Filter out that tip variant from the tips/reminders generator.

### 4.2 AI-generated tips based on user data
- Tips and reminders should be **personalized** by analyzing several days of inputted user data (completions, journal sentiment, neglected habits, goal progress).
- Output: short, actionable suggestion tailored to the user's recent pattern.
- *(Cross-ref [§14 AI Features](#14-ai-features).)*

### 4.3 Home-page daily sequence — optimize for routine consistency (evidence-based)

**Current sequence** (per existing app):
1. Record yesterday's habits
2. Write yesterday's journal
3. Review to-dos
4. Set today's intention

**Verdict:** the current order is **defensible and aligns well with the academic literature**. The body of research on daily reflection + planning routines converges on a **Recall → Reflect → Release → Plan/Commit** loop. Mapped to the current sequence:
- *Record yesterday's habits* = **Recall** (low cognitive load; what happened)
- *Write yesterday's journal* = **Reflect** (moderate load; what did it mean)
- *Review to-dos* = **Release** (closing open loops from prior commitments)
- *Set today's intention* = **Plan / Commit** (highest load; framing today)

This backward-then-forward shape is what the literature most strongly supports for instilling routine consistency.

**Key research and what each finding implies:**

| Research | Finding | Implication for the sequence |
|---|---|---|
| **Schippers, Morisano et al. (2015) — "Writing about goals" intervention** | Structured daily reflection + future-goal articulation produced large academic-performance gains. | Validates the recall → reflect → plan loop. The journal step should be *guided*, not freeform, to capture full effect (see refinement below). |
| **Gollwitzer (1999) — implementation intentions** | "If situation X, then I will do Y" plans roughly double adherence vs. plain goals. | The intention-setting step is most effective when it forces a *when-where-then* trigger pair, not just a list of intentions. |
| **Zeigarnik effect (1927); Allen — *Getting Things Done*** | Unclosed loops produce intrusive thoughts and cognitive overhead. | Review-to-dos placement (closing loops) before forward-planning is **correct** — clearing the mind enables better intention-setting. |
| **Pennebaker (1997) — expressive writing** | Reflective writing improves wellbeing and consolidation of experience. | Journal entry should follow the habit-recall step (you need to remember the day before writing about it) ✓ already in the sequence. |
| **Emmons & McCullough (2003) — gratitude / positive recall** | Counting wins / gratitudes increases motivation more than reviewing failures alone. | Worth surfacing yesterday's *completed* habits prominently in the recall step, not just gaps. A "what went well" moment costs nothing and primes positive affect for the rest of the sequence. |
| **Clear — *Atomic Habits*; identity-based change** | "I am the kind of person who…" framings outperform task-based framings. | The intention-setting step should support an *identity* lens, not just an action lens. |
| **Fogg — *Tiny Habits*; habit chaining** | New behaviors stick when anchored to an existing reliable trigger. | The home page sequence **is itself a habit chain**. Each step's completion should visually "release" the next — small, satisfying transitions reinforce the daily ritual. |
| **Decision fatigue (Baumeister, et al.)** | Cognitive resources deplete through the day. | Sequence the most demanding decision (intention-setting) **after** the easier recall/reflect steps but **before** the user gets pulled into their day. The current placement (step 4, still part of the morning ritual) is appropriate. |
| **Chronotype + morning cognition (Roenneberg)** | Many users have peak executive function shortly after waking. | The sequence should be designed for *first-touch-of-the-day* execution. If a user opens the app at 11pm, the sequence still works but the "intention" step becomes "tomorrow's intention," not "today's." |

**Recommended refinements to the current sequence** (do not break the order — refine within each step):

1. **Step 1 — Record yesterday's habits:** Add a "what went well" tile at the top showing *completed* habits before the *missed* ones. Same data, different emotional priming. (Emmons & McCullough.)
2. **Step 2 — Write yesterday's journal:** Move from blank freeform to **a structured prompt with optional freeform**. Examples: *"One thing I learned yesterday:"*, *"One thing I'd do differently:"*, *"One thing I'm grateful for:"* — these are the Schippers/Pennebaker-validated prompts. Make them dismissible for users who want pure freeform.
3. **Step 3 — Review to-dos:** Reframe slightly from *"review"* (passive) to *"close or carry forward"* (active). Each to-do gets a quick three-state action: ✅ done, ➡️ carry to today, ✗ no longer relevant. Closes loops decisively (Zeigarnik / GTD).
4. **Step 4 — Set today's intention:** This is the single highest-leverage step. Two upgrades:
   - **Implementation-intention format:** prompt the user to phrase the intention as *"When [trigger], I will [behavior]."* Concrete example field. The non-negotiable habit from [§3.5](#35-focused-goal-setting-onboarding-apply-behavioral-science) is auto-suggested as the candidate.
   - **Identity anchor (optional):** an additional field *"Today I want to be the kind of person who…"* (Clear). Skippable.
5. **A 5th micro-step worth piloting:** *"What might get in the way?"* — research on **mental contrasting** (Oettingen) shows that briefly imagining obstacles **alongside** intentions further increases follow-through. One-line input; entirely optional. Place after step 4.

**UI / interaction layer:**
- Sequential, scroll-to-reveal layout — completing a step unlocks/highlights the next. Reinforces the chain (Fogg).
- Each step has a "skip for today" affordance — don't make any step blocking. Forcing the sequence builds resentment, not consistency.
- Each step has a tiny progress indicator at the top so the user knows how many remain.
- Mobile: each step is a full-screen card; desktop: a stacked column visible at once. (Cross-ref [§12 Mobile Layout](#12-mobile-layout--spacing-fixes) and [§13 Desktop Input Parity](#13-desktop-input-parity--mobile-gesture-fallbacks).)

**Why ordering matters more than people think:**
The same four activities done in a different order produce measurably different commitment levels. Reviewing yesterday's *failures* and then setting today's *intentions* without a closing/release step in between (current step 3) actually **decreases** follow-through — the user goes into intention-setting with unresolved cognitive load. The "close to-dos in the middle" placement isn't decorative; it's load-bearing.

**Research-agent dispatch (defer to [§14.2](#142-research-agent-top-10-best-selling-books-on-habits--goals--discipline)-style task):**
- Have agents survey the academic literature on **daily reflection-and-planning routines** and **morning rituals**, specifically: Schippers (goal-setting interventions), Gollwitzer (implementation intentions), Oettingen (mental contrasting / WOOP), Clear (identity-based habits), Fogg (habit stacking), Allen (GTD), Emmons (gratitude), Baumeister (decision fatigue).
- Deliverable: a 1-page synthesis confirming or revising the sequence above, with citations for any revision.
- Update this section by appending findings rather than rewriting — preserves the audit trail of how the design evolved.

**Cross-references:**
- **[§3.5 Focused goal-setting onboarding](#35-focused-goal-setting-onboarding-apply-behavioral-science):** the same Gollwitzer / implementation-intentions research underpins both. The home page's intention step is the daily expression of the onboarding-time commitment.
- **[§14.3 Detect additive habits crowding out non-negotiables](#143-detect-additive-habits-crowding-out-non-negotiables):** the non-negotiable from onboarding gets auto-suggested in step 4's implementation-intention prompt — closes the loop between strategic priority and daily action.
- **[§7 Reflect Tab](#7-reflect-tab--journaling-redesign):** structured prompts from step 2 here should mirror the journaling prompts in the redesigned Reflect tab. Same prompt library, two surfaces.
- **[§14.2 Research-agent task](#142-research-agent-top-10-best-selling-books-on-habits--goals--discipline):** the research-agent dispatch above slots into the same workflow.

**Acceptance:**
- Current four-step order preserved.
- Step 1 surfaces completed habits before missed ones.
- Step 2 offers structured prompts (Schippers/Pennebaker), freeform fallback available.
- Step 3 actions are decisive (done / carry / drop), not just visual review.
- Step 4 supports an "If [trigger], I will [behavior]" format and optionally an identity anchor.
- Optional 5th step ("what might get in the way?") behind a small toggle.
- Each step skippable; no blocking gates.
- Mobile + desktop both audited against [§12](#12-mobile-layout--spacing-fixes) / [§13](#13-desktop-input-parity--mobile-gesture-fallbacks) at the same time.

**Priority:** **High.** The home page is the single most-visited surface; the sequence on it is the daily habit that drives every other habit. Small ordering tweaks here have outsized effects on long-term retention.

---

## 5. Habits & Goals — Cards, Bugs, Organization

### 5.1 Badge overlap on habit/goal cards
- **Problem:** When opening edit on a card, the target/unit-amount badge is sometimes covered by other components on the card.
- **Acceptance:** Badges remain visible and legible in both view and edit states.

### 5.2 "Organize Habits" module is broken
- **Problem:** Certain habits appear simultaneously when they shouldn't. The organize/reorder functionality does not fully work.
- **Problem (additional, 2026-05-12):** The organize tool does **not account for habits that are split into multiple times per day** (e.g., a "Study CFA curriculum" habit with morning / afternoon / evening sessions). The tool either groups or layers them incorrectly, or fails to surface them as a single conceptual habit at all.
- **Action:** Debug end-to-end. Confirm ordering is persisted, deduped, and rendered correctly. Cross-reference [§5.8](#58-multi-time-per-day-habits--independent-check-ins-summing-to-a-daily-target) — the organize tool depends on getting that data model right before its behavior can be fixed cleanly.

### 5.3 Full review of the "Edit Habit" card UI
- **Problem:** Inconsistent font sizes, font types, emoji use vs. no-emoji, spacing.
- **Action:** Audit and standardize. Reference Apple native apps (Reminders, Health, Notes) for layout/option presentation conventions.

### 5.4 Highlight neglected habits/goals with text emphasis
- **Current:** Neglected cards get a red dotted outline.
- **Add:** Red, all-caps text on top of the card (e.g., **"PRIORITIZE TODAY"** or **"NEGLECTED"**) for higher visual emphasis.
- *(See also [§17.9](#179-cross-references) — HealthKit-backed neglect signals are more reliable; promote them harder.)*

### 5.5 SMART framework display under goals
- **Current:** Less readable layout for SMART category data.
- **Change:** For each SMART category, render the **category label** on its own line, then the user-entered string **indented** beneath it.

### 5.6 Warning emoji on habits linked to incomplete goals
- **Problem:** A habit can be linked to a parent goal whose SMART fields (or other required fields) are not fully filled out. Today the habit gives no visual signal that its underlying goal is half-defined.
- **Behavior:** If a habit's linked goal is incomplete (any required field — SMART category, target, deadline, etc. — is empty), the habit card displays a **⚠️** warning emoji.
- **Interaction:** Tapping/hovering the emoji should explain *why* it's flagged (e.g., "Linked goal 'Run a marathon' is missing: Measurable, Time-bound") and offer a direct link to edit that goal.
- **Mirror existing pattern:** Goals themselves already show a warning when their own SMART fields are incomplete — this propagates that signal down to any habits attached to those goals so the user notices in the more frequently visited habits view.
- **Acceptance:**
  - Habit card renders ⚠️ when its `goalId` resolves to a goal with any required field missing.
  - Tooltip / tap target reveals which fields are missing.
  - Indicator disappears in realtime once the parent goal is completed (no manual refresh).
- **Priority:** Medium — visibility/quality bug, not blocking.

### 5.7 Visual clarity — distinguish "layered" vs "grouped" habits
- **Problem:** Today it's hard to tell at a glance which habits on a card are **layered** (a single habit with multiple check-in slots — e.g., 3 study sessions per day) vs **grouped** (multiple distinct habits clustered together for organization — e.g., a "morning routine" containing stretch, meditate, journal). These are conceptually different things and currently look similar in the UI.
- **Behavior required:**
  - Layered habits: render stacked / segmented progress (one segment per slot), with a single habit title and per-day rollup (e.g., "2 of 3 today").
  - Grouped habits: render a clear collapse / expand affordance OR a thin container outline, with a group title and a count of distinct habits (e.g., "3 habits").
  - Labels must reflect the difference — never reuse "3 of 3" ambiguously for both.
- **Acceptance:** A user glancing at the habits page can identify in <2 seconds whether a card is layered or grouped, without tapping in.
- **Cross-reference:** Depends on [§5.8](#58-multi-time-per-day-habits--independent-check-ins-summing-to-a-daily-target) for the layered data model; depends on [§5.2](#52-organize-habits-module-is-broken) for the grouping mechanism.
- **Priority:** Medium — clarity bug. Users currently can't tell what they're looking at.

### 5.8 Multi-time-per-day habits — independent check-ins summing to a daily target

> **🟡 Partial fix shipped 2026-05-13** — User-reported symptom: "all slots mark at once" when tapping one slot. Root cause: `swipeAnim` and `swipeRef` in `renderCard` were keyed by `habit.id` alone. For multi-slot habits that render as multiple rows under the same `habit.id`, swipe state bled across rows — one swipe lit up every row's green flash. Data layer (`togHabit` + `slotCompletions`) was actually correct; only the visual was lying.
>
> Fix: derive `animKey = renderSlot ? habit.id + ":" + renderSlot : habit.id` and key swipeAnim/swipeRef + the HabitCardShell sig by it. Each row now owns its own swipe animation. Shipped, deployed, tests stay 25/25.
>
> **Still possibly broken** (not yet repro'd or fixed):
> - Multi-slot habits with a numeric target (`target` + `targetOp`): the `togHabit` "increment" branch is unreachable for multi-slot habits because `isMultiSlot` short-circuits. Tapping the action circle with `mode === "increment"` falls into the multi-slot branch which only knows "done" / "missed" / "none" — so increment for a slot with a target effectively clears the slot.
> - Partial-day rollup is not visually surfaced. Two of three slots done shows the habit as "not done" with no "2 of 3" indicator. This is intentional per the design but may explain other "doesn't function properly" reports.
> - The forward-looking model in this section (per-slot quantity targets, optional time-bound slots, streak rules for partial days) is not yet implemented. The current model is binary per slot.

- **Concept:** Some habits naturally split into multiple sessions per day. Example: **"Study CFA curriculum" — 3 hours/day across 3 sessions**. Each session should be its own check-in (so the user gets the satisfaction of marking each, and can do them at different times), but the day's goal isn't "complete" until the sum across sessions meets the daily target.
- **Behavior required:**
  - User can configure a habit with `slotsPerDay: N` (e.g., 3) and either a per-slot quantity (e.g., 1 hour each) or a per-day cumulative target (e.g., 3 hours total).
  - Each slot has its own check-in UI — independent timestamp, independent state of completed / skipped / missed.
  - Day-level rollup: the habit shows as "complete" only when the sum (slots completed, or cumulative quantity) meets the daily target. Partial days display "1 of 3 today" / "2 of 3 today" without claiming completion.
  - Streak math: a partial day does **not** extend the streak unless the target was hit. (See open question below.)
- **Implications across the codebase:**
  - **Data model:** Habit needs `slotsPerDay` (int, default 1) and `slotTarget` (optional). `completions` becomes per-slot-per-day rather than a per-day boolean. Migration: existing habits default to `slotsPerDay: 1` to preserve current behavior.
  - **`utils.js`:** All streak / completion / "due today" logic must be updated. Tests in `tests/utils.test.mjs` need new cases for partial days, fractional progress, and slot-skipping. This is the most-touched core math change currently in this TODO.
  - **UI surface area:** Habit cards, today's view, calendar day view, the organize module ([§5.2](#52-organize-habits-module-is-broken)), and the layered-vs-grouped distinction ([§5.7](#57-visual-clarity--distinguish-layered-vs-grouped-habits)) all depend on this.
  - **AI features ([§14](#14-ai-features)):** The routine optimizer (14.1) and additive-vs-non-negotiable detector (14.3) must reason about slots, not just habits. A "study" habit with 3 missed slots is a different signal than a single missed habit.
- **Open questions:**
  - Does a partial day extend the streak? (Likely no — but consider showing a "soft streak" of partial-completion days separately.)
  - Can slots be **time-bound** (must complete by 11 AM, 3 PM, 8 PM) vs **untimed** (any 3 slots before midnight)? Default: untimed; time-bound is an opt-in.
  - Migration: do we silently default existing habits to `slotsPerDay: 1`, or offer an in-app prompt to upgrade selected habits?
- **Priority:** **High** — foundational model change. Gates [§5.2](#52-organize-habits-module-is-broken), [§5.7](#57-visual-clarity--distinguish-layered-vs-grouped-habits), and AI work in §14. Should be planned (via `superpowers:writing-plans`) before any other §5 work begins.

---

## 6. Future Goals & Future Habits — Brainstorm Staging Area

### 6.1 Concept
Let users **brainstorm and store future goals and habits separately from the active list**, so the active surface stays focused on what they're actually working on today. When workload clears, the user migrates a future item into the active list with one tap.

**Mental model:** "active" = what I am tracking and being held accountable to right now. "future" = what I want to do *eventually*. Mixing the two clutters the daily UX and dilutes the user's focus signal.

### 6.2 Existing surface to extend
A "future-goals drawer" already exists per commit `c4f62a9` on the desktop habits + goals layout. This item:
- **Confirms that direction** and asks to extend the pattern to **habits** as well (currently only goals have it).
- **Generalizes the concept** to a richer brainstorm space, not just a holding pen.

### 6.3 Feature requirements
- **Two staging buckets, one per kind:** "Future Goals" and "Future Habits".
- **No tracking on future items:** They do not appear on the today view, the calendar, streak math, neglected-habit warnings, or any analytics. They are inert.
- **Full editability:** User can still fill out SMART fields, notes, target dates, frequency, etc., while the item sits in the future bucket. This is "brainstorm mode" — the user can craft a high-quality plan before committing.
- **One-tap migration:** "Activate" button on a future item flips it to active. Conversely, "Move to Future" on an active item demotes it (preserves history, halts tracking).
- **Discoverable but not intrusive:** Available from the goals/habits page via a tab, drawer, or "Future" view toggle. Default view = active only.
- **Optional reminders:** User can choose to be prompted every N weeks ("You have 4 future goals — review them?"). Off by default.

### 6.4 Data model implications
- Add a `status: 'active' | 'future' | 'archived'` field to both habit and goal records.
- All existing logic that reads habits/goals must filter on `status === 'active'` (today view, streak math, completion gates, AI features). Audit every read site before this ships — silent bugs are likely if a future item leaks into active math.
- Migrations from future → active must reset `createdAt` (or capture an `activatedAt`) so streaks don't accidentally credit time spent in the future bucket.

### 6.5 UX details to nail
- Future items render visually distinct (muted color, dashed border, faded badges) so the user instantly sees the bucket they're looking at.
- The count of future items appears as a small badge on the goals/habits page header so they're not forgotten.
- Bulk operations: select multiple future items and "Activate all" or "Archive all".
- Search and filter apply across both buckets.

### 6.6 Interaction with other roadmap items
- **[§20 Infrastructure](#20-infrastructure--scaling--cost-efficient-to-thousands-of-users):** Future items live in the same per-user Firestore doc — no extra storage tier needed; just a status flag. Free.
- **[§14 AI features](#14-ai-features):** The AI routine optimizer (14.1) and the additive-vs-non-negotiable detector (14.3) **must ignore future items** by design. Active-only.
- **[§5.6 Warning emoji on incomplete-goal habits](#56-warning-emoji-on-habits-linked-to-incomplete-goals):** A habit linked to a *future* goal should not show the warning emoji while inactive — but should show it the moment the user activates the habit. Worth a test case.

### 6.7 Priority
- **Medium.** High-value organizational feature but not v1-critical. The "future-goals drawer" piece is already shipped per c4f62a9; the extension to habits and the migration-flow polish are the remaining work.

### 6.8 Pass 1 audit (2026-05-13) — what's shipped vs the spec

**What's actually in the code today:**

The existing "Future Goals drawer" at [index.html:19198–19241](../index.html#L19198) is a collapsible row at the bottom of the Goals tab. Its membership is **derived implicitly**, not stored:

```js
const futureGoals = (data.goals || [])
  .filter(g => !(data.habits || []).some(h => habitLinkedToGoal(h, g.id)));
```

A goal lands in the drawer if and only if no habit currently links to it. There is **no `status` field on goals**, and there is **no Future Habits drawer at all** — Habits has no equivalent surface.

**Audit findings against §6.3 / §6.4:**

| Spec | Shipped today | Gap |
|---|---|---|
| Two staging buckets (Future Goals, Future Habits) | Future Goals only — Future Habits does not exist | Build the Habits side. |
| `status: 'active' \| 'future' \| 'archived'` field on records | Not present. Bucket membership for goals is derived from habit linkage. Goals can be archived via a separate `archivedGoals` counter ([index.html:3882](../index.html#L3882)) but archive isn't a status enum. | Two paths — see Pass 2 below. |
| Future items don't appear in today view / calendar / streak math / neglected-habit warnings / AI features | **Partially.** Drawer goals don't show on the active grid, but they ARE read everywhere else — AI features, completion stats, goal-linked journal queries all see them. | Either add a `status` filter at every read site, or accept the implicit-derivation rule (already correctly excludes from `findCorrelations`/`detectOffSchedule` because those run over habits, and a future goal has no habits). |
| Full editability while parked | ✓ Drawer rows tap into the same Edit Goal modal. | None. |
| One-tap migrate active ↔ future | ✗ No explicit toggle. User must add/remove a linking habit to flip a goal's bucket. | Add explicit "Activate" / "Move to Future" buttons. |
| "Move to Future" preserves history but halts tracking | N/A — no current path to demote an active item. | Build alongside the migration toggle. |
| Discoverable count badge on the page header | ✗ Drawer label shows the count when expanded ([index.html:19222](../index.html#L19222)), but no top-of-page badge. | Add the badge. |
| Bulk operations | ✗ Not implemented. | Build. |
| Optional N-week review reminders | ✗ Not implemented. | Build. |

### 6.9 Pass 2 — two implementation paths

The big decision is the data model. The Pass 1 audit surfaced two viable approaches:

#### Path A — explicit `status` field (matches the §6.4 spec)

Add `status: 'active' | 'future' | 'archived'` to both goal and habit records. Audit every read site:

- Goals: `data.goals.filter(g => g.status === 'active')` on the active grid, AI features, journal-by-goal queries, achievement math.
- Habits: same — today view, streak math, completion gates, neglected-habit warnings, calendar render, AI features, reports.

**Migration shim:** in the data-load path ([index.html:3245-ish](../index.html#L3245)), default missing `status` to `'active'` so legacy records work. Add an explicit data migration on next save to bake the default in.

**Pros:** Matches the spec exactly. Generalizes cleanly to `archived`. Habits-side trivially supported.
**Cons:** Multi-region change across `index.html`. Audit risk — a missed read site means a future item bleeds into active math, which would be a real bug (e.g., a future habit getting a streak counter). Per CLAUDE.md this is "substantial work — invoke from the brainstorming/writing-plans loop."

#### Path B — extend the implicit-derivation rule (smaller change)

Define "future" per kind without a new field:
- **Future Goal:** existing rule. Goal with no linked habit.
- **Future Habit:** new rule. Habit with `frequency` unset OR a new boolean flag `parked: true` set by an explicit "Move to Future" action.

Build a Future Habits drawer that mirrors the existing Future Goals drawer. Activate = clear `parked` (or set a default frequency). Move to Future = set `parked: true`.

**Pros:** Smaller blast radius — only Habits-tab render code needs a new filter, and parked habits are easy to opt out of streak/calendar logic with one `parked === true` check.
**Cons:** Doesn't generalize to `archived`. Two different rules for "future" (one derived from links, one from a flag) is inconsistent.

#### Recommendation

**Start with Path B** for the Future Habits drawer. Ship the smaller change first to validate the UX (does the user actually want a "parked habits" surface?). Migrate to Path A when archived is needed, or when the next status-introducing feature lands (e.g., "snoozed for a week" or "vacation mode"). Defer the explicit-`status` rewrite until there's a second motivating use case.

#### Path B shipped 2026-05-13

- Habit records now carry a `parked: boolean` (default `false`, migrated on read).
- Edit Habit modal exposes a **Move to Future / Activate** toggle button next to Delete + Save Changes. Writes the flag and closes the modal.
- New **Future Habits** drawer at the bottom of the Habits tab, collapsed by default. Mirrors the existing Future Goals drawer pattern (`showFutureHabits` state + a header strip that toggles a habit list). Tapping any row opens the Edit Habit modal where the user can hit **Activate** to pull it back into the active list.
- Parked habits are filtered out of:
  - `filtH` → so they don't appear in `groupedH` sections on the Habits tab
  - `memoedCorrelations` input to `findCorrelations`
  - `memoedOffSchedule` input to `detectOffSchedule`
  - `detectAdditiveCrowding` input
  - Calendar `allHabits` / `scheduledOnly`
  - Reports `allHabitsForReport` (per-habit list) and `activeReportHabits` (Overview buckets)

Still **not filtered** (low-priority, not user-visible regressions):
- Goal-linked habit lists in goal cards. A goal with a parked habit linked to it still shows the habit name in the goal's "Linked habits" list. Could be intentional ("yes, the goal has this habit parked"); revisit if it confuses anyone.
- Streak math (`getStreak`, `getCR`, etc.) reads `h.completions` directly. For a parked habit with no recent completions, these return zero — harmless. If a habit was parked WHILE having recent completions, those completions still count toward its streak/rate if anything ever reads them — but nothing does, since parked habits don't render anywhere they'd be measured.
- Free-tier 5-habit cap counting ([§1.5](#15-free-tier-limits-proposed-numerical-caps)) — not yet wired, so the cap doesn't yet count parked habits either way. When §1.5 ships, the cap should count active habits only.

Deferred to Path A migration when a second status-introducing feature (archive / snooze / vacation) lands.

If Path B ships first:
- Add `parked: false` default in the data-load shim.
- Add a "Move to Future" item to the Edit Habit modal's footer; mirror "Move back to Active" in the drawer.
- Hide parked habits from: Habits-tab section render, calendar, streak math (`getStreak` shouldn't be called for them, but if it is, the result is harmless — no completions = streak 0), AI features (`findCorrelations` already filters `!avoid`; add `!parked`), neglected-habit warnings, Reports.

That's a roughly 8–12 callsite change in `index.html` — well under the multi-region threshold that warrants planning ceremony.

### 6.10 Pre-Pass-2 open questions

- Does the user want the "Future" concept to be visible on **mobile** too, or is the desktop drawer enough? The existing drawer is shipped on the desktop layout per c4f62a9 — verify whether it appears on the mobile Goals view.
- Should a Future *habit* count toward the free-tier 5-habit cap from [§1.5](#15-free-tier-limits-proposed-numerical-caps)? Recommendation: **no** — parked items are inert, so they shouldn't consume the gate. This matters because users will park 5–10 brainstormed habits while picking what to commit to. Penalize parking and they won't use the feature.
- How does this interact with [§6.6](#66-interaction-with-other-roadmap-items)? The cross-refs there assume Path A's `status` field. If we ship Path B first, the cross-refs need a one-line update.

---

## 7. Reflect Tab — Journaling Redesign

### 7.1 Past journal entries don't appear in the Reflect tab
- **Bug:** Previously written entries are not surfaced.
- **Acceptance:** Reflect tab lists historical entries, browsable by date.

### 7.2 Redesign Reflect tab using best-in-class journaling apps as reference
- **Research target:** Day One, Apple Journal, Stoic, Reflectly, etc.
- **Preserve required functionality:**
  - Daily journal entry
  - Goal-specific journal entry
  - "Other" / freeform journal entry
- **Deliverable:** Updated layout that shows history, supports the three entry types, and feels modern.

---

## 8. Urgent To-Do

### 8.1 Add archive feature
- Allow archiving urgent to-dos (instead of only delete / complete).
- Archived items must be retrievable.

---

## 9. Calendar Day Detail View

### 9.1 Clicking a day shows full daily snapshot
- **Acceptance:** When the user taps any day on the in-app calendar, show:
  - Which goals were active/touched
  - Which habits were completed (or missed)
  - Which to-dos were due / completed
  - Which journal entries were written
- **Priority:** High (high-value daily-review feature).

---

## 10. Version History

> **🟢 Shipped 2026-05-13** — §10.1, §10.2, and §10.3 are now implemented end-to-end. The data layer was already stamping snapshots on every edit (the `h.history` and `g.history` arrays were populated since well before this session); §10.3 added the surfacing.

### 10.1 Goal version history
- ✅ Track edits to goals over time.
- **How:** Goal saves stamp a snapshot of the prior state (`{ ts, text, type, smart, icon }`) into `g.history` whenever a tracked field changed. See [index.html:7657](../index.html#L7657) for the snapshot-creation path.

### 10.2 Habit version history
- ✅ Track edits to habits over time.
- **How:** Habit saves stamp a snapshot of the prior state (`{ ts, text, duration, type, importance, section, notes, frequency, icon }`) into `h.history` whenever a tracked field changed. See [index.html:8268](../index.html#L8268) for the snapshot-creation path.

### 10.3 Surface history inside My Account / settings
- ✅ Goal completions + goal edits + habit edits are surfaced in **My Profile → History** as a single unified reverse-chronological timeline.
- Each row shows a colored kind-dot ("Goal completed" / "Goal edited" / "Habit edited"), the item's current name, its Area-of-Life pill, and a relative timestamp (Today / Yesterday / Nd ago / date).
- Edit rows include a *Previously: "old text"* line so the user can see what changed at a glance.
- Goal-completion rows preserve the existing "Next: <follow-up goal>" affordance.
- Empty state when no events exist: "No history yet — keep using the app and edits will land here."
- See [§11.6](#116-surface-version-history-here) — this section was its cross-reference. Same page; check it off.

Deferred for future passes:
- **Restore from snapshot** — clicking an edit row could revert the habit/goal to that prior state. Not implemented; would need a confirm modal + careful overwrite logic. Data is preserved, so this is buildable when there's demand.
- **Per-snapshot diff detail** — showing exactly which field changed (text vs section vs frequency) rather than just the prior name. Currently shows the prior text for both habits and goals; that's the most identifying field. The other snapshot fields are kept in the data — the render just doesn't surface them yet.
- **Deleted habit/goal history** — when a habit or goal is hard-deleted, its history vanishes with it. To preserve, we'd need a separate `habitGraveyard` / `goalGraveyard` collection. Not done.

---

## 11. My Profile, Account & App Settings

> Merged from previously separate Profile and Settings sections. Both are user-controlled configuration surfaces; treating them as one helps avoid duplicated UI patterns.

### 11.1 Remove "your primary goal" section
- Delete this UI block from the profile page.

### 11.2 Reduce padding on My Profile
- The page has too much internal padding overall.

### 11.3 Keep "App Progress" function in sync with feature set
- The app-progress / progress-toward-using-features indicator must be **updated whenever features are added or removed**.
- **Process note:** Add a checklist item to any feature-add / feature-remove PR that touches the progress tracker.

### 11.4 Reorganize the Habit Reports section

- **Problem:** Current layout makes long-term success/rates hard to browse.
- **Action:** Design a better scroll / browse pattern for viewing habits and their long-term success rates over time.

#### Pass 1 — audit (2026-05-13)

**Current layout** ([index.html:22716–22779](../index.html#L22716)):

1. Sticky section title "Habit Reports".
2. Three aggregate stat cards: Best Streak · Avg Rate · Done Today (computed across all non-avoid habits).
3. Range filter: Week / Month / Year — applies globally to every heatmap below.
4. Single linear list, one card per habit, sorted by current streak descending ([index.html:22697](../index.html#L22697)). Each card carries:
   - Habit name + AVOID pill if applicable
   - 🔥 streak / 📈 rate / importance label
   - `YearHeatmap` strip (horizontally scrollable)

**What's actually hard to browse:**

| Friction | Why it bites |
|---|---|
| One sort, one view | No way to see only struggling habits, only Non-Negotiables, or only morning habits. Everything is in one giant scroll. |
| Sort by streak desc buries the habits that need attention | A new struggling habit sits at the bottom; oldest reliable habits sit at the top. Inverted from "what should I worry about?" |
| Aggregate stats are too aggregated | "Avg Rate 67%" doesn't tell you whether your Non-Negotiables are at 95% and your Additives at 20%, or vice versa. |
| Heatmap takes 80% of each card's height | On mobile, two habit cards fill the viewport; comparing rates across the list requires constant scrolling. |
| No "is anything broken?" surface | A user opening this tab on a Sunday afternoon to do a weekly review wants the answer in 5 seconds, not 60. |
| No grouping by section or importance | Can't ask "is my morning routine working?" without scrolling all habits. |

#### Pass 2 — Overview tab shipped (2026-05-13)

The Overview sub-tab (the highest-leverage of the three sub-views designed below) is live. New behavior on the Habit Reports panel inside My Profile:

- Top of the panel: a sub-tab strip — **Overview** (default) · **Per-habit**.
- **Overview** shows three at-a-glance buckets (only the non-empty ones render):
  - **Attention needed** — habits whose 30-day rate is below 50%, sorted by importance (Non-Negotiable first), then lower-rate first within each tier.
  - **Strongest performers** — top five habits by current streak.
  - **Falling behind** — habits whose last-7-day completion rate dropped more than 20 percentage points vs. the prior 7-day rate, sorted by drop size.
  - Each row: habit name · numeric badge (rate + streak, or streak + rate, or `−Npp · M% now` depending on bucket) · 7-cell monochrome sparkline (today on the right, filled = done).
  - When all three buckets are empty: "Nothing flagged. Tap Per-habit for the full list."
- **Per-habit** keeps the original heatmap-per-habit list with the Week / Month / Year range filter, unchanged. Moved into a tab so the Overview gets primary real estate without losing any detail.
- Top stat row (Best Streak / Avg Rate / Done Today) moved from "always visible at the top" to "inside Overview only," consistent with the sub-view's at-a-glance purpose.

Tunables for follow-up: `< 50%` attention threshold, `> 20pp` falling-behind threshold, monochrome vs. gradient sparkline. Reasonable defaults locked in for now.

Deferred for future passes (per the design below): the Per-habit filter + sort controls and the By-section sub-tab.

#### Pass 2 — original three-sub-view design (for reference)

Add a sub-tab strip at the top of the panel: **Overview · Per-habit · By section**. Range filter (W/M/Y) stays global to all three.

##### Overview (NEW — the missing capability)

Goal: 5-second answer to "is anything broken?" — no heatmaps, scannable.

- **Top stat row** (preserved): Best Streak · Avg Rate · Done Today.
- **Attention needed** — habits with rate < 50% over the active range, sorted by importance (Non-Negotiable first). Compact row: name · rate · streak · 1-week sparkline (most-recent 7 cells from `getLast14`).
- **Strongest performers** — top 5 by current streak.
- **Falling behind** — habits whose last-7-day rate dropped vs prior-7-day rate by > 20 percentage points. Catches regressions that "current streak" hides.

##### Per-habit (existing list, lightly improved)

- **Filter pills above the list:** All · By section · By importance · At risk (rate < 50%). Multi-select; reuse the pill pattern from the Habits tab filter row.
- **Sort dropdown:** Streak desc (default) · Rate desc · Recent (most recently completed) · Alphabetical · Importance.
- **Heatmap collapse:** default to most-recent 90 days. "Show full year" toggle per card. Reduces vertical footprint ~3× on mobile.
- Card content otherwise unchanged.

##### By section (NEW)

- One collapsible row per section (Morning · Afternoon · Evening · Daily Completion · Avoid + any custom sections).
- Section header row shows aggregate: section name · total habits · avg rate · done today · best streak in section.
- Tap to expand → renders the existing per-habit cards scoped to that section.
- Answers "is my morning routine working?" without scrolling.

#### Implementation cost (rough)

| Sub-view | Effort | Reuses |
|---|---|---|
| Overview | M | `getCR`, `getStreak`, `getLast14` from `utils.js`; new tiny sparkline component (could be a degenerate YearHeatmap with `cellSize=6` and `range="week"`). |
| Per-habit | S | Filter pill pattern from Habits tab; sort dropdown is plain `<select>`. Heatmap-collapse state per habit can live in component state. |
| By section | S–M | Pure grouping. Reuses the existing per-habit card. Expansion state per section. |

#### Suggested ship order

1. **Overview first** — biggest single improvement (no equivalent surface today), smallest perceived risk (purely additive — current list moves into its own tab unchanged).
2. **Per-habit filter/sort second** — power-user feature; only adds value once Overview has covered the "default" case.
3. **By section last** — useful, but the user can already see this on the Habits tab itself in a less data-dense form.

#### Open questions for Pass 2 commit

- Does the sub-tab strip live inside the existing `reportsPanel`, or is each sub-view its own top-level Profile panel? Current Profile nav has `account · scorecard · inspiration · content · history · reports · settings`. Splitting reports into three panels makes the Profile nav longer; inline tabs keep it tight. Recommend inline.
- Sparkline cell scale: monochrome (filled = done) or color-gradient (matches YearHeatmap)? Recommend monochrome — Overview is meant to be scanned, not studied.
- "Falling behind" threshold tuning: 20pp drop is a starting guess. Validate against real user data once telemetry exists.

### 11.5 Full audit of every setting

#### Pass 1 — audit (2026-05-13)

Settings live in two surfaces:
- **Local-device prefs** (localStorage only — by design they don't sync across devices)
- **App data prefs** (in `data.*` — persisted via `save()` to both localStorage and Firestore)

Audit complete. Status legend: ✓ works as described · ⚠️ documented-but-suboptimal · ✗ broken (picker is decorative or wiring is missing).

##### Local-device prefs (localStorage)

| Setting | Key | Status | Notes |
|---|---|---|---|
| Theme mode (Default / Custom) | `v-settings-mode` | ✓ | Persists via `useEffect` at [index.html:5926](../index.html#L5926). Local-only by design. |
| Dark Mode | `v-dark-mode` | ✓ | Body class flip; orthogonal to theme mode. |
| Accent Color | `v-accent-color` | ✓ | 12 swatches + freeform hex picker; CSS-var injection. |

##### Content prefs (Firestore-synced via `save()`)

| Setting | Field | Status | Notes |
|---|---|---|---|
| Goal Categories (custom) | `data.customGoalTypes` | ✓ | Delete clears `goal.type` on tagged goals ([index.html:22963](../index.html#L22963)). |
| Habit Importance (custom) | `data.customImportance` | ⚠️ | Delete removes the option from the picker but leaves orphaned `habit.importance` strings on existing habits. **User is warned in the confirm dialog**, so this is documented behavior — but the orphaned habits then carry a label that no longer appears in the picker, with no path to re-pick. See Pass 2 candidate fix below. |
| Time of Day groups (custom) | `data.customSections` | ⚠️ | Same shape as importance — delete confirms "Habits in this group will need to be reassigned" but doesn't actually reassign. Habits in a deleted section need manual rescue. |
| Time-of-Day Hours (start/end per Morning, Afternoon, Evening) | `data.timeRanges` | ✓ | 24-hour coverage banner warns when gaps or overlaps appear ([index.html:23119](../index.html#L23119)). Evening can wrap past midnight. |

##### Location / Notifications

| Setting | Field | Status | Notes |
|---|---|---|---|
| Home location (typed) | `data.homeLocation` | ✓ | 60-char cap. |
| Home location (GPS) | `data.homeCoords` | ✓ | One-shot fix via `locationService.getCurrent()`. |
| Detect when away | `data.locationOptIn` | ✓ | `useEffect` at [index.html:8818](../index.html#L8818) checks position on mount + on opt-in change. Toggle visually disabled until GPS captured. |
| Notifications | `data.notifyOptIn` | ✓ | Fires only when `state === "away" && data.notifyOptIn && permission === "granted"` ([index.html:8841](../index.html#L8841)). Toggle disabled when browser permission is `denied`. |

##### AI / automation

| Setting | Field | Status | Notes |
|---|---|---|---|
| Briefing Tone (Warm / Neutral / Tough Love) | `data.aiTone` | ✓ | Cached briefing is cleared on change so the next Brief-tab visit regenerates in the new voice ([index.html:23266](../index.html#L23266)). |
| Evening Debrief (opt-in) | `data.eveningDebriefEnabled` | ✓ | Card on Brief tab gated by `enabled && hour >= 18` ([index.html:14067](../index.html#L14067)). Shipped in commit `b8d5ed3`. |
| Weekly Review — **day** | `data.weeklyReview.day` | ✓ | `weeklyReviewCard` shows when `todayDow === wr.day` ([index.html:13941](../index.html#L13941)). |
| Weekly Review — **hour** | `data.weeklyReview.hour` | ✗ | **Picker is decorative.** The hour is saved ([index.html:23311](../index.html#L23311)) and used to pre-fill the picker on next open, but `weeklyReviewCard` never reads it — the card appears the moment the Brief tab is opened on the chosen day, regardless of the user's chosen hour. The hour-picker label and dropdown promise behavior that doesn't exist. |

##### Other actions

| Action | Status | Notes |
|---|---|---|
| Replay Welcome Tour | ✓ | Clears `v-tour-done` (localStorage), closes profile sheet, opens tour at step 1. Note: `v-tour-done` is localStorage-only — replaying on one device doesn't reset tour-seen state on another. Out of scope for Pass 2 unless flagged. |
| Reset to Verrocchio Defaults | ✓ | Visible only in Custom mode. Resets `settingsMode` + `accentColor`. Intentionally leaves Dark Mode alone (orthogonal toggle, per comment at [index.html:22779](../index.html#L22779)). |

#### Pass 2 — fixes shipped (2026-05-13)

1. **✓ Weekly Review hour wired.** `weeklyReviewCard` now gates on `now.getHours() >= (wr.hour ?? 0)` in addition to the day check. The card appears on the chosen day starting at the chosen hour and persists until the user dismisses it (sets `weeklyReviewDone`) or the day rolls. Legacy data without an `hour` field falls through (treated as hour 0). See [index.html:13938](../index.html#L13938).
2. **✓ Custom Habit Importance deletion — non-destructive cleanup.** Deleting a custom importance now finds habits with `habit.importance === <deleted value>` and re-assigns them to `"Important"` (the middle built-in tier). The confirm dialog reports the count: *"Delete 'Critical'? 3 habits using it will be moved to 'Important'."* `setImpFilter` is also cleared of the deleted value so the filter pill doesn't leave a stale entry. Mirrors the goal-category cleanup at [index.html:22963](../index.html#L22963).
3. **✓ Custom Time-of-Day group deletion — same shape as #2.** Deleting a custom time-of-day group re-assigns affected habits to `"morning"` (the earliest built-in section). The deletion path recovers the original kebab-case `value` from `data.customSections` before filtering, since the manageList rendering layer overwrites `value` with `label` for display.
4. **Deferred — cross-device tour replay.** Moving `v-tour-done` from localStorage to `data.tourSeen` (Firestore-synced) so "Replay Welcome Tour" on one device hides the tour on the user's others is still open. Defer unless multi-device users hit it.

#### Pass 1 scope notes (what wasn't audited)

- **My Account panel** (auth, sign-out, account deletion) — scoped to [§11.7](#117-in-app-account-deletion), not this audit.
- **My Routines** (Routine Compare, moved out of App Settings per comment at [index.html:23373](../index.html#L23373)) — its own surface; audit when that section is touched.
- **App Progress scorecard** — read-only, not a settings surface ([§11.3](#113-keep-app-progress-function-in-sync-with-feature-set) tracks it separately).
- **Inspiration / Content / History panels** — content management, not configuration.

### 11.6 Surface version history here
- Per [§10.3](#103-surface-history-inside-my-account--settings), goal and habit version histories should be accessible from this page.

### 11.7 In-app account deletion
- Apple requires apps with sign-in to provide in-app account deletion. Verify Firebase Auth user deletion is wired through to a UI button before submission. *(Cross-ref [§22.4](#224-verrocchio-specific-watch-items).)*

### 11.8 Manage subscription
- Per [§21.6](#216-whats-needed-before-first-paid-build), provide a "Manage Subscription" link that deep-links to iOS Settings → Subscriptions.

### 11.9 Public profile — username + profile picture
**Concept:** Each user can claim a **public username** (e.g., `@zgthomas`) and upload a **profile picture**. Together these form the user's public identity — the minimum surface needed for other users to find, recognize, and connect with them in the [§2 Social layer](#2-social--community-layer--anchor-pillar-of-the-app).

**Username:**
- **Format:** 3–20 chars, lowercase letters + digits + underscore. Must be unique across the app.
- **Claim flow:** during onboarding or first time the user opens the profile page. Validate uniqueness on submit; suggest 3 alternatives if taken.
- **Visibility:** the username is **the only identifier** that gets shown to other users in social contexts. Email, real name, and UID stay private by default.
- **Real-name field stays separate and optional** — only shown to confirmed connections, never to the network at large.
- **Mutable:** users can change their username, but rate-limited (e.g., once per 30 days) and old usernames are reserved for 90 days before they can be re-claimed by someone else. Prevents impersonation when handing off a username.
- **Reserved-name list:** block obvious abuse vectors (`admin`, `verrocchio`, `support`, `claude`, etc.) and trademarked terms at signup.

**Profile picture:**
- **Upload from photo library / camera / Apple Memoji.**
- **Client-side resize/compress before upload** — target ≤200 KB WebP/JPEG, max dimension 512×512px. Same compression rule that applies to general image attachments per [§20.3](#203-user-saved-content--the-real-cost-question).
- **Storage:** Cloudflare R2 at `users/<uid>/avatar.webp` (zero-egress cost path). Falls back to Firebase Storage if R2 isn't wired up yet.
- **Default:** initial letter avatar generated client-side from username (no asset cost) until the user uploads one.
- **Moderation:** because avatars are public to anyone the user shares with, basic image moderation eventually needs consideration (per [§20.9](#209-open-questions-to-resolve-before-building-user-saved-content) open question on image moderation). For v1, ship without active moderation and rely on the report flow from [§2.4](#24-privacy--safety--non-trivial-surface). Revisit when scale demands.

**Privacy posture:**
- **Discovery is opt-in, not automatic.** Having a public username does **not** mean appearing in any search index, leaderboard, or friend-of-friend graph (per [§2.4](#24-privacy--safety--non-trivial-surface) — *"no public profiles in v1"*). The username is *queryable when known* (someone types your exact username to invite you), not *discoverable* (no public list).
- **Profile picture only shows to connected accountability partners**, not to the entire app. Until a mutual share exists, even users who know your username only see the letter avatar.
- This resolves the open question in [§2.12](#212-open-questions-to-resolve-before-building) about how users find each other — **the answer is invite-by-username**, with the picture visible only after connection.

**Data model:**
- Add to user record: `profile: { username: string, displayName?: string, photoUrl?: string, photoUpdatedAt?: ts }`.
- **Username index:** `usernames/{username}` doc → `{ uid }` for fast uniqueness lookups + reverse mapping. Firestore rules: anyone authenticated can read by exact key (for invite resolution); only the owner can write their own mapping.
- **Reserved-username collection:** `usernames_reserved/{username}` doc for blocklist.

**Cross-references:**
- **[§2 Social](#2-social--community-layer--anchor-pillar-of-the-app):** depends on this section. Username is the invite primitive; profile picture is the recognition primitive.
- **[§2.12](#212-open-questions-to-resolve-before-building):** this section closes the "how do users find each other" open question (invite-by-username).
- **[§3 Onboarding](#3-onboarding--new-user-experience):** the username claim can happen during onboarding, but is optional — users can choose to claim later without blocking signup. *(Profile picture upload should never block onboarding.)*
- **[§20.3 User-saved content](#203-user-saved-content--the-real-cost-question):** avatar storage falls under the image tier; small per-user cost, R2 recommended.

**Acceptance:**
- Username field on profile page; uniqueness validation; rename rate limit.
- Profile picture upload with client-side compression to ≤200 KB.
- Default letter avatar generated client-side.
- Both fields visible per the privacy rules above; never leaked beyond the user's accountability partners except for the username when invoked explicitly.
- Block/report flow ([§2.4](#24-privacy--safety--non-trivial-surface)) treats avatar abuse identically to other content abuse.

**Priority:** Medium-High — needed for the v1-minimum social slice ([§2.11](#211-priority--anchor-pillar-v1-minimum-slice-required)). Without a way to identify and find each other, the social layer can't function. Ship username + default letter avatar in the v1 social slice; allow custom photo upload to land in v1.x.

---

# Part III — Cross-Platform UX Consistency

> Verrocchio runs on iPhone, iPad, and desktop browser. Each platform has its own input modality and screen real estate. These sections audit the friction points where one platform's design hurts another's experience.

---

## 12. Mobile Layout & Spacing Fixes

### 12.1 Reduce horizontal padding on mobile (iPhone widths)
- **Problem:** Too much border/padding on left and right sides squeezes content.
- **Visible symptom:** On the Habits page, the row containing the "Add Habit" button plus the "Today", filter, sort, and other pills wraps onto **two rows instead of one**.
- **Acceptance:** On iPhone width (~390px), the Add Habit button + all pills fit on a single row.
- **Priority:** High (most-visible polish issue).

### 12.2 Reduce gap between header and top action buttons (Goals & Habits pages)
- **Problem:** Spacing between the page header and the row of buttons just below it is too large on both pages.
- **Acceptance:** Visually tighter; matches Apple-native app spacing conventions.

### 12.3 Reduce excessive spacing inside the To-Do tab
- **Problem:** Too much vertical spacing between items / sections.
- **Acceptance:** Denser layout that still reads cleanly.

### 12.4 Fix text wrapping site-wide
- Audit habit cards, goal cards, and any other text-bearing component for broken wrapping or truncation.
- **Acceptance:** No clipped text, no awkward single-word overflow lines at common widths (390, 768, 1024+).

### 12.5 Reduce vertical spacing between cards
- **Problem (observed 2026-05-12):** Card-to-card vertical spacing is currently too large — applies across habit cards, goal cards, and likely other list surfaces. Possible regression from recent layout work; verify against git history before assuming bug vs. intentional.
- **Acceptance:** Tighter card stacking that still reads cleanly. Match Apple-native list-density conventions (Reminders, Notes, Health). Keep enough breathing room to make tap targets unambiguous but cut excess whitespace.
- **Audit scope:** habit cards, goal cards, to-do list items, journal entries in Reflect, calendar day-snapshot items. Should be a single shared spacing token, not per-component values.
- **Cross-ref:** [§12.3](#123-reduce-excessive-spacing-inside-the-to-do-tab) is a narrower instance of the same problem. Fixing 12.5 globally may close 12.3.

---

## 13. Desktop Input Parity — Mobile-Gesture Fallbacks

### 13.1 Audit every mobile gesture for a desktop equivalent
- **Problem:** Several actions in the app are reachable only via touch gestures (swipe, long-press, drag) that do not translate to a laptop trackpad / mouse environment. Example reported by user: **marking a habit as "missed" on a habit card is awkward / not obviously doable on a laptop**.
- **Audit scope:** Walk through every interactive surface and identify any action that today requires:
  - Swipe (left/right) — habit cards, to-do items, journal entries
  - Long-press — likely on habit cards for context menus
  - Drag-to-reorder — Organize Habits, Goals
  - Pinch / two-finger gestures (if any)
- **Acceptance:** Every gesture-driven action has a **discoverable** desktop affordance:
  - Visible button, kebab/ellipsis menu, or right-click context menu
  - Keyboard shortcut where appropriate (e.g., `m` for missed, `c` for complete on the focused habit)
  - Hover state reveals action icons on habit/goal/to-do cards at desktop widths
- **Specific known case:** Habit card needs an obvious "Mark missed" affordance on desktop — not a swipe. Could be: a small ✗ button that appears on hover, an ellipsis menu on the card with Complete/Skip/Missed options, or a right-click context menu.

### 13.2 Drag-to-reorder needs a desktop-friendly alternative
- **Problem:** Reordering habits/goals via drag works on touch but is finicky on a trackpad and impossible with keyboard alone.
- **Acceptance:** Provide ↑ / ↓ buttons (or a dedicated "Reorder" mode with up/down controls) at desktop widths, and ensure keyboard arrow keys move the focused row when in reorder mode.

### 13.3 Responsive affordance switch
- **Rule of thumb:** At pointer-coarse (touch) widths, prefer gestures + minimal chrome. At pointer-fine (mouse/trackpad) widths, prefer visible buttons / hover affordances / right-click menus.
- **Implementation hook:** Use the existing device profile system in `index.html` (per `verrocchio-frontend` skill) — gate gesture-only UI behind the mobile profile and render explicit controls on desktop.
- **Priority:** High — usability blocker on the primary development surface (laptop).

---

# Part IV — Intelligent / AI Features

> AI-powered behavioral interventions and content generation. All AI features cost real money per call ([§20.5](#205-ai-proxy-cloudflare-worker--usage-cap-per-user)); pricing/gating implications live in [§1.4](#14-whats-behind-the-paid-wall-pro-only).

---

## 14. AI Features

### 14.1 Habit-routine optimizer based on neglected habits
- **Goal:** AI analyzes which habits have been ignored historically and **suggests a new routine** that re-prioritizes the neglected ones, possibly swapping them in for habits the user reliably hits.
- **Outcome:** User misses fewer days overall.

### 14.2 Research agent: top 10 best-selling books on habits / goals / discipline
- **Action:** Dispatch agents to scan the internet for the top 10 best-selling books in this space.
- **Deliverable:** Summary of each book's core principles.
- **Use:** Inform product decisions so the app's design aligns with proven behavioral-science fundamentals.

### 14.3 Detect additive habits crowding out non-negotiables
- **Problem:** User consistently completes additive (nice-to-have) habits while repeatedly missing a non-negotiable. The successful additive can act as a distraction or substitute for the harder, more important habit.
- **Detection signal:** Analyze recent completion patterns. Flag when an additive habit's completion rate is high (e.g., >80% over N days) AND a non-negotiable habit's completion rate is low (e.g., <50% over the same window), especially when the additive is typically completed at a time of day that overlaps or precedes the missed non-negotiable.
- **AI behavior — prompt the user:** Ask directly: "Are any of the habits you're nailing distracting you from the ones that matter most?" Surface the specific suspected pair(s).
- **AI behavior — suggested actions:**
  - **Reorder:** Suggest moving the non-negotiable above the additive in the day's habit order so the user encounters it first.
  - **Forcing function:** Optionally gate / dim / lock the additive habit's completion UI until the non-negotiable is done that day. (Soft lock with override, not hard lock.)
  - **Pair / chain:** Suggest stacking the non-negotiable as a prerequisite ritual to the additive (habit chaining).
- **Acceptance:**
  - User receives a contextual prompt when the pattern is detected (not nagging — throttled, e.g., once per detected pattern per week).
  - Reorder action persists and updates the home/today view.
  - If forcing-function variant is built, it is opt-in per habit pair and respects an override tap.
- **Dependency:** Requires habits to carry a `priority` / `nonNegotiable` flag (currently informal — verify or add to habit schema).
- **Priority:** Medium-High — high-leverage behavioral intervention; aligns with item 14.1's broader routine-optimizer theme.
- **Related:** Item 14.1 (routine optimizer based on neglected habits) — 14.3 is the narrower, paired-habit case of the same principle.

### 14.4 AI-personalized home page tips
- Per [§4.2](#42-ai-generated-tips-based-on-user-data), tips and reminders should be personalized by analyzing several days of inputted user data.

#### Shipped 2026-05-13

The `smartTips` engine on the Brief tab already analyzes the user's data (off-schedule detection, habit-pair correlations, low-completion habits, incomplete SMART goals, missing details, unused-feature nudges). §14.4 adds an AI rewrite layer on top of that data signal.

- **Trigger:** a useEffect runs on Brief tab visit when `AI_ENABLED && data.aiConsentAt && completionDayCount() >= 7`.
- **Signal selection mirrors smartTips priority:** top off-schedule hit first, then top correlation by lift. If neither exists, the AI path is silent — pure templates render.
- **Prompt:** assembled from the signal's exact specifics (habit names, percentages, section, lift). System prompt enforces tone (Warm / Neutral / Tough love from `data.aiTone`), 2-sentence max, no new facts, no moralizing.
- **API call:** reuses the existing `callAiForDebrief(systemPrompt, userPrompt, 110)` helper. Same auth + consent + idToken plumbing as Morning/Evening Debrief.
- **Cache:** result stored at `dailyRitual[<dateKey>].aiTipBody` keyed by `aiTipKey` (a hash of the signal). Same signal on the same day reads the cache; signal change or new day re-fires.
- **In-session dedupe:** a useRef-backed `Set` prevents a second fire before the first call's `updateRitual` lands.
- **Render:** the cached `aiTipBody` is prepended to `smartTips[0]` with title "Personalized for you" and an icon matching the signal (🕘 off-schedule, 🔗 correlation). Existing templated tips slot in below — no template is ever overwritten.
- **Graceful degradation:** any failure path (no consent, no signal, AI off, fetch error, < 7 days of data) results in the existing templated tips rendering exactly as before.

What this gives users: the same data-driven signal now arrives in their preferred voice, with natural language phrasing instead of a template. Cost: one Anthropic call per signal-changeover per day.

Future enhancements (not in this pass):
- Pro gating per [§1.4](#14-whats-behind-the-paid-wall-pro-only) once the paid tier ships. Currently available to anyone with AI consent.
- Journal-sentiment-based tips (§4.2 explicitly mentions journal sentiment as a data source). The infrastructure exists; just needs a new signal extractor.
- An "AI rewrite all three tips" mode rather than just the top one.

### 14.5 Voice-driven AI scheduling
- See [§18.3](#183-voice-driven-ai-scheduling) — the AI half of calendar integration. Tracked under the calendar section since it depends on calendar OAuth.

---

# Part V — iOS Platform & Cross-App Integration

> The native iOS surfaces beyond the main app window: widgets, lock screen, Siri, Watch, and integrations with other apps on the user's iPhone. All five share the same underlying infrastructure (App Group shared storage + App Intents framework) — design them as one cohesive system, not five separate features.

---

## 15. iOS Widgets, Lock Screen & Surface Glances

### 15.1 Concept
Verrocchio's value compounds when habits are visible at glance. The iOS platform offers four ambient surfaces where the app can live outside its main window — each should be considered first-class:
- **Home Screen widgets** (small / medium / large)
- **Lock Screen widgets** (iOS 16+ — inline / circular / rectangular)
- **StandBy mode** (iOS 17+ — large landscape view when iPhone is charging horizontally)
- **Apple Watch complications + glances** (when/if we ship a Watch app — see [§19](#19-apple-watch-companion-app--future))

These are not bonus polish; they are how a habit tracker stays present in the user's day without requiring them to open the app. The whole "did I do my run today" check should be a 1-second glance, not an app launch.

### 15.2 Home Screen widgets
**Small (2×2):** the single most-prioritized habit for today + completion state. Tap → opens the app to that habit.

**Medium (4×2):** today's full habit list (compact rows) with completion indicators. Tap a row → opens that habit. Best widget for most users.

**Large (4×4):** today's habits + active goals snapshot + current streaks. The "dashboard" widget for power users.

**Interactivity (iOS 17+):** the small + medium widgets should support **direct habit toggling** without launching the app, via App Intents wired through `Button(intent:)` in WidgetKit. One tap on the home screen = habit marked complete. This is the killer feature — no app launch required.

### 15.3 Lock Screen widgets (iOS 16+)
Three lock-screen widget shapes, all small:
- **Inline (text-only, beside the time):** "3 of 5 habits done today". One pure status line.
- **Circular:** ring progress (% of today's habits complete). Like an Apple Watch ring.
- **Rectangular:** the next un-completed habit's name + a tiny progress indicator.

**Privacy guardrail:** lock-screen widgets render when the phone is **locked and possibly visible to others** (kitchen counter, restaurant table). Never show:
- Journal text or excerpts
- Goal names if marked "private"
- Anything from the [§2 Social layer](#2-social--community-layer--anchor-pillar-of-the-app) (partner names, partner messages)
- AI-generated tips that might be personal

Habit names are user-controlled, so they're acceptable on the lock screen by default — but provide a setting to hide habit names on lock-screen widgets ("show counts only") for shared-device users.

### 15.4 StandBy mode (iOS 17+)
- Large landscape widget designed for nightstand viewing while charging.
- **Content:** evening view — "habits remaining for today" + "tomorrow's habits" + current streaks.
- **Brightness-aware:** must render legibly in StandBy's dim red night mode. Test in that mode explicitly.

### 15.5 Apple Watch (deferred — see [§19](#19-apple-watch-companion-app--future))
- The Watch surface is treated as its own section because it requires a distinct WatchOS target.
- **Required preparation now:** the data layer must be reachable from a Watch extension via App Group shared storage (same as widgets — see 15.6). Build it once for widgets; Watch reuses it.

### 15.6 Capacitor-specific implementation
This is where things get non-trivial because verrocchio is a Capacitor web app, but widgets and watch apps are native Swift.

- **Widget extension is a separate Xcode target.** Native SwiftUI code, not Capacitor / WebView. Cannot run `index.html` inside a widget.
- **Shared data via App Group:** create an App Group (`group.app.verrocchio.shared`). Both the main app and the widget extension read/write from this group's UserDefaults / shared file container.
- **Sync mechanism:**
  1. The main app, on every habit/goal change, writes a denormalized "widget snapshot" (today's habits + completion state + streaks) into the App Group container.
  2. Main app calls `WidgetCenter.reloadAllTimelines()` to tell the widget to refresh.
  3. Widget reads the snapshot at render time — fast, offline, no network.
- **What gets written to the snapshot:** ONLY the minimum needed for widget rendering. Keep this denormalized blob small (<100 KB).
- **Interactive widgets need App Intents** (per [§16](#16-siri--app-intents--apple-intelligence)) — the widget's "mark complete" button invokes an App Intent that updates the App Group store *and* signals the main app to sync to Firestore the next time it opens. Wire these once; reuse across widgets, Siri, and Shortcuts.

### 15.7 Privacy & App Store implications
- Widgets don't require new entitlements beyond the App Group capability.
- Privacy disclosures must mention that habit data is mirrored to a shared container readable by the widget extension (same security domain as the app — not a privacy concern but worth noting).
- Lock-screen widgets are subject to extra App Review scrutiny because they render outside auth — Apple checks that no sensitive data leaks. Self-audit per 15.3 before submission.

### 15.8 Free vs Paid split
Slots into [§1 Monetization](#1-monetization-strategy--free--paid-split--referral-unlock):
- **Free:** small home screen widget + inline lock screen widget + StandBy widget (the basics).
- **Free:** medium home screen widget with completion display (read-only).
- **Referral-unlocked:** medium + large home screen widgets + circular + rectangular lock screen widgets.
- **Pro:** **interactive widgets** (tap-to-complete from home/lock screen) + Apple Watch complications (when shipped).

Reasoning: widgets cost almost nothing to run (no network); gating most of them is purely a friction-to-upgrade lever. The interactive widget tier is genuinely premium-feeling and a clear paid-tier hook.

### 15.9 Cross-references
- **[§17 Third-party integrations](#17-third-party-app-integration-on-ios--deep-links--auto-completion):** the App Intents used for interactive widgets (15.2) are the **same App Intents** exposed to Shortcuts (17.3 Tier B) and Siri ([§16](#16-siri--app-intents--apple-intelligence)). Write them once.
- **[§20 Infrastructure](#20-infrastructure--scaling--cost-efficient-to-thousands-of-users):** widget data lives on-device in the App Group. No Firestore cost. Free at any scale.
- **[§22 App Store via TestFlight](#22-app-store-submission-via-testflight):** the widget extension target must be configured in App Store Connect (separate provisioning profile). Add to the first TestFlight build that ships widgets, not retrofitted.
- **[§2 Social](#2-social--community-layer--anchor-pillar-of-the-app):** a future "partner pulse" widget could show whether a chosen accountability partner has done their habits today — but that needs careful privacy review per 15.3.

### 15.10 Priority
- **High.** Widgets are the single highest-leverage "you don't have to open the app" feature for a habit tracker. The phase order is naturally:
  - **v1.x:** small + medium home screen widgets + StandBy + inline lock screen. Read-only.
  - **v1.x + 1:** interactive widgets (tap to complete) — once App Intents are in place from [§16 Siri](#16-siri--app-intents--apple-intelligence).
  - **v2:** Apple Watch app + complications ([§19](#19-apple-watch-companion-app--future)).

---

## 16. Siri / App Intents / Apple Intelligence

### 16.1 Concept — yes, this is very doable
**Yes** — verrocchio can integrate with Siri richly via Apple's modern **App Intents** framework (iOS 16+). This is the same framework that powers Shortcuts, widgets (interactive), Spotlight actions, Apple Intelligence suggestions (iOS 18+), and Siri voice control. **One implementation surface, many entry points.**

Voice examples that should work:
- "Hey Siri, mark my morning run as complete in Verrocchio."
- "Hey Siri, what habits do I have today in Verrocchio?"
- "Hey Siri, log a journal entry in Verrocchio."
- "Hey Siri, what's my current run streak?"

And — without explicit Siri invocation — these App Intents power Spotlight suggestions, the Action button (iPhone 15 Pro+), Shortcuts automations, interactive widgets, and Apple Intelligence's contextual suggestions on iOS 18+.

### 16.2 Core App Intents to expose (the "actions" surface)
Start with a focused, useful set:
- **MarkHabitComplete** — params: habitName (or habit picker). The most-used intent.
- **MarkHabitMissed** — explicit missed-marking action (relevant per [§13.1](#131-audit-every-mobile-gesture-for-a-desktop-equivalent)).
- **WhatAreMyHabitsToday** — read-only intent; Siri reads the list back.
- **StartJournalEntry** — opens the app to a fresh journal entry, optionally with dictation.
- **LogJournalEntry** — params: text. Creates an entry from dictated content without opening the app.
- **WhatIsMyStreak** — params: habitName. Returns the current streak count.
- **OpenHabit** — params: habitName. Launches the app to a specific habit (powers Spotlight suggestions).
- **AddHabitFromVoice** *(stretch)* — full habit creation by voice. Lower priority; complex parameter elicitation.

Each intent declares its parameters with **App Intents'** type system so Siri can ask follow-up clarification questions naturally ("Which habit?" if not specified).

### 16.3 Conversational interactions
- **Parameter elicitation:** if the user says "Hey Siri, mark a habit complete" without naming the habit, the framework can prompt "Which habit?" and the user replies by voice. Implement `IntentDialog` strings for natural prompts.
- **Result dialog:** after an intent succeeds, Siri can speak a confirmation. Keep these short and varied ("Done.", "Marked.", "Got it. That's a 12-day streak now.").
- **Snippet views:** intents can return a SwiftUI snippet that Siri displays — e.g., asking for today's habits returns a compact list visible in the Siri overlay. Worth building for the read-only intents.

### 16.4 Apple Intelligence (iOS 18.1+) — proactive surface
iOS 18.1+'s Apple Intelligence layer can proactively surface relevant App Intents:
- **Spotlight suggestions:** if the user searches "run" in Spotlight, "Mark run complete in Verrocchio" appears as an action.
- **Contextual suggestions:** when Apple Health detects a completed workout, iOS may proactively suggest "Mark morning run complete in Verrocchio" in the Action Suggestions row.
- **Siri's smarter contextual mode:** in conversation with Siri about fitness, our intents become eligible suggestions.

**To opt in:** simply expose App Intents with rich metadata, parameter types, and `IntentDescription` strings. Apple's intelligence layer indexes them automatically. No bespoke ML work on our side.

### 16.5 Watch + AirPods integration (deferred)
- App Intents donated from the iPhone propagate to the Watch and to AirPods Pro 2 (head-gesture replies) once we ship a Watch companion. Architect once, deploy everywhere.
- **No additional Siri-specific work** needed for Watch — same intents.

### 16.6 Tech / Capacitor implementation
- App Intents are **Swift-native** code; cannot live in `index.html`. Add an `Intents` Swift module to the Capacitor iOS shell that:
  - Defines each `AppIntent` struct.
  - Reads/writes the App Group shared store (same one used by widgets — see [§15.6](#156-capacitor-specific-implementation)).
  - For intents that need round-tripping into the WebView (e.g., creating a journal entry the React UI knows about), uses the existing Capacitor bridge to fire an event the WebView listens for.
- **State synchronization:** an intent run while the app is closed mutates the App Group store directly. The next time the WebView app opens, it reconciles the App Group store with its in-memory state and pushes any changes to Firestore. Same mechanism as widget interactivity (15.6).
- **Shortcuts donation:** "donate" frequently-used intents so they appear in Shortcuts/Spotlight without manual user setup. E.g., after a user marks a habit complete a few times via Siri, the app donates that intent to Shortcuts automatically.

### 16.7 Privacy + App Store implications
- **No new entitlements** beyond what App Intents framework grants by default.
- Siri data handling is on-device for most intents — no audio leaves the user's iPhone unless they enable server-side Siri processing in iOS settings.
- **No privacy policy update required** unless we start passing intent-derived data to server-side AI features (cross-ref [§14 AI features](#14-ai-features) — those have their own disclosures).
- App Review will spot-check Siri integration; ensure all intents work without crashing when the app has never been launched.

### 16.8 Cross-references
- **[§15 Widgets](#15-ios-widgets-lock-screen--surface-glances):** widget interactivity (tap-to-complete) and Siri voice both invoke the same App Intents. Build once.
- **[§17 Third-party integrations](#17-third-party-app-integration-on-ios--deep-links--auto-completion):** Tier B (Shortcuts) directly uses these App Intents. Section 17.3 Tier B is essentially "expose intents → user chains them in Shortcuts app."
- **[§14 AI features](#14-ai-features):** voice-driven AI scheduling ([§18.3](#183-voice-driven-ai-scheduling)) is partially served by a Siri-invoked intent that hands off to our AI proxy. Different concept than direct voice→AI but worth aligning.
- **[§13 Desktop input parity](#13-desktop-input-parity--mobile-gesture-fallbacks):** App Intents aren't reachable from desktop, so desktop affordances remain a separate problem.

### 16.9 Free vs Paid split
Slots into [§1 Monetization](#1-monetization-strategy--free--paid-split--referral-unlock):
- **Free:** All basic Siri intents — mark complete, mark missed, what are my habits today, what's my streak.
- **Pro:** AI-augmented Siri intents (voice-driven scheduling per [§18.3](#183-voice-driven-ai-scheduling), AI-generated journal prompts via voice, intelligent habit suggestions). Anything that costs Anthropic API calls per invocation.

Reasoning: basic intents have zero per-user cost — gating them would feel petty and hurt accessibility. The AI-backed intents have real cost and are a natural paid-tier hook.

### 16.10 Priority
- **High.** Modern iOS users expect voice control of any frequently-used app. The build cost is moderate (a few days of Swift work for a focused intent set) and reuses the App Group infrastructure already needed for widgets. Build widgets and Siri intents **together** — they share 60%+ of the underlying code.

### 16.11 Open questions
- Should Siri-invoked completions update streaks immediately, or wait for the next app sync? (Recommended: immediate via App Group, then reconciled with Firestore on next launch.)
- For the "what are my habits today" read intent, do we read the live Firestore state (requires the device to have data fetched recently) or the App Group snapshot (always available, may be stale)? (Recommended: snapshot, with a "last synced X minutes ago" suffix if stale.)
- Do we support voice-driven *habit creation* in v1, or defer it? (Defer — parameter elicitation for SMART fields is messy.)
- How do we disambiguate when two habits have similar names ("morning run" vs "evening run")? (App Intents framework handles disambiguation prompts natively if we declare them as `EntityQuery`-backed parameters.)

---

## 17. Third-Party App Integration on iOS — Deep Links + Auto-Completion

### 17.1 Concept
Habits and goals can be **linked to other apps on the user's iPhone** in two directions:
- **Outbound (launch):** Tapping a habit card opens the linked third-party app — e.g., the "morning run" habit launches **Runna**, the "meditate" habit launches **Calm**, the "read" habit launches **Kindle**. One tap removes the friction between *intending to do a habit* and *being in the app that does it*.
- **Inbound (auto-complete):** When the user completes the corresponding activity in the third-party app, verrocchio detects it and marks the habit complete automatically — e.g., finish a run on Runna, the "morning run" habit ticks itself off in verrocchio without the user opening verrocchio.

Both directions remove friction. Outbound is mostly trivial; inbound is the high-leverage feature and is where most of the work lives.

### 17.2 Outbound deep linking (the easy half)
- **Mechanism:** iOS URL schemes (`runna://`, `strava://`, `headspace://`, etc.) and Universal Links where supported.
- **Per-habit config:** habit record gains an optional `integration: { kind: 'launch', uri: 'runna://' }` field. Tapping the habit launches the URI.
- **Fallback chain:**
  1. App installed → open it.
  2. App not installed → present a sheet: "Get Runna in the App Store" with a direct App Store link.
  3. No URI configured → behaves as normal habit card.
- **Discovery UX:** in the habit edit modal, surface a curated picker of common companion apps (Runna, Strava, Apple Health, Headspace, Calm, Kindle, Duolingo, MyFitnessPal, etc.) plus an "Other / custom URI" field.

### 17.3 Inbound auto-completion (the hard, high-leverage half)
Three tiers of integration mechanism, ordered from most universal to most bespoke:

**Tier A — Apple HealthKit (the universal layer).** Most fitness, mindfulness, and sleep apps write to HealthKit. Reading HealthKit is the single highest-ROI integration path:
- One iOS entitlement covers integration with hundreds of apps that write to HealthKit (Apple Health, Runna, Strava, Garmin Connect, Whoop, Oura, Apple Watch workouts, Headspace, Calm, MyFitnessPal, etc.).
- Habit config gains `integration: { kind: 'healthkit', sampleType: 'HKWorkoutActivityType.running', minDuration: 600, minDistance: 1000 }` etc.
- A background fetch (or on-app-open sync) queries HealthKit for matching samples since the user's last sync and auto-marks the corresponding habits complete on the dates samples fall on.
- **This is the primary inbound mechanism.** Single integration unlocks the long tail.

**Tier B — Apple Shortcuts / App Intents.** For non-HealthKit apps that the user wants to integrate:
- verrocchio exposes a "Mark habit complete" App Intent (per [§16.2](#162-core-app-intents-to-expose-the-actions-surface)).
- User builds a Shortcut: "When [trigger from another app] → run verrocchio's Mark Complete intent with habit=X".
- Power-user feature; works for any iOS app that exposes a Shortcut trigger.
- Bonus: verrocchio can expose other intents ("Start journaling", "Show today's habits") that users can invoke from Siri / Spotlight / Home Screen actions.

**Tier C — Direct API / webhook integrations.** Last resort, per-app work:
- Strava OAuth + webhooks; Garmin; Whoop; etc.
- High cost per integration (OAuth flows, refresh tokens, vendor approval processes, ongoing API changes).
- Defer until 5+ users specifically ask for an app that's not HealthKit-or-Shortcut reachable.

### 17.4 Per-habit configuration (the UX glue)
- **In habit edit:** add an "App integration" section with three sub-options:
  - **Open app on tap** (outbound, from 17.2)
  - **Auto-complete via HealthKit** (inbound Tier A, from 17.3) — picker of HealthKit sample types + thresholds
  - **Auto-complete via Shortcut** (inbound Tier B) — instructional UI showing the user how to wire it
- **Default:** none. Integrations are opt-in per habit.
- **Multi-source:** a habit can have both an outbound link and an inbound completion source (most common case — "run" habit launches Runna AND auto-completes from HealthKit workouts).

### 17.5 Privacy, entitlements, App Store implications
- **HealthKit entitlement** must be added to the Capacitor iOS target. App Store Review requires:
  - Plain-language usage description in `Info.plist` (e.g., "Verrocchio reads workout data from Apple Health to automatically mark fitness habits as complete.").
  - Privacy nutrition labels updated to disclose health data access.
  - **Health data must never leave the device** — Apple is very strict here. We must **not** sync HealthKit-derived data to Firestore. Only the *resulting habit completion* (which is just a date) goes to Firestore. The raw HealthKit sample stays local. *(This is a hard rule.)*
- **App Privacy policy** ([docs/PRIVACY_POLICY.md](PRIVACY_POLICY.md)) must be updated to disclose HealthKit usage before this ships.
- **Permission UX:** request only the specific HealthKit data types each habit needs, not blanket access. Re-request granularly when a user enables a new HealthKit-backed habit.
- **HIPAA is not in scope** — verrocchio is not a covered entity. But adopting Apple's "health data stays on device" rule prevents accidentally tripping into PHI territory.

### 17.6 Tech stack — Capacitor plugin requirements
- **HealthKit access:** existing community plugin (e.g., `capacitor-health` or equivalent) — evaluate; if quality is poor, write a thin native bridge. Native code lives in the iOS shell, not in `index.html`.
- **URL scheme launching:** Capacitor's built-in `App.openUrl(...)` covers outbound deep links.
- **App Intents / Shortcuts donation:** requires a small Swift bridge in the Capacitor iOS shell registering the intents (shared with [§16](#16-siri--app-intents--apple-intelligence)).
- **Background fetch:** iOS background processing scheduled task that periodically reads HealthKit for new samples and reconciles habit completions. Bounded by iOS background-execution limits — best-effort, not real-time.
- **None of this requires Android equivalents** for v1 since the app is iOS-first via Capacitor. Android Health Connect is the equivalent path if/when we ship Android.

### 17.7 Suggested first-wave integrations (the launch set)
Cover the 80% case at minimum cost:
1. **Apple Health / HealthKit workouts** — running, walking, cycling, swimming, strength training (auto-complete fitness habits).
2. **Apple Health / HealthKit mindfulness** — covers Headspace, Calm, Apple Mindful Minutes (auto-complete meditation habits).
3. **Apple Health / HealthKit sleep** — auto-complete sleep-related habits.
4. **Outbound launchers** — Runna, Strava, Headspace, Calm, Kindle, Duolingo, MyFitnessPal (URL schemes only; no auth required).
5. **Apple Shortcuts intent** — "Mark verrocchio habit complete" exposed so power users can wire anything.

That's it for v1 of the integration feature. Direct OAuth integrations (Strava, Garmin, etc.) defer to demand-driven later work.

### 17.8 Free vs Paid split
Slots into [§1 Monetization](#1-monetization-strategy--free--paid-split--referral-unlock):
- **Free:** Outbound deep links (any habit can link to any app, unlimited).
- **Free:** HealthKit auto-completion on up to **2 habits**.
- **Referral-unlocked:** HealthKit auto-completion on up to **5 habits** + Shortcuts intent access.
- **Pro:** Unlimited HealthKit-backed habits + direct API integrations (Strava, etc., when shipped).

Reasoning: outbound has zero per-user infra cost — free. HealthKit reads are local-only — also near-zero cost. Caps exist mostly to drive upgrade rather than to recoup spend. Direct API integrations have real per-call cost and OAuth maintenance burden — gate those.

### 17.9 Cross-references
- **[§18 Calendar integration](#18-calendar-integration--two-way-sync--voice-scheduling):** same "third-party data source" pattern. Calendar work and HealthKit work can share an integration framework (`integrations/` module exposing a uniform `read(externalSource, since) → events` interface). Don't build two parallel integration stacks.
- **[§20 Infrastructure](#20-infrastructure--scaling--cost-efficient-to-thousands-of-users):** HealthKit data never enters Firestore (per 17.5). Outbound URLs cost nothing. Direct API integrations would cost OAuth-token storage + webhook receivers in the Cloudflare Worker — budget those when scheduled.
- **[§22 App Store via TestFlight](#22-app-store-submission-via-testflight):** HealthKit entitlement + privacy manifest entries must be in the **first** TestFlight build that ships any health-integration code, not retrofitted.
- **[§1.4 Pro features](#14-whats-behind-the-paid-wall-pro-only):** "direct third-party integrations (Strava, Garmin, etc.)" is in the Pro list.
- **[§2 Social](#2-social--community-layer--anchor-pillar-of-the-app):** auto-completed habits (via HealthKit) are **harder to fake** than self-reported habits — this raises the trust value of shared progress in the social layer. Accountability partners can be more confident that a "✓ completed morning run" actually happened. Consider surfacing a small "Verified by Apple Health" badge on auto-completed habits in shared views.
- **[§5.4 Neglected-habit emphasis](#54-highlight-neglected-habitsgoals-with-text-emphasis):** if a habit is HealthKit-backed and has *not* been auto-completed in N days, the neglect signal is more reliable — promote it harder.

### 17.10 Priority
- **High.** Strong differentiator and high-friction-removal feature. Apple Health integration alone provides outsized value for fitness-tracker users (a large segment of the audience). Most of the iOS surface is reachable via HealthKit + Shortcuts with one entitlement and one Swift bridge — favorable build/value ratio.
- **Recommended phasing:**
  - **v1.x (immediately post-launch):** Outbound URL launchers + Apple Shortcuts intent (low cost, no entitlement gymnastics).
  - **v1.x + 1:** HealthKit read integration for workouts + mindfulness + sleep (the high-value tier).
  - **v2:** Direct OAuth integrations (Strava, Garmin) **only** as user demand warrants.

### 17.11 Open questions
- How does auto-completion interact with manual completion? If the user manually marks a habit complete and HealthKit later reports a matching workout, do we count it twice? (Recommended: idempotent per date — one completion per day per habit; auto-completion is silently a no-op if already complete.)
- Do auto-completed habits get journal-entry prompts the same way manual completions do? (Recommended: yes, but bounce the prompt off the user's last app-open rather than the completion timestamp.)
- How far back do we look in HealthKit on first sync — last 7 days? Last 30? All-time? (Recommended: last 30 days on first sync; daily delta after.)
- If a user has two habits both backed by the same HealthKit type (e.g., "morning run" and "evening run"), how do we disambiguate? (Likely by time-of-day window in the habit config.)
- Should outbound app launchers count as a "completion intent" for analytics — i.e., if the user taps a habit to open Runna and never marks complete, do we surface a "you tried but didn't finish" insight? (Probably yes; cheap to track and useful for the AI tips feature in [§14](#14-ai-features).)

---

## 18. Calendar Integration — Two-Way Sync & Voice Scheduling

> ⚠️ **CRITICAL PRIORITY — UNDEVELOPED.** Together with [§2 Social](#2-social--community-layer--anchor-pillar-of-the-app), AI-assisted calendar integration is one of the two **core differentiators** of the product that has not yet been built. The combination of a habit/goal tracker + accountability layer + AI-aware scheduling against the user's real calendar is the wedge that distinguishes Verrocchio from generic habit-tracker competitors. Treat this section with the same urgency as §2 — both should land in v1.x at the latest, not deferred to v2.

### 18.1 Two-way calendar sync (export)
- Allow exporting habits and to-dos onto the user's mobile or desktop calendar (iCloud, Google Calendar, Outlook).

### 18.2 Two-way calendar sync (import)
- Allow importing the user's email/work calendar into the app.
- **Goal:** Verrocchio becomes the **single source of truth** for the user's day.

### 18.3 Voice-driven AI scheduling — the headline feature
- User can **speak to the AI**; AI moves/reassigns habits and to-dos around the immovable items on the user's calendar.
- This is the **load-bearing user experience** of Verrocchio's "AI-assisted daily routine optimization" positioning. Without it, the AI features ([§14](#14-ai-features)) are merely reactive nudges; with it, the AI becomes an active scheduling collaborator who reshapes the day in real time around what actually happened.
- **Requirements:**
  - Calendar read/write permission flow (OAuth for Google/Microsoft, EventKit for iOS)
  - Identification of "immovable" events vs. flexible ones
  - Reading current habits + goals + to-dos
  - Suggesting an optimized layered schedule
  - Voice input pipeline → AI tool-call → calendar mutation
  - Reaches this section via Siri ([§16.9](#169-free-vs-paid-split) — Pro tier).

### 18.4 Priority — critical and undeveloped
- **Critical.** This and [§2 Social](#2-social--community-layer--anchor-pillar-of-the-app) are the two pillars of the product's differentiation that **currently do not exist in the codebase**. Both must move from "designed in this doc" to "shipping" before any v2 features are entertained.
- **Phasing:**
  - **v1.x (immediately post-launch):** §18.1 + §18.2 — read-only calendar import as a one-way display layer. Lowest-risk foothold.
  - **v1.x + 1:** Two-way sync (export of habits/to-dos to calendar).
  - **v1.x + 2:** Voice-driven AI scheduling ([§18.3](#183-voice-driven-ai-scheduling-the-headline-feature)). This unlocks the "AI optimizes my day" product narrative.
- **Dependencies that gate this work:**
  - OAuth infrastructure for Google + Microsoft calendars (net-new — not in the current stack).
  - AI proxy ([§20.5](#205-ai-proxy-cloudflare-worker--usage-cap-per-user)) extended with tool-calling for calendar mutations — including server-side rate limits per [§20.5](#205-ai-proxy-cloudflare-worker--usage-cap-per-user).
  - Permission UX that doesn't scare users off (calendar OAuth scopes are intimidating; the consent screen needs careful copy).

---

## 19. Apple Watch Companion App — Future

### 19.1 Note
A future version of verrocchio should include a **native Apple Watch app**. The Watch is the most habit-tracker-aligned surface Apple makes — strap-on, glance-able, low-friction, and already where users check progress on movement/exercise rings. Putting verrocchio on the wrist removes the last bit of "open the phone first" friction.

### 19.2 What the Watch app should be at minimum
- **Glance view:** today's habits with completion state. Tap row → mark complete.
- **Complications** for all watch face families (corner, modular, graphic circular, inline): "X of Y habits complete today" or "next habit: morning run".
- **One-tap complete from a complication** where the WatchOS family supports it.
- **Streak surfacing** on the larger complications (graphic rectangular, modular large).

### 19.3 What it should NOT be in v1 of the Watch app
- Full habit/goal editing — too cramped on the wrist; defer to iPhone.
- Journaling — voice dictation possible but messy; defer.
- Social interactions — defer until the [§2 Social](#2-social--community-layer--anchor-pillar-of-the-app) layer is well-established on iPhone first.
- AI features — round-trip latency and Watch battery cost not worth it.

### 19.4 Tech / Capacitor implications
- The Watch app must be a **native SwiftUI WatchOS target** in the Capacitor iOS Xcode project. Capacitor's WebView model does **not** run on WatchOS — there is no WebView.
- **Data layer:** must reach the Watch via:
  - Same App Group shared storage used by widgets and Siri intents (see [§15.6](#156-capacitor-specific-implementation)) — local glance data.
  - `WatchConnectivity` framework for syncing changes made on the Watch back to the phone.
- **Reuse:** the App Intents from [§16 Siri](#16-siri--app-intents--apple-intelligence) and the widget infrastructure from [§15 Widgets](#15-ios-widgets-lock-screen--surface-glances) are the foundation — the Watch app is largely a SwiftUI front-end over the same shared store + same intents. Don't build a parallel data stack.

### 19.5 Cross-references
- **[§15.5 Apple Watch architectural prep](#155-apple-watch-deferred--see-19):** the prep work needed on iPhone (App Group, denormalized snapshot, App Intents) is a prerequisite. Don't start the Watch app until that's done.
- **[§22 App Store via TestFlight](#22-app-store-submission-via-testflight):** Watch apps ship as a target inside the iOS app, so no separate App Store listing — but App Review will validate the Watch target separately.
- **[§1 Monetization](#1-monetization-strategy--free--paid-split--referral-unlock):** Watch app should be **Pro-only** at launch — it's a premium-feeling, native-investment feature and a clean upgrade hook.

### 19.6 Priority
- **Medium — explicitly deferred to v2.** Not a v1 commitment. The iPhone-side architectural prep (App Group, App Intents, widget infrastructure) is what unlocks this later; do that prep in the natural course of building widgets + Siri (§§15 + 16) so the Watch app is a 2–3 week add when the time comes, not a months-long retrofit.

---

# Part VI — Infrastructure, Distribution & Operations

> The non-product systems that make the product viable: scaling, payments, App Store, QA. Build these only when they actually constrain the product — premature infra is wasted effort, but late infra is twice as painful to retrofit.

---

## 20. Infrastructure & Scaling — Cost-Efficient to Thousands of Users

### 20.0 BUG (live, P0) — `verrocchio.app` returns NXDOMAIN
- **Status:** Live production issue as of 2026-05-12. Browsers visiting `https://verrocchio.app` get `DNS_PROBE_FINISHED_NXDOMAIN`. Mail (`support@verrocchio.app`) still works because MX records are intact.
- **Diagnosis (confirmed via Cloudflare API):** The `verrocchio.app` zone has MX + SPF/DKIM records (email path) and an AAAA on `ai.verrocchio.app` (the AI proxy custom domain), but **no A/AAAA/CNAME on the apex itself**. Browsers have no answer for where to send web requests.
- **Fix path:**
  1. Firebase Console → Hosting → Add custom domain → enter `verrocchio.app`.
  2. Firebase issues a TXT challenge to verify ownership (one-time), then provides the specific A records to add. Use exactly what Firebase shows — IPs change.
  3. Add the A records to the Cloudflare DNS zone (proxied = orange cloud is typically what Firebase recommends; verify against Firebase's current instructions).
  4. Wait for Firebase to provision the SSL cert (usually <30 min).
  5. Verify `https://verrocchio.app` resolves to the app and SSL is green.
- **Out of scope here:** `www.verrocchio.app` — recommend adding a `www` → apex redirect via Cloudflare page rule as a follow-up.
- **Priority:** P0 — the app is the product, the product needs a working URL. Blocks all user-facing testing of anything that goes through `verrocchio.app` (including App Store screenshots that link to the marketing URL).

### 20.1 End-to-end scale + cost audit
- **Goal:** Confirm the stack (Firebase Hosting, Firestore, Cloudflare Worker AI proxy, GitHub repo, iOS Capacitor shell) can serve **thousands of concurrent users** while keeping hosting cost **as close to $0 as possible** at low volume and predictable at scale.
- **Action:** Produce a one-page "infra-at-scale" doc capturing per-layer cost model, free-tier limits, projected costs at 1k / 10k / 100k DAU, and breaking points.
- **Owner:** Architect / planner agent. Reference: [.claude/CLAUDE.md](../.claude/CLAUDE.md) stack table.

### 20.2 Firestore — keep reads cheap
- **Current model:** Per-user JSON blob at `users/<uid>` (per CLAUDE.md). Locality is good; reads are 1 doc per session.
- **Risks at scale:**
  - Document size limit is 1 MiB — long-running users with years of completions could approach this.
  - Per-user blob means **any small write rewrites the whole doc** → cost amplification.
- **Actions:**
  - Set a tripwire alert when any user doc exceeds, say, 500 KiB.
  - Plan a **migration path** to subcollections (`users/<uid>/habits/<id>`, `users/<uid>/completions/<dateKey>`) so writes scope down. **This migration is load-bearing for [§2 Social](#2-social--community-layer--anchor-pillar-of-the-app) and must happen before social work begins.**
  - Aggressive client-side throttling/coalescing of writes (already partially in place via localStorage-first) — confirm no chatty write paths.
  - Use `serverTimestamp()` only when needed (it costs an extra write hop).

### 20.3 User-saved content — the real cost question
- **Problem framing:** Users may attach content to habits/goals — could be journal entries (text, cheap), photos (medium), audio reflections (large), or linked URLs (free).
- **Cost-minimal tiers (cheapest → most expensive):**
  1. **URLs / links only** — store as strings in Firestore. Zero storage cost. Render previews client-side (optionally cached).
  2. **Short text / journal entries** — Firestore. Trivial cost. Cap individual entry at ~10 KB.
  3. **Images** — **Cloudflare R2** (zero egress) is cheaper than Firebase Storage at scale. Alternative: Firebase Storage if we want to stay one-vendor. Either way: **resize and compress client-side before upload** (target ≤200 KB per image; WebP). Free tier: R2 10 GB storage / 10M Class A ops / 1M Class B ops monthly.
  4. **Audio / video** — defer. If shipped, R2 + HLS via Cloudflare Stream, or skip entirely in v1.
- **Recommended v1:** Allow **links + short text only**. Defer images to v2. Audio/video off-roadmap until paying users exist.
- **Storage organization (when images land):** `users/<uid>/attachments/<attachmentId>` in R2/Storage; Firestore holds metadata (id, type, url, byteSize, linkedTo: {kind: 'habit'|'goal', id}).

### 20.3a Per-tier storage caps (the upgrade gate)
**User-uploaded content storage is metered per account, with hard caps by tier. Hitting the cap forces a choice: invite friends to expand it, upgrade to Pro, or delete content.**

| Tier | Storage cap | Includes |
|---|---|---|
| **Free** | **25 MB** | Text snippets + journal entries + (when images land) avatar + image attachments |
| **Referral-unlocked** (3+ converted invites per [§1.6](#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime)) | **100 MB** | Same scope, expanded cap |
| **Referral-unlocked** (5+ converted invites) | **250 MB** | Same scope, further expanded |
| **Pro** | **5 GB** | Same scope, generous headroom for image-heavy use |
| **Pro + Lifetime ([§1.6b](#16b-non-pro-perks-above-the-lifetime-threshold))** | **10 GB** | "Founding 100 Club" status reward |

**Why a hard cap rather than per-feature throttling:**
- Predictable cost ceiling per user: at the Free 25 MB cap × 100k users × R2 pricing (~$0.015/GB-month), worst-case storage cost is ~$37.50/month even at 100k DAU. Trivial.
- Simpler UX: one progress bar in [§11 My Profile](#11-my-profile-account--app-settings) showing "8 MB of 25 MB used" beats a maze of per-feature limits.
- Maps cleanly to the referral ladder ([§1.6](#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime)): expanding storage is a tangible reward for invites, not an abstract one.

**Enforcement model:**
- **Client-side check before upload:** the app refuses to upload when the cap is hit, shows a prompt explaining the three options (delete content / invite friends / upgrade).
- **Server-side enforcement** as a backstop: the Cloudflare Worker (or Firestore rule) verifies the upload would not exceed the user's tier cap before authorizing the R2/Storage write. Never trust the client alone.
- **Soft warnings ahead of the cap:** at 80% used, surface a banner. At 95%, prompt directly. Never silently fail an upload.
- **Per-file size limits** still apply on top of the global cap: ≤200 KB per image (per the upload-compression rule), ≤10 KB per text snippet.
- **Storage accounting:** maintain `users/<uid>.storage = { usedBytes: N, lastComputedAt: ts }` and decrement on delete. Recompute from R2 listing periodically as a reconciliation check.

**Edge cases to handle:**
- User downgrades from Pro → Free with 4 GB stored. **Policy:** existing content stays accessible (read-only); cannot add new uploads until below the new tier cap. Never silently delete user data on downgrade.
- User on referral-unlocked tier whose invites expire (rare, per [§1.6](#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime) the unlocks are mostly permanent past 5). Same policy as downgrade — read-only until under cap.
- User who reaches 25 MB on the free tier with photos: the prompt should clearly state "**you've reached your storage limit**" with three options (manage content / invite friends / upgrade), not a generic error.

**Cross-references:**
- **[§1.5 Free-tier limits](#15-free-tier-limits-proposed-numerical-caps):** the 25 MB free cap is one of the tier limits driving upgrade decisions.
- **[§1.4 Paid wall](#14-whats-behind-the-paid-wall-pro-only):** "Unlimited content/storage" in the Pro list refers to the 5 GB cap from this matrix — *practically* unlimited for normal use, not literally infinite.
- **[§11.9 Profile picture](#119-public-profile--username--profile-picture):** the avatar counts against the storage cap (small contribution — ≤200 KB).
- **[§20.8 Cost gates / kill switches](#208-define-cost-gates--kill-switches):** add an alert if total R2 storage costs exceed projections, which would suggest enforcement isn't working.

### 20.4 Firebase Hosting — already cheap, keep it that way
- **Reality:** Single static `index.html` + a handful of assets. Firebase Hosting free tier covers 10 GB storage and 360 MB/day egress. At ~1 MB shell × 10k DAU = 10 GB/day — would exceed free tier.
- **Actions:**
  - Aggressive cache-control headers (already partial via service worker).
  - Consider **Cloudflare Pages** as an alternative if Firebase Hosting egress becomes the dominant cost. Cloudflare Pages = unlimited bandwidth free. (Tradeoff: leaves the Firebase ecosystem for hosting; we still keep Firestore.)
  - Asset diet: audit `index.html` for embedded base64 / large literals before each release.

### 20.5 AI proxy (Cloudflare Worker) — usage cap per user
- **Risk:** A free-tier user spamming AI features racks up Anthropic API cost on our side.
- **Actions:**
  - Per-uid rate limit (e.g., 20 AI calls/day for free, more for paid). Enforce in `ai-proxy/worker.js` using a KV or Durable Object counter.
  - Log token spend per uid. Surface to user as "AI usage this month" so cost is visible.
  - Cache identical prompts (deterministic ones like "summarize my week") for N hours.
  - Default to Haiku model for cheap calls; escalate to Sonnet only on demand.

### 20.6 GitHub — irrelevant to user-facing cost
- GitHub repo is dev infrastructure, not user-serving. No scale concern. Single bullet: ensure CI free-tier minutes aren't blown by unnecessary workflows.

### 20.7 iOS / Capacitor — scale is App Store, not us
- **Reality:** Each install runs locally; the only server interaction is Firestore + AI proxy. No additional per-user infra cost from going to thousands of iOS installs **beyond** what 20.2 and 20.5 already cover.
- **Watch item:** Apple Developer membership ($99/yr) is fixed. TestFlight scales to 10k testers free.

### 20.8 Define cost gates / kill switches
- **Action:** Add Firestore + Cloudflare billing alerts at $5, $20, $50/month.
- **Action:** Wire a global feature flag that lets us **disable AI features** instantly if Anthropic spend spikes (server-side flag read by the Worker before forwarding).
- **Priority:** High — these are cheap to add now and expensive to add reactively.

### 20.9 Open questions to resolve before building user-saved content
- What's the maximum content size we'll let a single user store? (Hard cap, e.g., 100 MB.)
- Free tier vs. paid tier feature split? (E.g., images = paid only.)
- Do we need image moderation? (If user-generated content is private-only, no. If shared, yes — and that's a separate cost line.)
- Backup/export strategy — let users download their data so we can purge inactive accounts without a PR problem.

### 20.10 Site architecture — split apex into marketing page + app subdomain
- **Concept:** Today `verrocchio.app` directly serves the React PWA — first-time visitors hit a sign-in screen with no context. Convert to a two-domain split:
  - **`verrocchio.app`** → static marketing landing page (hero, value prop, screenshots, App Store badge, social proof, legal footer). Optimized for SEO and first-impression conversion.
  - **`app.verrocchio.app`** → the React PWA, identical to what's there now, just on a different hostname.
  - The marketing page has a prominent "Log in" / "Open the app" button linking to `app.verrocchio.app`.
- **Why:**
  - Visitors and signed-in users have different needs; mixing them hurts both — a curious visitor lands on an auth wall, a returning user sees marketing they don't need.
  - SEO needs static HTML with proper meta tags / structured data; the PWA can't easily serve that without SSR.
  - App Store reviewers and press want a "what is this product" landing page, not an immediate sign-in.
  - Industry convention: Linear, Notion, Stripe — `<product>.com` = marketing, `app.<product>.com` = app.
- **Implementation notes:**
  - **Hosting:** Multi-site Firebase Hosting (single repo, two `firebase.json` targets, deploy both at once) is the lightest path. Alternative: Cloudflare Pages for the marketing site if richer build tooling (Astro, MDX) is wanted.
  - **DNS:** Add `app.verrocchio.app` as a new Firebase Hosting custom domain → A records via Cloudflare API (same flow as the apex setup).
  - **AI proxy CORS:** [ai-proxy/worker.js](../ai-proxy/worker.js) `ALLOWED_ORIGINS` currently includes `https://verrocchio.app`. Must add `https://app.verrocchio.app` or AI calls from the new origin will fail CORS.
  - **PWA / service worker scope:** Today registered at the apex. Moving the app to `app.verrocchio.app` changes the scope; users with the PWA installed from `verrocchio.app` will keep loading the now-marketing page. Transition strategy needed — options: (a) redirect-and-prompt-reinstall on the apex for ~30 days, (b) keep apex temporarily double-serving the PWA with a banner directing to the new URL, (c) accept the small breakage and force re-install via App Store post-launch.
  - **Firebase Auth email links:** Templates (password reset, email verification) point at a configured base URL. Update Firebase Console → Authentication → Templates → "Customize action URL" to `app.verrocchio.app`.
  - **Existing bookmarks:** Users who bookmarked `verrocchio.app` will hit marketing first, then click through to the app. Acceptable cost — most usage will come via the App Store anyway.
  - **Capacitor iOS shell:** Unaffected. The iOS app loads `index.html` packaged inside the IPA, not from the network.
  - **Legal pages:** `/privacy`, `/terms`, etc. — keep on the marketing apex so they're public-reference and don't require being signed in. Update links from inside the app accordingly.
- **Cutover sequencing (lowest-risk path):**
  1. Add `app.verrocchio.app` as a second Firebase Hosting site; deploy current app there. Verify everything works.
  2. Update Firebase Auth + Worker CORS to recognize the new origin.
  3. Build the marketing site at `marketing/` in this repo (or a separate one).
  4. Deploy marketing to apex, replacing the app at apex.
  5. Communicate the change to existing users (in-app banner, email).
- **Open questions:**
  - Marketing page content — what goes on it? Hero + features + screenshots + App Store CTA + social proof + legal footer. Tied to [§1](#1-monetization-strategy--free--paid-split--referral-unlock) (referral strategy lives prominently here) and [§2](#2-social--community-layer--anchor-pillar-of-the-app).
  - Should the marketing page collect emails (newsletter / launch list) before the app is App-Store-public? Probably yes during pre-launch.
  - Do we want `www.verrocchio.app` to redirect to apex (current setup) or to the app? Current default = apex / marketing.
- **Priority:** Medium. Not blocking core product work, but a meaningful SEO + brand + conversion improvement. **Worth doing before App Store launch** so reviewers, press, and organic discoverers see a landing page rather than an app shell.

---

## 21. Payment Backend — Subscriptions / Paid Tier

### 21.1 Why we need this
Several roadmap items already imply paid features:
- [§20.3](#203-user-saved-content--the-real-cost-question) — image attachments gated to paid tier
- [§20.5](#205-ai-proxy-cloudflare-worker--usage-cap-per-user) — higher AI usage caps for paying users
- [§14.1](#141-habit-routine-optimizer-based-on-neglected-habits) / [§14.3](#143-detect-additive-habits-crowding-out-non-negotiables) — AI-powered routine optimization
- [§18](#18-calendar-integration--two-way-sync--voice-scheduling) — calendar integrations (premium-feeling)

A payment backend is the gating mechanism that decides which features are unlocked per user.

### 21.2 Apple's rule (the non-negotiable)
**iOS apps that sell digital goods/services MUST use Apple In-App Purchase (IAP).** Stripe / external checkout for in-app digital purchases is grounds for rejection. Practical implications:
- iOS users → Apple IAP → Apple takes 30% (or 15% Small Business).
- Web users (if we ever sell on the web app at verrocchio.app) → Stripe → ~3% Stripe fee. Massive margin difference vs IAP.
- Apple's "anti-steering" rules have loosened (US, EU): we can now link out to a web checkout from inside the iOS app under specific rules. But the simplest v1 is **IAP-only on iOS**.

### 21.3 Architecture — recommend RevenueCat as the abstraction layer
- **Don't roll your own subscription state machine.** Receipt validation, renewal handling, refund handling, grace periods, family sharing, restore-purchases, cross-platform sync — all hard and easy to get wrong.
- **RevenueCat** (free up to $2.5k MTR — monthly tracked revenue) handles all of the above and exposes a simple "is this user entitled to feature X?" API.
- **Flow:**
  1. User taps "Upgrade" in app.
  2. RevenueCat SDK (Capacitor plugin) shows the StoreKit native paywall (iOS) or Stripe checkout (web, eventually).
  3. Purchase completes → RevenueCat validates receipt with Apple / Stripe → updates user's entitlement.
  4. App reads entitlement state via SDK; gates UI accordingly.
  5. Server-side: Cloudflare Worker (`ai-proxy/`) hits RevenueCat REST API (or a cached entitlement claim in Firestore) before honoring premium AI requests.
- **Alternative if avoiding a vendor:** StoreKit 2 directly + manual server-side receipt validation against Apple's verification endpoint. Doable but **months of work**; not worth it pre-revenue.

### 21.4 Subscription model (resolved by [§1](#1-monetization-strategy--free--paid-split--referral-unlock))
The tier model, pricing, trial mechanic, and referral ladder are defined in [§1](#1-monetization-strategy--free--paid-split--referral-unlock). Implementing the payment backend means realizing that tier model in code. **Lock the §1 decisions before writing payment code.**

### 21.5 Server-side entitlement (where the truth lives)
- **Authoritative source:** RevenueCat (or whichever provider).
- **Cached entitlement claim:** stored in the user's Firestore doc as `subscription: { tier: 'free'|'pro', expiresAt: <ts>, lastVerifiedAt: <ts> }`.
- **Refresh policy:** verify against RevenueCat at most once per app launch + on webhook events.
- **AI proxy enforcement:** `ai-proxy/worker.js` reads the user's tier (via Firebase Auth UID → Firestore lookup, or a signed JWT containing entitlement claims) and applies the appropriate rate limit before calling Anthropic.
- **Webhook pipeline:** RevenueCat → Cloudflare Worker webhook → update Firestore entitlement. (Or RevenueCat's native Firebase extension if it exists; check before building.)

### 21.6 What's needed before first paid build
- [ ] Lock tier model + pricing (per [§1](#1-monetization-strategy--free--paid-split--referral-unlock))
- [ ] Configure subscription products in App Store Connect (and Google Play later if we ship Android)
- [ ] Set up RevenueCat project; link App Store Connect; create entitlements
- [ ] Install RevenueCat Capacitor plugin
- [ ] Build paywall UI in `index.html` (gated component)
- [ ] Implement entitlement check helper used everywhere features gate (`isPro(user)` → bool — eventually richer `entitlements(user)` per [§1.10](#110-cross-cutting-implementation-hooks))
- [ ] Wire `ai-proxy/worker.js` to read entitlements server-side
- [ ] Create restore-purchases flow (required by Apple for re-installs / new devices)
- [ ] Add Terms of Service + Subscription Terms (Apple requires these visible from the paywall)
- [ ] Add "Manage Subscription" link in My Account (deep-links to iOS Settings → Subscriptions — see [§11.8](#118-manage-subscription))
- [ ] Test the **sandbox** purchase flow with Sandbox Apple IDs (do this before TestFlight)
- [ ] Test restore-purchases on a fresh install

### 21.7 Tax & financial admin (don't forget)
- **App Store Connect Agreements, Tax, and Banking** must be completed before Apple disburses any revenue. This includes US W-9 (since Verrocchio LLC is the entity) and banking details for the LLC.
- **Sales tax** is generally handled by Apple in most jurisdictions — they're the merchant of record. For Stripe-based web subscriptions, we'd need Stripe Tax or a service like TaxJar.

### 21.8 Cost recap
- Apple IAP: 30% (15% Small Business — apply if eligible, must reapply annually).
- RevenueCat: free up to $2.5k MTR; 1% of MTR above that. Massively worth it.
- Stripe (web, eventually): ~2.9% + $0.30 per transaction.
- Net at scale (iOS-only, Small Business): roughly **84%** of stated price flows to LLC after Apple + RevenueCat fees.

### 21.9 Priority
- **High** but **not v1.** Ship v1 as free + referral; collect users; understand which premium features they'd pay for *before* building the paywall. Don't build payment infra speculatively — but **do** keep the entitlement check helper (`isPro(user)`) as a stub returning `false` everywhere from day one, so adding the paywall later is a one-line flip per feature.

---

## 22. App Store Submission via TestFlight

### 22.1 Why TestFlight is required (or near-required)
TestFlight is Apple's official beta-distribution channel inside App Store Connect. It is **not strictly mandatory** to ship to the App Store — you can submit a build directly for review — but for verrocchio it is effectively required, because:

- **It's the only way to install a release-signed iOS build on real devices before the public launch.** Capacitor builds compiled in Xcode for "Release" cannot be sideloaded for testing without TestFlight (or expensive enterprise distribution).
- **It uses the same archive that the App Store will eventually serve.** Bugs that only appear under production code-signing / production entitlements (push notifications, App Group storage, IAP, etc.) only surface in a TestFlight build, not in `cap run ios` debug builds.
- **App Review is more likely to pass** when a build has already cleared internal + external TestFlight rounds.

### 22.2 Prerequisites (one-time setup)
- **Apple Developer Program** — $99/yr. Already a known fixed cost (per [§20.7](#207-ios--capacitor--scale-is-app-store-not-us)). Account must be enrolled before any of this works.
- **App Store Connect record** — create the app under its bundle ID (e.g., `app.verrocchio.app` or whatever's in `capacitor.config.json`).
- **Signing identity + provisioning profiles** — generated via Xcode "Automatically manage signing" with the team selected.
- **App Privacy + data-use disclosures** — must be filled out in App Store Connect (see also [docs/PRIVACY_POLICY.md](PRIVACY_POLICY.md) — already drafted).
- **App icons + launch screen + screenshots** — required asset bundle. Screenshots needed for iPhone 6.7" and iPhone 6.5" at minimum; iPad if we ship for iPad.

### 22.3 The build → TestFlight → App Store pipeline
1. **Capacitor sync** — `npm run cap:sync` to copy the latest `index.html` / assets into the iOS project.
2. **Open Xcode** — `npm run cap:open`.
3. **Bump version + build number** in Xcode (`CFBundleShortVersionString` and `CFBundleVersion`). App Store Connect rejects builds with duplicate version+build pairs.
4. **Archive** — Xcode menu: Product → Archive. Produces a signed `.xcarchive`.
5. **Distribute via Organizer** — Xcode Organizer → Distribute App → App Store Connect → Upload. The build appears in App Store Connect within minutes.
6. **Wait for processing** — Apple processes the binary (5–60 min) and runs automated checks (privacy manifests, missing entitlements, etc.).
7. **Assign to TestFlight Internal Testing** — up to 100 internal testers (Apple Dev team members). No App Review required for internal testing; available within minutes.
8. **Assign to TestFlight External Testing** *(optional but recommended)* — up to 10,000 external testers via public link or email invites. **Requires a separate, lightweight Beta App Review** (usually <24 hours). Test for at least a week with real users to catch bugs that internal testing missed.
9. **Submit for App Store Review** — once stable on TestFlight, promote the same build (or a new build) to "Submit for Review". Full App Review typically takes 24–48 hours.
10. **Release** — manual or automatic on approval; can be a phased rollout (1% → 100% over 7 days).

### 22.4 Verrocchio-specific watch items
- **Privacy manifest** (`PrivacyInfo.xcprivacy`) — Apple now requires disclosure of "Required Reason APIs." Capacitor plugins may need entries. Audit before first submission.
- **Encryption export compliance** — set `ITSAppUsesNonExemptEncryption = NO` in `Info.plist` unless we add custom crypto (we don't — Firebase + HTTPS only is exempt).
- **Account deletion in-app** — Apple requires apps with sign-in to provide in-app account deletion. Verify Firebase Auth user deletion is wired through to a UI button before submission. *(Cross-ref [§11.7](#117-in-app-account-deletion).)*
- **No "beta" / "test" wording** in the App Store description or screenshots — auto-reject.
- **Demo account credentials** must be provided in App Review Information so the reviewer can log in. Pre-seed a `reviewer@verrocchio.app` account with sample habits/goals/journal entries.
- **AI features disclosure** — if we ship AI tips in v1, declare AI-generated content in the App Store privacy section. Apple is increasingly strict here.
- **Block/report flow for social** — required if shipping any social slice from [§2.11](#211-priority--anchor-pillar-v1-minimum-slice-required).
- **HealthKit entitlements** — required if shipping any inbound integration from [§17.5](#175-privacy-entitlements-app-store-implications).
- **Widget + Watch + Siri targets** — each separate Xcode target must be configured in App Store Connect before the first submission that includes it.

### 22.5 Recommended cadence
- **Pre-launch:** 2+ weeks of internal TestFlight, then 1–2 weeks of external TestFlight with ~10–20 external users, before submitting to App Store.
- **Post-launch:** Every new feature spends ≥3 days in TestFlight (internal) before being promoted to App Store.
- **Automation:** Down the road, add Fastlane lanes for `beta` (build + upload to TestFlight) and `release` (promote latest TestFlight build to App Store). Out of scope for v1.

### 22.6 Cost recap
- Apple Developer Program: $99/yr (only paid cost in this pipeline).
- TestFlight itself: free, scales to 10k testers.
- App Store: free; Apple takes 30% of any paid transactions (15% for Small Business Program — apply if revenue < $1M/yr).

---

## 23. Cross-Cutting QA

### 23.1 Component click-through coverage
- **Action:** Dispatch sub-agents to systematically click every interactive component in the app (every button, every tab, every modal, every menu item) and verify it works.
- **Output:** A report of any non-working or unexpected behaviors.
- **Note:** This is recurring — not a one-time task. Run it after every major release.

### 23.2 Settings audit
- See [§11.5](#115-full-audit-of-every-setting) — every toggle and option in App Settings should be verified periodically.

### 23.3 Mobile gesture vs desktop affordance audit
- See [§13.1](#131-audit-every-mobile-gesture-for-a-desktop-equivalent) — recurring audit to make sure mobile-only gestures don't ship without desktop fallbacks.

---

# Appendix

## How to use this document

- **Read order:** [Part I](#part-i--strategy--product-identity) first (strategy is load-bearing). After that, parts can be read independently.
- Each numbered section is a coherent unit of work that one subagent (or one PR) can own.
- Subagents executing items should refer back to [.claude/CLAUDE.md](../.claude/CLAUDE.md) and [.claude/skills/verrocchio-frontend/SKILL.md](../.claude/skills/verrocchio-frontend/SKILL.md) for codebase conventions before touching code.
- UI work must pass the verification gate in [.claude/CLAUDE.md](../.claude/CLAUDE.md) (desktop + iOS-width screenshots, dark-mode check if any color/border was touched, `npm test` if `utils.js` was touched).
- When an item is completed, move its checkbox to a "Completed" section at the bottom (or remove and reference the merging commit/PR).
- **Cross-references** use `[§N.M](#anchor)` format. If you renumber a section, update every back-reference — search the file for the old `§N` token.
