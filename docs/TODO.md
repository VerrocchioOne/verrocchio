# Verrocchio — Master To-Do List

> Captured from product owner brain dump on 2026-05-12. Each section is scoped so a subagent can pick up an item with minimal additional context. Items are NOT in priority order — see the **Priority** tag inside each item.

---

## 1. Mobile Layout & Spacing Fixes

### 1.1 Reduce horizontal padding on mobile (iPhone widths)
- **Problem:** Too much border/padding on left and right sides squeezes content.
- **Visible symptom:** On the Habits page, the row containing the "Add Habit" button plus the "Today", filter, sort, and other pills wraps onto **two rows instead of one**.
- **Acceptance:** On iPhone width (~390px), the Add Habit button + all pills fit on a single row.
- **Priority:** High (most-visible polish issue).

### 1.2 Reduce gap between header and top action buttons (Goals & Habits pages)
- **Problem:** Spacing between the page header and the row of buttons just below it is too large on both pages.
- **Acceptance:** Visually tighter; matches Apple-native app spacing conventions.

### 1.3 Reduce excessive spacing inside the To-Do tab
- **Problem:** Too much vertical spacing between items / sections.
- **Acceptance:** Denser layout that still reads cleanly.

### 1.4 Fix text wrapping site-wide
- Audit habit cards, goal cards, and any other text-bearing component for broken wrapping or truncation.
- Acceptance: No clipped text, no awkward single-word overflow lines at common widths (390, 768, 1024+).

---

## 2. Habit & Goal Card Bugs

### 2.1 Badge overlap on habit/goal cards
- **Problem:** When opening edit on a card, the target/unit-amount badge is sometimes covered by other components on the card.
- **Acceptance:** Badges remain visible and legible in both view and edit states.

### 2.2 "Organize Habits" module is broken
- **Problem:** Certain habits appear simultaneously when they shouldn't. The organize/reorder functionality does not fully work.
- **Action:** Debug end-to-end. Confirm ordering is persisted, deduped, and rendered correctly.

### 2.3 Full review of the "Edit Habit" card UI
- **Problem:** Inconsistent font sizes, font types, emoji use vs. no-emoji, spacing.
- **Action:** Audit and standardize. Reference Apple native apps (Reminders, Health, Notes) for layout/option presentation conventions.

### 2.4 Highlight neglected habits/goals with text emphasis
- **Current:** Neglected cards get a red dotted outline.
- **Add:** Red, all-caps text on top of the card (e.g., **"PRIORITIZE TODAY"** or **"NEGLECTED"**) for higher visual emphasis.

### 2.5 SMART framework display under goals
- **Current:** Less readable layout for SMART category data.
- **Change:** For each SMART category, render the **category label** on its own line, then the user-entered string **indented** beneath it.

---

## 3. Reflect Tab — Redesign

### 3.1 Past journal entries don't appear in the Reflect tab
- **Bug:** Previously written entries are not surfaced.
- **Acceptance:** Reflect tab lists historical entries, browsable by date.

### 3.2 Redesign Reflect tab using best-in-class journaling apps as reference
- **Research target:** Day One, Apple Journal, Stoic, Reflectly, etc.
- **Preserve required functionality:**
  - Daily journal entry
  - Goal-specific journal entry
  - "Other" / freeform journal entry
- **Deliverable:** Updated layout that shows history, supports the three entry types, and feels modern.

---

## 4. Home Page — Tips & Reminders

### 4.1 Remove "review yesterday's habit" tip
- **Reason:** There is already a separate module dedicated to this.
- **Action:** Filter out that tip variant from the tips/reminders generator.

### 4.2 AI-generated tips based on user data
- Tips and reminders should be **personalized** by analyzing several days of inputted user data (completions, journal sentiment, neglected habits, goal progress).
- Output: short, actionable suggestion tailored to the user's recent pattern.

---

## 5. Urgent To-Do

### 5.1 Add archive feature
- Allow archiving urgent to-dos (instead of only delete / complete).
- Archived items must be retrievable.

---

## 6. Calendar Day Detail View

### 6.1 Clicking a day shows full daily snapshot
- **Acceptance:** When the user taps any day on the in-app calendar, show:
  - Which goals were active/touched
  - Which habits were completed (or missed)
  - Which to-dos were due / completed
  - Which journal entries were written
- **Priority:** High (high-value daily-review feature).

---

## 7. Version History

### 7.1 Goal version history
- Track edits to goals over time.

### 7.2 Habit version history
- Track edits to habits over time.

### 7.3 Surface history inside My Account / settings
- Both goal and habit version histories should be viewable from within My Account (or settings).

---

## 8. My Profile / My Account

### 8.1 Remove "your primary goal" section
- Delete this UI block from the profile page.

### 8.2 Reduce padding on My Profile
- The page has too much internal padding overall.

### 8.3 Keep "App Progress" function in sync with feature set
- The app-progress / progress-toward-using-features indicator must be **updated whenever features are added or removed**.
- **Process note:** Add a checklist item to any feature-add / feature-remove PR that touches the progress tracker.

### 8.4 Reorganize the Habit Reports section
- **Problem:** Current layout makes long-term success/rates hard to browse.
- **Action:** Design a better scroll / browse pattern for viewing habits and their long-term success rates over time.

---

## 9. App Settings

### 9.1 Full audit of every setting
- Click through every toggle, dropdown, and option in App Settings.
- Confirm each one **actually does what it says** and persists correctly.
- Fix any that are broken or no-op.

---

## 10. Onboarding & New-User Experience

### 10.1 Animated genesis sequence before onboarding
- **Note for future build:** New users should see an **animated intro** explaining the genesis of the app and its purpose **before** the standard onboarding flow begins.
- **Status:** Spec only — animation assets and timing TBD.

---

## 11. AI Features (New)

### 11.1 Habit-routine optimizer based on neglected habits
- **Goal:** AI analyzes which habits have been ignored historically and **suggests a new routine** that re-prioritizes the neglected ones, possibly swapping them in for habits the user reliably hits.
- **Outcome:** User misses fewer days overall.

### 11.2 Research agent: top 10 best-selling books on habits / goals / discipline
- **Action:** Dispatch agents to scan the internet for the top 10 best-selling books in this space.
- **Deliverable:** Summary of each book's core principles.
- **Use:** Inform product decisions so the app's design aligns with proven behavioral-science fundamentals.

---

## 12. iOS Widget Support (Architectural Prep)

### 12.1 Build with iOS widgets in mind
- Even though widgets aren't being shipped now, **architect data access** so today's habits, urgent to-dos, and goal progress can be exposed to an iOS widget extension later without re-plumbing the data layer.
- **Note:** Currently the app is Capacitor — adding native widgets later will require a Swift widget extension target reading from shared App Group storage. Keep that path open.

---

## 13. Calendar Integration (Major Feature)

### 13.1 Two-way calendar sync (export)
- Allow exporting habits and to-dos onto the user's mobile or desktop calendar (iCloud, Google Calendar, Outlook).

### 13.2 Two-way calendar sync (import)
- Allow importing the user's email/work calendar into the app.
- **Goal:** Verrocchio becomes the **single source of truth** for the user's day.

### 13.3 Voice-driven AI scheduling
- User can **speak to the AI**; AI moves/reassigns habits and to-dos around the immovable items on the user's calendar.
- **Requirements:**
  - Calendar read permission flow (OAuth for Google/Microsoft, EventKit for iOS)
  - Identification of "immovable" events vs. flexible ones
  - Reading current habits + goals + to-dos
  - Suggesting an optimized layered schedule
  - Voice input pipeline → AI tool-call → calendar mutation

---

## 14. Cross-Cutting QA

### 14.1 Component click-through coverage
- **Action:** Dispatch sub-agents to systematically click every interactive component in the app (every button, every tab, every modal, every menu item) and verify it works.
- **Output:** A report of any non-working or unexpected behaviors.
- **Note:** This is recurring — not a one-time task. Run it after every major release.

---

## How to use this document

- Each numbered section is a coherent unit of work that one subagent (or one PR) can own.
- Subagents executing items should refer back to `.claude/CLAUDE.md` and `.claude/skills/verrocchio-frontend/SKILL.md` for codebase conventions before touching code.
- UI work must pass the verification gate in `.claude/CLAUDE.md` (desktop + iOS-width screenshots, dark-mode check if any color/border was touched, `npm test` if `utils.js` was touched).
- When an item is completed, move its checkbox to a "Completed" section at the bottom (or remove and reference the merging commit/PR).
