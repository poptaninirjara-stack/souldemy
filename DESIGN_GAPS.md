# Design gaps and departures

Where the build needed something the design handoff (`/design-handoff/README.md`) does not draw, or where the handoff conflicts with the build brief (`MASTER_PROMPT.md`). No new visual style was invented. Every item below is built from existing tokens (`src/styles/tokens.css`) and existing component patterns.

## Conflicts with the brief, resolved in favour of the brief or the content

| Handoff | What the app does | Why |
|---|---|---|
| Points: 10 for each first-try correct answer; points total on My progress | **No points.** Quizzes show only "n of N correct". | Brief §7.7 allows only a plain count. Owner chose "drop points, keep badges". |
| Badges for finished modules | Kept. A module is finished when every lesson (research) or section (communicative) has been read. | Owner decision. Badges reflect reading only, never a score. |
| Exercise screen: multiple choice, fill in the blank, reorder the words, then "Check answer" | The content has open exercises (textarea, then **Show model answer**) and self-correcting quizzes. Quizzes use the handoff's **Option button**, **Feedback panel** and action-row states (Check answer → Try again / Show answer). | The content defines the tasks. The handoff components fit the quiz. |
| Quiz explanation in the margin column (desktop) or bottom sheet (phone) | Explanation appears inline in the feedback panel under each question. | The quiz has 8 items per lesson; inline keeps each explanation next to its question on every screen size. |
| "Sources and further reading" listed inline on the study page | Behind a **Further reading** button that opens the handoff's **Bottom sheet** (on desktop it is centred, max 720px). | Brief constraint 6 and the content files. |
| Annotated phrases, margin notes and the Phrase book | **Not in v1.** Only the welcome demo sentence uses the annotated-phrase style. The desktop margin column holds a lesson-position note (Lesson n of 7, progress line, Further reading button) in the margin-note style. | The content has no annotations, and the brief forbids adding content. |
| 12 research modules and 6 communicative modules (titles drafted) | 2 research modules and 4 communicative modules, from the content files. | The content files are the source of truth. |
| Track names "Research English for Humanities" / "Communicative and professional English" | "Research-Oriented English for Humanities" / "Communicative / Professional English" (from the content). | As above. |
| Library entries (DOAJ, British Council and others) with drafted skill filters | The Library lists every Further reading source from the content, grouped by module, with filters **All · Research-Oriented English · Communicative English**. It also holds the About section. | No extra content; the brief requires an About/Sources page. |
| Google Fonts | Fonts are self-hosted via `@fontsource` (Literata variable with opsz, Public Sans, Noto Serif and Noto Sans Devanagari). | Brief: no runtime CDN calls. |
| Weekly practice: "practice minutes per ISO date" | The student logs hours by hand (number input, quarter-hour steps) for a day this week. Stored as `{date, hours}`; weeks start Monday in Asia/Kolkata. | Brief §7.8: manual logging, no timer. |
| Phone bottom nav hidden on Exercise (focus mode) | No separate exercise screen exists, so the nav stays on lesson pages. | Exercises sit inside lessons. |

## Screens and states the handoff does not draw

- **Research module page** (outcomes + lesson list with "Read" marks). Built from the reading column, Module row pattern and the margin-note panel.
- **Communicative module page.** One page with an in-page index of the six sections, using the Library filter-chip style. "Pending faculty review" badge on Marathi notes uses `margin-tint`, `control-border` and caption type. A section counts as read once its end has been on screen.
- **Track page details.** "Outcomes and lesson map" is a `<details>` disclosure under each research module row; the lesson map table uses the reading-table style.
- **Welcome page additions.** "Continue where you left off" panel and This week panel, using the dashboard panel style.
- **Progress page additions.** Log practice form (inputs styled like the handoff's controls: control-border, radius 4, 48px), My notes with **Clear my notes**, Settings (Reduce motion), **Reset my data**. Destructive actions ask for confirmation inline in a `margin-tint` box.
- **Error state.** "{Thing} did not load. Check your connection and try again." plus **Try again**, as described in §5.7 but not drawn.
- **Not found page.** Plain heading, meta line and a primary button.
- **Tablet (600–1023px).** Built by the stated rule: phone layout, wider padding, reading column capped at 600px and centred.
- **Responsive tables.** Hairline top and bottom rules. When a table overflows, a caption line "Scroll sideways to see the whole table →" and a 2px `control-border` right edge appear (no shadow, per the one-shadow rule).
- **Focus states.** Every control uses the handoff's 2px ink ring with 2px offset.
- **Storage blocked.** The Progress footer line changes to "This browser is blocking storage, so progress lasts only until you close this tab."

## Copy needing the author's review

- Track blurbs (handoff, drafted). The communicative blurb mentions "vivas", which v1 does not cover.
- Interface lines written for states the handoff does not cover:
  - the quiz's generic incorrect message, "That is not the best answer. Try again, or show the answer.";
  - "Write your attempt first. The model answer appears after you try.";
  - the Marathi-notes review caption;
  - the About text;
  - the Log practice helper text.
