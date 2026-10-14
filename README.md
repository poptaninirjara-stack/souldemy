# SoulDemy

A free, static study app for first- and second-year BA students (Geography, Psychology, English) at an English-medium college in Maharashtra. It has two tracks:

- **Research-Oriented English for Humanities**: Module 1 (Academic Writing) and Module 2 (Research, Finding, Reading and Critical Reading). It has open exercises with model answers and self-correcting quizzes.
- **Communicative / Professional English**: Presentations and Seminars, Professional Email, CVs, Cover Letters and LinkedIn, and Interviews. These are open "Try it" tasks with no quizzes or scoring.

The app has no backend, accounts, adverts, analytics, timers or leaderboards. Everything a student does is stored in their own browser (`localStorage`).

The app name is set by `APP_NAME` in `src/config.ts`; it is used everywhere.

## Run

Requires Node 22.18+ (Node 24 recommended). The build scripts are TypeScript run directly by Node.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # parser, reveal/quiz components, weekly practice, storage
npm run lint
npm run build      # → dist/
npm run preview    # serve dist/ locally
```

`dev`, `build` and `test` first run `scripts/build-content.ts`, which parses `/content/*.md` into `src/content/*.json` (generated, git-ignored).

## Deploy

`npm run build` produces a static site in `dist/` that works on any static host. Routing uses `HashRouter` (`#/research/r1/l3`), so no rewrite rules are needed.

- By default, asset paths are relative (`./`), so `dist/` works from any folder.
- To set an absolute sub-path: `BASE_PATH=/english/ npm run build`. On Git Bash for Windows, prefix the command with `MSYS_NO_PATHCONV=1`.

Fonts (Literata, Public Sans, Noto Serif/Sans Devanagari) are bundled through `@fontsource`. The app makes no runtime requests to other hosts; the only outside links are the sources a student chooses to open.

## Update the content

1. Edit the Markdown in `/content`:
   - `module-1-academic-writing.md`
   - `module-2-research-finding-reading.md`
   - `communication-track.md`
2. Run `npm run content`. It prints counts per module and lists what it deliberately left out.
3. If the structure is wrong, the build stops with a clear message, e.g. a missing `## Lesson map`, a quiz item without `→ **(x).**`, or communicative sections out of order.

Structure the parser expects:

- **Research modules.**
  - Title and metadata: `# Module N: Title`, then the metadata lines, `## Module outcomes` (numbered) and `## Lesson map` (table).
  - Lessons: `## Lesson N: Title` with `###` sections.
  - Exercises: `### Exercise …` must contain a line starting `**Answer key**`, `**Model answer(s)**` or `**Model plan**`. Everything from that line on is hidden until the student attempts. Italic label lines such as `*(… invented for practice.)*` stay visible.
  - Quizzes: `### Quiz …` items are `1. **Question**`, then options `(a) … (b) …`, then `→ **(b).** explanation`.
  - Practice: `### Practice …` and `### Reflect …` become open tasks with an optional notes box.
  - Trailing sections: `## Notes for the app build` is never shown. `## Sources and further reading` or `## Further reading` feeds the **Further reading** button.
- **Communicative track.** Each `## Module N: Title` has seven `###` sections in this order: Why it matters → Core ideas → Useful language → Worked example → Marathi to English notes → Try it → Further reading. The `> Build notes` blockquote is never shown.

Deliberate render-time rules:
- The Module 1 self-assessment rubric is omitted. The "self-assessment" word in its lesson map is dropped in `src/lib/omissions.ts`.
- The final checklist is not tickable.
- Module 2 Lesson 4 always shows the library note (`PAGE_NOTES` in `src/config.ts`).
- Marathi notes carry a "Pending faculty review" badge while `SHOW_UNREVIEWED_BADGE` is `true`.

## Check the links

```bash
npm run check-links
```

This sends a HEAD request (GET fallback) to every Further reading URL and writes `LINK_REPORT.md`. It flags broken links, redirects to a different domain, and labels that name an institution other than the link's host. It never edits URLs.

## Where things are

| Path | What |
|---|---|
| `content/` | Source Markdown (do not edit for layout reasons; see `CONTENT_ISSUES.md`) |
| `design-handoff/` | The design spec and prototype. Source of truth for visuals. |
| `scripts/` | `build-content.ts`, `check-links.ts`, parser and tests |
| `src/config.ts` | App name, review badge flag, page notes, practice time zone, track blurbs |
| `src/styles/tokens.css` | All design tokens (the only file with colour values) |
| `src/lib/storage.ts` | `load` / `save` / `remove` / `migrate`. This is the seam for future accounts and sync. |
| `src/lib/weekly.ts` | Weekly practice rules (Monday start, Asia/Kolkata, goal-met weeks). Kept in one module so it is easy to change. |
| `src/state/` | App state (context) persisted under `souldemy:v1:*` keys |
| `CONTENT_ISSUES.md` | Content problems for the owner (nothing was changed in the text) |
| `DESIGN_GAPS.md` | Where the build departs from or extends the handoff |
| `LINK_REPORT.md` | Output of `npm run check-links` |

## Stored data

All data is kept in `localStorage` under keys prefixed `souldemy:v1:`:

| Key | Contents |
|---|---|
| `track` | The chosen track |
| `visited` | Lesson and section IDs the student has read |
| `lastLocation` | Where to continue |
| `attempts` | Exercise answers and notes, plus whether each model answer has been revealed |
| `quiz` | The selected option and status for each quiz question |
| `weekly` | `{targetHours, logs: [{date, hours}]}` |
| `ui` | The reduced-motion override |
| `schema` | The data version, used by `migrate()` |

The "opening seen" flag lives in `sessionStorage`. The app works when storage is blocked: data is then kept in memory for the session, and the Progress page says so. **Reset my data** on the Progress page removes every key.

## Notes on the constraints

- **No timers.** The code has two `setTimeout` calls. One is a 300 ms delay before the loading skeleton appears, so fast loads do not flash. The other is a backup that removes the opening overlay after 1.4 s. Neither is a user-facing timer, and there is no `setInterval`.
- **Reduced motion.** The OS setting or the in-app switch (Progress → Settings) turns every screen change into a single 150 ms fade. The opening panel is skipped, and the highlight, sheet and ribbon appear in place.
- **Versions.** The brief named React 19, TypeScript 5 and Vite 7. At install time the current stable releases were React 19, TypeScript 6, Vite 8 and React Router 8, so those are used.
