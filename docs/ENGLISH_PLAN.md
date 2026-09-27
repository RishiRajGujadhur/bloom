# Bloom English — plan

A Duolingo-style English course inside Bloom. It gets its own page, `#english`, which is registered as the `englishLearning` feature with sub-feature toggles.

## Research notes

- **Duolingo**:
  - The core loop is a path of units and lessons.
  - Motivation comes from XP, streaks with streak freezes, 10 weekly leagues (Bronze to Diamond), daily and monthly quests, gems, and hearts (now "energy").
  - Other features: practice hub, stories, match madness, legendary levels, AI video call and roleplay (Max), and "Explain my answer".
- **Babbel**: dialogue-based lessons, grammar tips, and a spaced review manager.
- **Busuu**: CEFR-levelled course, community corrections of your writing, and a vocabulary trainer that tracks word strength.
- **Memrise**: native-speaker clips, "Learn with locals", and speed review.
- **LibreLingo** (AGPL, so ideas only and no code reused):
  - Courses are YAML modules, then skills, then words and phrases.
  - Challenge types: cards, options, short input, chips (word bank), and listening.
  - We copy the *structure*, which is the course graph plus challenge types.

## Open-source libraries

**New for this feature (15):**

| Library | What it's used for |
|---|---|
| `syllable` | Syllable counts and clapping drills |
| `pluralize` | Plural drills |
| `write-good` | Writing-coach suggestions |
| `fastest-levenshtein` | Typo-tolerant answer checking |
| `double-metaphone` | Sound-alike matching for speech answers |
| `number-to-words` | Numbers drill |
| `franc-min` | Detects when the learner answered in another language |
| `seedrandom` | Deterministic daily quests and daily challenge |
| `flesch` | Readability scores |
| `automated-readability` | CEFR estimate of your writing |
| `stopword` | Keyword extraction for vocabulary mining |
| `wink-lemmatizer` | Word-family grouping (running → run) |
| `cmu-pronouncing-dictionary` | Phonemes, stress and rhymes |
| `an-array-of-english-words` | Valid-word checking for word games |
| `compromise-speech` | Syllable splitting from the NLP graph |

**Existing libraries reused:**

| Library | What it's used for |
|---|---|
| `compromise` | Tense and verb conjugation |
| `ts-fsrs` | Spaced repetition |
| `howler` / Web Audio | Sound effects |
| `canvas-confetti` (via celebrate) | Celebrations |
| `@dnd-kit` | Word bank |
| `gsap` | Animations |
| `fuse.js` | Dictionary search |
| `diff` | Correction highlights |
| `sentiment` | Tone feedback |
| `chart.js` | Progress charts |
| `@xenova/transformers` / web-llm | Optional AI tutor, where already available |

The browser's Web Speech API provides text to speech and speech recognition.

## Features (32)

1. **Learning path**: units drawn as a winding SVG path with GSAP-animated nodes. Each unit is a CEFR level (A1 to B2).
2. **Lessons**: 6 to 10 mixed exercises with a progress bar and a completion screen.
3. **Multiple choice**: a word or phrase to translate or define, with emoji pictures.
4. **Word bank**: build the sentence from chips (drag or tap).
5. **Type the answer**: typo-tolerant checking (Levenshtein), with a "you had a typo" note.
6. **Listening**: hear a sentence (text to speech) and type it, with a slow-audio button.
7. **Speaking**: say the sentence (speech recognition). Scored by double-metaphone sound matching.
8. **Match pairs**: tap word and meaning pairs against the clock ("Match madness").
9. **Fill the blank**: grammar cloze, including verb forms generated with compromise.
10. **Picture choice**: pick the emoji card that matches the word.
11. **Hearts / energy**: 5 hearts that refill over time, or refill by practising.
12. **XP and daily goal**: choose Casual, Regular, Serious or Intense (10, 20, 30 or 50 XP), shown on a GSAP progress ring.
13. **Streak**: day streak with a flame animation, plus streak freezes bought with gems.
14. **Gems shop**: spend gems on a streak freeze, a heart refill or a double-XP boost.
15. **Weekly leagues**: 10 tiers with simulated rivals (seeded). Top 5 promote.
16. **Daily quests**: three seeded quests a day, plus a monthly badge.
17. **Achievements**: badges for lessons, streaks, words and perfect lessons.
18. **Words tab**: every learned word with FSRS strength bars.
19. **Spaced review**: ts-fsrs schedules which words are due.
20. **Mistakes review**: replays the exercises you got wrong.
21. **Stories**: short illustrated dialogues with comprehension checks.
22. **Grammar tips**: "Explain my answer" cards for each rule.
23. **Pronunciation lab**: CMU phonemes, stress marks and syllable clapping.
24. **Rhyme time**: find the rhymes (CMU dictionary).
25. **Minimal pairs**: ship/sheep listening game.
26. **Spelling bee**: hear the word and spell it. Words are checked against the word list.
27. **Numbers drill**: number to words and back.
28. **Plurals and tenses**: pluralize plus compromise conjugation drills.
29. **Writing coach**: write a paragraph, then get write-good tips, Flesch and ARI scores, a CEFR estimate and tone.
30. **Daybook link**: turn today's Daybook entry into a writing exercise (an existing Bloom feature).
31. **Word of the day**: a seeded word shown on the page. Bloom says it when you arrive.
32. **Roleplay chat**: scripted scenarios (café, job interview, doctor) with choices, graded by keywords.
33. **Placement test**: a quick adaptive quiz that sets your starting unit.
34. **Progress charts**: XP per day (chart.js) and words learned.
35. **Bloom integration**: lessons log activity for Bloom Growth/insights. Bloom's avatar gets a "book" act on this page.
36. **Sound effects and celebrations**: correct and wrong chimes, confetti on lesson complete, GSAP shakes and bounces.

## Build order (a commit and push after each group)

1. Scaffold the page, course data, model (XP, streak, hearts, goal) and the path. Lessons with exercise types 3, 4, 5 and 9.
2. Listening, speaking, match pairs and picture choice.
3. Quests, leagues, gems shop, achievements and streak freeze.
4. Words, FSRS review, mistakes and word of the day.
5. Stories, grammar tips and roleplay.
6. Pronunciation lab, rhymes, minimal pairs, spelling bee, numbers, plurals and tenses.
7. Writing coach, Daybook link, placement test and charts.
