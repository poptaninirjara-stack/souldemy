# MASTER PROMPT: Academic & Professional English App (v1)

You are building a static, front-end-only web app. Read this whole file, then inspect `/content` and `/design-handoff` before writing any code. Work in the phases in section 10 and stop at each checkpoint.

---

## 1. What this is

A study app for first- and second-year BA students (Geography, Psychology, English) at an English-medium college in Maharashtra. Their first language is Marathi. The gap is **academic and professional register and confidence, not basic fluency**.

v1 has **two tracks** and **no backend**:

| Track | Modules in v1 | Content file |
|---|---|---|
| Research-Oriented English for Humanities | Module 1 (Academic Writing, why and how), Module 2 (Research, Finding, Reading and Critical Reading) | `/content/module-1-academic-writing.md`, `/content/module-2-research-finding-reading.md` |
| Communicative / Professional English | Modules 1-4 (Presentations and Seminars; Professional Email; CVs, Cover Letters and LinkedIn; Interviews) | `/content/communication-track.md` |

BSc and BCom tracks are out of scope. Do not scaffold them.

The app name is **not final**. Put it in one config constant (`src/config.ts` → `APP_NAME`, default `"[Working Title]"`) and use it everywhere. Never hard-code it.

---

## 2. Hard constraints (non-negotiable)

1. **No monetisation:** no ads, paywalls, upsells, pricing UI, or analytics/tracking scripts.
2. **No backend, accounts, login, or network calls** at runtime (except external links the user clicks). All state lives in `localStorage`.
3. **No leaderboards, rankings, or social comparison.**
4. **No timers, countdowns, or time limits anywhere** in lessons, exercises, or practice.
5. **No self-assessment features inside modules:** no rubrics, no self-scoring, no "rate yourself" controls, no tickable self-check boxes. Self-correcting quizzes (instant right/wrong plus explanation) ARE allowed in the two Research-Oriented modules. The Communicative track has **no quizzes at all**.
6. **"Further reading" is never shown inline.** Every module has a **Further reading** button that opens a drawer or modal. Links open in a new tab with `rel="noopener noreferrer"`.
7. **Model answers appear only after the student attempts.** The attempt is a text box or a selection; the reveal control stays disabled until there is input.
8. **Content is rendered verbatim.** Do not rewrite, "improve", shorten, or silently fix content text. If you find a problem, record it in `CONTENT_ISSUES.md` and leave the text unchanged. The only exceptions are the items the content files themselves tell you not to render (see section 6).
9. **Sources are attributed and linked.** Never copy source text into the app.
10. **Design is not yours to invent.** `/design-handoff` is the single source of truth for visuals, tokens, type, layout, and motion (section 4).

---

## 3. Stack

- **React 19 + TypeScript 5 + Vite 7.** Resolve current stable versions at install time (`npm create vite@latest`); do not pin from memory. Strict TypeScript.
- **Styling:** follow the handoff. If it specifies Tailwind or plain CSS, use that. If not, use CSS variables for design tokens plus CSS Modules (no runtime CSS-in-JS).
- **Routing:** `react-router` with `HashRouter` (works on any static host with no rewrite rules).
- **Markdown pipeline:** `unified` / `remark` + `remark-gfm` (tables are essential) + `rehype`, with `rehype-sanitize`. No unsanitised `dangerouslySetInnerHTML`.
- **State:** React context plus a small `localStorage` wrapper. Wrap every read and write in try/catch; the app must work when storage is blocked.
- **Motion:** per the handoff. Respect `prefers-reduced-motion` everywhere with a static fallback for every animation.
- **Tests:** Vitest + React Testing Library for the content parser and the reveal/quiz components. One Playwright smoke test is optional.
- **Hosting target:** static build (`vite build` → `dist/`). `base` configurable via env so it works under a sub-path.

---

## 4. Design handoff

- Read everything in `/design-handoff` first (tokens, components, screens, motion spec, assets).
- Implement tokens exactly as specified (colour, type scale, spacing, radii, shadows, motion durations and easings) in one tokens file consumed everywhere. No stray hex values in components.
- If the handoff lacks a screen or state you need (empty, error, focus, mobile, reduced-motion), **do not invent a new style**. Build it from existing tokens and list it in `DESIGN_GAPS.md`.
- **Fallback only if a token is truly absent:** the intended direction is an "annotated edition": a reading column with margin notes, indigo ink on cool white, one turmeric accent. The opening transition is an ink-and-underline that settles into a marginalia highlight sweep. Quality bar: professional academic publishing, not a school-app look.
- Fonts: self-host (no runtime CDN calls). Support Devanagari glyphs for the Marathi words in the Communicative track (Noto Sans Devanagari or the handoff's choice).

---

## 5. Repository layout

```
/content/                    source MD files (do not edit)
/design-handoff/             from Claude Design (do not edit)
/scripts/
  build-content.ts           parses MD → typed JSON
  check-links.ts             validates every external URL (section 9)
/src/
  config.ts                  APP_NAME, feature flags
  content/                   generated JSON (git-ignored, built on dev/build)
  components/ pages/ styles/ lib/
CONTENT_ISSUES.md            you write: problems found in content
DESIGN_GAPS.md               you write: states missing from the handoff
LINK_REPORT.md               you write: output of check-links
```

If `/content` or `/design-handoff` is empty or missing, say so clearly before proceeding. Expected file names in `/content`: `module-1-academic-writing.md`, `module-2-research-finding-reading.md`, `communication-track.md` (the uploads may carry suffixes like `__1_`; rename on copy).

---

## 6. Content pipeline

Write `scripts/build-content.ts` to parse the MD files into typed JSON at build time. **Open and read the real files first; if they disagree with the structure below, trust the files and note the difference in `CONTENT_ISSUES.md`.**

### Observed structure

**Research-Oriented modules:**
- `# Module N: …` title; a metadata block (track, audience, a "no timers" note); **Module outcomes** (numbered list); **Lesson map** (table).
- `## Lesson N: Title` → `### Explain`, then `### Exercise …` blocks. Each exercise ends with an **Answer key**, **Model answer(s)**, or **Model plan**, which is the hidden reveal. Some exercises include a short italic label such as "*(Abstract invented for practice.)*"; keep it visible beside the exercise.
- Module 1: Lessons 1-7. Lesson 6 has a **Final checklist** (`- [ ]` items). Lesson 7 has `### Quiz`, `### Practice answer (not timed)`, and `### Self-assessment rubric`.
- Module 2: Lessons 1-7. Lesson 7 has `### Practice (not timed)` and `### Quiz`. Lesson 2 has two tables and Lesson 4 has a resources table; keep tables intact.
- Quiz items are numbered bold questions with `(a) … (b) …` options and an inline `→ **(b).** explanation`. Parse into `{question, options[], correctIndex, explanation}`. Some options sit on separate lines and some on one line; handle both.
- Trailing sections: `## Notes for the app build` (instructions to you; **never render**) and the sources list (Module 1: `## Sources and further reading`; Module 2: `## Further reading`), which feeds the Further reading button.

**Communicative track:**
- A header (audience, gap, module list, per-module format), then a `> Build notes for Claude Code` blockquote (instructions to you; **never render**).
- `## Module N: Title`, with `###` sections in this order: **Why it matters → Core ideas → Useful language → Worked example → Marathi to English notes → Try it → Further reading**.
- "Useful language" is a table; "Try it" is a numbered list of open practice tasks (no answers, no scoring).

### Do not render (conflicts with constraint 5)
- Module 1, Lesson 7, **Self-assessment rubric** section: omit entirely.
- Module 1, Lesson 6, **Final checklist**: render as a plain, non-interactive list (not tickable).
- Module 1 lesson map row 7 mentions "self-assessment" in its description. Default: show the lesson title and drop that one word from the description at render time. Log it in `CONTENT_ISSUES.md` for the owner's decision.

### Output schema (suggested)

```ts
Track   { id, title, modules: Module[] }
Module  { id, title, outcomes?: string[], lessons?: Lesson[], sections?: Section[], furtherReading: Link[] }
Lesson  { id, title, blocks: Block[] }      // research modules
Section { id, kind, title, html }           // communication track
Exercise{ id, prompt, label?, answerHtml }  // answerHtml hidden until attempt
QuizItem{ id, question, options, correctIndex, explanation }
Link    { title, url, note? }
```

### Parser rules
- Fail the build with a clear message if an expected heading is missing or a quiz item has no parseable answer. Never emit partial content silently.
- Preserve labels like "*(invented for practice)*" and "*(Names are fictional.)*"; they stay visible next to the item.
- Extract each Further reading list into structured `Link[]` (title, url, trailing note in parentheses). Some bullets contain two links (for example the Shodhganga brochure and repository); keep both.
- Unit-test the parser against the three real files: counts of lessons, exercises, quiz items, and links.

---

## 7. Screens and behaviour

Visual treatment comes from the handoff. This section defines what exists and how it behaves.

1. **Opening transition:** once per session, skippable; reduced-motion = instant.
2. **Home:** two track cards; "continue where you left off" (from localStorage); weekly practice widget (item 8).
3. **Track page:** modules with outcomes and lesson maps.
4. **Module page:** outcomes and lesson list. Show "visited" per lesson only (no scores).
5. **Lesson reader (Research-Oriented):**
   - Long-form reading column; responsive tables (horizontal scroll with a visible affordance on small screens).
   - Previous/next lesson, progress through the module, keyboard accessible.
   - Margin notes/annotations per the handoff, if specified.
   - **Further reading** button → drawer or modal with the structured links (focus-trapped, Esc closes, focus returns).
6. **Exercise component:** prompt, a textarea (or option selection) for the attempt, **Show model answer** (disabled until input), then the answer expands in place. Persisting attempts is optional; if you do, store locally only and provide "Clear my notes".
7. **Quiz component (Research-Oriented only):** immediate feedback and explanation on selection; retry allowed. A plain "n of N correct" is allowed; nothing is shared, ranked, or compared. Use `aria-live` for feedback.
8. **Weekly practice (user-set):** the student sets a weekly target in hours and manually logs practice hours (a number input; **no timer or stopwatch**). Show progress for the current week (Monday start, `Asia/Kolkata`) and a streak of consecutive weeks where the target was met. No notifications, no leaderboard, local only. *Assumption: this reading of "user-set weekly practice-hour streaks" is mine; keep it isolated in one module so it is easy to change.*
9. **Communicative module page:** the seven fixed sections as tabs or an in-page index. "Try it" tasks are plain numbered tasks.
10. **Marathi to English notes:** show a "Pending faculty review" badge when `config.SHOW_UNREVIEWED_BADGE` is `true` (default `true`). The content file says these are the author's observations and need review by a Marathi-speaking faculty member before release.
11. **Module 2, Lesson 4** must always show: "Ask your library for your institute's exact login steps and which services it has joined." Never display live statistics for N-LIST, DELNET, or Shodhganga.
12. **About / Sources page:** lists every source with attribution; states that the app is non-commercial and links to each source. Note that the UNC Writing Center essay-exams page is licensed CC BY-NC-ND: link only, never adapt.

### Accessibility and quality bar
- WCAG 2.2 AA: contrast, visible focus, semantic headings, labelled controls, skip link.
- Mobile-first; test at 360 px width; touch targets at least 44 px.
- Lighthouse on a mobile profile: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95.
- No layout shift on reveal. Lazy-load per-module JSON; keep the initial bundle small.

---

## 8. State (localStorage keys, namespaced `appname:v1:`)

- `visited` (lessonIds), `lastLocation`
- `attempts` (exerciseId → text), optional
- `quiz` (quizId → selected answers), optional
- `weekly` (`{targetHours, logs: [{weekStart, hours}]}`)
- `ui` (reduced-motion override; text size if the handoff includes it)

Include a "Reset my data" control. Version the schema for later migration.

---

## 9. Link checking and content QA

- `scripts/check-links.ts`: collect every URL from the parsed Further reading data; run HEAD with GET fallback and a timeout; output status, redirect target, and failures. Flag redirects to a different domain and any link whose label names an institution that does not match the host.
- Write results to `LINK_REPORT.md`. **Report only; never auto-edit URLs.**
- Log these known items in `CONTENT_ISSUES.md` (do not change the content):
  1. Communicative track, Module 4: the link labelled "MIT Career Advising and Professional Development" points to a Dartmouth Guarini URL (the note says "summary hosted by Dartmouth Guarini"). Confirm the attribution matches the page.
  2. Module 1, Lesson 7: the Self-assessment rubric and the "self-assessment" mention in the lesson map (see section 6).
  3. Module 1, Lesson 5, Exercise 5b item 3: the answer key rewrites the sentence with "rural settings", which changes the meaning of "writing about rural life". Owner to review the model fix.
  4. Module 2, Lesson 2, Exercise 3 item 4: "Tertiary, usually scholarly-reference but for orientation only" is awkwardly worded. Owner to review.
  5. Module 1 sources: the Longman Academic Writing entry links to a bookseller page (`sunriverbooks.com`) as a "publisher summary". Confirm that is acceptable attribution.
  6. Module 1, Lesson 1, Exercise 1: the reference "(Rao, 2019)" is invented; the file labels it so. Keep the label visible.

---

## 10. Phases and checkpoints (target: about 5 days, solo)

**Phase 0: Audit (report first).** Read `/content` and `/design-handoff`. Report what is present or missing, which stack choices the handoff implies, and conflicts with section 2. Pause only if something is missing or conflicting; otherwise continue.

**Phase 1: Foundation.** Scaffold, tokens, routing, `config.ts`, localStorage wrapper, layout shell, fonts, reduced-motion handling.

**Phase 2: Content pipeline.** `build-content.ts`, schema, parser tests, `CONTENT_ISSUES.md`. **Checkpoint:** print counts per module (lessons, exercises, quiz items, links) for me to sanity-check.

**Phase 3: Reader and components.** Lesson reader, exercise reveal, quiz, Further reading drawer, responsive tables.

**Phase 4: Pages.** Home, track and module pages, Communicative section view, Marathi-notes badge, About/Sources.

**Phase 5: Weekly practice,** persistence, reset control.

**Phase 6: Motion and polish** per the handoff; accessibility pass; Lighthouse; Chrome, Safari iOS, Firefox.

**Phase 7: QA and release.** Link check, `LINK_REPORT.md`, `DESIGN_GAPS.md`, README (run, build, deploy, how to update content), static build verified under a sub-path.

---

## 11. Definition of done

- [ ] Every lesson, exercise, quiz item, and link in the three content files renders. Nothing extra and nothing rewritten, except the omissions listed in section 6.
- [ ] No hard constraint in section 2 is violated. Search the codebase for `setInterval`, timer-style `setTimeout`, "leaderboard", "rubric", and analytics scripts.
- [ ] Further reading appears only behind the button; model answers appear only after an attempt.
- [ ] Works with `localStorage` disabled and under `prefers-reduced-motion`.
- [ ] `CONTENT_ISSUES.md`, `DESIGN_GAPS.md`, `LINK_REPORT.md`, and README exist and are accurate.
- [ ] `npm run build` is clean (no TS or lint errors); parser tests pass.

---

## 12. How to work

- Prefer targeted changes over rewrites. Small commits, one per phase step.
- Ask before adding any dependency not listed here or implied by the handoff.
- When unsure whether something violates a constraint, don't build it; ask.
- Keep end-of-phase summaries to a few lines: what was built, what needs my eyes, what's next.
