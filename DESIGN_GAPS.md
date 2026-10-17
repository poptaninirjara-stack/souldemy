# Design decisions and gaps

## v2 (current): "Canteen Pop" plus the "Campus to Career" game layer

v2 replaces the v1 "annotated edition" look, which the owner found dull. The research and decisions are in `docs/DESIGN_BRIEF.md`; this file records what was built and where it departs from the brief or is still missing.

### Built as specified in the brief

- **Look.** Canteen Pop tokens: cream paper, ink outlines, hard offset shadows on interactive surfaces, and mango, vermilion, mint, lilac and sky fills with ink text. Every text pair is checked against WCAG AA in `src/styles/tokens.css`.
- **Type.** Anek Latin for display and interface; Mukta for body text in Latin and Devanagari.
- **Calm reading.** The reading column stays calm: no borders, shadows or motion around body text. Game styling appears only in the "Practise this" boxes between sections.
- **Campus map home.** Six places in two wings, plus Today's walk (warm-up review, continue reading, next game), a rank card and a week card.
- **Place pages.** Learn (lessons or sections), Play (games and Mirror mode), Phrase cards and Further reading.
- **Three game engines.** Sort, Quick pick and Story (scenario), all in focus mode. Feedback says why, a wrong answer shows the right one, and there is no timer.
- **Review.** Spaced recall of phrase cards in Leitner boxes (1, 3, 7, 14 and 30 days).
- **Mirror mode.** On-device recording with MediaRecorder; nothing is saved or uploaded. The checklist is never scored.
- **Rewards.**
  - XP for effortful work only, awarded once per event key.
  - Six ranks with can-do statements.
  - Surprise badges with a celebration dialog: confetti once, WhatsApp share text, and confetti hidden under reduced motion.
  - A weekly "N of 7 days" goal (3, 4 or 5), with no streak-loss wording.
- **Offline.** A small service worker caches the app after the first visit, and there is a web manifest so it can be installed to the home screen.

### Departures from the brief (decide later)

| Brief | Built | Why |
|---|---|---|
| Dark theme from Direction B tokens | **Not built** | Scope. All colours are tokens, so adding a dark theme only needs a second set of token values. |
| Peer cast and mentor voice ("Kavya, final-year senior") | **Not built as a character.** Feedback is written in a friendly second person instead. | A character needs illustration and copy the author should own. Add it once the voice is approved. |
| Boolean puzzle with a simulated result counter; spot-the-claim highlighter; faded model answers; opt-in exam mode | **Not built.** Boolean practice is a Quick pick game for now. | Listed as "later" in the brief. |
| Card-chunked lessons (60–120 words per card) | **Not built.** Lessons stay as one calm scrolling page, with "Practise this" after each lesson or section. | Chunking changes how the author's text is grouped, so the author should decide first. |
| Weekly report share image | **Not built.** Badge sharing is text only (wa.me link). | Generating the image on canvas is a later step. |
| Haptics | A 15 ms vibration on a correct answer (Android only). Off under reduced motion. | As in the brief. |

### Still to check on real devices

- Lighthouse (mobile) and a low-end Android phone (2–4 GB RAM).
- Mirror mode on iOS Safari (MediaRecorder support varies by version).
- Service worker update behaviour after a redeploy: pages load network-first, so updates arrive when online.

---

## v1 decisions that still apply

- **Further reading** is always behind a button and opens a bottom sheet with a focus trap; Escape closes it and focus returns to the button.
- **Model answers** stay hidden until the student has written an attempt.
- **Quizzes.** The Module 1 and Module 2 quizzes keep the Check answer → Try again / Show answer flow, with words and icons as well as colour.
- **No leaderboards, timers, hearts or lives.**
- **The Library** lists every source from the content, grouped by module, and includes the About section.
- **Responsive tables** scroll sideways with a visible hint when they overflow.
- **Copy that needs the author's review:**
  - the track blurbs;
  - interface lines for states the original handoff did not cover;
  - all game feedback (see `docs/GAME_ITEMS_FOR_REVIEW.md`).
