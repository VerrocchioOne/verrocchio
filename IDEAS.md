# Verrocchio — Product Ideas Backlog

A cleaned-up version of the brain-dump, grouped by theme and annotated
with current status. Items are rewritten as actionable statements so
they can be picked up directly.

---

## 1. Identity & Branding

- **Final product name** — *unresolved.* "Verrocchio" is a codename; needs a consumer-facing brand. Decide whether Verrocchio stays, becomes a studio name, or is replaced.
- **Tagline** — "Achieve Anything" is in place. Keep or iterate once the final name is chosen.
- **Loading / splash animation** — pyramid blocks stacking as the app loads or refreshes.
- **Logo motion** — the V from the pyramid inverts into the A's in "Achieve Anything"; remaining letters slide in from behind the A.

## 2. Onboarding (new user)

- *Done:* login, welcome quote screen, demo mode for previewing onboarding.
- **Guided tour** — first-run overlay that walks through: tab layout, adding a habit, linking it to a goal, the community tab. Not yet built.
- **Intent capture** — ask the user *why* they're using the app during onboarding; store it and surface it later (e.g., briefing or reflect tab).
- **Balanced-life framework primer** — default "Areas of Life" categories plus a path to customize. Explain the framework inline so the user understands why they're picking categories.

## 3. Core Goal / Habit Framework

- *Done:* SMART fields on goals.
- **Areas of Life** — ship a default set; allow users to rename, add, or remove them. The customization is what drives long-term retention.
- **Parent -> sub-habit hierarchy** — e.g., parent "Quit smoking" -> sub "Stop by Mom's wedding." Community resources attach at the parent level.
- **Version history (habits per goal)** — when habits change over time under the same goal (2 packs -> 1 pack -> 5 cigs -> zero), the goal view shows the full evolution.
- **Version history (goal itself)** — snapshots of goal edits so you can see how the goal's wording/targets changed.

## 4. Time & Scheduling

- **Vertical day clock** — left rail showing the hours of the day with a red dotted "now" line at the current time; habits arranged along it.
- **Export to calendar** — one-click export of scheduled habit blocks to an iCal/Google Calendar feed.

## 5. AI & Notifications

- **AI Habit Coach** — conversational: user describes where they're struggling; coach can (a) reorder habits, (b) propose more push notifications, (c) generate a truncated "must-do only" list for time-constrained days.
- **Push notifications (baseline)** — reminders for habits.
- **Location-based notifications** — geofence triggers tied to specific habits (e.g., "walking past the gym").
- **Screentime integration** — read phone-usage data to drive action prompts and to let users set goals around screen time.

## 6. Tactile / Sensory Feedback

- **Haptic feedback on habit state change** — vibrate on complete vs. miss. *(Original note was cut off — assumed meaning.)*

## 7. Community & Social

- *Partially in place:* Social tab shell.
- **Community space** — share goals/habits, follow other users or groups.
- **Group / category pages** — subscribable resource pages attached to parent habits (e.g., a "Quit Smoking" hub).
- **Accountability partners** — user designates partners; when they break app-blocking goals, partners get a text.
- **Friendly-betting integration** — hook into Gunnar's betting app so a group of friends can wager nominal sums on each other's habit performance.

## 8. Monetization & Business

- **Subscription + paywall** — pricing tiers TBD; integrate with a billing provider.
- **"Get paid to make ads for Verrocchio"** — recruiting ad slot at the bottom of the home tab (UGC creator program).
- **Exit strategy** — merge with or sell to BePresent. *(Belongs in a business doc, not the product backlog — flagged for separation.)*

## 9. UI Primitives & Flows (reference inventory)

Most of these already exist in the app. Treating this as a checklist
rather than a to-do:

- **Primitives in use:** button, tab, bottom sheet, sidebar, dialog, toast, progress indicator, icon.
- **Primitives not yet used:** slider, carousel.
- **Flows already modeled:** onboarding, adding/creating (habits, goals), browsing home, starting/completing habits.
- **Flows not yet modeled:** add-to-cart, subscribing (tied to paywall above), chatting (tied to AI Coach above), browsing tutorial (tied to guided tour above), searching, listening to audio.

---

## Open Questions / Decisions Needed

1. **Name + brand** is upstream of the logo animation work — lock the name before investing in splash/logo motion.
2. **AI Coach, community, and paywall** are each multi-week efforts. Pick one to anchor the next phase rather than starting all three in parallel.
3. **Version history** (goal + habits) is the single feature most likely to differentiate this from a generic habit tracker — worth prioritizing early.
4. **"Get paid to make ads"** and the **BePresent exit plan** are business / ops items, not product features. Move them to a separate doc.
5. **Tactile feedback** sentence was incomplete in the original — confirm the trigger (complete only, miss only, or both).
6. **Screentime + location permissions** will force platform-specific native code (iOS/Android), which changes the architecture significantly. Flag as "phase 2 / native app" scope.
