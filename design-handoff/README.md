# [NAME] — implementation handoff

A free web app that teaches academic and professional English to first- and second-year BA students (Geography, Psychology, English) at an English-medium college in Maharashtra. First language Marathi. Mostly used on phones between classes.

Design direction: **the annotated edition**. The app reads like a well-made scholarly book with a thoughtful reader's marginalia. Key phrases in the reading are marked; a short note sits beside each one.

The wordmark is not final. Keep it typographic: the text `[NAME]` set in Literata 600. Make it one config value.

## Contents

1. Scope and architecture
2. Files in this package
3. Tokens
4. Breakpoints and layout grid
5. Screen specs
6. Components
7. Opening sequence
8. Motion between screens
9. Copy
10. Accessibility checklist
11. Open items

---

## 1. Scope and architecture

**Front end only for now.** No login, no accounts, no database, no analytics, no ads, no payments, no leaderboards.

- All progress is stored on the device in `localStorage`, under one versioned key (for example `app.v1`). Store: chosen track, per-module progress, per-task status and first-try flag, points, saved phrase IDs, weekly goal in hours, practice minutes per ISO date.
- The opening sequence's "already played" flag lives in `sessionStorage`, so it plays once per browser session.
- Content (modules, study pages, notes, tasks, resources) should be static JSON or Markdown in the repo, so lecturers can edit it without touching components. Each margin note needs a stable ID so a saved phrase survives content edits.
- Design the storage layer behind a small interface (`load()`, `save()`, `migrate()`). **Accounts and a database will come later.** Keeping this one seam lets sync be added without rewriting screens.
- Phone-first, scaling to tablet and desktop. Must work offline once loaded if practical (a service worker is a nice-to-have, not required).
- Devanagari must render well everywhere text appears, so Marathi glosses can be added to any note. Mark Marathi runs with `lang="mr"`.
- Show this line on My progress: "Progress is saved on this device only. Clearing your browser data removes it."

## 2. Files in this package

- `design/Prototype.dc.html` — the clickable reference. Open it in a browser. It shows the app three times: phone 390px, phone 360px, desktop 1280px. A review bar on top switches returning student / first visit, replays the opening, shows the loading state and simulates reduced motion.
- `design/App.dc.html` — the single app component behind the prototype. All screens, states, data and interaction logic are in its logic class (search for `RES`, `COM`, `ANN`, `PARTS`, `TASKS`, `SOURCES`). Treat it as the source of truth for copy, colours and spacing values.
- `design/support.js` — runtime for the prototype only. Do not ship it.

The prototype is a design reference, not production code. Rebuild it in the target stack with real routing, semantic components and the storage layer above. Prototype-only shortcuts that should **not** carry over: progress held in memory, all screens in one component, inline styles.

## 3. Tokens

### Colour

| Token | Hex | Use |
|---|---|---|
| `paper` | `#F6F7FA` | App background (cool white) |
| `page` | `#FFFFFF` | Reading and exercise surfaces, cards, top bar |
| `ink` | `#1E2A5E` | Headings, navigation, primary buttons, links |
| `ink-hover` | `#16204A` | Primary button hover |
| `body-ink` | `#181B2E` | Body text |
| `muted` | `#4B5375` | Secondary text, meta lines, inactive nav (added, 5.5–7.5:1) |
| `control-border` | `#6E7590` | Borders of inputs, chips, secondary buttons, empty week bars (added, ≥4.5:1 on paper) |
| `margin-tint` | `#EEF0F7` | Margin note / selected option / skeleton background |
| `hairline` | `#D9DCE6` | Dividers, card borders, progress track |
| `turmeric` | `#D69A12` | Highlighter only |
| `turmeric-wash` | `#F1DCAC` | Highlight sweep fill behind an active phrase |
| `correct` | `#2E7D5B` | Correct answers |
| `incorrect` | `#B23A48` | Incorrect answers |
| `scrim` | `rgba(24,27,46,.36)` | Behind the bottom sheet |

Rules:
- **Turmeric is never a text colour.** It is used for underlines on marked phrases, the highlight sweep, the progress lines and ribbon, the active-nav underline, the active margin-note rule, and `::selection`. Dark ink always sits over any turmeric fill.
- Correct and incorrect always carry an icon **and** words. Never colour alone.
- `correct` text is never placed on `margin-tint` (4.39:1, fails). Put it on `page` or `paper`.
- `hairline` is for dividers only. Never use it as the only boundary of a control.

Checked contrast pairs (WCAG AA):

| Foreground on background | Ratio |
|---|---|
| body-ink on page / paper / margin-tint | 17.0 / 15.9 / 14.9 |
| ink on page / paper / margin-tint | 13.6 / 12.7 / 11.9 |
| page (white) on ink | 13.6 |
| paper on ink (opening wordmark) | 12.7 |
| body-ink on turmeric-wash | 12.6 |
| ink on turmeric-wash | 10.1 |
| ink on turmeric | 5.5 |
| muted on page / paper / margin-tint / hairline | 7.5 / 7.0 / 6.6 / 5.5 |
| correct on page / paper | 5.0 / 4.7 |
| incorrect on page / paper / margin-tint | ≥5.1 |
| control-border on page / paper (non-text, ≥3:1) | ~4.6 / ~4.3 |
| turmeric on page (non-text only) | ~2.3 — must not carry meaning alone; underlines ≥2px |

### Type

Fonts (Google Fonts): **Literata** (opsz 7..72, 400, 600, 400 italic) for reading and headings; **Public Sans** (400, 500, 600) for interface; **Noto Serif Devanagari** and **Noto Sans Devanagari** (400, 600) for Marathi. Font stacks:

- Serif: `Literata, 'Noto Serif Devanagari', serif`
- Sans: `'Public Sans', 'Noto Sans Devanagari', system-ui, sans-serif`

Scale (1.25 ratio):

| Token | Size / line height | Font | Use |
|---|---|---|---|
| `caption` | 14 / 1.4–1.5 | Public Sans 400–600 | Meta, statuses, source hosts, nav on phone |
| `ui` | 16 / 1.5 | Public Sans 400–600 | Interface text, buttons, notes |
| `body` | 19 / 1.7 | Literata 400 | Reading text. Measure 62–68 characters (600px column on desktop) |
| `h3` | 24 / 1.3 | Literata 600 | Section headings. 19/1.35 for panel headings |
| `h2` | 30 / 1.25 | Literata 600 | |
| `h1` | 38 / 1.2 desktop, 30 / 1.2 phone | Literata 600, letter-spacing −0.015 to −0.02em | Page titles |
| `demo` | 24 desktop / 21 phone, 1.6 | Literata 400 | Welcome demo sentence |
| `wordmark` | 22 desktop header, 20 phone header; 56 / 44 in opening | Literata 600, −0.01em | |
| Marathi gloss | 16–17 / 1.8 | Noto Serif Devanagari 400 | Taller line height for matras |

Headings: semi-bold serif, slightly tight, sentence case, `text-wrap: balance`. Body: `text-wrap: pretty`. No all-caps anywhere. Numbers that line up use `font-variant-numeric: tabular-nums`.

### Spacing

8px base. Used steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72. (4 and 12 are half-steps for tight inline groups.)

### Radii

| Role | Radius |
|---|---|
| Buttons, inputs, chips, option rows, toast | 4px |
| Sheets and panels (dashboard cards, track cards, empty phrase book, app frame) | 8px (bottom sheet: 8px top corners only) |
| Reading page, margin notes | 0 |
| Radio dots, badge medallions | 50% |

### Elevation

Structure comes from hairlines and whitespace. **One soft shadow, bottom sheet only:** `0 -8px 32px rgba(30,42,94,.16)`. No other shadows.

### Motion

One easing family: `--ease-out: cubic-bezier(0.25, 1, 0.5, 1)`. Nothing loops. No bounce, shake or confetti.

| Token | Value | Use |
|---|---|---|
| `dur-instant` | 120ms | Quiz feedback fade-in (must appear within 150ms) |
| `dur-fade-reduced` | 150ms | The only motion under reduced motion |
| `dur-toast` | 200ms | Toast opacity + 8px rise |
| `dur-screen` | 220ms | Reading column cross-fade |
| `delay-margin` | 120ms | Margin notes / explanation arrive after text |
| `dur-margin` | 260ms | Margin note opacity + 6px rise |
| `dur-sheet` | 320ms | Bottom sheet translateY 110% → 0 |
| `dur-scrim` | 300ms | Scrim opacity |
| `dur-ribbon` | 450ms | Progress ribbon top/height; progress-line width |
| `dur-sweep` | 500ms | Highlight sweep (background-size 0% → 100%) |
| `toast-hold` | 2600ms | Toast visible time |

Under `prefers-reduced-motion: reduce`: every screen change is a single 150ms opacity fade; highlight, sheet, ribbon and margin notes appear in place with no movement.

## 4. Breakpoints and layout grid

| Range | Name | Layout |
|---|---|---|
| < 600px | phone | Single column. Top bar 56px. Bottom navigation 64px. Page padding 24px sides (32px top, 40px bottom). Margin collapses into the bottom sheet. Designed at 390px, checked at 360px. |
| 600–1023px | tablet | Phone layout with wider padding (32–40px) and the reading column capped at 600px, centred. Margin still in the bottom sheet. Bottom nav stays. (Not drawn; follow this rule.) |
| ≥ 1024px | desktop | Top bar 64px with nav on the right; no bottom nav. Study and exercise screens add the contents rail and margin column. Designed at 1280px. |

Desktop study / exercise grid (at 1280px):

```
| rail 248px | main: padding 48px | reading 600px | gap 40px | margin 254px | rest |
```

- Rail: fixed width 248px, own scroll, padding 28px 20px 28px 24px, right hairline, `paper` background.
- Main: `page` background, padding 48px 48px 72px.
- Reading and margin columns sit in one CSS grid (`600px 254px`, column-gap 40px). Each paragraph and its notes share a grid row, so a note lines up with its paragraph.
- Other desktop screens (welcome, dashboard, progress) centre within `max-width: 1040px` with padding 56px 48px 72px. Library: `max-width: 760px`.

Never use fixed heights on boxes that hold text. Use `minmax(0,1fr)` tracks.

## 5. Screen specs

Six screens in one flow: Opening → Welcome and track choice → Module dashboard → Study page → Exercise → (Library, My progress from navigation). Plus empty, first-visit and loading states.

### Global chrome

**Phone top bar** (56px, `page`, bottom hairline, padding 0 12px 0 8px):
- Left: either the wordmark (button → Welcome) or a back button (chevron + label: "Contents" on study, "Study page" on exercise).
- Right (contextual): dashboard "Change track"; study "Phrase book (n)"; exercise "Task n of 3" (muted, not a link).

**Phone bottom navigation** (64px, `page`, top hairline): Learn · Library · Progress. Hidden on Welcome and Exercise (focus mode).

**Desktop top bar** (64px, padding 0 32px): wordmark left; right: Learn · Library · Progress · "Phrase book (n)". Gap 32px.

### 5.1 Welcome and track choice

Phone: page padding 32/24/40, vertical gap 24.
1. H1 "Learn to write and speak the way scholars do."
2. Demo sentence (blockquote, `demo` size) with "suggest" marked; margin note beneath it (desktop: beside it, grid `600px 254px`).
3. H3 "Choose a track".
4. Two track cards (phone: stacked; desktop: two columns, gap 16). Card: `page`, 1px hairline, radius 8, padding 20, hover border `ink`. Contents: track name (Literata 600 19px, ink) + chevron, one-line blurb, module count (caption, muted). The whole card is the button.
5. Footnote (caption, muted): "Free. No account. Progress stays on this device."

Next action: choose a track. Selecting a card sets the track and goes to the dashboard.

### 5.2 Module dashboard

Contents page for the chosen track, like a course outline.

Phone order: Continue panel → This week strip → H1 + summary → module list.
Desktop: two columns `minmax(0,1fr) 300px`, gap 56. Module list left, Continue panel and This week right.

- H1: track name. Summary line: "12 modules, 6 completed" + "Change track" link.
- Module list: top hairline; each row a full-width button (see Module row). The progress ribbon marks the current module.
- Continue panel (`page`, hairline, radius 8, padding 24): heading = current module title; one line of status; 4px progress line; primary button "Continue" (48px, full width). First visit: heading "Start here", button "Start module", no bar.
- This week panel (`page`, hairline, radius 8, padding 20/24): heading "This week" + summary "1 h 10 min of 3 h"; week strip; one line; link "Change goal" / "Set a weekly goal" → My progress.

Next action: the Continue button. It goes to the study page, or to the exercise if the study page is already read.

### 5.3 Study page

Phone: full-width reading column, padding 32/24/40.
Desktop: rail + reading column + margin column (see grid).

- H1 "Hedging and academic stance". Meta (ui, muted): "Module 7 of 12 in Research English for Humanities." Phone adds: "Tap an underlined phrase to read its note."
- Reading text at `body` (19/1.7) with four annotated phrases.
- Desktop margin: one note per annotated phrase, in reading order, top-aligned with the paragraph. Gap 20 between notes.
- "Sources and further reading" (h3) with a top hairline, margin-top 40. Rows: link title (ui 500) + publisher (caption, muted), bottom hairline.
- Primary button "Practise" (48px; phone full width, desktop auto width with 40px side padding) and a caption: "Three tasks: multiple choice, fill in the blank, reorder the words."

Next action: tap a phrase, then "Practise".

### 5.4 Exercise

Looks like a worksheet. One task at a time. Phone hides bottom nav.

- H1 "Practice". Meta: "Hedging and academic stance. Task n of 3." Step indicator: three 4px segments, max-width 240, gap 4 (done = turmeric, current = control-border, upcoming = hairline). The step text carries the meaning, not the colour.
- Task heading (h3): "Multiple choice" / "Fill in the blank" / "Reorder the words". Instruction (ui, muted).
- Task body (see Option button, Ruled blank, word bank).
- Feedback panel (live region) below the task, margin-top 20.
- Action row (gap 12, margin-top 24):
  - idle: "Check answer" (disabled look until an answer exists: hairline background, muted text, `aria-disabled="true"`)
  - incorrect: "Try again" (primary) + "Show answer" (secondary)
  - solved, desktop: "Next task" / "Finish practice"
  - solved, phone: "Read explanation" (secondary) + "Next task" / "Finish practice"
- Explanation: desktop in the margin column (Margin note style, active rule, heading "Explanation"), arriving 120ms after feedback. Phone: in the bottom sheet, opened automatically on a correct answer or "Show answer"; the sheet's primary button is the next-task action.
- Completion view: H1 "Practice complete"; a summary sentence; "Hedging and academic stance is complete. Its badge is on your progress page."; "Back to contents" (primary), "Open progress" (secondary), "Practise again" (link).

Scoring: 10 points for each task answered correctly on the first try. "Show answer" gives no points.

Next action: always exactly one primary button.

### 5.5 Resource library

Single column, max-width 760 on desktop.
- H1 "Library". Line (ui, muted): "Links open the original site."
- Filters (see Filters): All · Finding papers · Reading and citing · Academic phrasing · Abstracts · Literature reviews · Email.
- List: top hairline; each row is one link (padding 18 0, bottom hairline): source name (Literata 600 19, ink) + external-link icon (16px, ink) right-aligned; "good for" line (ui, body-ink); host (caption, muted).

### 5.6 My progress

Desktop two columns (gap 56), phone one column. Sections are separated by hairlines (padding 20 top, 24 bottom). Understated, like a habit tracker.

Left / first:
- **This week:** heading + "1 h 10 min of 3 h"; week strip with minutes under each day; line "You met your weekly goal for the last 4 weeks." (first visit: "Practise on any day this week to start your record.")
- **Weekly practice goal:** helper "Choose a number of hours you can keep in a busy week. You can change it at any time." Segmented radio 1 h–6 h (44px tall, min 52px wide). If no goal is set: "Choose how many hours a week you want to practise."
- **Points:** big number on the right of the heading; "Ten points for each task answered correctly the first time."
- **Modules completed:** per track: name + "6 of 12" + 2px progress line.

Right / second:
- **Badges:** list of completed modules: 36px circle (1.5px ink border, check icon) + module title (Literata 16) + track (caption). Empty: "A badge appears here each time you finish a module."
- **Phrase book:** heading + count ("1 phrase" / "n phrases"). Rows: phrase (Literata 600 19), note, "From Hedging and academic stance", "Remove" link.
- Footer line (caption, muted, top hairline).

### 5.7 States

- **First visit** (no stored data): dashboard shows "Start here" / "Start module", all progress lines empty, ribbon on module 1, week strip empty with "Set a weekly goal", 0 points, no badges, empty phrase book.
- **Empty phrase book** (an invitation to act): panel (`page`, hairline, radius 8, padding 20): "Save phrases while you read and they collect here with their notes, ready to use in your own writing." + secondary button "Open a study page".
- **Loading:** in the reading column: `aria-busy="true"`; skeleton bars in `margin-tint` radius 4 (title 36px at 70%, meta 16px at 45%, three 14px lines at 100/96/88%); then text "Loading {thing}…" (ui, muted), e.g. "Loading Hedging and academic stance…". No spinner. Show only if loading takes longer than ~300ms.
- **Errors** (not drawn): say what happened and how to fix it, without apologising. E.g. "This page did not load. Check your connection and try again." + "Try again".

## 6. Components

All interactive elements: visible focus ring `2px solid ink, offset 2px` via `:focus-visible`. Minimum touch target 44×44px (inline phrase links within running text are the WCAG inline exception).

### Contents rail (desktop study/exercise)
- 248px, sticky, own scroll. "All modules" back link (44px tall) → dashboard. Track name (ui 600, ink).
- List of module rows: title (caption 14/1.4), progress line (current 4px, others 2px). The current module expands two sub-items: "Study page" (note "Read") and "Practice" (note "n of 3"). The active sub-item gets a `margin-tint` background, weight 600 and `aria-current="page"`. Sub-items are at least 40px tall.
- Stays fixed while the main column cross-fades.
- A11y: `<nav aria-label="Modules in this track">`; buttons or links, not divs.

### Module row (dashboard)
- Full-width button: grid `28px minmax(0,1fr)`, column-gap 12, padding 16 0, bottom hairline. Hover: `page` background.
- Number (Literata 16, muted, tabular). The number is used because modules are a real sequence.
- Title (Literata 19; 600 if current, else 400; ink). Outcome (ui, muted). Progress line 2px + status (caption, min-width 76, right): "Completed" / "40%" / "Not started" (current only) / blank.
- States: default, hover, current (`aria-current="step"`, weight 600, ribbon), completed (full line + "Completed").
- A11y: the accessible name should include the status, e.g. "7. Hedging and academic stance, 40%".

### Progress ribbon (dashboard)
- A 4px turmeric bar positioned absolutely in the list's left gutter (−20px desktop, −24px phone), spanning the current row's full height, like a bookmark ribbon.
- Moves to the new current row with top/height transitions (450ms ease-out) when progress changes. No movement under reduced motion.
- Decorative: `aria-hidden="true"`. The current row says the same thing with `aria-current` and bold weight.

### Reading column
- `page` background, no radius. Text Literata 19/1.7, body-ink, 600px max on desktop (≈65 characters). Headings ink.

### Annotated phrase
- Inline `<button>` styled as text, or `<span role="button" tabindex="0">` handling Enter/Space. Underline 2px turmeric, offset 5px. Padding 2px 0, `box-decoration-break: clone`.
- Active: `turmeric-wash` background sweeps left to right (background-size 0% → 100%, 500ms); `aria-pressed="true"`.
- Desktop: toggles the matching margin note active. Phone: opens the bottom sheet with that note.
- A11y: accessible name = phrase; `aria-controls`/`aria-describedby` linking to the note. The underline is the non-colour cue (shape, not hue).

### Margin note
- Desktop margin column, top-aligned with its paragraph. Plain text with a hairline above (chosen variant B): `border-top 1px hairline, padding-top 12px`. Active: `2px solid turmeric`, padding-top 11px (no layout shift).
- Content: phrase (Literata 600 16, ink), note (ui 16/1.5, body-ink), optional Marathi gloss (`lang="mr"`, Noto Serif Devanagari 16/1.8), and when active a "Save phrase" secondary button (44px, 1px ink border). Once saved: "In your phrase book" (hairline border, no action).
- Clicking a note activates it (mouse convenience only). Keyboard users activate through the phrase, then Tab to "Save phrase". The note container itself is not a focus stop.
- Arrives 120ms after the reading text on screen change (260ms, 6px rise).

### Bottom sheet (phone)
- Absolutely positioned at the bottom; `page`; radius 8 8 0 0; the one shadow; padding 12 24 24; grab handle 36×4 hairline.
- Note variant: phrase (Literata 600 19), note, Marathi gloss on `margin-tint` panel (radius 4, padding 12 16), buttons "Save phrase" (primary, 48px) + "Close" (secondary).
- Explanation variant: "Explanation" with active turmeric rule, text, buttons "Next task"/"Finish practice" + "Close".
- Rises from the bottom edge: translateY 110% → 0, 320ms ease-out, no bounce. Scrim fades 300ms. Tap scrim or press Escape to close.
- A11y: `role="dialog"`, `aria-modal="true"`, labelled by its heading; move focus to the heading or first button on open; trap focus; return focus to the triggering phrase on close. `visibility: hidden` when closed so it isn't tabbable.
- Saving closes the sheet and shows the toast.

### Toast
- "Saved to your phrase book." with a correct-green check icon. `page`, 1px hairline, radius 4, padding 12 16, ui 16. Bottom centre (phone: 80px above bottom so it clears the nav). Max width = container − 48px; wraps. `role="status"`. Fades in and rises 8px over 200ms, holds 2.6s.

### Option button (multiple choice)
- `role="radio"` inside `role="radiogroup"`; full width; grid `20px 16px 1fr`, gap 12; padding 14 16; 1px border; radius 4; text Literata 19/1.55; letter A–D (ui 600, ink).
- States:
  - unanswered: hairline border, white, empty radio ring (control-border)
  - hover: border ink
  - selected: ink border + 1px inset ring (2px total), `margin-tint` background, filled ink radio dot, `aria-checked="true"`
  - correct: correct-green 2px border, white background, row shows ✓ icon + "Correct answer"
  - incorrect: incorrect-red 2px border, white background, row shows ✗ icon + "Your answer"
  - locked after solving (no pointer)
- Arrow keys move selection within the group (roving tabindex).

### Ruled blank (fill in the blank)
- Inline in the sentence (Literata 21/2.1): `inline-block`, min-width 8ch, bottom border 2px, centred, ink 600 text.
- Border colour by state: unanswered control-border, selected ink, correct green, incorrect red. The colour is backed up by the feedback panel text.
- Word choices below as chips (44px, radius 4, Literata 17). Selected chip: ink border + inset ring + `margin-tint`, `aria-pressed="true"`.
- Production note: also accept typed input for later tasks. Provide `aria-label="Blank"` and announce the chosen word.

### Sentence reordering
- A ruled answer line (min-height 56, bottom border 2px in the same state colours as the blank) holds placed word tiles. A second hairline sits beneath as the worksheet's next line. The word bank sits below.
- Tap a bank word to append it; tap a placed word to remove it. Used bank words become dashed outlines with hidden text (`aria-hidden`, `tabindex=-1`), keeping their place.
- The first word is capitalised automatically; a full stop is added when solved.
- Empty hint: "Your sentence appears on this line."

### Feedback panel
- `role="status"` `aria-live="polite"`; appears within 150ms (120ms fade). Icon 20px + bold label + sentence:
  - ✓ green **Correct.** "10 points added." (first try only)
  - ✗ red **Incorrect.** + what was wrong and how to fix it
  - ⓘ ink **Answer shown.** "No points for this task."
- No shake or confetti. Labels in words, so colour is never the only cue.

### Week strip
- 7 columns (M T W T F S S), gap 6–8. Each day: bar + letter + (progress page) minutes or "–".
- Practised day: 6px turmeric bar. Not practised: 1px control-border line. The difference is in thickness, not just colour.
- Today: letter in ink, weight 600.
- A11y: each day has `aria-label="Monday: 50 min practised"` / "Tuesday: no practice". Wrap the strip in a list with a summary heading.
- The streak is the student's own weekly goal in hours. No flames, no streak-loss warnings.

### Resource row
- One link per row; opens in a new tab with `rel="noopener"`. The external icon has `aria-label="Opens the original site in a new tab"` (or append visually hidden text to the link).
- Always attribute the source: name + host.

### Filters (library)
- `role="radiogroup"` `aria-label="Filter by skill"`; chips are radios: 44px tall, padding 0 14, radius 4, ui 500 14. Selected: ink fill, white text, `aria-checked="true"`. Unselected: white, control-border, ink text.
- Phone: single scrolling row (scrollbar hidden; row bleeds to the right edge so it is clearly scrollable). Desktop: wraps.
- Announce the result count after filtering ("3 sources").

### Bottom navigation (phone)
- 3 equal columns, 64px. Labels only (caption 14). Active: ink, 600, 3px turmeric underline offset 6px, `aria-current="page"`. Inactive: muted 500.
- "Learn" is active on Welcome, Dashboard, Study and Exercise. `<nav aria-label="Main">`.

### Buttons
- Primary: ink background, white text, ui 600 16, height 48 (44 on desktop secondary contexts), radius 4, hover `ink-hover`.
- Secondary: white, 1px control-border, ink text; hover `margin-tint`.
- Text link: ink, underline in control-border at 3px offset; hover underline turmeric 2px. Min 44px hit area.
- Disabled: hairline background, muted text, `aria-disabled="true"` (keep it focusable so the reason can be explained).

## 7. Opening sequence

Plays **once per browser session**, before Welcome. The Welcome screen is rendered underneath from the first frame. The indigo panel is an overlay, so content is never delayed.

| Time | What happens | Property, duration, delay |
|---|---|---|
| 0–300ms | Full-screen indigo `#1E2A5E`. Nothing else. | — |
| 300–800ms | Wordmark appears in Literata 600 (56px desktop, 44px phone), colour `paper`. Letter spacing settles from loose to normal. | opacity 0→1, letter-spacing 0.14em → −0.01em; 500ms, delay 300 |
| 700–1000ms | Turmeric underline (3px, 10px below the wordmark, full wordmark width) draws left to right. | scaleX 0→1, transform-origin left; 300ms, delay 700 |
| 1000–1300ms | Panel lifts upward. It stops catching pointer events at 1000ms, so the content is usable as soon as the lift starts. | translateY 0 → −100%; 300ms, delay 1000. Remove the panel at 1300ms (backup timer as well as the `finish` event). |
| 1300–1800ms | On Welcome, "suggest" receives the highlight sweep and its margin note slides in. Part of the page, not a blocker. | background-size 0%→100%, 500ms, delay 1300; note opacity 0→1 + translateY 8px→0, 500ms, delay 1300 |

All steps use `cubic-bezier(0.25, 1, 0.5, 1)`. Nothing loops. The indigo is never on screen for more than 1300ms.

Rules:
- **Skip:** any pointer down or key press during the sequence finishes all animations immediately (Welcome in its final state, highlight and note in place).
- **Once per session:** set `sessionStorage` "opening seen" when it finishes or is skipped. Returning to Welcome in the same session shows it immediately with no sequence.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no panel. Welcome fades in once over 150ms, with the highlight and note already in place.
- The overlay is `aria-hidden="true"`. Screen readers start on the Welcome H1.

Implementation: Web Animations API (`element.animate`) with `fill: 'both'`, or CSS animations with `animation-delay`. Do not block the router on it.

## 8. Motion between screens

- The contents rail and top bar stay fixed. Only the main column changes: cross-fade opacity 0→1, 220ms. Scroll the main column to the top.
- Margin notes (and the exercise explanation) arrive 120ms after the text: opacity + 6px rise, 260ms.
- The progress ribbon slides to its new row (450ms). Progress lines animate their width (450ms).
- The bottom sheet rises from the bottom edge, 320ms, no bounce.
- Quiz feedback appears within 150ms (120ms fade), always with an icon and words.
- Reduced motion: every screen change is a single 150ms fade; nothing else moves.

## 9. Copy

Interface voice: plain words, sentence case, active verbs. Errors say what happened and how to fix it, without apologising. Do not rewrite supplied content. Copy marked *(drafted)* was written for the prototype and needs the author's review.

### Welcome
- H1: "Learn to write and speak the way scholars do."
- Demo sentence: "Early findings suggest a link between sleep and memory." (marked: "suggest")
- Note: "Hedging. 'Suggest' signals caution; 'prove' would claim too much."
- "Choose a track"
- Research English for Humanities — "Read papers, find a research gap, and write in the register of your discipline." — "12 modules" *(blurb drafted)*
- Communicative and professional English — "Write formal email, speak in seminars and vivas, and introduce yourself professionally." — "6 modules" *(blurb drafted)*
- "Free. No account. Progress stays on this device."

### Modules (titles supplied; one-line outcomes drafted)

Research English for Humanities
1. What research is, and why academic writing works the way it does — Explain what counts as research and why academic writing backs each claim with evidence.
2. How to find academic papers — Search for scholarly papers in your subject and judge which are worth reading.
3. How to read a paper — Find a paper's question, method and findings without reading every word.
4. Critical reading and analysis — Judge how well a source supports its own claims.
5. What a research gap is — Recognise a gap in earlier studies and describe it in one sentence.
6. Reading and summarising academic sources — Summarise a source accurately and in your own words.
7. Hedging and academic stance — Make claims with the degree of caution the evidence allows.
8. Structuring an abstract — Write an abstract that states aim, method, findings and significance.
9. Literature review phrasing — Use phrases that group, compare and evaluate earlier studies.
10. Framing a research question — Turn a broad topic into a focused question you can answer.
11. Qualitative research vocabulary — Use the terms for interviews, themes and coding correctly.
12. Citation-adjacent phrasing — Introduce, report and respond to other writers' ideas.

Communicative and professional English
1. Formal email — Write a clear formal email to a teacher, office or employer.
2. Shifting register — Move between casual, neutral and formal English on purpose.
3. Presentations and viva — Present your work and answer examiners' questions clearly.
4. Interview English — Answer common interview questions clearly and briefly.
5. Group discussion — Join in, build on others' points and disagree politely.
6. Professional self-introduction — Introduce yourself and your studies in under a minute.

### Dashboard
- Summary: "{n} modules, {k} completed" · "Change track"
- Continue panel: "{module title}" · "Module 7 of 12. Study page read; practice 1 of 3 tasks done." · "Continue"
- First visit: "Start here" · "Begin with the first module. It explains what research is and why academic writing works the way it does." · "Start module"
- Statuses: "Completed" · "{n}%" · "Not started"
- This week: "This week" · "{1 h 10 min} of {3} h" · "You met your weekly goal for the last 4 weeks." *(prototype sample data)* · "Change goal" / "Set a weekly goal" · "Choose how many hours a week you want to practise."

### Study page: Hedging and academic stance
- Meta: "Module 7 of 12 in Research English for Humanities." Phone adds: "Tap an underlined phrase to read its note."
- Reading text (supplied):
  > Academic writers rarely claim certainty. Instead of writing that a study **proves** something, they write that its results **suggest** a link, or that the evidence **appears to** support an explanation. This is not weakness. Hedging shows the reader **how much weight a claim can bear**, and it leaves room for other researchers to test it.
- Notes (supplied):
  - proves — "Too strong for most single studies. Compare: suggests, indicates."
  - suggest — "A hedging verb. It reports a pattern without claiming it is settled." Marathi: "सूचित करणे: निष्कर्ष निश्चित आहे असे न म्हणता नमुना मांडणे."
  - appears to — "A distancing phrase. It signals a reasonable but not final reading."
  - how much weight a claim can bear — "Hedging is about accuracy, not doubt."
- "Save phrase" · "In your phrase book" · "Close" · toast "Saved to your phrase book."
- "Sources and further reading": Academic Phrasebank — University of Manchester; Research and Citation — Purdue Online Writing Lab
- "Practise" · "Three tasks: multiple choice, fill in the blank, reorder the words."

### Exercise
- "Practice" · "Hedging and academic stance. Task {n} of 3."
- **Multiple choice** — "Choose one sentence." — "Which sentence is best hedged for a small survey?"
  - A. The survey proves that students sleep too little.
  - B. The survey suggests that many students may be sleeping too little. *(correct)*
  - C. Students definitely sleep too little.
  - D. Everyone knows students sleep too little.
  - Explanation: "B reports what the data can support and uses 'suggests' and 'may'. The others claim certainty that one small survey cannot give."
  - Incorrect *(drafted)*: "That sentence claims more certainty than one small survey can give. Choose a sentence that reports the finding cautiously."
- **Fill in the blank** — "Choose the word that completes the sentence." — "These findings ____ a relationship between reading habits and vocabulary." Options: suggest / prove / confirm beyond doubt. Correct: suggest.
  - Explanation *(drafted)*: "'Suggest' reports the relationship and leaves room for further study. 'Prove' and 'confirm beyond doubt' claim more than findings like these can support."
  - Incorrect *(drafted)*: "“{word}” claims more than these findings can support. Choose a hedging verb."
- **Reorder the words** — "Tap the words in order to build the sentence. Tap a placed word to remove it." — may / the results / explain / differences / in / attendance. Correct: "The results may explain differences in attendance."
  - Explanation *(drafted)*: "'May' sits directly before the verb it hedges. The sentence offers the results as a possible explanation for differences in attendance, not a proven one."
  - Incorrect *(drafted)*: "The words are not in a grammatical order. Start with the subject, then put “may” before the verb it hedges."
  - Empty line: "Your sentence appears on this line."
- Feedback labels: "Correct." "10 points added." · "Incorrect." · "Answer shown." "No points for this task." · "Correct answer" · "Your answer"
- Buttons: "Check answer" · "Try again" · "Show answer" · "Read explanation" · "Next task" · "Finish practice"
- Done: "Practice complete" · "You finished all three tasks: {n} correct the first time[, {m} correct after another try][, {k} with the answer shown]. {points} points added." · "Hedging and academic stance is complete. Its badge is on your progress page." · "Back to contents" · "Open progress" · "Practise again"

### Library
- "Library" · "Links open the original site."
- Filters: All · Finding papers · Reading and citing · Academic phrasing · Abstracts · Literature reviews · Email *(filter tagging drafted)*

| Source | Good for | Link | Filters |
|---|---|---|---|
| Purdue OWL, Research and Citation | Conducting and using research, quoting and paraphrasing, citation styles | https://owl.purdue.edu/owl/research_and_citation/resources.html | Reading and citing |
| Purdue OWL, Abstracts | What an abstract does and how it is usually structured | https://owl.purdue.edu/owl/graduate_writing/graduate_writing_genres/graduate_writing_genres_abstracts_new.html | Abstracts |
| Academic Phrasebank, University of Manchester | Example phrases organised by the sections of a research paper | https://www.phrasebank.manchester.ac.uk/ | Academic phrasing, Abstracts, Literature reviews |
| UNC Writing Center, Literature Reviews | What a literature review is and how to build one | https://writingcenter.unc.edu/tips-and-tools/literature-reviews/ | Literature reviews |
| Google Scholar, Help | Searching for scholarly papers | https://scholar.google.com/intl/en/scholar/help.html | Finding papers |
| DOAJ, Directory of Open Access Journals | Finding peer-reviewed open access journals | https://doaj.org | Finding papers |
| British Council LearnEnglish, English for emails | Starting, organising and finishing emails | https://learnenglish.britishcouncil.org/business/eng *(truncated — confirm full URL)* | Email |

### My progress
- "My progress"
- "This week" · "{time} of {goal} h" · day minutes or "–"
- "Weekly practice goal" · "Choose a number of hours you can keep in a busy week. You can change it at any time." · 1 h … 6 h
- "Points" · "Ten points for each task answered correctly the first time."
- "Modules completed" · "{k} of {n}" per track
- "Badges" · empty: "A badge appears here each time you finish a module."
- "Phrase book" · "1 phrase" / "{n} phrases" · "From {module}" · "Remove"
- Empty phrase book: "Save phrases while you read and they collect here with their notes, ready to use in your own writing." · "Open a study page"
- "Progress is saved on this device only. Clearing your browser data removes it."

### Loading
- "Loading the welcome page…" · "Loading the contents…" · "Loading Hedging and academic stance…" · "Loading the practice tasks…" · "Loading the library…" · "Loading your progress…"

## 10. Accessibility checklist

- WCAG 2.2 AA. All pairs in §3 pass; keep new pairs to that table.
- Every interactive element is a real `button`/`a`/`input`, reachable by Tab, with the `:focus-visible` ring.
- Touch targets ≥44×44px. Inline phrase links in running text are the documented exception.
- Reflow at 320–360px and 200% zoom: no horizontal scroll except the filter row, no fixed heights on text boxes, no `nowrap` on content text.
- State is never colour alone: selected = filled radio + thicker border; correct/incorrect = icon + word; week strip = bar thickness; progress lines = status text.
- Live regions: feedback panel and toast are `role="status"`.
- Bottom sheet: modal dialog behaviour (focus trap, Escape, focus return).
- `lang="en"` on the document and `lang="mr"` on Marathi runs. Test Devanagari conjuncts and matras at 16px and up (line height ≥1.8).
- Respect `prefers-reduced-motion` everywhere (§7, §8).
- `::selection` uses turmeric with body-ink text.

## 11. Open items

- **Wordmark** is a placeholder (`[NAME]`).
- **Drafted copy** needs author review: module outcomes, track blurbs, incorrect-answer messages, explanations for fill-in and reorder, library filter tags.
- **Marathi gloss** for "suggest" was supplied. Any further glosses need a Marathi reviewer.
- **British Council URL** looks truncated.
- **Only one study page exists.** Every research module currently opens "Hedging and academic stance". Module routing should be data-driven.
- **Tablet** layout is specified by rule (§4) but not drawn.
- **Answer-key query** from Module 1, Exercise 5b, item 3 (raised earlier) is still open if that module is added.
- **Later:** accounts, a database and sync behind the storage interface in §1. Until then nothing leaves the device.
