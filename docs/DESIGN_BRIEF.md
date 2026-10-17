# SoulDemy v2: design brief

This brief comes from four research reports written in October 2026: learner psychology, a competitor teardown, game mechanics for writing and speaking, and visual direction. It records what we are building, why, and which rules from the v1 brief changed. Sources are cited inline. Effect sizes are as reported by the cited studies.

## 1. What the evidence says, in one page

- **Gamification helps a little, if it carries real practice.** The meta-analysis by Sailer & Homner (2020) found small positive effects: g = .49 on learning, .36 on motivation and .25 on behaviour. Only the learning effect held up in rigorous studies. So game elements should make students practise more and retrieve more; they should not replace content.
  [link.springer.com/article/10.1007/s10648-019-09498-w](https://link.springer.com/article/10.1007/s10648-019-09498-w)
- **Some elements backfire.**
  - Leaderboards and compulsory badges lowered intrinsic motivation and exam scores in a semester-long course (Hanus & Fox 2015).
  - Rewards students are told to expect, for completing tasks, crowd out interest. Informative feedback does the opposite and *raises* it (Deci, Koestner & Ryan 1999).
  - A broken streak lowers later engagement, and the drop is smaller when the streak can be repaired (Silverman et al. 2023).
  - Novelty fades after about week 4 (Rodrigues et al. 2022).
- **The strongest lever for this group is the "future self".** The ideal L2 self correlates r = .61 with intended effort (Al-Hoorie 2018). Payoffs in India are concrete: fluent English is linked to about 34% higher hourly wages (Azam et al. 2013). So frame every unit as a step from first-year to scholar and professional.
- **Anxiety is the main barrier.** Language anxiety correlates r = −.36 with achievement (Teimouri et al. 2019). Fear of negative evaluation is a core part of it. Indian undergraduates report communication anxiety as the highest. Private rehearsal and "not yet" feedback matter more than rewards.
- **Learning science must stay intact.** Four practices have strong evidence:
  - retrieval practice;
  - spaced review;
  - interleaving confusable categories (g ≈ .42), such as formal vs casual and hedged vs over-claimed;
  - feedback that explains (d ≈ .48).
- **The competitor gap is real but narrow.**
  - No live app teaches academic register in a gamified mobile format. The closest neighbours are Quill.org, Cambridge Write & Improve, and UCL's 2018 iOS app.
  - Spoken-English confidence apps for Indian learners are a crowded market (Stimuler, Enguru, Josh Skills, Hello English).
  - SoulDemy's niche is the bridge from academic to professional register, offered free and with no tracking.
- **Keep it simple.** Testbook's gamification did not improve retention, and small-town students found it complicated.

## 2. What we are building

### Game layer: "Campus to Career"

| Element | Decision | Why |
|---|---|---|
| **Campus map** home | Each module is a place: Exam Hall (M1), Library (M2), Seminar Room, Email Desk, CV Desk, Interview Room | Narrative and identity (projective self); students choose where to go next (autonomy) |
| **XP and levels** | XP only for effortful work: reading a lesson, attempting an exercise, a correct quiz answer, finishing a practice round, phrase reviews. Ranks: Fresher → Note-taker → Writer → Researcher → Presenter → Scholar-Professional | Light competence signal. Never the goal; no shop, no coins |
| **Weekly goal** | Practise on **4 of 7 days** (choose 3, 4 or 5). Active days are counted automatically. No daily streak, no loss messages. A gentle "welcome back" | Forgiving; avoids streak-break dropout |
| **Badges** | Mastery and milestone badges (e.g. "Hedge master", "First place finished"). They are not announced in advance, so each one arrives as a surprise | Unexpected rewards do not undermine motivation |
| **Phrase deck** | Collect phrases from the Useful-language tables and the hedging and task-word tables. A spaced "Warm-up" review (Leitner boxes) asks you to recall each phrase from its purpose | Spaced retrieval; a collection the student keeps and can use |
| **Practice games** | Sort (swipe-style bins), Match (term ↔ meaning), Scenario (choose a response, see the consequence) | Interleaved discrimination with explanatory feedback |
| **Mirror mode** | Record yourself on the phone, play it back, tick a checklist. The recording is never uploaded or saved | Private rehearsal reduces speaking anxiety |
| **Celebrations** | Confetti only for a new rank, a finished place or a badge. Always paired with a message saying what the student can now do | Milestones work better when rare |
| **Mentor voice** | "Kavya, final-year senior" gives text feedback lines. No animal mascot | Mascots show weak effects for adults; a peer persona is more relatable |
| **Offline** | A small service worker caches the app after the first visit | Data-sensitive users on low-end Android phones |

### Visual direction: "Canteen Pop", with a calm reading mode

- **Look.** Bold, tactile campus neo-pop: cream paper, ink outlines, hard offset shadows on interactive cards and buttons, and mango, vermilion and mint accents. Buttons press down into their shadow.
- **Type.** Anek Latin for headings and interface. Mukta for body text in Latin and Devanagari, so Marathi renders with a matching face.
- **Reading screens stay calm.** No borders, shadows or motion around body text. Body text is 18px with 1.65 line height, at about 65 characters per line.
- **Contrast.** Dark ink on bright fills, never white on mango or vermilion. All text pairs pass WCAG AA.
- **Motion.** CSS only, springy at 120–200ms. Reduced motion swaps all movement for fades.

## 3. Rules from the v1 brief that changed

| v1 rule | v2 | Reason |
|---|---|---|
| No points | **XP and ranks allowed**, earned only for effortful work, never purchasable, no economy | The owner asked for gamification; the evidence supports light competence signals |
| Weekly hours logged by hand | **Active days counted automatically** (4 of 7 by default). The manual hours log is removed | Less friction; same forgiving weekly frame |
| No self-assessment | **Checklists allowed in Mirror mode only.** They are never scored and never feed ranks | Rubric-style checklists help (g ≈ .45) |
| **Kept:** no leaderboards, no timers, no hearts or lives, no ads, no tracking, no backend, Further reading behind a button, model answers only after an attempt, content rendered verbatim | — | Strong evidence of harm, or still required |

## 4. Content rule for game items

The author's lesson text is still rendered verbatim. The practice-game items live in `content/games.json`, separate from the lessons:

- Items are **derived from the author's own examples** wherever possible. Sources include the register table, task-word table, style table, sentence-error table, Marathi notes, CV before/after, and the email and interview language tables.
- Items written new for the games are marked `"drafted": true` and listed for the author's review in `CONTENT_ISSUES.md`.

## 5. Later (needs a backend or more content)

- **Class features.** Class codes and cohort goals, with no individual ranking.
- **Peer review.** Peer review of emails using a checklist.
- **Accounts and sync.** Optional sign-in so progress moves between devices.
- **AI feedback (optional).** AI feedback on open writing.
- **More formats.**
  - Boolean search puzzle with a simulated results counter.
  - Spot-the-claim highlighter on paper abstracts.
  - Faded model answers.
  - Opt-in Exam mode.
- **Sharing and themes.**
  - Weekly report share card (canvas image to WhatsApp).
  - Dark theme.
- **Content refresh.** A content-refresh season around weeks 4–6 of term.
