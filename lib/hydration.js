// Cloud-doc hydration. Originally inlined in index.html (lines 3118-3359);
// extracted to this module as Phase 2 OSS-port Port #3. Loaded from
// index.html as a classic <script>, which puts the `hydrateCloudDoc`
// binding in the shared Script scope so the inline app script below
// can reference it by name. Also exports via CommonJS when the file is
// required from Node so tests/hydration.test.mjs can import the same
// source.
//
// Superstruct rewrite was attempted but reverted: the function's three
// distinct concerns (strict-object guards, cross-field-conditional
// defaults, per-item migrations) only overlap superstruct's `defaulted()`
// API on a small slice (~18 fields out of ~40). Wrapping the rest in
// `coerce`/pre-pass code grew the file by ~30 code lines without
// removing imperative state, and forced the reader to track two
// paradigms. The verbatim extraction below is the same proven 240-line
// function, now isolated for Node testing — which buys us the 36 new
// pinned-behavior tests in `tests/hydration.test.mjs`. That's the real
// value of Port #3.

// Seeds for a brand-new account. Kept here as empty arrays so this
// module is self-contained for Node tests. The browser path of
// index.html also declares its own SEED_HABITS / SEED_GOALS at
// line ~2349 for the inline app's own use; the two are independent.
const HYDRATE_SEED_HABITS = [];
const HYDRATE_SEED_GOALS = [];

// Single source of truth for "did this doc come from an older schema".
// Called from BOTH the localStorage load and the Firestore read/listener
// so a cloud-only user whose doc predates a field doesn't crash on
// `.filter/.map/.length` later. Pure — takes a raw doc, returns a
// hydrated copy (mutates for performance; caller has already cloned if
// they care).
function hydrateCloudDoc(p) {
  // Only seed when the field is MISSING or not an array. The previous
  // `|| .length === 0` clause re-seeded any time the cloud doc came
  // back with an empty array — which is exactly what the user produces
  // when they delete their last habit or last goal. The realtime
  // listener would then replace [] with the SEED list and write that
  // back to Firestore, making the deletion appear to roll itself back.
  // A deliberate empty array is now preserved.
  if (!Array.isArray(p.habits)) p.habits = HYDRATE_SEED_HABITS;
  if (!Array.isArray(p.goals))  p.goals  = HYDRATE_SEED_GOALS;
  if (!p.journal) p.journal = [];
  if (!p.archive) p.archive = [];
  if (!p.quotes) p.quotes = [];
  if (!p.todos) p.todos = [];
  if (!Array.isArray(p.customGoalTypes)) p.customGoalTypes = [];
  if (!Array.isArray(p.customImportance)) p.customImportance = [];
  if (!Array.isArray(p.customSections)) p.customSections = [];
  if (!Array.isArray(p.dayVisits)) p.dayVisits = [];
  if (!Array.isArray(p.upcomingDates)) p.upcomingDates = [];
  // Stricter than `typeof x !== "object"` — arrays ARE objects in JS,
  // so a malicious (or just corrupt) remote write of [] here would
  // pass the typeof guard and then break Object.entries / lookups
  // downstream. Require a plain object.
  if (!p.bestStreaks || typeof p.bestStreaks !== "object" || Array.isArray(p.bestStreaks)) p.bestStreaks = {};
  if (!p.achievementsUnlocked || typeof p.achievementsUnlocked !== "object" || Array.isArray(p.achievementsUnlocked)) p.achievementsUnlocked = {};
  // W3-T23: legacy docs stored achievement unlock times and archived
  // entry timestamps as ISO strings via toISOString(). Newer code writes
  // epoch ms (Date.now() / Date.prototype.getTime()) for cheaper compare
  // and JSON stability. Convert any string survivors on hydrate so all
  // downstream consumers see a uniform number type.
  if (p.achievementsUnlocked && typeof p.achievementsUnlocked === "object" && !Array.isArray(p.achievementsUnlocked)) {
    for (const k of Object.keys(p.achievementsUnlocked)) {
      const v = p.achievementsUnlocked[k];
      if (typeof v === "string") {
        const ms = new Date(v).getTime();
        p.achievementsUnlocked[k] = isNaN(ms) ? Date.now() : ms;
      }
    }
  }
  if (Array.isArray(p.archive)) {
    p.archive = p.archive.map(a => {
      if (a && typeof a.archivedAt === "string") {
        const ms = new Date(a.archivedAt).getTime();
        return { ...a, archivedAt: isNaN(ms) ? Date.now() : ms };
      }
      return a;
    });
  }
  if (Array.isArray(p.goalArchive)) {
    p.goalArchive = p.goalArchive.map(a => {
      if (a && typeof a.archivedAt === "string") {
        const ms = new Date(a.archivedAt).getTime();
        return { ...a, archivedAt: isNaN(ms) ? Date.now() : ms };
      }
      return a;
    });
  }
  if (typeof p.xp !== "number") p.xp = 0;
  if (!p.dailyRitual) p.dailyRitual = {};
  if (typeof p.homeLocation !== "string") p.homeLocation = "";
  // W3-T9: returning users (anyone who already has habits OR completed
  // the tour) skip the welcome modal — they're not first-timers.
  if (typeof p.welcomeModalSeen !== "boolean") {
    p.welcomeModalSeen = (Array.isArray(p.habits) && p.habits.length > 0) || p.tourDone === true;
  }
  // W3-T11: existing users with any journal entries pre-date the
  // disclaimer requirement and shouldn't be re-prompted.
  if (typeof p.journalDisclaimerAcked !== "boolean") {
    p.journalDisclaimerAcked = Array.isArray(p.journal) && p.journal.length > 0;
  }
  // W3-T12: AI consent timestamp. 0 means never consented.
  if (typeof p.aiConsentAt !== "number") p.aiConsentAt = 0;
  if (!Array.isArray(p.travelDays)) p.travelDays = [];
  p.travelDays = p.travelDays.map(t => {
    if (typeof t === "string") return { date: t, location: "", tripId: "t-" + t };
    if (!t || typeof t.date !== "string") return null;
    if (!t.tripId) return { ...t, tripId: "t-" + t.date };
    return t;
  }).filter(Boolean);
  if (Array.isArray(p.habits)) {
    // Drop falsy entries at hydration time. Bare `!h.parked` checks
    // downstream would otherwise pass nulls through (since
    // !undefined === true), and the next access to h.text / h.id /
    // h.completions would throw a TypeError mid-render and crash a
    // whole panel. One filter here is cheaper than guarding every
    // call site individually.
    p.habits = p.habits.filter(Boolean).map(h => {
      // Backfill frequency (pre-frequency-field habits default to daily).
      if (!h.frequency) h = { ...h, frequency: { type: "daily", days: [], day: null } };
      // Backfill completionTimes — parallel to `completions`, stores the
      // local HH:MM the habit was logged. Empty on historical data; we
      // only populate it going forward. Always an object so later
      // access doesn't have to null-check.
      if (!h.completionTimes || typeof h.completionTimes !== "object") h = { ...h, completionTimes: {} };
      // Backfill the sub-unit target fields (see togHabit's "increment"
      // mode). `target` is the number of units needed to count the
      // habit as done for the day (e.g. 8 cups of water). `unitLabel`
      // is the display suffix ("cups", "min", "pages"). `increment` is
      // how many units each tap adds (default 1). `completionUnits`
      // maps dateKey → running count for that day. All optional;
      // habits without a target stay binary done/not-done.
      if (!h.completionUnits || typeof h.completionUnits !== "object") h = { ...h, completionUnits: {} };
      // Backfill goalIds from the legacy goalId scalar. A habit can
      // now belong to multiple goals; older docs only carried one
      // link in goalId. Promote it into the array on read so every
      // call site can rely on goalIds being authoritative. We keep
      // goalId on the doc too (writes set both) so a downgrade to
      // an older client wouldn't lose all goal links.
      if (!Array.isArray(h.goalIds)) {
        h = { ...h, goalIds: h.goalId != null ? [h.goalId] : [] };
      }
      // §6 Future Habits — `parked: true` means the habit sits in the
      // Future Habits drawer instead of the active list. Inert: not
      // rendered on the Habits tab sections, not counted by streak /
      // rate / completion math, not scored by the AI features, not
      // surfaced in neglected-habit warnings. Default false so every
      // existing habit stays active until the user explicitly parks it.
      if (typeof h.parked !== "boolean") h = { ...h, parked: false };
      // §5.8 — per-slot completion times for multi-slot habits.
      // Parallel to slotCompletions, but stores the local HH:MM of
      // each slot's completion: { dateKey: { sectionValue: "HH:MM" } }.
      // Without this, all slots of a multi-slot habit shared one
      // completionTimes[date] entry, breaking off-schedule detection
      // (a 20:00 evening completion would be compared against the
      // morning cutoff). Empty on legacy data; new toggles populate.
      if (!h.slotCompletionTimes || typeof h.slotCompletionTimes !== "object") h = { ...h, slotCompletionTimes: {} };
      // §5.8b — Multi-slot key migration. Legacy slotCompletions were
      // keyed by bare section name ("morning"). The expanded model
      // allows multiple slots per section, so keys are now
      // "<section>:<localIdx>". Rekey any bare-section keys to ":0"
      // of that section if the habit has the section in slotSections;
      // drop orphans. Existing colon-format keys win — they're
      // already canonical, so they don't get overwritten by a bare
      // fallback if both are present (the rare double-write race).
      if (Array.isArray(h.slotSections) && h.slotSections.length > 0) {
        const fields = ["slotCompletions", "slotCompletionTimes"];
        for (const f of fields) {
          if (!h[f] || typeof h[f] !== "object") continue;
          const out = {};
          let mutated = false;
          for (const dkey of Object.keys(h[f])) {
            const day = h[f][dkey] || {};
            const next = {};
            for (const k of Object.keys(day)) {
              if (k.indexOf(":") !== -1) {
                // Already canonical "<section>:<localIdx>". Preserve as-is.
                next[k] = day[k];
                continue;
              }
              // Bare section name. Promote to "section:0" only if
              // the habit declares that section AND a ":0" entry
              // doesn't already exist (canonical wins).
              if (h.slotSections.includes(k)) {
                const promoted = k + ":0";
                if (!(promoted in next)) next[promoted] = day[k];
                mutated = true;
              } else {
                // Orphan (section dropped from slotSections). Drop it.
                mutated = true;
              }
            }
            if (Object.keys(next).length > 0) out[dkey] = next;
            else mutated = true;
          }
          if (mutated) h = { ...h, [f]: out };
        }
      }
      return h;
    });
  }
  // `_order` backfill: habits have had it for a while (section-reorder);
  // goals and todos didn't, but the sort feature needs one. Seed the
  // field from current array position so the first render under
  // "Custom" matches what the user sees today.
  if (Array.isArray(p.goals)) {
    p.goals = p.goals.map((g, i) => g && typeof g._order !== "number" ? { ...g, _order: i } : g);
  }
  if (Array.isArray(p.todos)) {
    p.todos = p.todos.map((t, i) => t && typeof t._order !== "number" ? { ...t, _order: i } : t);
  }
  // Per-page sort preferences. Values: "default" | "alpha" | "created" |
  // "date" | "streak" | "custom". `streak` only applies to habits;
  // `date` means goal target / todo due date. Invalid values fall back
  // to "default" at render time, so we can add new modes without a
  // migration.
  if (!p.sortPrefs || typeof p.sortPrefs !== "object") p.sortPrefs = {};
  if (typeof p.sortPrefs.habits !== "string") p.sortPrefs.habits = "default";
  if (typeof p.sortPrefs.goals  !== "string") p.sortPrefs.goals  = "default";
  if (typeof p.sortPrefs.todos  !== "string") p.sortPrefs.todos  = "default";
  // AI tone for the daily briefing. Values: "encouraging" | "neutral" |
  // "tough-love". Used by genBrief to shape the prompt sent to the
  // backend proxy AND the deterministic fallback. Default is "neutral"
  // (middle tone) — neither cheerleading nor scolding — and unknown
  // values fall back to the default at read time.
  if (typeof p.aiTone !== "string") p.aiTone = "neutral";
  // Signup timestamp (ms) — stamped on first hydration for accounts
  // that don't have one. Drives the review-prompt milestones below.
  // Never overwritten once set.
  if (typeof p.signupAt !== "number") p.signupAt = Date.now();
  // Feature access log: featureId → lastUsedMs. Drives the scorecard
  // in Profile and the "check out this unused feature" tip source.
  // Stays empty for new users; populated lazily by touchFeature.
  if (!p.featureAccess || typeof p.featureAccess !== "object" || Array.isArray(p.featureAccess)) p.featureAccess = {};
  // Review-prompt tracking: `dismissedDays` is the list of milestone
  // day-counts (7/14/30) we've already surfaced and the user has
  // either reviewed or dismissed. Silent after a user picks "Maybe
  // later" so we don't nag the same day.
  if (!p.reviewPrompt || typeof p.reviewPrompt !== "object") p.reviewPrompt = { dismissedDays: [] };
  if (!Array.isArray(p.reviewPrompt.dismissedDays)) p.reviewPrompt.dismissedDays = [];
  // Location + notifications preferences. homeCoords is {lat, lng, capturedAt}
  // or null; captured by the user tapping "Set home location" in
  // settings (one-shot geolocation). locationOptIn gates automatic
  // home/away detection on app open. notifyOptIn gates showing local
  // notifications (and will gate push notifications once Capacitor's
  // @capacitor/push-notifications is wired). Defaults are all opt-out
  // so nothing moves without the user's explicit consent — important
  // for app-store review and trust.
  if (!p.homeCoords || typeof p.homeCoords !== "object") p.homeCoords = null;
  if (typeof p.locationOptIn !== "boolean") p.locationOptIn = false;
  if (typeof p.notifyOptIn !== "boolean")   p.notifyOptIn   = false;
  if (typeof p.onboardingComplete !== "boolean") {
    p.onboardingComplete = (p.habits && p.habits.length > 0) || (p.goals && p.goals.length > 0);
  }
  // Backfill tourDone on legacy docs so a returning user with a
  // pre-tourDone-field cloud doc doesn't re-trigger the guided tour
  // on a new device. New accounts get true via DD; this catches
  // existing accounts whose docs predate the field entirely.
  if (typeof p.tourDone !== "boolean") p.tourDone = true;
  if (typeof p.celebratedFirstGoal !== "boolean") {
    p.celebratedFirstGoal = !!(p.goals && p.goals.length > 0);
  }
  if (typeof p.celebratedFirstHabit !== "boolean") {
    p.celebratedFirstHabit = !!(p.habits && p.habits.length > 0);
  }
  return p;
}

// CommonJS export for Node-side tests. The `typeof module` guard means
// the browser path (no CommonJS) is untouched, so hydrateCloudDoc stays
// available as a Script-scope global to the inline app code in index.html.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { hydrateCloudDoc };
}
