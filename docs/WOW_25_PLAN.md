# Bloom "wow" features: 25 new ideas

Twenty-five **new** features. None of them duplicates an existing Bloom page; the list was checked against every sidebar destination. They cover learning, life admin, relationships, safety, money-with-friends, home, travel, the planet and play. Each feature ships on its own:

1. Build it.
2. Take a screenshot.
3. Commit.
4. Push.

## Research

**What people value in 2026 apps.** Apps that "save time, deepen understanding and add context-aware value". Personalisation, AI companions and smart scheduling lead the trend reports:

- [bryj](https://www.bryj.ai/bryj-blog-mobile-app-trends-2026/)
- [MobiDev](https://mobidev.biz/blog/mobile-app-development-trends-key-features)
- [a16z Top 100 Gen AI consumer apps](https://www.a16z.news/p/top-100-gen-ai-consumer-apps-march)
- [Lifestack](https://lifestack.ai/blog/best-consumer-ai-apps)

Learning-by-doing (games, streaks, instant feedback) and practical life admin (split bills, relationship reminders, home upkeep, emergency info) are the recurring "make my life better" categories.

**What wows on the web (Awwwards 2026).** These pages cover the winning techniques:

- [Awwwards animation](https://www.awwwards.com/websites/animation/)
- [Awwwards SVG animation](https://www.awwwards.com/inspiration/svg-animation)
- [Awwwards WebGL](https://www.awwwards.com/websites/webgl/)
- [Best award-winning sites of 2026](https://www.hontran.dev/blog/best-award-winning-websites-2026)
- [Envato 2026 trends](https://elements.envato.com/learn/web-design-trends)
- [Figma 2026 trends](https://www.figma.com/resource-library/web-design-trends/)

The winning techniques are:

- kinetic typography that reacts to the cursor;
- shapes that respond to the pointer;
- scroll- and step-driven storytelling;
- WebGL/3D moments;
- SVG line drawing and morphing;
- bold oversized type with split reveals.

Bloom borrows these *techniques* with original visuals and copy. Nothing is copied from any site.

**Rules for every feature:**

- Use at least 5 open-source libraries: new ones, or ones Bloom already has.
- Use a GSAP-animated SVG as the centrepiece.
- Keep layouts no-scroll where possible.
- Support keyboard use and reduced motion.
- Store data on the device only.
- Ship with a screenshot in `docs/screenshots/wow-XX-*.png`.

## The 25

| # | Feature | Group | The wow | Libraries | Status |
|---|---|---|---|---|---|
| 1 | **Chess Academy**: learn the pieces, rules and tactics, then play Bloom | Learn | An SVG board where pieces glide (GSAP), legal-move dots and a mate burst | chess.js, @use-gesture/react, gsap, canvas-confetti, seedrandom | [x] [Learn](screenshots/wow-01-chess.png) · [Play](screenshots/wow-01-chess-play.png) · [Puzzle](screenshots/wow-01-chess-puzzle.png) |
| 2 | **Life in Weeks**: your life as a grid of weeks, with milestones | Explore | 4,000+ SVG cells that ripple in, plus a kinetic headline | date-fns, d3-scale, gsap, chroma-js, zod | [x] [Screenshot](screenshots/wow-02-life-in-weeks.png) |
| 3 | **Night Sky**: which planets and the moon are up now, with a star-hop guide | Explore | A rotating SVG sky dome with glowing planets | astronomy-engine, d3-geo, suncalc, gsap, date-fns | [x] [Screenshot](screenshots/wow-03-night-sky.png) |
| 4 | **Typing Dojo**: learn touch typing | Learn | An SVG keyboard that lights the next key, and live WPM | fastest-levenshtein, chart.js, gsap, seedrandom, canvas-confetti, an-array-of-english-words | [x] [Screenshot](screenshots/wow-04-typing-live.png) |
| 5 | **Piano & Ear Trainer**: notes, chords and intervals by ear | Learn | A playable SVG keyboard with glowing keys and a falling-note hero | tone, tonal (new, pinned 6.4.3 — 6.5.0 ships broken), gsap, seedrandom, chroma-js | [x] [Screenshot](screenshots/wow-05-piano.png) |
| 6 | **Tuner**: tune a guitar, ukulele or your voice from the mic | Learn | A needle-gauge SVG with a live spring | pitchy, gsap, tone, d3-shape, chroma-js | [ ] |
| 7 | **Sign Alphabet**: fingerspelling with camera feedback | Learn | An SVG hand guide plus live hand tracking | @mediapipe/tasks-vision, gsap, seedrandom, fastest-levenshtein, canvas-confetti | [ ] |
| 8 | **Globe Quiz**: learn countries, capitals and flags | Learn | A 3D globe that spins to the answer | three, @react-three/fiber, d3-geo, topojson-client, world-atlas | [ ] |
| 9 | **CPR & First-Aid Coach**: life-saving steps with a compression metronome | Learn | A pulsing SVG heart on the 110 bpm beat, plus step cards | tone, gsap, nosleep.js, zod, canvas-confetti | [ ] |
| 10 | **Speed Reader**: RSVP reading with comprehension checks | Learn | Kinetic single-word display with a highlighted focal letter | compromise, reading-time, gsap, chart.js, seedrandom | [ ] |
| 11 | **Decision Lab**: weighted choices, a gut-check coin and regret minimisation | Explore | A 3D coin flip and animated SVG score bars | mathjs, gsap, three, canvas-confetti, zod | [ ] |
| 12 | **People Garden**: keep in touch with people who matter | Grow | Each friend is a plant that wilts when you haven't talked | date-fns, fuse.js, rrule, gsap, ics | [ ] |
| 13 | **Split & Settle**: split bills with friends and see who owes whom | Grow | An SVG debt graph that simplifies itself into the fewest payments | currency.js, decimal.js, d3-shape, gsap, qrcode | [ ] |
| 14 | **Pantry Keeper**: use food before it expires, with recipe ideas | Grow | Shelf jars that fill and change colour as dates approach | date-fns, fuse.js, dexie, gsap, chroma-js | [ ] |
| 15 | **Plant Care**: watering and light schedules for houseplants | Grow | Plants that droop and perk up, with falling water drops | rrule, date-fns, ics, gsap, seedrandom | [ ] |
| 16 | **Home Keeper**: recurring home and car maintenance | Today | An SVG house whose rooms glow when tasks are due | rrule, date-fns, ics, gsap, fuse.js | [ ] |
| 17 | **Trip Packer**: packing lists by trip type and weather, plus a countdown | Explore | A suitcase that fills item by item, and a flight-path map | leaflet, @turf/turf, date-fns, gsap, zod | [ ] |
| 18 | **Emergency Card**: medical ID and emergency contacts as a QR code and PDF | Grow | A holographic card that tilts with the pointer | qrcode, @react-pdf/renderer, zod, gsap, chroma-js | [ ] |
| 19 | **Digital Safety Check**: password strength and a security checklist | Grow | A shield that assembles as you complete steps | zxcvbn-ts, gsap, zod, canvas-confetti, chroma-js | [ ] |
| 20 | **Carbon Footprint**: estimate and cut your footprint | Grow | A living SVG planet that heals as you cut CO₂ | chart.js, gsap, d3-shape, chroma-js, zod | [ ] |
| 21 | **Adventure Dice**: roll for screen-free weekend ideas | Explore | Physics dice in 3D with a kinetic reveal | three, @react-three/fiber, seedrandom, gsap, canvas-confetti | [ ] |
| 22 | **Weather Wardrobe**: what to wear, from a live forecast | Today | Weather drawn as animated SVG (rain, sun, wind) | open-meteo (fetch), suncalc, date-fns, gsap, chroma-js | [ ] |
| 23 | **Morse & Signals**: learn Morse by ear and by light | Learn | A blinking SVG lamp and a signal waveform | tone, gsap, seedrandom, fastest-levenshtein, canvas-confetti | [ ] |
| 24 | **Periodic Table Explorer**: elements, groups and a quiz | Learn | Tiles that ripple and an animated SVG atom model | fuse.js, chroma-js, gsap, seedrandom, d3-scale | [ ] |
| 25 | **Negotiation Gym**: practise asking for a raise, a refund or a better deal | Learn | A tug-of-war SVG meter that moves with each reply | sentiment, compromise, @chatscope/chat-ui-kit-react, gsap, seedrandom | [ ] |
