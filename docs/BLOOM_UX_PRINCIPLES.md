# Bloom UX principles

Bloom's identity in one sentence:

> The longer you use Bloom, the more it seems to understand you, the more your
> personal world grows, and the more interesting your history becomes.

Everything connects through one loop:

```
DO  →  PROGRESS  →  DISCOVER  →  REFLECT  →  RETURN
task,     Bloom Growth,   a pattern Bloom    Memory Timeline   tomorrow's seed,
routine,  garden, rings   noticed about you  keeps the story   Sunday story,
focus                                                         welcome back
```

These are working hypotheses drawn from behavioural product design (Tim Gabe's
talks on gamification, retention, onboarding and emotional design, plus
Hick's and Fitts's laws). Several statistics quoted in that material are hard to
verify, so **every rule below has a way to check it in Bloom** rather than
being assumed to work.

## The seven rules

| # | Rule | What it means on screen | Where it lives |
|---|---|---|---|
| 1 | **One obvious next action** | Every screen answers "What should I do now?". The home screen's dominant element is a single large button. | `NowCard` (`src/features/core/CoreHome.tsx`, `nowModel.ts`) |
| 2 | **Zero unnecessary friction** | Common actions take one tap: *Start 25-minute focus* (remembers your last duration and preselects the task), *Already done*, *Tick habit*. | `NowCard` actions; `focusQuest.taskId` |
| 3 | **Visible, meaningful growth** | One progression, not many counters: Seed → Sprout → Growing → Thriving → Blooming, earned from real tasks, habits, focus, reflection and care. Consistency over intensity. | `growthModel.ts`, `GrowthGarden` |
| 4 | **Bloom remembers you** | Recognition compares you with *past-you*, never other people. Discoveries are real patterns from your history. Moments are written to the Memory Timeline. | `recognition.ts`, `discoveries.ts`, `insights.ts` |
| 5 | **Something changes while you're gone** | Morning / Afternoon / Evening / Sunday Bloom; a new daily seed question; tomorrow's bud in the garden; the Sunday week reveal. | `modeFor`, `seedFor`, `weekStory` |
| 6 | **Big moments are moments** | Anticipation → reveal → celebration, reserved for discoveries, stage-ups, a completed day and the week story. Ordinary actions get a quiet whisper instead. | `MomentReveal.tsx`, `CoreEngine.tsx` |
| 7 | **Never punish absence** | "Welcome back. Here's where you left off." History and garden are intact; flowers never wilt; the growth score keeps a banked lifetime half. No "streak lost". | `WelcomeBack`, `growth()`, habit cards |

## How each idea from the research maps to Bloom

- **One meaningful progression** → Bloom Growth replaces "+XP" as the thing you watch. Level and XP still exist in Growth & Rewards for people who enjoy them, but ordinary "+XP" toasts are replaced by recognition.
- **Controlled unpredictability** → *Discoveries*: after a meaningful action (a postponed or P1 task, deep work, a 25-minute focus, a reflection, a returning or perfect habit) there's a 30 % chance Bloom reveals a pattern. A pity timer guarantees one after four misses, and nothing repeats. Rare discoveries get a gold treatment.
- **Compounding value** → the garden gains one flower per active day and never loses them; discoveries, stage-ups, whole days and weekly stories join the Memory Timeline.
- **Open loops / clock mechanic** → today's seed is replaced tomorrow; a dashed bud marks tomorrow's flower; Sunday unlocks the week story. There are no decay punishments.
- **Anticipation → reveal → celebration** → a trembling seed pod, words that bloom in one by one, then petals, a soft chime and a haptic tap.
- **Peak-end rule** → the day-complete moment ("You planned 6 things. You completed 6. Your focus was strongest in the morning.").
- **Achievable comparison** → "18 % more than your 30-day average". Your rival is yesterday-you.
- **Hick's law** → *Simple home*: the hero shrinks, the daily spin and stat row step back, and "More for today" is collapsed.
- **Fitts's law** → the primary button is 56 px tall, high-contrast, in the natural reading path; secondary actions are visibly lighter.
- **Fast onboarding** → goal → quiet moment → first task → you're in. Each step personalises something (a starter habit, greeting and the first Now action). It's inline and skippable, never a blocking tutorial.
- **Human recognition** → "That's the third task you'd been putting off that you've finished this week." rather than "+25 XP".
- **The interface disappears** → the Now card chooses for you; the Daily flow and nudges link features so you rarely need the sidebar.

## Guardrails

- Animate moments, not everything. Everything respects *prefers-reduced-motion* and each effect has a Settings switch (`bloomCore.*`).
- No leaderboards against strangers. Social features, if added, should be encouragement (shared challenges, "celebrate a friend"), not rank.
- No manipulative scarcity, no guilt copy, no loss framing.
- Consistency over decoration: warm palette, generous whitespace, one accent colour for primary actions, rounded surfaces.

## Validating it (instead of assuming it works)

Bloom is local-first, so measure on-device and compare periods:

| Question | Signal already in the data |
|---|---|
| Does the Now card reduce friction? | Share of focus sessions started with a preselected task; time from opening to first action. |
| Does growth motivate consistency? | Active days per week (`growth().recentDays`) before and after enabling `bloomCore.growth`. |
| Do discoveries create curiosity, not noise? | Return rate the day after a discovery vs other days. |
| Does welcome-back beat streak loss? | Days until the next action after a 3+ day gap. |
| Does the simple home help? | Tasks completed per active day with `simpleHome` on vs off (A/B by toggling). |

Each is one Settings switch away from an A/B comparison. Nothing is sent anywhere.
