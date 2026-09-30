# Bloom Arcade — 100 games

A new **Games** section in the sidebar opens the Arcade: a hub with a card for each game.
Each game is click-driven, built around animation and SVG, and runs on one of Three.js, Babylon.js, PlayCanvas, p5.js, matter-js (PhysicsJS-style 2D physics) or GSAP + SVG.
Games never announce a lesson. The skill is only in the mechanic; the "Quietly builds" column is for us.

**Inspiration from the Awwwards games collection:**
- Merci Michel's airship, egg hunt and race: short sessions with one core verb.
- Death Chef: an animated kitchen under time pressure.
- Sephora Pinball and Mailchimp Hole Golf: physics toys.
- MicroWaver 59: a playful appliance simulator.
- Wayfinder: procedural art.
- The Crumbskees: a click arcade.
- Gucci Burst: colour-burst puzzles.
- AIRSHIFUMI: gesture play.

Every game has:
- one verb;
- a 60–120 second loop;
- a best score kept in `localStorage`;
- instant restart;
- a result card with GSAP flourish;
- a theme-aware palette;
- reduced-motion fallbacks.

| # | Game | Core mechanic | Tech | Quietly builds |
|---|------|---------------|------|----------------|
| 1 | Pantry Tetris | Drop groceries into a fridge that must close; food spoils if buried | matter-js + SVG | Food storage, reducing waste |
| 2 | Coin Cascade | Drop coins through pegs into jars (Rent, Fun, Later) before the month ends | matter-js + SVG | Budgeting |
| 3 | Knot Garden | Click rope ends to tie knots that hold a swinging lantern | p5.js verlet | Practical knots |
| 4 | Burner Juggle | Keep four pans at the right heat as dishes cook in parallel | GSAP + SVG | Cooking timing, multitasking |
| 5 | Laundry Sorter | Flick clothes into baskets by colour and symbol before the drum fills | matter-js | Laundry care |
| 6 | Tiny Plant Shop | Water, light and repot plants whose leaves animate by mood | SVG + GSAP | Plant care |
| 7 | Leak Hunter | A pipe maze leaks; click valves in the right order | Three.js | Home maintenance basics |
| 8 | Map Runner | Pick the fastest route across a living city grid as buses move | Babylon.js | Navigation, planning |
| 9 | Fuse Box | Balance circuits so nothing trips while appliances switch on | SVG | Electrical load sense |
| 10 | Queue Hop | Choose checkout lanes by reading basket sizes | p5.js | Estimation |
| 11 | Compound Orchard | Plant seeds whose trees grow exponentially; pick when to harvest | Three.js | Compound interest |
| 12 | Receipt Rain | Catch the right receipts and let the fake charges fall | p5.js | Spotting overcharges |
| 13 | Scam Bubbles | Pop the bubbles carrying shady messages; keep the real ones | SVG + GSAP | Scam awareness |
| 14 | Password Forge | Hammer glowing runes into a lock that monsters try to crack | Babylon.js | Strong passphrases |
| 15 | Fridge Chef | Combine what's left into a dish before the timer ends | SVG drag | Cooking from leftovers |
| 16 | Tidy Sprint | Rooms fill with clutter; click-drag items home in the fewest moves | PlayCanvas | Tidying systems |
| 17 | Calendar Blocks | Stack falling week blocks with no overlaps and room for rest | matter-js | Time-blocking |
| 18 | First Aid Pulse | Keep a heart rhythm by clicking to the beat at the right depth | SVG + audio | CPR rhythm |
| 19 | Bandage Wrap | Trace spirals around a moving limb | p5.js | Wound dressing |
| 20 | Smoke Escape | Crawl low through a smoky 3D flat; test doors before opening | Three.js | Fire safety |
| 21 | Traffic Light Crossing | Cross streets with an animated crowd at the right moments | PlayCanvas | Road safety |
| 22 | Storm Pack | Pack a go-bag from a spinning carousel before the storm hits | GSAP + SVG | Emergency prep |
| 23 | Sunscreen Snake | Snake over a beach map; reapply before the sun meter peaks | p5.js | Sun safety |
| 24 | Hydration Hose | Aim a hose at plants and a runner through the day | matter-js | Hydration |
| 25 | Sleep Tide | Dim lights and screens to bring the moon tide in | SVG + GSAP | Sleep hygiene |
| 26 | Breath Kite | Fly a kite by holding and releasing a click in a slow rhythm | SVG + GSAP | Calm breathing |
| 27 | Mood Weather | Match clouds to feelings to clear the sky | SVG | Naming emotions |
| 28 | Echo Talk | Pick replies that make an avatar's colour glow warmer | SVG + GSAP | Active listening |
| 29 | Bridge Builder | Build a bridge between two islands that holds everyone's weight | matter-js | Compromise, negotiation |
| 30 | Pitch Balloon | Keep a balloon aloft by choosing crisp words over filler | p5.js | Concise speaking |
| 31 | Negotiation Tug | Tug a rope with timed offers and pauses | matter-js | Negotiation |
| 32 | Gift Radar | Collect clues about a friend and pick a gift | SVG | Thoughtfulness |
| 33 | Thank-You Paper Planes | Fold and throw paper-plane notes to the right people | Three.js | Gratitude habit |
| 34 | Boundary Garden | Build fences that let the good in and keep weeds out | SVG + GSAP | Healthy boundaries |
| 35 | Focus Lighthouse | Keep a beam on ships while distractions flash | Three.js | Attention control |
| 36 | Pomodoro Forge | Strike iron while it's hot and rest while it cools | Babylon.js | Work and rest cycles |
| 37 | Inbox Zero River | Route floating letters to Do, Delegate, Defer, Drop | matter-js | Email triage |
| 38 | Priority Peaks | Stack stones by importance and urgency to climb | matter-js | Prioritising |
| 39 | Procrastination Pinball | Hit start ramps before the gremlins grab the ball | matter-js | Starting tasks |
| 40 | Deadline Dominoes | Arrange dominoes so every task falls in time | matter-js | Scheduling dependencies |
| 41 | Habit Hatchery | Tap eggs daily in a loop; they hatch into creatures | SVG + GSAP | Consistency |
| 42 | Delay Dessert | Wait for the bigger cake as it grows | SVG | Delayed gratification |
| 43 | Shopping Cart Dash | Hit the list on budget while treats tempt from aisles | PlayCanvas | Mindful shopping |
| 44 | Unit Price Duel | Choose the better deal between two bouncing products | SVG | Unit pricing |
| 45 | Tip Split Café | Split bills fairly among animated diners | SVG | Mental maths, fairness |
| 46 | Salary Slide | Slide sliders to fit rent, food and savings as the month scrolls | GSAP | Budget ratios |
| 47 | Debt Dragon | Feed coins to shrink a dragon; interest makes it grow | Babylon.js | Paying debt down |
| 48 | Insurance Umbrella | Open umbrellas over houses as random storms roll in | p5.js | Risk pooling |
| 49 | Energy Meter | Switch off appliances to keep the meter green | SVG | Saving energy |
| 50 | Recycling Rush | Sort a conveyor of items into bins | matter-js | Recycling |
| 51 | Compost Castle | Layer greens and browns to build a warm pile | p5.js | Composting |
| 52 | Seasonal Market | Buy what's in season as the 3D wheel turns | Three.js | Seasonal eating |
| 53 | Plate Painter | Paint half a plate green before it spins away | SVG | Balanced meals |
| 54 | Label Detective | Zoom into packaging to find hidden sugar | SVG + GSAP | Reading labels |
| 55 | Knife Rhythm | Slice veg on beat with a claw-grip hand | p5.js | Knife skills |
| 56 | Egg Timer Symphony | Take eggs out at soft, medium and hard | SVG + audio | Cooking precision |
| 57 | Dough Rise | Knead, then wait and punch at the right moment | Three.js soft body | Baking |
| 58 | Spice Mixer | Mix colour-coded spices to hit a target flavour wheel | SVG | Seasoning |
| 59 | Pack the Suitcase | Fit a trip's needs into a carry-on | matter-js | Packing light |
| 60 | Jet Lag Globe | Rotate a globe and shift the sleep window to land fresh | Three.js | Travel planning |
| 61 | Phrasebook Parrot | Teach a parrot greetings by feeding it the right shapes | SVG | Travel phrases |
| 62 | Car Care Garage | Check tyres, oil and lights on a 3D car | Babylon.js | Car basics |
| 63 | Bike Fix | Rotate a 3D bike, find the flat and patch it | Three.js | Bike repair |
| 64 | Drawer Organiser | Fit tools into foam cut-outs | SVG drag | Organisation |
| 65 | Stain Lab | Pick the right treatment for each stain | SVG | Laundry, cleaning |
| 66 | Button Sewer | Sew a button by clicking holes in a cross pattern | SVG + GSAP | Sewing |
| 67 | Paint the Room | Tape, prime and paint, ordering each step | PlayCanvas | DIY sequence |
| 68 | Shelf Level | Mount a shelf using a bubble level | matter-js | Measuring, DIY |
| 69 | Tool Match | Pick the right tool for each job as the jobs fly by | SVG | Tool literacy |
| 70 | Clock Tower | Set tower hands to the times asked | SVG | Reading clocks |
| 71 | Morning Flow | Order morning steps to catch the tram | GSAP | Routine design |
| 72 | Wind-Down Lanterns | Blow out screens and light lanterns on the path to bed | Three.js | Evening routine |
| 73 | Water Wheel | Keep a mill turning with steady sips | matter-js | Hydration rhythm |
| 74 | Posture Tower | Stack vertebrae to keep a tower upright | matter-js | Posture awareness |
| 75 | Stretch Snap | Match glowing pose outlines | SVG | Stretching |
| 76 | Step Garden | Clicks are steps; a garden grows along your walk | p5.js | Daily movement |
| 77 | Germ Wash | Scrub all 20 seconds of germ patches off 3D hands | Three.js | Handwashing |
| 78 | Toothbrush Tempo | Brush every tooth zone to the music | SVG | Oral care |
| 79 | Medicine Cabinet | Sort meds by expiry and dose windows | SVG | Medicine safety |
| 80 | Allergy Chef | Serve guests safe dishes from their badges | SVG | Allergen awareness |
| 81 | Kindness Chain | Pass a glowing orb through a crowd | Babylon.js | Kindness, networking |
| 82 | Team Raft | Assign crew to oars by strength to cross rapids | matter-js | Delegation |
| 83 | Conflict Knots | Untangle two ropes without pulling too hard | p5.js verlet | Conflict resolution |
| 84 | Apology Origami | Fold paper in the right order into a crane | SVG + GSAP | Apologising well |
| 85 | Listening Pond | Ripples reveal fish only when you wait | p5.js | Patience, listening |
| 86 | Decision Maze | Branching paths whose costs reveal later | Three.js | Weighing decisions |
| 87 | Risk River | Cross stepping stones; bigger leaps pay more but can splash | matter-js | Risk judgement |
| 88 | Goal Mountain | Chunk a peak into camps and climb | Babylon.js | Goal setting |
| 89 | Memory Market | Remember a shopping list that walks past | SVG + GSAP | Working memory |
| 90 | Resume Builder Blocks | Stack achievement blocks into a strong tower | matter-js | Self-presentation |
| 91 | Interview Spotlight | Keep a spotlight steady while answering | SVG | Composure |
| 92 | Meeting Meteor | Deflect meteors of off-topic chat and keep to the agenda | Three.js | Running meetings |
| 93 | Note Nest | Catch floating ideas in a nest before they fly off | p5.js | Note-taking |
| 94 | Clock Juggler | Juggle timers for laundry, oven and call | SVG + GSAP | Juggling tasks |
| 95 | Weather Wardrobe | Dress a character for the forecast | SVG | Planning for the weather |
| 96 | Star Compass | Find north from stars and shadows | Three.js | Orientation |
| 97 | Camp Fire | Build a fire in the right order: tinder, kindling, logs | matter-js | Outdoor skills |
| 98 | Water Filter | Layer sand, charcoal and gravel | matter-js particles | Survival basics |
| 99 | Swim Float | Keep a swimmer afloat with calm strokes | p5.js | Water safety |
| 100 | Life Garden | A 3D island that blooms from your best scores | Babylon.js | Reflection, balance |

## Build log
- Game 1: Pantry Tetris — matter-js fridge packing drawn in SVG, with rotation, a door that has to shut and a bonus for short-dated food kept within reach. The Arcade hub and Games section launched with it.
- Game 2: Coin Cascade — a Plinko month of pay into Home, Food, Fun and Later jars, with bills that fall due partway through and a Later jar that grows weekly.
- Game 3: Knot Garden — p5.js verlet rope. Follow a firefly's path through the garden pegs to tie a clove hitch, figure eight, bowline, reef knot and sheet bend, each one lighting a lantern before dusk.
- Game 4: Burner Juggle — GSAP and SVG stove with four burners, heat knobs, stirring, scorch meters and an order rail, in 90-second services.
- Game 5: Laundry Sorter — matter-js drag and fling. Clothes tumble onto a folding table and go into Whites, Colours, Darks or Hand wash by colour and care tag (a red sock turns the whites pink). Arcade games now keep their own colours in the Matrix theme.
- Game 6: Compound Orchard — a Babylon.js floating island. Plant trees that grow by a fifth of their size each season and harvest at the right time before old trees wither; 20 seasons with soft shadows and coin bursts.
- Game 7: Scam Bubbles — GSAP bubbles carry texts up to your phone. Pop the phishing, fake-delivery and gift-card scams, let real messages through; three cracks and it's over.
- Game 8: Focus Lighthouse — Three.js night sea with wave-displaced water, a spotlight beam and cone, sailing ships with focus bars and fireworks pulling your eye away.
- Game 9: Breath Kite — SVG and GSAP kite on a 4-seconds-up, 6-seconds-down wind wave. Hold to rise, release to glide, and thread the rings for streaks.
- Game 10: Traffic Light Crossing — PlayCanvas voxel street with four lanes of traffic that queues at a cycling crossing light. Hop across to run errands, with a bonus for crossing on the green man.
- Game 11: Sleep Tide — an SVG bedroom where phones, the TV, a laptop, a lamp, a tablet and a late coffee keep waking up. Tap them off so the moon-tide of sleep fills before the alarm.
- Game 12: Recycling Rush — a matter-js conveyor over Paper, Cans & plastic, Glass, Compost and General bins. Tap to drop each item at the right moment; the belt speeds up.
- Game 13: Listening Pond — a p5.js generative koi pond. Fish rise only as stillness builds; tap a koi as it surfaces, and a splash anywhere else sends them all deep.
- Game 14: Delay Dessert — an SVG cake that keeps stacking layers worth more and more, while a cat creeps along the counter in fits and starts. Serve early or push your luck.
- Game 15: Camp Fire — matter-js stacking of tinder, kindling and logs in a stone ring, with canvas flames and sparks. Fire spreads by contact and smothers if packed too tight; three matches to warm the night.
- Game 16: Germ Wash — scrub wiggly SVG germs off two hands with foaming GSAP bubbles before the 20-second song ends. Germs favour fingertips, thumbs, between fingers and wrists.
- Game 17: Star Compass — a Three.js sky dome of real star positions (the Plough, Cassiopeia, Polaris and more), rotated and tilted to a new latitude each night. Drag to look around and click the Pole Star; north appears on the horizon.
- Game 18: Pack the Suitcase — drag polyomino belongings into a 9×6 carry-on (right-click to turn). Gold-edged essentials matter most; zip it with a bouncing lid before the taxi arrives.
- Game 19: Debt Dragon — a Babylon.js cave with a breathing dragon on its hoard that grows 7% each moon. Tap glowing crystals to mine (coins arc through the air), then feed the dragon or buy a better pick before it outgrows the cave.
- Game 20: Pomodoro Forge — an SVG smithy with a glowing, cooling bar, a GSAP hammer and sparks. Strike hot metal to shape it, reheat in the forge, and cold strikes crack it.
- Game 21: Plate Painter — paint veg, protein and grains onto a spinning SVG plate. Coverage and proportions are sampled against the chef's sketch pie for each of five plates.
- Game 22: Posture Tower — matter-js vertebrae stacked on a chair that keeps slumping. Lean the pointer or arrow keys against the drift, with a live tilt gauge.
- Game 23: Hydration Hose — canvas water-droplet arcs aimed by pointer. Five plants each have their own thirst and happy band (the cactus barely wants any), with passing joggers who'd love a splash.
- Game 24: Bike Fix — a Three.js spoked wheel half-dunked in a water tub. Drag to spin it, watch for bubbles rising from hidden punctures, click to patch, then pump the tyre up across five wheels.
- Game 25: Clock Juggler — SVG dials for bread, laundry, parking, tea, a call to Gran and seedlings, each sweeping down at its own pace. Tap in the green window; more timers join through the day.
- Game 26: Knife Rhythm — p5.js chopping board where carrots, cucumbers, leeks and more glide under the blade on a speeding beat. Slice as each dotted line meets the knife for perfect, even pieces; a curled guiding hand flinches if you rush.
- Game 27: Label Detective — an SVG clip-path magnifying glass (3× lens) over tiny ingredient lists. Click every disguised sugar (dextrose, maltodextrin, invert syrup…) on five packs before the shopper moves on.
- Game 28: Team Raft — canvas rapids where you can't paddle, only assign six crew with different strength and stamina to left, right or rest, steering by the balance of effort. Tired paddlers fade until they rest.
- Game 29: Weather Wardrobe — dress Pip for six random days of temperature, rain, snow, strong sun and gusts. Warmth has to match the thermometer, and umbrellas flip in the wind; animated SVG weather.
- Game 30: Goal Mountain — a Babylon.js displaced-terrain mountain with snowcap, spiralling ledges and a reach ring. Camp ledge to ledge: big leaps cost energy and shrink tomorrow's reach, storms cut it, and the summit must fall within 16 days.
- Game 31: Memory Market — a friend calls out a shopping list one item at a time (GSAP speech bubbles), then it blows away. Tap the list items across market stalls full of decoys; lists grow from 3 to 8.
- Game 32: Fuse Box — an evening of appliances (kettle, oven, hairdryer, iron…) waiting for power. Plug each into one of three 3 kW circuits, with a live load preview; overloads trip the fuse and knock everything off.
- Game 33: Smoke Escape — a Three.js procedural-maze flat under rising layered smoke. Crawl to stay under it, click doors to feel them first (hot doors glow behind), and reach the green exit across three flats.
- Game 34: Button Sewer — sew two- and four-hole buttons in across-and-back, parallel, cross and square patterns. Front stitches draw on with GSAP and back stitches show dashed; wrap the shank and knot it off.
- Game 35: Thank-You Planes — Three.js paper planes with a slingshot drag and dashed arc preview, thrown to the neighbour in the right window of a 3D building. Each note names the kindness, and they wave when it arrives.
- Game 36: Stretch Snap — an SVG figure with two-bone IK arms and legs. Drag hands and feet into glowing stretch outlines (star, side bends, lunge, airplane…) and hold still while the breath ring fills.
- Game 37: Inbox River — SVG letters drift toward a waterfall. Drag each to Do it now (two minutes or less), Schedule (big jobs), Hand off (not yours) or Let it go (promos); anything important swept away costs you.
- Game 38: Procrastination Pinball — a matter-js pinball table with hinged flippers, five glowing START targets to light and bouncy gremlins ("one more video", "snack?") that drain your focus bar.
- Game 39: Shopping Cart Dash — a PlayCanvas supermarket where the cart follows your pointer. Collect the six-item list, fight the magnetic pull of treat displays that add themselves to the bill, and reach the till within £30.
- Game 40: Kindness Chain — a Babylon.js town square of wandering people, a glowing orb with a particle trail and a reach ring. Pass the warm light person to person before it fades, until the whole square glows.
- Game 41: Negotiation Tug — haggle by tug-of-war on a matter-js rope. Pull while the seller rests, ease off when they heave (or the rope snaps), and let go with the knot in the fair-price zone; lowballing makes them pack up.
- Game 42: Tidy Sprint — drag scattered things to homes marked with faint outlines (bookshelf, hooks, laundry, drawer, toy box, bin), with a one-touch bonus for putting things straight away. Three rooms before the guests arrive.
- Game 43: Bridge Builder — snap planks between grid nodes to span three gaps on a budget, then Test. matter-js turns each plank into a pinned body; joints that stretch too far snap, and triangles under the deck carry the heavy cart across.
- Game 44: Leak Hunter — an SVG house cross-section with animated water flowing through kitchen, bathroom and heating branches. Close the right valve (or the main stopcock, which makes everyone grumble), patch the dripping leak, and reopen; patching with water on soaks you.
- Game 45: Insurance Umbrella — p5.js storms drift toward six little houses. Each umbrella costs a coin a season against an income of six; uncovered houses hit by lightning need nine-coin repairs. Twelve seasons of risk pooling.
- Game 46: Water Filter — layer cloth, charcoal, sand, gravel (or grass) into a cut-down bottle, pour murky stream water, and watch GSAP drops clear as they pass each layer. Order matters, and without charcoal it never runs fully clear.
- Game 47: Shelf Level — tilt a shelf by hand (a slightly shaky one) while an SVG spirit-level bubble lags behind, and screw it in when it sits between the lines. Then GSAP ornaments drop on and slide off if it's wonky.
- Game 48: Clock Tower — drag an SVG town clock's minute hand (the hour hand follows like real gearing) to times shouted in words ("quarter to nine") or 24-hour (19:15), then ring the swinging GSAP bell.
- Game 49: Swim Float — p5.js sea with wave sets and a gentle rip. Hold to swim toward the pointer (tiring), let go to float on your back and recover breath, and don't panic-tap; reach the beach.
- Game 50: Egg Timer Symphony — three SVG pots that tick a beat per second (lit dots, no clocks). Drop in eggs for soft, jammy or hard orders, lift them out by counting, then crack them open to see yolks from runny to chalky.
- Game 51: Habit Hatchery — SVG eggs in nests that each need one warm tap a day. Seven-day streak dots hatch a creature with a GSAP pop, missed days cool eggs back to zero, and you can add eggs from the basket at your own risk.
- Game 52: Morning Flow — race a 7:30 tram with ten job cards. Hands-on jobs block you while kettle, toast and washing run in the background once started; must-dos, dependencies (dress after shower) and a live analogue clock.
- Game 53: Risk River — a p5.js frog hops drifting stones upstream. Point, hold to charge (with an aim arc), release to leap; steady grey rocks, wobbly brown ones that sink if you linger, flimsy lily pads, and gold coin stones just out of reach.
- Game 54: Allergy Chef — dishes on an SVG conveyor show their ingredients, and guests wear badges for what they can't eat. Tap a dish then a guest; safe meals bounce with joy, unsafe ones make them sneeze, and guests who wait too long leave hungry.
- Game 55: Password Forge — a Babylon.js vault door with six glowing rune slots. Forge a lock from rune words, then watch horned imps attack; popular words and a→@ tricks fall instantly, while strings of odd unrelated words hold for years. Five vaults.
- Game 56: Conflict Knots — two p5.js verlet ropes tangled on a table, with live segment-intersection counting. Drag any part to tease them apart; drag too fast and a tension meter locks the tangle for a breath. Five tangles.
- Game 57: Apology Origami — real polygon folding in SVG. Half-plane clipping splits each paper layer along the crease, and flaps rotate over it with a live preview while you drag the glowing corner to its ring. Envelope, fortune and cup.
- Game 58: Car Care Garage — a Babylon.js car rolls into the bay. Orbit round it and tap each tyre, the oil, headlights and wipers to inspect (green okay, red glow needs work), then tap again to fix; flat tyres visibly squash. Five cars.
- Game 59: Jet Lag Globe — a Three.js globe with a day/night shader and twinkling city lights. Plan an in-flight nap on a dial coloured by the destination's night, then fly a great-circle arc as the terminator sweeps across; land fresh across five trips.
- Game 60: Compost Castle — a p5.js falling-sand bin. Pour greens, browns and water, and turn the pile with a fork; heat rises with the right mix, moisture and air (steam wisps), converting cells to dark finished compost, while too many greens gets whiffy.
