# Verrocchio — Marketing Landing Page Brief

**Audience for this document:** an external designer (or design-AI service) building the marketing landing page that will live at `verrocchio.app`.

**Status of the work:** The app itself is built and live at `https://verrocchio.app` today. We are splitting the apex domain into a static marketing page (this brief) and an app subdomain (`app.verrocchio.app`) that will host the React PWA. The marketing page will replace what is currently served at the apex.

**Goal of this brief:** give you everything you need — product context, brand identity, content structure, sample copy, visual system, technical constraints — to design a landing page without further back-and-forth.

---

## 1. The product in one sentence

**Verrocchio is a habits-and-goals tracker built around the philosophy of disciplined practice toward mastery — named after the Renaissance master sculptor who trained Leonardo da Vinci.**

It is not a gamified streak app, not a productivity tracker, and not a wellness app. It is a tool for self-disciplined people who already believe daily practice matters and want a serious tool that takes their goals seriously.

---

## 2. The name — origin and meaning

**Andrea del Verrocchio** (1435–1488) was an Italian Renaissance sculptor, painter, and goldsmith who ran the most prestigious workshop in Florence. His apprentices included Leonardo da Vinci, Sandro Botticelli, and Domenico Ghirlandaio.

The name signals the product's framing: **habits are the daily practice of an apprentice becoming a master.** Not "to-dos to check off." Not "streaks to maintain." Daily, disciplined craft in service of a long-horizon goal.

The landing page should *feel like* this lineage — quietly classical, considered, serious about craft — without descending into Renaissance-cosplay (no faux-parchment textures, no Latin mottos, no faux-aged borders). Modern interpretation of classical sensibility.

---

## 3. Target audience

**Primary persona:**
- Self-directed adult, 25–55
- Already practices some form of daily discipline (writing, exercise, study, meditation, language learning, instrument)
- Has tried other habit trackers (Streaks, Habitica, Todoist, Notion) and found them either too gamified, too playful, or too generic
- Reads books, takes their goals literally, has SMART-shaped thinking even if they don't know the acronym
- Pays for tools they use — not looking for free-forever; looking for serious

**Anti-persona** (what we are NOT for):
- Casual streak-collectors
- Gamification-driven users
- Users who want "checkmarks for everything in life"
- Anyone looking for a social/competitive scoreboard primarily

The page should naturally select toward the primary persona by tone alone. The anti-persona should bounce within five seconds because the visual and language don't speak their dialect.

---

## 4. What the app actually does (so you understand what we're selling)

Surface features, in order of prominence in the app:

1. **Habits** — daily, weekly, or monthly cadence. States: completed / missed / skipped. Streak math is honest (missing a day breaks the streak; "skipped" is a first-class state for legitimate skips).
2. **Goals** — defined with the SMART framework (Specific, Measurable, Achievable, Relevant, Time-bound). Habits link to parent goals so the user can see the line from daily practice to long-horizon outcome.
3. **Journaling** — three modes: daily reflection, goal-specific entries, freeform. The Reflect tab surfaces history and patterns.
4. **Calendar day view** — shows what was completed, missed, and journaled on any given day.
5. **AI Coach** — surfaces neglected habits, identifies routine inefficiencies, distinguishes additive habits from non-negotiables. Personalized, not generic advice.
6. **Cross-device sync** — Firestore-backed; same data on web, iOS app, and (future) Apple Watch.
7. **iOS app** — native shell via Capacitor, App Store submission planned (TestFlight imminent).

Features the page should NOT lead with: social/community (planned but not shipped), referrals (mechanism, not value prop), AI (model-of-the-week pitches are tired). Lead with the philosophical hook + the core craft of habits + goals + reflection.

---

## 5. Brand identity — voice and tone

**Voice attributes (in priority order):**
1. **Reverent toward the user's ambition.** Take their goals seriously. They are not children to be cajoled with confetti.
2. **Direct and confident.** No hedging. No "Maybe Verrocchio is right for you!" Yes or no — and we believe it's yes for the right audience.
3. **Quietly classical.** Renaissance sensibility without being precious. Think *The Daily Stoic* + *Apple's marketing copy* — restrained, considered, occasionally aphoristic.
4. **Educational, not salesy.** Explain what the app *is*. Don't sell what it could be.

**Tonal references** (read these and match the register, not the topic):
- Apple's iPhone marketing pages (restraint, confident product claims, minimal copy)
- *The Daily Stoic* book / website (classical wisdom in modern prose)
- Linear's marketing copy (precise, opinionated, no marketing fluff)
- Nike's "Just Do It" era (confidence without explanation)

**Things to avoid in copy:**
- Exclamation marks (kill on sight — one allowed for the whole page max)
- "Game-changing", "revolutionary", "unleash", "empower", "transform your life"
- Gamification language ("level up", "streaks", "achievements", "score")
- Emojis in body copy (the app uses them functionally; marketing doesn't need them)
- Time-pressure tactics ("Limited time!", "Join 10,000 users today!")
- Generic productivity tropes ("Get more done", "Build better habits faster")

**Sample taglines, in priority order:**
1. *"Daily practice. Long-horizon goals. The discipline of mastery."*
2. *"Habits, goals, and reflection — for people who take their craft seriously."*
3. *"A habit tracker named after the master who trained Leonardo."*

Designer can propose alternatives if they capture the same essence.

---

## 6. Visual system — colors, typography, imagery

### Colors (already canonical in the app — match these)

| Role | Token | Hex |
|---|---|---|
| Brand primary | `--accent` | `#2d5a2d` (deep forest green) |
| Brand secondary | `--accent-2` | `#3d7a3d` |
| App background (light) | `--app-bg` | `#f8f7f4` (warm cream / unbleached paper) |
| App background (dark) | (dark mode) | `#0b0d0f` (near-black) |
| Body text | `--app-text` | `#1f2937` (deep charcoal) |
| Soft text | `--c-text-faint` | `#6b7280` |
| Brand tint background | `--c-tint-brand-bg` | `#f0f7f0` (palest green wash) |
| Brand tint border | `--c-tint-brand-border` | `#c6dfc6` |
| Borders | `--c-border` | `#e5e7eb` |

The deep-forest green on warm cream is the heart of the palette — evokes age-of-discovery manuscripts and growing things at once. Avoid pure white backgrounds; the cream is part of the brand. Avoid pure black; use the near-black for dark mode.

Dark mode is supported in the app but the marketing page can be light-only if that's simpler. If dark mode is included, the cream background flips to `#0b0d0f` and the green becomes slightly brighter for contrast.

### Typography (already loaded by the app — match these)

- **Display / headings:** [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) — weights 600, 700, 900. Italic versions available. Use for hero, section headers, and any emphatic display copy.
- **Body / serif body:** [Lora](https://fonts.google.com/specimen/Lora) — weights 400, 600, 700. Use for body paragraphs, captions, footer.
- **No sans-serif** in the brand system. Both fonts are serif. This is intentional — adds classical gravitas, distinguishes from every other tech-startup landing page using Inter or system fonts.

Hierarchy guidance:
- Hero headline: Playfair Display 900, large (clamp 48–96 px)
- Section headers: Playfair Display 700, italic on alternate sections for variety
- Body: Lora 400, ~18 px on desktop, ~16 px on mobile, generous line-height (1.6–1.7)
- Pull quotes / aphorisms: Playfair Display 600 italic, distinct from body

### Imagery direction

**Yes:**
- Screenshots of the app itself (will be provided — use placeholders for now if needed)
- Renaissance-era detail crops (drapery, hands, geometric proportions from sketches) — subtle, never the focal point
- Abstract modernist takes on classical proportions (golden ratio guides, geometric forms)
- Clean photography of physical practice — a journal page, a sculptor's tools, an unfilled notebook — desaturated, neutral

**No:**
- Stock photos of people smiling at laptops
- Faux-aged textures, scanned-paper backgrounds, parchment skeuomorphism
- Gradient-heavy hero illustrations
- Cartoon/illustration of habits or checkmarks
- Fitness-bro imagery, gym imagery, hustle-culture motifs

**Iconography:**
- If icons are needed, prefer minimal line-weight icons (Feather, Phosphor light, or custom). Avoid filled / colored / playful icon sets.
- No emoji in copy (see voice section). Emoji in screenshots is fine — that's the app, not the marketing.

---

## 7. Page structure

The marketing page is a single long scroll. Section order matters — top sections do the heaviest selling.

### Section 1 — Hero (above fold, every device)

- **Headline:** Large, Playfair Display 900. Suggested: *"Daily practice. Long-horizon goals."*
- **Sub-headline:** One sentence. *"A habits, goals, and reflection app named after the Renaissance master who trained Leonardo da Vinci."*
- **Primary CTA:** Button — "Open the app" → links to `https://app.verrocchio.app`. Solid background `#2d5a2d`, white text, generous padding, Playfair Display 600.
- **Secondary CTA:** "Download on the App Store" badge (use Apple's official badge — Apple provides assets). If pre-launch, replace with "Coming soon to the App Store" as text.
- **Hero visual:** Single, restrained — either (a) an iPhone mockup with the app's home screen, (b) a desktop browser frame with the app's Today view, or (c) a Renaissance detail (e.g., a hand from a Verrocchio sculpture, cropped tight) layered with one app screen. Designer's call. Avoid busy "scattered phones at different angles" compositions.
- **No carousel.** No autoplay video. The hero is still.

### Section 2 — The philosophy

This section sells the *why* — why this app exists, why it's named what it's named. It is the most distinctive section on the page; do not skip it.

Suggested copy structure:

> **Heading:** *"Named for a master."*
>
> **Body (2–3 short paragraphs):** Verrocchio's workshop in 15th-century Florence trained Leonardo da Vinci, Botticelli, Ghirlandaio. The apprentices didn't become masters because they were talented. They became masters because they showed up to the workshop every day, sharpened their craft in small increments, and held themselves accountable to a long-horizon vision of what they were becoming.
>
> Most habit trackers reward you for streaks. This one rewards you for the practice — and tells you the truth when you skip.
>
> The app does three things: it tracks what you set out to do daily, it links those daily acts to the goals they ladder up to, and it gives you a place to reflect on what's working and what isn't. That's it. No leaderboards. No gamification. No infinite list of tracked metrics.

Visual: a single classical detail — e.g., a high-contrast crop of Leonardo's *Vitruvian Man* proportions, or a tight crop of Verrocchio's *David* — sized small, not as a hero. Or no image at all — text alone is legitimate here if the typography is doing its job.

### Section 3 — Three features (the craft)

Three columns or rows, each a single feature:

**Habits**
- Image: an annotated screenshot of a habit card showing the completion/missed/skipped UI
- Heading: *"Daily practice, honestly tracked."*
- Copy: *"Mark a habit complete, missed, or skipped. Missed is a first-class state — not just 'not done.' Streak math is honest; tools that lie to you about your own behavior aren't worth using."*

**Goals**
- Image: a goal card with SMART fields visible, linked habits beneath
- Heading: *"The line from today to where you're going."*
- Copy: *"Every habit links to a goal. Every goal uses the SMART framework — Specific, Measurable, Achievable, Relevant, Time-bound. You can always answer 'why am I doing this?' because the answer is one tap away."*

**Reflection**
- Image: a journal entry view or the Reflect tab
- Heading: *"A place to think about what's working."*
- Copy: *"Daily entries. Goal-specific entries. Freeform thinking. The Reflect tab surfaces what you wrote a week ago, a month ago — patterns become visible only when you can see your own arc."*

### Section 4 — What makes Verrocchio different (optional, if scrolling depth allows)

A short, opinionated list. Examples:

- *No gamification.* No badges, no XP, no confetti when you complete a habit. The reward is the practice.
- *Honest streaks.* Missed a day? The streak breaks. That's the point — discipline is the discipline of facing reality.
- *Goals before habits.* You define the long-horizon outcome first. Habits exist to serve goals, not the other way around.
- *Renaissance sensibility, modern execution.* Cross-device sync, offline-first PWA, native iOS app, AI coaching where it actually helps.

### Section 5 — Closing CTA

Single section. Large display headline. Single button.

- **Headline:** *"Begin the practice."* (or *"Open the workshop."* if too quiet)
- **Button:** Same as hero — "Open the app" → `app.verrocchio.app`
- Optional sub-line: *"Free for the first week. Then either bring a friend or join Pro — your choice."* (only include if monetization strategy is locked, see Section 9.)

### Section 6 — Footer

Restrained. Single-row or two-row max.

Required links:
- Privacy Policy → `/privacy` (served from same marketing site)
- Terms of Service → `/terms` (same)
- Support → `mailto:support@verrocchio.app`
- App Store badge (or "Coming soon") if not already in hero
- Copyright line: `© 2026 Verrocchio. All rights reserved.`

Optional:
- Social links — only if accounts exist. Do not invent.
- Newsletter signup — see Section 9.

---

## 8. CTAs and conversion targets

Two CTAs only on the page. One job per CTA.

| CTA | Action | Where it appears |
|---|---|---|
| **Primary** | "Open the app" → `https://app.verrocchio.app` | Hero, closing section, sticky header (optional) |
| **Secondary** | "Download on the App Store" (badge) | Hero, footer. Pre-launch: replace with text *"Coming soon to the App Store"* |

Do not add: "Watch demo video", "Read our manifesto", "Join the waitlist", "Book a call". One product, one front door.

---

## 9. Open product questions the designer should know about

These are things still being decided — flag in your design where they're surfaced and we'll fill in later:

1. **Pre-launch vs. post-launch state.** The iOS app is not yet on the App Store. The page may launch before App Store approval. Design two states: "Coming soon to the App Store" (pre-launch) and the proper App Store badge (post-launch). Easy to swap.
2. **Pricing on the page?** The free → referral-unlocked → Pro model is the eventual plan. We may not surface pricing on the marketing page at all in v1 — just the "Open the app" CTA, where the in-app flow handles trial / referral / upgrade. Designer's preference: include pricing or hide it?
3. **Newsletter signup?** May or may not include depending on whether we have a mailing list set up. Design two variants of the footer.
4. **Social proof.** No testimonials yet. Designer should reserve space for a future testimonial/quote section (e.g., between Section 3 and Section 4) without making the v1 page feel incomplete.

---

## 10. Functional & technical requirements

### Responsive design

- Desktop: 1280 px design width, scales up cleanly to 1920+
- Tablet: 768–1024 px breakpoint
- Mobile: 390 px (iPhone reference width) — every section must work here. The hero is critical: headline, sub, primary CTA, App Store badge all visible without scrolling on iPhone 14 viewport.

### Performance

- Static HTML/CSS/JS only — no React, no Vue, no framework runtimes for marketing
- Total page weight under 500 KB gzipped including hero image (use modern formats — WebP or AVIF)
- First Contentful Paint under 1.2 s on slow 4G
- Lighthouse score: 95+ on Performance, Accessibility, Best Practices, SEO

### SEO requirements

- `<title>` tag: *"Verrocchio — Daily practice. Long-horizon goals."*
- `<meta name="description">`: 150–160 characters, captures the value prop
- Open Graph tags for social sharing — og:title, og:description, og:image (1200×630)
- Twitter Card tags
- Structured data: `Application` schema (JSON-LD) describing the iOS app
- Canonical URL: `https://verrocchio.app`
- Sitemap.xml + robots.txt — include in deliverables
- Semantic HTML — proper `<h1>` (one only, the hero), `<h2>` for sections, `<article>` / `<section>` landmarks

### Accessibility (WCAG 2.2 AA minimum)

- Color contrast: brand green `#2d5a2d` on cream `#f8f7f4` measures **8.4:1** — meets AAA. Maintain.
- All interactive elements keyboard-reachable, visible focus states
- Alt text on all images describing the image, not the surrounding copy
- No motion that auto-plays beyond a 3-second loop; respect `prefers-reduced-motion`
- Screen reader landmarks (`main`, `nav`, `footer`) properly tagged

### Browser support

- Modern evergreen browsers (Chrome / Safari / Firefox / Edge latest 2 versions)
- iOS Safari 16+
- No IE11. No Opera Mini.

### Hosting target

The page will deploy to **Firebase Hosting** alongside the app (multi-site config). Deliverables should be a folder containing:

- `index.html`
- `privacy.html`
- `terms.html`
- `/assets/` — images, fonts (if self-hosted), favicon
- `sitemap.xml`
- `robots.txt`
- Any small JS for interactivity (must be vanilla / no framework)

---

## 11. Out of scope

Things the designer should NOT do:

- Build the privacy / terms page *content* — wording will be supplied by legal. Designer only needs to handle the layout shell.
- Design email templates, App Store assets, or in-app screens.
- Build a CMS or backing dashboard for editing copy. Plain HTML for v1; copy edits happen in code.
- Add a blog, FAQ, or help-center pages. v1 is single page + privacy + terms.
- Animation libraries (GSAP, Framer Motion, Lottie). CSS-only transitions are fine and preferred.
- A/B testing infrastructure. v1 ships static.

---

## 12. Deliverables checklist

The designer should hand off:

- [ ] Figma (or equivalent) file with desktop + mobile designs for all sections
- [ ] Final static HTML/CSS/JS folder ready to deploy to Firebase Hosting
- [ ] Image assets (hero, screenshots in correct treatment, favicon, OG image) in WebP + PNG fallback
- [ ] `sitemap.xml` + `robots.txt`
- [ ] Open Graph + Twitter Card meta tags wired up
- [ ] Lighthouse score screenshot showing 95+ across categories
- [ ] Brief readme.md explaining how to edit copy / swap App Store state
- [ ] Source files for the hero illustration (if custom) in vector format

---

## 13. Reference URLs for the designer

| Resource | URL |
|---|---|
| Current live app (target of CTA) | `https://verrocchio.app` (will move to `app.verrocchio.app`) |
| App Store badge assets | https://developer.apple.com/app-store/marketing/guidelines/ |
| Playfair Display | https://fonts.google.com/specimen/Playfair+Display |
| Lora | https://fonts.google.com/specimen/Lora |
| Tonal reference — Apple | https://www.apple.com/iphone-16/ |
| Tonal reference — Linear | https://linear.app |
| Tonal reference — The Daily Stoic | https://dailystoic.com |
| Andrea del Verrocchio Wikipedia | https://en.wikipedia.org/wiki/Andrea_del_Verrocchio |

---

## 14. Questions to ask before starting

If anything below is unclear, the designer should ask before designing:

1. Is the App Store listing live yet, or is this pre-launch? (Determines App Store badge vs. "Coming soon" text.)
2. Is there a confirmed pricing display on the marketing page, or is pricing handled entirely in-app?
3. Are screenshots of the app available, or should the designer use placeholders?
4. Is there a confirmed support email? *(Yes: `support@verrocchio.app`.)*
5. Is dark mode in scope for v1?
6. Is internationalization in scope? *(No for v1 — English only.)*

---

## Closing

The single most important thing: **the page must feel different from every other tech-startup landing page.** Most habit apps look interchangeable — Inter font, hero gradient, "Build better habits" headline, illustration of a person checking off a list. Verrocchio's positioning is the opposite: classical typography, restrained palette, honest copy, no gimmicks. Lean into that. The worst possible outcome is a generic SaaS landing page in green.

If the designer is unsure about a choice, ask: *"Would Apple's marketing team approve of this restraint? Would the Daily Stoic newsletter ship this copy?"* If either answer is no, reconsider.
