# Verrocchio — Home Page + Daily Debrief Redesign

**Draft:** 2026-05-12 · For founder review before code dispatch.

This proposal extends the evidence-based daily-sequence work already captured in `docs/TODO.md` §4.3 (Recall → Reflect → Release → Plan/Commit). That section validates the **order** of the four steps. This document extends it with a v1.1 **architecture** that leverages the now-live AI proxy at `ai.verrocchio.app`.

## What changed that opens this redesign

Two prerequisites just landed:

1. **AI is live in production** (`AI_BACKEND_URL = "https://ai.verrocchio.app"`, `AI_ENABLED = true`). The `genBrief()` and `genIns()` paths in `index.html` are now active. Previously the briefing fell back to a deterministic data-driven string when `AI_BACKEND_URL` was null; with the worker live, the briefing can now be genuinely generative + personalized.
2. **The AI consent gate from W3-T12 already wired the user flow**: `data.aiConsentAt` must be set before any AI call fires. Users who haven't consented see a one-time modal explaining what gets sent to Anthropic and where. After consent, AI features run silently in the background.

These two changes mean every step of the daily debrief can be **AI-augmented** without rewriting the consent flow or adding new infrastructure.

## Current state — what the Home (Brief) tab does today

(Quick code orientation; this is what's there now, before any redesign.)

The Home tab renders in roughly this order:
1. **Daily ritual cards** — a stacked list of "today's actions": each habit shown with a tap-to-complete pill, partial-completion units (e.g., `5/8 cups`), and a small streak indicator.
2. **Key Upcoming Dates** — user-added `upcomingDates` plus goal deadlines.
3. **Smart tips rail** — `smartTips` array generated client-side from `data` patterns (low completion, unused features, consistency fallback). The "Review yesterday's habit" variant was removed in commit `3f28441`.
4. **Generate briefing button** (gated on `AI_ENABLED` per W1-T10; now visible since the gate flipped true). Tap → fetches a 2-3 paragraph briefing from the AI proxy, displays inline.
5. **Generate insight button** (similar gating). Tap → fetches a deeper pattern analysis ("you tend to read more on run days," etc.).

The "daily debrief" (the 4-step Recall → Reflect → Release → Plan flow from TODO.md §4.3) is NOT yet implemented as a sequenced flow. The Home tab today is a *single scrollable view*; the user can do all four activities but the app doesn't present them as a sequence.

## Proposed v1.1 architecture

The Home tab becomes **two distinct surfaces**, switched by context:

### Surface A — "Today" (replaces the current Brief tab default)

Shown whenever the user opens the app **and the daily debrief is already complete** for today (or it's still mid-day and the user already ran through it once).

This is the **at-a-glance dashboard**:
- Today's habits as tap-to-complete pills (current behavior — preserved).
- Today's intention banner at the top (set during step 4 of the morning debrief).
- A compact "yesterday's snapshot" card — the AI's 2-3 sentence summary of yesterday's wins + one thing to carry forward.
- Active goals' next milestone (one-line summary per active goal).
- Upcoming dates within the next 7 days.

This surface is the **steady-state view**. Quiet, scannable, fast.

### Surface B — "Morning Debrief" (4-step sequential flow)

Shown on **first open of the day**, OR when the user explicitly taps a "Run debrief" button.

This is the **structured ritual**. Four screens, each focused. Skip is always available on each step.

#### Step 1 — Recall (15-30 sec)

What the user sees:
- Yesterday's date prominently displayed.
- **"What went well"** section listed FIRST (Emmons / McCullough — gratitude priming). Each completed habit shown as a small green tile with the habit name + completion time.
- **"Carry forward"** section — yesterday's missed habits, presented neutrally (NOT shamed). Each has a one-tap **Mark missed** OR **Mark done late** affordance, in case the user forgot to log yesterday.

AI augmentation: an inline **"Pattern note"** card from the AI — 1-2 sentences pointing to a single specific observation, e.g., *"You ran the morning 8 of the last 10 days. That's the foundation of everything else this week."* Throttled to once per day. Skipped if the AI proxy is unreachable.

Action: tap **Next** → step 2.

#### Step 2 — Reflect (60-90 sec)

What the user sees:
- A single AI-generated **journal prompt** rendered as a soft suggestion above an open textarea. Examples (chosen by the AI based on yesterday's data):
  - *"You missed your morning run yesterday for the second time this week. What was happening?"*
  - *"Three wins yesterday. Which one mattered most?"*
  - *"What's one thing you noticed about yesterday that you want to carry into today?"*
- The textarea is freeform — user can ignore the prompt entirely and write whatever.
- An optional mood-tag row (gratitude / wins / challenges / etc.) at the bottom — same canonical tags as the Reflect tab.
- Skip link.

AI augmentation: the prompt itself is generated. Falls back to a rotating set of static Schippers/Pennebaker prompts if AI is unreachable.

Action: **Save & Next** (commits the entry to the journal array, then advances) or **Skip**.

#### Step 3 — Release (30-60 sec)

What the user sees:
- A list of every open to-do AND every upcoming-date item in the next 3 days.
- Each row has three buttons: ✅ Done · ➡️ Carry to today · ✕ No longer relevant.
- AI augmentation: a tiny suggestion next to each — *"This has been on your list for 14 days. Drop?"* — based on age + recent inactivity. Suggestions are non-binding; user always picks.

This is the Zeigarnik close-the-loops step. The point is to make a decisive call on each item, not to review them. If the user has 20+ open todos, only the oldest 5 + due-soon ones surface in this step; the rest stay in the to-do tab.

Action: **Next** when each row has been actioned (or **Skip remaining**).

#### Step 4 — Plan / Commit (30-60 sec)

What the user sees:
- **Implementation-intention prompt** (Gollwitzer): *"When [trigger], I will [behavior]."* Two text inputs side-by-side.
  - The trigger and behavior are pre-suggested by the AI based on yesterday's misses and the user's stated non-negotiable. Example pre-fill: *"When my alarm rings at 6am, I will put on running clothes before checking my phone."*
- Below: **Identity anchor** (Clear, optional): *"Today I want to be the kind of person who…"* — single text input, skippable.
- Below: **Mental contrasting prompt** (Oettingen, optional): *"What might get in the way?"* — single text input, skippable.

These three inputs commit to `data.dailyRitual[today]`:
```js
{
  intention: "When ... I will ...",
  identity: "Today I want to be the kind of person who ...",
  obstacle: "..."
}
```

AI augmentation: when the user types into the intention field, AI offers an inline refinement suggestion ("more specific trigger" / "narrower behavior" / "phrase as if-then"). Optional; user can ignore.

Action: **Done** → returns the user to Surface A (Today), with the intention banner now populated at the top.

### Surface C — Evening Debrief (optional, opt-in)

A counterpart to the morning debrief, runnable in the evening. Three steps:
1. **Log** — yesterday-style recap of today's habits.
2. **One-line reflection** — *"What's one thing about today worth remembering?"*
3. **Tomorrow's commit** — pre-fill the next morning's intention based on today's data.

Marked **opt-in** because forcing morning + evening produces fatigue. Power users get it; casual users don't.

## Integration with existing AI surfaces

The two existing AI affordances (`genBrief` and `genIns`) become contextual entry points into the debrief:

| Surface | Source | Becomes |
|---|---|---|
| `genBrief` button on Home today | Free-form daily briefing | **Surface A "yesterday's snapshot" card** auto-populates with this content on first load of the day. Manual button removed; content is now always-present (cached). |
| `genIns` button on Home today | Pattern analysis | Same — moves into the **Step 1 "Pattern note" card** in the debrief. Manual button removed from the always-visible Home; available from a less-prominent "Deeper insights" menu in Profile. |

This consolidates AI-generated content into the debrief flow rather than scattering it across separate buttons. Cleaner UX, fewer AI calls per session (cost-saving), more contextual placement.

## Caching + cost discipline

Every AI call costs real Anthropic-API tokens. The redesign should respect a budget:

- **One generative briefing per day per user** — cached in `data.dailyRitual[date].aiBrief`. Step 1 + Surface A both read the cached value. The proxy only runs once per user per 24h.
- **One journal prompt per day per user** — same caching scheme at `data.dailyRitual[date].aiJournalPrompt`.
- **One implementation-intention suggestion per day** — `data.dailyRitual[date].aiIntention`.
- **Insights button on demand** — uncached; user explicitly taps. Display a "this uses AI tokens" subtle indicator.

Net result: a typical daily user triggers ~3 AI calls per day at most. At the worker's `MAX_TOKENS_CAP = 2000` cap and Anthropic's Haiku 4.5 pricing (~$0.0008 per 1K input + $0.004 per 1K output), this is well under $0.01/user/day even at the cap. Scales to thousands of users on the project's free Cloudflare Worker tier (100K req/day on the free plan).

## Behavior on AI failure

The proxy can fail (network, quota, Anthropic outage). The redesign handles each step gracefully:

| Step | AI failure fallback |
|---|---|
| Surface A snapshot | Use the existing deterministic `genBrief` fallback (data-driven summary). |
| Step 1 pattern note | Hide the card entirely. The Recall step still works. |
| Step 2 journal prompt | Rotate from a static array of 12 Schippers/Pennebaker prompts. |
| Step 3 to-do suggestions | Hide the per-row hint text. The three-button action UI still works. |
| Step 4 intention pre-fill | Empty inputs; user fills from scratch. |

The flow is always *complete-able* without AI. AI just makes it sharper.

## Implementation plan — phased

> **Status as of 2026-05-12:** R-1 through R-4 SHIPPED. R-5 DEFERRED to post-launch.

### Phase R-1 — Surface A "Today" tidy-up ✓ SHIPPED (c64a202)

Audit found that most of R-1's goals were already in the codebase from prior waves:
- The cached daily briefing card ("Your Daily Briefing") at ~12669 already exists.
- The intention banner (`intentionPinned`) at ~12632 already exists.
- No standalone "Generate briefing" button ever existed to remove.

The one real gap was a consent-side-effect: the auto-hydrate effect at ~9537 called `genBrief()` without first checking `data.aiConsentAt`, which would trigger the W3-T12 consent modal as a side effect of merely visiting the Brief tab. Fix: explicit `if (needsAi && AI_ENABLED && !data.aiConsentAt) return;` gate added at ~9537.

### Phase R-2 — Morning Debrief flow scaffold ✓ SHIPPED (d7ec2a2)

4-step opt-in modal flow accessible via a "Start" button on the Brief tab:
1. **Recall** — yesterday's habits split into "What went well" and "Carry forward" with one-tap mark-done backfill.
2. **Reflect** — deterministic prompt rotation (12-prompt library, day-of-year selection) + open textarea; commits to `data.journal[]` with `source: "debrief"`.
3. **Release** — top 8 oldest open todos with three-action buttons (Done / Today / Drop).
4. **Plan/Commit** — Gollwitzer if-then intention textarea + optional identity anchor + optional Oettingen obstacle, commits to `data.dailyRitual[today].{intention,identity,obstacle}`.

Existing intention banner auto-displays the value once step 4 commits. Step indicator (4 segmented bars), Skip-remaining + backdrop-tap-with-confirm, internal scroll for narrow widths.

### Phase R-3 — AI augmentation wiring ✓ SHIPPED (a022a39)

Real AI calls wired into all three augmentation surfaces:
- **Pattern note (Step 1):** fires on debrief open; surfaces ONE specific observation about the last 14 days of habits.
- **Journal prompt (Step 2):** fires on step 1→2 advance; generates a specific prompt referencing yesterday's data + recent journal snippets.
- **Intention suggestion (Step 4):** fires on step 3→4 advance; generates a Gollwitzer-format pre-fill referencing the user's non-negotiable + recent misses.

Each cached per-day at `data.dailyRitual[today].ai*`. ZERO calls fire without `data.aiConsentAt` set. All capped at 80-120 tokens via Haiku 4.5. Estimated cost: well under $0.01/user/day at the cap.

Fallbacks: pattern-note card hidden when AI off/fails; journal prompt falls back to STATIC_PROMPTS rotation; intention banner hidden, empty placeholder remains.

### Phase R-4 — Evening debrief (opt-in) ✓ SHIPPED (b8d5ed3)

Default OFF. Activated via Settings toggle `data.eveningDebriefEnabled`. When on, a purple-tinted entry card appears on the Brief tab after 6pm local time. Three-step flow:
1. **Log** — today's habits split into Completed + "Mark missed or done" with per-row Done/Missed buttons.
2. **Reflect** — single-line text input; commits to journal with `source: "evening_debrief"`.
3. **Tomorrow** — pre-filled with today's intention as a starting point; commits to `data.dailyRitual[tomorrowDk].intention` so the next morning's Brief tab opens with the intention banner already set.

Separate state machine from morning debrief. NO AI calls in R-4 — purely deterministic.

### Phase R-5 — Telemetry + tuning ⏸ DEFERRED to post-launch

Original scope: track step completion rates, AI fallback rate, prompt completion data; tune prompts based on real user behavior.

**Why deferred:** with zero users at v1.0 pre-launch, R-5 produces no actionable signal. The step-completion data is already captured by R-2/R-4's `debrief*CompletedAt` timestamps on `data.dailyRitual[date]`. AI fallback rate with one user is statistical noise. Prompt tuning requires actual user behavior to inform decisions.

**Reactivate when:** v1.0 has been live on the App Store for ~2 weeks with at least ~50 daily-active users producing signal. At that point, add a minimal `data.aiCallStats` counter object to `callAiForDebrief` so historical call/fail rates become queryable.

The infrastructure that R-5 would tune (the AI prompts in R-3, the step structure in R-2/R-4) is already in production-quality form; no architecture change is needed to add R-5 later.

## Risks + open questions

1. **Forcing a 4-step sequence on first open of the day might feel heavy.** Mitigation: every step is skippable; the whole flow is dismissible; users who skip 3 days in a row see a one-time "want to simplify the morning routine?" prompt that turns the sequence off and reverts to the old single-scroll Home.

2. **AI-generated prompts can drift into clichéd or generic territory.** Mitigation: every AI call uses recent user data as context (yesterday's completions, recent journal entries with mood tags, current goals). The prompt template explicitly asks for specificity. Quality test: a sample of generated prompts should reference specific habits/dates from the user's data, not be writable about anyone.

3. **Privacy posture on AI prompts.** The journal text and habit names get sent to Anthropic via our Cloudflare worker. The W3-T12 consent gate covers this. Make sure the consent modal copy is updated to mention that morning debrief prompts use the AI.

4. **Open question: should Surface A show an AI-generated "yesterday's snapshot" even before the user has run the debrief?** Arguments either way:
   - **Yes:** the snapshot is valuable on its own; the user might never run the formal debrief and still benefit.
   - **No:** seeing the AI's framing of yesterday might pre-bias the user's own reflection in step 2; force them through the debrief to reflect first.
   
   Recommendation: **Yes, but with a small disclaimer** that links to "Run today's debrief" — i.e., the snapshot is the appetizer, the debrief is the meal.

5. **Open question: does the debrief replace the Reflect tab's daily entry, or coexist?** If it replaces it, the Reflect tab becomes a history-only browser. If it coexists, users have two places to write — confusing. Recommendation: **coexist, but the debrief writes to the same `data.journal[]` array.** A journal entry written during the debrief is indistinguishable from one written in the Reflect tab; the source field is just `"debrief"` vs `"reflect"`. Users see one unified history.

## What I need from you to start Phase R-1

Pick:
- **A** — Greenlight everything as-is; start Phase R-1 next session.
- **B** — Greenlight with one or more changes I should make to this doc first (tell me what).
- **C** — Hold; you want to refine the spec further before any code.

This is the highest-leverage UX change available in v1.0 → v1.1. The home page is the single most-visited surface; AI-augmenting the daily ritual is what would make a habit tracker actually *thoughtful* rather than just a checklist app.
