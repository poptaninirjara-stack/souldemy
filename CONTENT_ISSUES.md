# Content issues

Problems found in `/content`. **None of these has been changed in the text.** Each needs a decision from the content owner. When an item is resolved, edit the Markdown file and rerun `npm run content`.

## Known items (from the build brief)

1. **Communicative track, Module 4, Further reading.** The link labelled "MIT Career Advising and Professional Development" points to a Dartmouth Guarini URL (`guarinigrad.dartmouth.edu/...`). The note says "summary hosted by Dartmouth Guarini". Confirm the attribution matches the page, or relabel it. The app shows it as written. `LINK_REPORT.md` flags it automatically.
2. **Module 1, Lesson 7: self-assessment.**
   - The `### Self-assessment rubric` section is **omitted** from the app because the brief forbids self-assessment features.
   - The lesson map row 7 description reads "Quiz, practice answer, self-assessment". By default the app shows it as "Quiz, practice answer"; the word is dropped at render time in `src/lib/omissions.ts`.
   - Owner to decide: remove the rubric and the word from the source file, or replace them.
3. **Module 1, Lesson 5, Exercise 5b, item 3.** The answer key rewrites "writing about rural life" as "rural settings". That changes the meaning: writing about rural life is a subject, while rural settings are a feature of the fiction. A fix that keeps the meaning is possible, e.g. "…her clear style, sharp humour and vivid writing about rural life" (owner to choose).
4. **Module 2, Lesson 2, Exercise 3, item 4.** "Tertiary, usually scholarly-reference but for orientation only" is awkward. A possible rewording: "Tertiary; usually a scholarly reference work, but use it for orientation only."
5. **Module 1, Sources.** The Longman Academic Writing Series entry links to a bookseller page (`sunriverbooks.com`) and calls it a "publisher summary". Confirm this is acceptable attribution, or link to the Pearson page.
6. **Module 1, Lesson 1, Exercise 1.** The reference "(Rao, 2019)" is invented. The file labels it, and the app keeps the label *(The reference in (b) is invented for practice.)* visible next to the exercise, outside the hidden answer.

## Found while building

7. **Communicative track, Module 1, Marathi to English notes, item 1.** "Marathi marks respect through verb forms (*tumhi*, *aapan*)": *tumhi* and *aapan* are pronouns. Verb agreement changes with them, but the examples given are not verb forms. Suggest the faculty reviewer check the wording.
8. **Communicative track, Module 4, Marathi to English notes, item 1.** *"ek goshta sang"* is glossed as "Tell me one thing", which is a request to the listener. The suggested replacements, "Let me add one point" and "May I add something?", are the speaker offering a point. These are different speech acts. Suggest the faculty reviewer check which meaning is intended.
9. **Module 1, Lesson 7, Quiz items 4, 5 and 7.** These give the answer letter but no explanation (`→ **(b).**` only). The app shows "Correct answer: (b)" with no explanation sentence. Optional: add a one-line explanation, as in the other items.
10. **Module 1, Sources, URL case.** The UNLV link is written as `https://WWW.UNLV.EDU/...`. Host names are case-insensitive, so it works, but lower case is conventional. See `LINK_REPORT.md` for its status.

## Where the files differ from the structure in the brief

These were handled in the parser, and the text is unchanged.

- **Module 1 extra `###` sections.** Some lessons have sections besides Explain and Exercise: *Same idea, three registers*, *Task words*, *Weighting two-part questions*, *A good thesis answers the question and gives a reason*, *Three sentence errors that cost marks*, and *Reflect (not marked)*. They render as ordinary reading sections. *Reflect (not marked)* and the two *Practice … (not timed)* sections have no model answer. They get an optional notes box stored on the device, with no reveal and no scoring.
- **Module 2, Lesson 7 order.** The order is Explain → Practice (not timed) → Quiz. The app keeps this order.
- **Module 2 extra sections.** It has more sections than Explain/Exercise: *A simple research workflow* (Lesson 4) and *Anatomy of a humanities article* (Lesson 5). Both render as reading sections.
- **Module 1, last Sources bullet.** "Structure informed by S. Bailey…" has no link. It renders as a text line inside the Further reading drawer and on the Library page.
- **Module 2, closing line.** The Further reading heading carries an instruction in brackets, which is not rendered. The closing line "All explanations and exercises above are newly written for this course." follows the list. It renders below the list in the drawer.
- **Communicative "Further reading" headings.** These carry the instruction *(behind the "Further reading" button)*, which is not rendered.
- **Module 1 metadata lines.** The *Track:*, *Who it's for:* and *Time-free module:* lines have no blank lines between them, so Markdown would run them together into one paragraph. The app shows one line each. The same applies to the communicative track header.
- **Track titles.** These come from the content: "Research-Oriented English for Humanities" (the `**Track:**` line of Module 2) and "Communicative / Professional English" (the track file's title). The handoff's titles differ; see `DESIGN_GAPS.md`.

## Rendered differently on purpose (from the brief)

- **Module 1, Lesson 6, Final checklist.** Shown as a plain list; it is not tickable.
- **Module 2, Lesson 4.** Always shows the note "Ask your library for your institute's exact login steps and which services it has joined." (`PAGE_NOTES` in `src/config.ts`). No live statistics are shown for N-LIST, DELNET or Shodhganga.
- **Build notes are never rendered.** This covers "Notes for the app build" (Modules 1 and 2) and the "Build notes for Claude Code" blockquote (communicative track).
