# SoulDemy

A free study app for first- and second-year BA students (Geography, Psychology, English) at an English-medium college in Maharashtra. It teaches academic and professional English one short practice at a time, as a walk around a campus:

| Wing | Places (modules) |
|---|---|
| **Study wing**: Research-Oriented English for Humanities | Exam Hall (Academic Writing), Library (Research, Finding, Reading and Critical Reading) |
| **Career wing**: Communicative / Professional English | Seminar Room, Email Desk, CV Desk, Interview Room |

Each place has:

- **Learn.** The author's lessons, shown word for word. Research lessons include exercises (the model answer appears after an attempt) and self-correcting quizzes.
- **Play.** Short practice games with explanatory feedback and no timer:
  - *Sort it*: sort sentences into categories.
  - *Quick pick*: choose the best answer.
  - *Story*: a branching email-inbox or interview scenario.
- **Phrase cards.** Phrases from the "Useful language" and task-word tables, collected into a deck. **Review** brings each one back just before you would forget it (spaced recall).
- **Mirror mode.** Seminar, CV and Interview places only. Record yourself on the phone and play it back; nothing is uploaded or saved.

**Motivation design** (evidence in `docs/DESIGN_BRIEF.md`):

- **XP** is earned for effort only, never bought. It feeds six ranks, from Fresher to Scholar-Professional.
- **Badges** are surprises.
- **A weekly goal** of practising on 3–5 days, with no daily-streak pressure.
- **Ruled out:** leaderboards, hearts and timers.

The app has no adverts or analytics. Everything a student does is stored in their own browser first. Signing in is optional: with a college-issued username and password, progress is also saved to the student's account in Supabase, so it follows them between devices and teachers can see it. It works offline after the first visit and can be installed to the home screen.

The app name is set by `APP_NAME` in `src/config.ts`.

## Run

Requires Node 22.18+ (Node 24 recommended). The build scripts are TypeScript run directly by Node.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # parser, games, XP/ranks/review logic, reveal + quiz components, storage
npm run lint
npm run build        # → dist/
npm run preview      # serve dist/ locally
```

`dev`, `build` and `test` first run `scripts/build-content.ts`. It parses `/content` into `src/content/*.json`, which is generated and git-ignored. It also builds the games and phrase cards.

## Deploy

The app is deployed on **Vercel** from the GitHub repo. Every push to `main` deploys; settings are in `vercel.json` (Vite, `npm run build`, output `dist`, Node 24). Because of `HashRouter` (`#/play/r1-registers`), no rewrite rules are needed.

On any other static host:

- **Default:** `dist/` works from any folder, because asset paths are relative.
- **Under a sub-path:** run `BASE_PATH=/english/ npm run build`. On Git Bash for Windows, add `MSYS_NO_PATHCONV=1` in front.
- **Offline support:** `public/sw.js` loads pages network-first and caches hashed assets. Bump `CACHE` in it if you ever need to force-clear old caches.

## Accounts, sync and Supabase

The Supabase project URL and publishable key are in `.env`. They are public by design: the access rules in `supabase/migrations/` decide what anyone can read or write. Delete those two lines to build a fully offline app with no accounts.

**One-time setup**

1. Supabase dashboard → **SQL Editor** → paste `supabase/migrations/20261017000000_init.sql` → **Run**.
2. **Authentication → Sign In / Providers → Email**: turn off **Allow new users to sign up**. Only the admin creates accounts.
3. Copy `.env.local.example` to `.env.local` and paste the **secret** key (Project Settings → API Keys). Never commit it or put it in a `VITE_` variable.
4. Deploy the account-management function (`npx supabase login` opens your browser once):

   ```bash
   npx supabase functions deploy admin-users --project-ref cejwumyzkepcnobvvijm
   ```

5. Create the main admin. It prints a starting password once:

   ```bash
   npm run create-admin -- admin "Your Name"
   ```

6. GitHub repo → Settings → Secrets and variables → Actions: add `SUPABASE_SECRET_KEY` with the same value (for content publishing).

**The admin.** Sign in with the admin username on the normal sign-in page, and you land on **Admin** (also reachable from **Me**). There you can:
- Add student, teacher or admin accounts. A starting password is suggested (e.g. `mango-river-4821`) and shown once, with a button to copy it for sending.
- Reset anyone's password, change their name, role or class, or delete an account.
- Answer **Password requests**.

Passwords the admin gives out are temporary: after signing in, the person is asked to choose their own (Me → Change password).

**Forgot password.** Logins are usernames, not real email addresses, so there is no reset email. Instead, **Forgot your password?** on the sign-in page sends a request to the admin's **Password requests** tab. The admin clicks **Set a new password** and passes it on. To avoid revealing which usernames exist, the request always says it was sent.

**Many accounts at once.** Fill a CSV like `accounts/users.example.csv` (`username,full_name,role,password,class`; role is `student`, `teacher` or `admin`) and save it in `accounts/` (git-ignored). Then check it, and import it:

```bash
npm run import-users -- accounts/users.csv --dry-run
```

```bash
npm run import-users -- accounts/users.csv
```

Existing usernames are skipped. Add `--update` to change names, roles, classes or passwords. Students sign in with the username only; internally it becomes `username@users.souldemy.app`.

**Who sees what.** Students see only their own data. Teachers and admins see every student's progress, quiz answers, written answers, feedback and (later) recordings. Classes are stored now, and limiting teachers to their classes can be added later through `teacher_classes`.

**Sync.** The device copy is always the working copy, so the app stays instant and works offline. Each change is uploaded about 1.5 seconds later. On a device's first sign-in, anything done before signing in is merged into the account. After that, the account copy wins, apart from changes not yet uploaded. Signing out removes the progress from the device (college computers are shared).

**Content publishing.** Every push to `main` that touches `/content` runs `.github/workflows/publish-content.yml`. It builds the content, runs the tests and publishes a new version to Supabase. Students get it the next time they open the app, with no redeploy needed. You can also run `npm run publish-content` locally. Publishing stops if a lesson, exercise, quiz, game or phrase ID that students' progress points at has disappeared. Those IDs come from headings, so renaming a heading changes them. If that was intended, run the workflow by hand with *allow removed IDs* (or set `ALLOW_REMOVED_IDS=1`). To roll back, delete the newest row in `content_versions`.

## Update the content

### Lessons (Markdown, rendered verbatim)

1. Edit `content/module-1-academic-writing.md`, `content/module-2-research-finding-reading.md` or `content/communication-track.md`.
2. Run `npm run content`. It prints counts per module, game and phrase totals, and what it deliberately left out.
3. If the structure is wrong, the build stops with a clear message.

Structure the parser expects:

- **Research modules**
  - `# Module N: Title`, then the metadata lines, `## Module outcomes` (numbered) and `## Lesson map` (table).
  - Each lesson is `## Lesson N: Title`, with `###` sections inside.
  - `### Exercise …` must contain a line starting `**Answer key**`, `**Model answer(s)**` or `**Model plan**`. Everything from that line on stays hidden until the student attempts the exercise.
  - `### Quiz …` items are `1. **Question**`, then the options `(a) … (b) …`, then `→ **(b).** explanation`.
  - `## Notes for the app build` is never shown.
  - `## Sources and further reading` or `## Further reading` feeds the **Further reading** button.
- **Communicative track**
  - Each `## Module N: Title` has seven `###` sections, in this order: Why it matters → Core ideas → Useful language → Worked example → Marathi to English notes → Try it → Further reading.
  - The "Useful language" table (Purpose | phrases separated by ` · `) becomes phrase cards automatically.

### Games (`content/games.json`)

- **Hand-written games.** Each one has a `kind` and a place:
  - `sort`: bins and items;
  - `pick`: items with options and the correct index;
  - `scenario`: steps with choices that are good or weak, each with the other person's reply.
- **Linking to a lesson.** `"after": "l5"` shows the game in the "Practise this" box after that lesson or section.
- **Drafted items.** Items written for the games, rather than taken from the lessons, carry `"d": true`. `npm run drafted` writes `docs/GAME_ITEMS_FOR_REVIEW.md` for the author.
- **Validation.** The build checks every game. It rejects unknown bins, out-of-range answers, scenario steps with no good choice and unknown lessons.
- **Generated games.** The task-word decoder and the "Right phrase, right moment" games are generated from the author's tables, so you never edit them directly.
- **Mirror mode.** The `mirror` tasks quote the author's "Try it" text.

## Check the links

```bash
npm run check-links
```

This writes `LINK_REPORT.md`. It flags broken links, redirects to a different domain, and labels that name a different institution from the host. It never edits URLs.

## Where things are

| Path | What |
|---|---|
| `content/` | Lesson Markdown and `games.json` |
| `docs/DESIGN_BRIEF.md` | v2 research summary and design decisions |
| `docs/GAME_ITEMS_FOR_REVIEW.md` | Drafted game items for the author (generated) |
| `design-handoff/` | The original v1 design handoff (kept for reference) |
| `scripts/` | Content build, game assembly, phrase extraction, link check, tests |
| `src/config.ts` | App name, review-badge flag, page notes, practice time zone |
| `src/styles/tokens.css` | All design tokens (the only file with colour values) |
| `src/lib/gamify.ts` | XP rules, ranks, spaced review, badges, place progress (pure functions, tested) |
| `src/lib/weekly.ts` | Weekly goal rules (Monday start, Asia/Kolkata) |
| `src/lib/places.ts` | Campus places: names, colours, wings |
| `src/lib/storage.ts` | `load` / `save` / `remove` / `migrate`, plus `onSave` for sync |
| `src/lib/sync.ts` | Signed-in progress sync and its merge rules (tested) |
| `src/lib/supabase.ts` | The Supabase client and the username → login email rule |
| `src/lib/contentSource.ts` | Bundled content, or a newer published version from Supabase |
| `src/state/` | App state, sign-in state (`useAuth.ts`) and derived progress |
| `src/pages/TeacherPage.tsx` | Teacher view: students, one student's answers, feedback |
| `supabase/migrations/` | Database tables, access rules and the recordings bucket |
| `supabase/functions/admin-users/` | Edge Function the Admin page uses to create accounts and set passwords |
| `scripts/create-admin.ts`, `scripts/import-users.ts`, `scripts/publish-content.ts` | Admin scripts (need the secret key in `.env.local`) |
| `src/pages/AdminPage.tsx` | Admin: accounts, passwords, password requests |
| `accounts/` | Account CSVs (git-ignored apart from `users.example.csv`) |
| `CONTENT_ISSUES.md` | Content problems for the owner |
| `DESIGN_GAPS.md` | What was built, and what is deferred |
| `LINK_REPORT.md` | Output of `npm run check-links` |

## Stored data

Everything is stored in `localStorage` under keys starting with `souldemy:v1:`. The data format (schema) is version 2. `migrate()` removes the v1 `weekly` and `track` keys.

| Key | Contents |
|---|---|
| `visited` | Lesson and section IDs read |
| `lastLocation` | Where to continue |
| `attempts` | Exercise answers and notes, and whether each model answer was revealed |
| `quiz` | The chosen option and status for each quiz question |
| `xp` | `{eventKey: {xp, date}}`. Each key earns once, and the dates give the active days. |
| `deck` | `{phraseId: {box, due}}`: phrase cards in Leitner boxes |
| `games` | `{gameId: {best, total, plays}}` |
| `goal` | Weekly goal: 3, 4 or 5 days |
| `seen` | Badges and rank already celebrated |
| `ui` | Reduced-motion override |
| `schema` | Data version |

When signed in, every key except `ui` and `schema` is also kept in the Supabase `progress` table (one row per key). The session lives under `souldemy:auth`, and downloaded content under `souldemy:content`.

The "opening seen" flag is kept in `sessionStorage`. If storage is blocked, the app keeps data in memory for the session and the Me page says so. **Me → Reset my data** removes every key.

## Notes on the constraints

- **No timers.** No task has a countdown, and there is no `setInterval`. The `setTimeout` calls only control display:
  - the loading-skeleton delay;
  - the opening-overlay backup;
  - how long the "+XP" toast stays.
- **Reduced motion.** The device setting, or **Me → Settings → Reduce motion**, turns every screen change into a 150 ms fade. It also hides confetti and stops buttons from moving when pressed.
- **Versions.** React 19, TypeScript 6, Vite 8 and React Router 8, the current stable releases at install time.
