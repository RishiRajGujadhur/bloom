import { exercises, filterExercises, repSeconds } from '../src/features/exercise/exercises'
import { applyPreset, featureCategory, matchPreset, presets } from '../src/settings/featureCatalog'
import { defaultSettings, featureKeys } from '../src/SettingsPage'
import { subFeatures } from '../src/features/subFeatures'
import { cardsFor, dailyCard, deckOf, decks as afDecks, shuffle } from '../src/features/affirm/affirmModel'
import { cities as dlCities, dayFraction, hm as dlHm, moonName, plan as dlPlan, sunTimes, yearDayLengths } from '../src/features/daylight/daylightModel'
import { blinkClosed, exerciseById, nearFar, routine as eyeRoutine } from '../src/features/eyes/eyesModel'
import { addActive, challengeMinutes, inWindDown, minutesOn, week as screenWeek } from '../src/features/screen/screenModel'
import { describe as ruleText, occursOn, streak as rtStreak, templates as rtTemplates, totalMinutes, upcoming } from '../src/features/routines/routineModel'
import { ganttTasks, goalProgress, onTrack, reviewDue, sampleGoal } from '../src/features/roadmap/roadmapModel'
import { dailyWorkout, isTarget, mathsProblem, memoryPattern, memorySetup, nbackSequence, nextLevel, reactionScore, rng, scoreNback, skillScores, stroopTrial } from '../src/features/games/gamesModel'
import { clozeBack, clozeFront, dueCards, newCard, parseImport, render as mdRender, review as cardReview, stats as cardStats } from '../src/features/cards/cardsModel'
import { branches, fromText, templates as mapTemplates, titleOf } from '../src/features/mindmap/mindmapModel'
import { agreement, daily as mrDaily, label as mrLabel, reframesFor, score as mrScore, topWords } from '../src/features/mirror/mirrorModel'
import { hit, pathFor, promptFor, push as inkPush, redo as inkRedo, undo as inkUndo } from '../src/features/ink/inkModel'
import { beadOf, isQuarter, roundsOf } from '../src/features/mala/malaModel'
import { best as bwBest, defaultSettings as bwDefaults, initial as bwInitial, lung, step as bwStep } from '../src/features/breathwork/breathworkModel'
import { bells, courses, currentLine, sessionById, streakDays, timed } from '../src/features/meditate/meditateModel'
import { modes as soundModes } from '../src/features/sounds/focusEngine'
import { endMessage, fmtH, perDay, stageAt, stats as fastStats } from '../src/features/fasting/fastingModel'
import { allergenHits, forPortion, light, parseProduct, sugarCubes, validCode } from '../src/features/scan/scanModel'
import { bmi, bmiBand, display, projection, trend, whtr, whtrBand } from '../src/features/body/bodyModel'
import { bests, demoRoute, distanceKm, fmtPace, pace, pointAt, splits, weekKm } from '../src/features/run/runModel'
import { forAreas, routines as stRoutines, steps as stSteps, totalSeconds as stTotal } from '../src/features/stretch/stretchModel'
import { isDue } from '../src/components/studio/Nudges'
import { flowSeconds, newStep, poses, presetFlows, stepAt } from '../src/features/yoga/yogaModel'
import { c25kProgram, calories, position, presets as ivPresets, segments, total } from '../src/features/interval/intervalModel'
import { e1rm, plates, progress, prsFor, volume, weeklyMuscleSets, type Workout } from '../src/features/workout/workoutModel'

test('settings: every feature has a category; presets round-trip', () => {
  for (const k of featureKeys) expect(featureCategory[k]).toBeDefined()
  const calm = presets.find((p) => p.id === 'calm')!
  const flags = { ...defaultSettings.features, ...applyPreset(calm, featureKeys) }
  expect(flags.breathe).toBe(true)
  expect(flags.dailySpin).toBe(false)
  expect(matchPreset(flags, featureKeys)?.id).toBe('calm')
  expect(matchPreset({ ...flags, dailySpin: true }, featureKeys)).toBeUndefined()
  expect(matchPreset(defaultSettings.features, featureKeys, defaultSettings.features)?.id).toBe('recommended')
})

test('round 13 features each have at least 10 sub-features', () => {
  for (const k of ['exerciseGuides', 'workoutLog', 'intervalCoach', 'yogaFlow', 'mobility', 'runTracker', 'bodyProgress', 'foodScanner', 'fasting', 'focusSounds', 'soundMixer', 'meditation', 'breathwork', 'mala', 'inkJournal', 'moodMirror', 'mindMaps', 'flashcards', 'brainGames', 'goalRoadmap', 'routineScheduler', 'digitalWellbeing', 'eyeCare', 'daylight', 'affirmations'] as const) expect(subFeatures[k].length).toBeGreaterThanOrEqual(10)
})

test('exercise library: poses, tempo and filters', () => {
  expect(exercises.length).toBeGreaterThanOrEqual(12)
  for (const e of exercises) {
    expect(e.cues.length).toBeGreaterThan(1)
    expect(e.primary.length).toBeGreaterThan(0)
  }
  const squat = exercises.find((e) => e.id === 'squat')!
  expect(repSeconds(squat)).toBe(4)
  expect(repSeconds(squat, 2)).toBe(2)
  expect(filterExercises(exercises, { equipment: 'dumbbells' }).every((e) => e.equipment === 'dumbbells')).toBe(true)
  expect(filterExercises(exercises, { muscle: 'chest' }).map((e) => e.id)).toContain('pushup')
  expect(filterExercises(exercises, { favourites: ['plank'] }).map((e) => e.id)).toEqual(['plank'])
})

test('workout maths: e1RM, PRs, volume, plates and weekly muscle sets', () => {
  expect(e1rm(100, 5)).toBeCloseTo(116.7, 1)
  expect(e1rm(100, 1)).toBe(100)
  const history = [{ liftId: 'bench', weight: 60, reps: 8, at: 1 }]
  expect(prsFor({ liftId: 'bench', weight: 65, reps: 8, at: 2 }, history)).toEqual(['e1rm', 'weight'])
  expect(prsFor({ liftId: 'bench', weight: 60, reps: 10, at: 2 }, history)).toEqual(['e1rm', 'reps'])
  expect(prsFor({ liftId: 'squat', weight: 60, reps: 10, at: 2 }, history)).toEqual([])
  expect(volume([{ liftId: 'pullup', weight: 10, reps: 5, at: 1 }], 70)).toBe(400)
  expect(plates(100)).toEqual({ perSide: [25, 15], leftover: 0 })
  expect(plates(21).leftover).toBe(1)
  const now = Date.now()
  const w: Workout[] = [
    { id: 'a', name: 'Push', templateId: 'push', startedAt: now - 86400000, sets: [{ liftId: 'bench', weight: 60, reps: 8, at: now - 86400000 }] },
    { id: 'b', name: 'Push', templateId: 'push', startedAt: now, sets: [{ liftId: 'bench', weight: 65, reps: 8, at: now }] },
  ]
  expect(progress(w, 'bench').map((p) => p.best)).toEqual([76, 82.3])
  expect(weeklyMuscleSets(w, now).get('chest')).toBe(2)
  expect(weeklyMuscleSets(w, now).get('triceps')).toBe(1)
})

test('intervals: segments, position, C25K progression and calories', () => {
  const tabata = ivPresets.find((p) => p.id === 'tabata')!
  const s = segments(tabata)
  expect(s.filter((x) => x.kind === 'work')).toHaveLength(8)
  expect(s.filter((x) => x.kind === 'rest')).toHaveLength(7)
  expect(total(s)).toBe(120 + 8 * 20 + 7 * 10 + 120)
  expect(total(segments(tabata, false))).toBe(230)
  expect(position(s, 125)).toMatchObject({ segment: { kind: 'work', round: 1 }, into: 5, left: 15 })
  expect(position(s, total(s))).toBeNull()
  expect(c25kProgram(0).name).toBe('C25K W1 D1')
  expect(c25kProgram(4).name).toBe('C25K W2 D2')
  expect(c25kProgram(99).work).toBe(1800)
  expect(calories(s, total(s), 70)).toBeGreaterThan(40)
})

test('yoga: poses, flow length and the live step', () => {
  expect(poses.length).toBeGreaterThanOrEqual(12)
  const sun = presetFlows.find((f) => f.id === 'sunA')!
  const breaths = sun.steps.reduce((t, s) => t + s.breaths, 0)
  expect(flowSeconds(sun, 5)).toBe(breaths * 5)
  expect(stepAt(sun, 5, 0)?.index).toBe(0)
  expect(stepAt(sun, 5, 10)?.index).toBe(1)
  expect(stepAt(sun, 5, flowSeconds(sun, 5))).toBeNull()
  expect(newStep('tree').key).not.toBe(newStep('tree').key)
  for (const f of presetFlows) for (const s of f.steps) expect(poses.some((p) => p.id === s.poseId)).toBe(true)
})

test('stretch: sides expand, areas map to stretches; nudges respect quiet hours', () => {
  const desk = stRoutines.find((r) => r.id === 'desk')!
  const both = stSteps(desk.ids)
  expect(both.length).toBeGreaterThan(desk.ids.length)
  expect(stSteps(desk.ids, false)).toHaveLength(desk.ids.length)
  expect(both.filter((s) => s.stretch.id === 'neckTilt').map((s) => s.side)).toEqual(['left', 'right'])
  expect(stTotal(stSteps(['chinTuck'], false), 2)).toBe(60)
  expect(forAreas(['wrists'])).toEqual(['wristFlex', 'prayer'])
  const base = { id: 'x', title: '', body: '', page: 'stretch' as const, every: 30, enabled: true, lastAt: 0 }
  const noon = new Date('2026-09-26T12:00:00').getTime()
  const night = new Date('2026-09-26T23:00:00').getTime()
  expect(isDue(base, noon)).toBe(true)
  expect(isDue({ ...base, enabled: false }, noon)).toBe(false)
  expect(isDue({ ...base, lastAt: noon - 10 * 60000 }, noon)).toBe(false)
  expect(isDue({ ...base, quietStart: 21, quietEnd: 7 }, night)).toBe(false)
  expect(isDue({ ...base, quietStart: 21, quietEnd: 7 }, noon)).toBe(true)
})

test('run: turf distance, splits, pace, replay point and bests', () => {
  const route = demoRoute(undefined, 3, 0)
  const km = distanceKm(route)
  expect(km).toBeGreaterThan(2.7)
  expect(km).toBeLessThan(3.6)
  const sp = splits(route)
  expect(sp).toHaveLength(Math.floor(km))
  for (const s of sp) expect(s).toBeGreaterThan(200)
  expect(splits(route, 'mi')).toHaveLength(Math.floor(km / 1.609344))
  expect(fmtPace(pace(5, 1500))).toBe(`5'00"`)
  expect(pace(1.609344, 480, 'mi')).toBeCloseTo(480)
  expect(pointAt(route, 0)?.lat).toBeCloseTo(route[0].lat, 5)
  const runs = [{ id: 'a', at: Date.now(), kind: 'run' as const, km, seconds: 1000, points: route }]
  expect(bests(runs).longest?.id).toBe('a')
  expect(weekKm(runs)).toBeCloseTo(km)
})

test('body: trend smoothing, ratios, units and goal projection', () => {
  expect(trend([80, 80, 80])).toEqual([80, 80, 80])
  expect(trend([80, 90], 0.1)[1]).toBeCloseTo(81)
  expect(bmi(80, 180)).toBeCloseTo(24.7, 1)
  expect(bmiBand(24.7)).toBe('Healthy range')
  expect(whtrBand(whtr(90, 180))).toBe('Increased')
  expect(display(100, 'kg', 'imperial').value).toBeCloseTo(220.46, 1)
  expect(display(10, 'cm', 'imperial').unit).toBe('in')
  const entries = Array.from({ length: 10 }, (_, i) => ({ date: `2026-09-${String(i * 2 + 1).padStart(2, '0')}`, weight: 80 - i * 0.2 }))
  const p = projection(entries, 75)!
  expect(p.perWeek).toBeLessThan(0)
  expect(p.date).toBeInstanceOf(Date)
  expect(projection(entries, 90)?.date).toBeNull()
  expect(projection(entries.slice(0, 2), 75)).toBeNull()
})

test('food scanner: parses Open Food Facts, portions, cubes, lights, allergens', () => {
  const p = parseProduct('123', {
    status: 1,
    product: { product_name: 'Spread', brands: 'Acme, Other', nutriscore_grade: 'e', nova_group: 4, nutriments: { 'energy-kcal_100g': 539, sugars_100g: 56.3, fat_100g: 30.9, proteins_100g: 6.3, carbohydrates_100g: 57.5, salt_100g: 0.1 }, additives_tags: ['en:e322'], allergens_tags: ['en:milk', 'en:nuts'] },
  })!
  expect(p).toMatchObject({ name: 'Spread', brand: 'Acme', nutriscore: 'e', nova: 4, additives: ['E322'], allergens: ['milk', 'nuts'] })
  expect(parseProduct('1', { status: 0 })).toBeNull()
  expect(forPortion(p, 30).kcal).toBe(162)
  expect(sugarCubes(56.3, 30)).toBe(4)
  expect(light('sugars', 56.3)).toBe('high')
  expect(light('salt', 0.1)).toBe('low')
  expect(allergenHits(p, ['nuts', 'gluten'])).toEqual(['nuts'])
  expect(validCode('3017620422003')).toBe(true)
  expect(validCode('12ab')).toBe(false)
})

test('fasting: stages, per-day hours, stats and kind endings', () => {
  expect(stageAt(2).name).toBe('Fed')
  expect(stageAt(13).name).toBe('Fat burning')
  expect(stageAt(30).name).toBe('Autophagy')
  expect(fmtH(13.5)).toBe('13h 30m')
  const now = new Date('2026-09-26T12:00:00').getTime()
  const h = [
    { start: now - 20 * 3600000, end: now - 4 * 3600000, goal: 16 },
    { start: now - 2 * 86400000 - 12 * 3600000, end: now - 2 * 86400000, goal: 16 },
  ]
  expect(perDay(h)).toHaveLength(2)
  const st = fastStats(h, now)
  expect(st.weekCount).toBe(2)
  expect(st.longest).toBe(16)
  expect(st.rate).toBe(0.5)
  expect(endMessage(16, 16)).toMatch(/Goal reached/)
  expect(endMessage(6, 16)).toMatch(/still a real fast/)
})

test('focus sounds: modes map to brainwave bands', () => {
  expect(soundModes.focus.am).toBeGreaterThanOrEqual(13)
  expect(soundModes.relax.am).toBeGreaterThanOrEqual(8)
  expect(soundModes.relax.am).toBeLessThan(13)
  expect(soundModes.meditate.am).toBeGreaterThanOrEqual(4)
  expect(soundModes.meditate.am).toBeLessThan(8)
  expect(soundModes.sleep.am).toBeLessThan(4)
})

test('soundscape presets only use known layers', async () => {
  jest.resetModules()
  const { layers, presets } = await import('../src/features/mixer/mixerEngine')
  const ids = new Set(layers.map((l) => l.id))
  for (const p of presets) for (const k of Object.keys(p.mix)) expect(ids.has(k as never)).toBe(true)
  expect(layers.filter((l) => l.noise)).toHaveLength(3)
})

test('meditation: scripts scale to length, bells and streaks', () => {
  const body = sessionById('body')
  const lines = timed(body, 20)
  expect(lines[0].at).toBe(0)
  expect(lines[lines.length - 1].at).toBeLessThan(1200)
  expect(currentLine(lines, 300)?.text).toBe(lines.filter((l) => l.at <= 300).at(-1)?.text)
  expect(bells(10, 5)).toEqual([300])
  expect(bells(10, 0)).toEqual([])
  for (const c of courses) for (const id of c.sessions) expect(sessionById(id)).toBeDefined()
  const now = new Date('2026-09-26T12:00:00').getTime()
  const logs = [0, 1, 2, 4].map((d) => ({ at: now - d * 86400000, id: 'breath1', minutes: 5 }))
  expect(streakDays(logs, now)).toBe(3)
})

test('breathwork: breathe → retention → recovery → next round → done', () => {
  const cfg = { ...bwDefaults, rounds: 2, breaths: 3, pace: 1, recovery: 5 }
  let s = bwInitial(0)
  s = bwStep(s, cfg, 2500)
  expect(s.breath).toBe(1)
  s = bwStep(s, cfg, 6000)
  expect(s.phase).toBe('retention')
  s = bwStep(s, cfg, 36000, true)
  expect(s).toMatchObject({ phase: 'recovery', retentions: [30] })
  s = bwStep(s, cfg, 41000)
  expect(s.phase).toBe('rest')
  s = bwStep(s, cfg, 44000)
  expect(s).toMatchObject({ phase: 'breathe', round: 2 })
  s = bwStep(bwStep(bwStep(s, cfg, 50000), cfg, 90000, true), cfg, 96000)
  expect(s.phase).toBe('done')
  expect(bwBest([{ at: 0, retentions: s.retentions }])).toBe(40)
  expect(lung(bwInitial(0), cfg, 1000)).toBeCloseTo(1)
})

test('mala: quarters, rounds and bead position', () => {
  expect([27, 54, 81, 108].every((n) => isQuarter(n))).toBe(true)
  expect(isQuarter(28)).toBe(false)
  expect(roundsOf(250)).toBe(2)
  expect(beadOf(250)).toBe(34)
})

test('ink: freehand path, eraser hit, undo/redo, prompts', () => {
  const stroke = { id: 'a', tool: 'pen' as const, color: '#000', size: 8, t0: 0, points: [[0, 0, 0.5], [50, 10, 0.5], [100, 0, 0.5]] as [number, number, number][] }
  expect(pathFor(stroke)).toMatch(/^M /)
  expect(hit([stroke], 50, 12)).toEqual(['a'])
  expect(hit([stroke], 50, 80)).toEqual([])
  let h = inkPush({ past: [], future: [] }, [])
  const u = inkUndo(h, [stroke])!
  expect(u.strokes).toEqual([])
  h = u.history
  expect(inkRedo(h, [])!.strokes).toEqual([stroke])
  expect(inkUndo({ past: [], future: [] }, [])).toBeNull()
  expect(promptFor('2026-09-26')).toBe(promptFor('2026-09-26'))
})

test('mood mirror: sentiment, daily tone, words, agreement, reframes', () => {
  const day = 86400000
  const items = ['I am so happy and grateful today', 'Stressed and tired, a hard day', 'Wonderful calm evening', 'Sad and lonely', 'Great news, excited'].map((text, i) => mrScore({ id: String(i), at: i * day, text, source: 'journal' }))
  expect(items[0].comparative).toBeGreaterThan(0)
  expect(items[1].comparative).toBeLessThan(0)
  expect(mrLabel(items[0].comparative)).toMatch(/Bright|Warm/)
  expect(topWords(items, 'negative').map((w) => w[0])).toContain('stressed')
  const days = mrDaily(items)
  expect(days).toHaveLength(5)
  const moods = [5, 2, 4, 1, 5].map((mood, i) => ({ at: i * day, mood }))
  expect(agreement(days, moods)!).toBeGreaterThan(0.8)
  expect(reframesFor(items).map((r) => r[0])).toEqual(expect.arrayContaining(['stressed', 'tired', 'sad']))
})

test('mind maps: outlines, titles and journal conversion', () => {
  expect(titleOf(mapTemplates[0].md)).toBe('My goal')
  expect(branches(['# A', '## B', '- c', '- d'].join('\n'))).toBe(3)
  const md = fromText('Nightly', 'Work was busy. I felt tired. I need rest.\n\nDinner with Sam was lovely.')
  expect(md.split('\n')[0]).toBe('# Nightly')
  expect(md).toContain('## Work was busy.')
  expect(md).toContain('- I felt tired.')
})

test('flashcards: SM-2, cloze, safe markdown, import, stats', () => {
  const c = newCard('d', 'Q', 'A', '2026-09-26')
  expect(dueCards([c], '2026-09-26')).toHaveLength(1)
  const good = cardReview(c, 4, '2026-09-26')
  expect(good.due).toBe('2026-09-27')
  expect(dueCards([good], '2026-09-26')).toHaveLength(0)
  expect(cardReview(good, 1, '2026-09-27').lapses).toBe(1)
  expect(clozeFront('The {{c1::heart}} pumps')).toBe('The […] pumps')
  expect(clozeBack('The {{c1::heart}} pumps')).toBe('The **heart** pumps')
  const html = mdRender('**bold** <script>alert(1)</script> <a href="javascript:x" onclick="y">l</a>')
  expect(html).toContain('<strong>bold</strong>')
  expect(html).not.toMatch(/script|onclick|javascript:/)
  expect(parseImport('a;b\nc\td\nbad')).toEqual([{ front: 'a', back: 'b' }, { front: 'c', back: 'd' }])
  expect(cardStats([c, good], '2026-09-26')).toMatchObject({ fresh: 1, young: 1, total: 2 })
})

test('brain games: n-back, memory, stroop, maths, adaptivity, skills', () => {
  const r = rng(42)
  const seq = nbackSequence(2, 40, r)
  const targets = seq.map((_, i) => i).filter((i) => isTarget(seq, i, 2))
  expect(targets.length).toBeGreaterThan(4)
  expect(scoreNback(seq, 2, new Set(targets)).accuracy).toBe(1)
  expect(scoreNback(seq, 2, new Set()).hits).toBe(0)
  expect(memorySetup(1)).toEqual({ size: 3, tiles: 4 })
  expect(memoryPattern(4, 6, r).size).toBe(6)
  for (let i = 0; i < 30; i++) {
    const t = stroopTrial(5, r)
    expect(t.options).toContain(t.ink)
    const p = mathsProblem(8, r)
    expect(Number.isInteger(p.answer)).toBe(true)
    expect(p.answer).toBeGreaterThanOrEqual(0)
  }
  expect(nextLevel(3, 0.9)).toBe(4)
  expect(nextLevel(3, 0.3)).toBe(2)
  expect(nextLevel(1, 0.1)).toBe(1)
  expect(reactionScore(150)).toBe(100)
  expect(reactionScore(500)).toBe(0)
  expect(skillScores([{ at: 0, game: 'stroop', level: 2, score: 50, accuracy: 1 }]).attention).toBe(68)
  expect(dailyWorkout('2026-09-26')).toHaveLength(3)
})

test('roadmap: progress, on-track, reviews and gantt tasks', () => {
  const g = sampleGoal('2026-09-01')
  expect(goalProgress(g)).toBeCloseTo((1 / 3 + 4 / 10) / 2)
  expect(goalProgress({ ...g, krs: [] })).toBeCloseTo(0.1)
  expect(onTrack(g, '2026-09-01')?.status).toBe('on track')
  expect(onTrack({ ...g, krs: [] }, '2026-10-25')?.status).toBe('behind')
  expect(reviewDue(g, '2026-09-01')).toBe(true)
  expect(reviewDue({ ...g, reviewedAt: '2026-09-01' }, '2026-09-05')).toBe(false)
  const t = ganttTasks([g])
  expect(t).toHaveLength(3)
  expect(t[1].dependencies).toBe(g.milestones[0].id)
})

test('routines: rrule schedules, text, occurrences and streaks', () => {
  const morning = { ...rtTemplates[0], id: 'm', log: [] as { date: string; done: number }[] }
  expect(ruleText(morning.repeat)).toBe('Every weekday at 07:00')
  expect(occursOn(morning, '2026-09-28')).toBe(true)
  expect(occursOn(morning, '2026-09-27')).toBe(false)
  expect(occursOn({ ...morning, paused: ['2026-09-28'] }, '2026-09-28')).toBe(false)
  expect(upcoming(morning, new Date('2026-09-26T10:00:00Z'), 2).map((d) => d.toISOString().slice(0, 10))).toEqual(['2026-09-28', '2026-09-29'])
  expect(totalMinutes(morning)).toBe(16)
  morning.log = ['2026-09-24', '2026-09-25'].map((date) => ({ date, done: 4 }))
  expect(rtStreak(morning, '2026-09-26')).toBe(2)
})

test('screen time: hourly usage, week, wind-down, challenges', () => {
  const at = new Date('2026-09-26T14:10:00').getTime()
  let u = addActive({}, at, 600)
  u = addActive(u, at + 60000, 300)
  expect(u['2026-09-26'][14]).toBe(900)
  expect(minutesOn(u, '2026-09-26')).toBe(15)
  expect(screenWeek(u, '2026-09-26').at(-1)?.minutes).toBe(15)
  expect(inWindDown(22, 23)).toBe(true)
  expect(inWindDown(22, 3)).toBe(true)
  expect(inWindDown(22, 12)).toBe(false)
  expect(challengeMinutes({ start: 0, end: 90 * 60000 })).toBe(90)
})

test('eye care: routine, near/far and blink timing', () => {
  expect(eyeRoutine.every((id) => exerciseById(id))).toBe(true)
  expect(nearFar(0)).toBeCloseTo(0)
  expect(nearFar(5)).toBeCloseTo(1)
  expect(blinkClosed(2.8)).toBe(true)
  expect(blinkClosed(1)).toBe(false)
})

test('daylight: sun times, plan, moon and seasons', () => {
  const london = dlCities.find((c) => c.name === 'London')!
  const t = sunTimes(new Date('2026-06-21T12:00:00Z'), london)
  expect(t.dayLength).toBeGreaterThan(16)
  expect(dlHm(t.sunrise, london.tz)).toMatch(/^04:4\d$/)
  const w = sunTimes(new Date('2026-12-21T12:00:00Z'), london)
  expect(w.dayLength).toBeLessThan(8.5)
  const y = yearDayLengths(london, 2026)
  expect(y[5]).toBeGreaterThan(y[11])
  expect(dayFraction(new Date(t.noon), t.sunrise, t.sunset)).toBeCloseTo(0.5, 1)
  const p = dlPlan({ wake: '07:00', caffeineGap: 8, windDownGap: 60 }, t.sunrise, t.sunset, new Date('2026-06-21T12:00:00'))
  expect(p.sleep.getTime() - p.wake.getTime()).toBe(16 * 3600000)
  expect(p.sleep.getTime() - p.caffeineCurfew.getTime()).toBe(8 * 3600000)
  expect(moonName(0.5)).toBe('Full moon')
  expect(moonName(0.01)).toBe('New moon')
  // Polar night still yields usable times.
  expect(sunTimes(new Date('2026-12-21T12:00:00Z'), { name: 'Pole', lat: 89, lng: 0 }).dayLength).toBe(12)
})

test('affirmations: decks, mix, favourites, daily card', () => {
  const store = { favourites: ['I trust myself.'], custom: ['I am here.'] }
  expect(cardsFor('calm', store)).toHaveLength(6)
  expect(cardsFor('favourites', store)).toEqual(['I trust myself.'])
  expect(cardsFor('mine', store)).toEqual(['I am here.'])
  expect(cardsFor('mix', store)).toHaveLength(afDecks.length * 6)
  expect(shuffle([1, 2, 3, 4], 7)).toEqual(shuffle([1, 2, 3, 4], 7))
  expect(dailyCard(new Date('2026-09-26'))).toBe(dailyCard(new Date('2026-09-26T20:00:00')))
  expect(deckOf('I trust myself.')?.id).toBe('confidence')
})

test('life tools migrate into Daybook pages once', async () => {
  const { migrateLifeTools, DAYBOOK_STORAGE_KEY } = await import('../src/components/daybook/storage')
  localStorage.setItem('bloom-life-tools-v1', JSON.stringify({ version: 1, records: [{ id: 'a', tool: 'boundaries', title: 'Work calls', values: { need: 'Quiet evenings', script: '' }, created: 0, updated: 1, done: false, next: 'Tell my manager' }] }))
  expect(migrateLifeTools()).toBe(1)
  const pages = JSON.parse(localStorage.getItem(DAYBOOK_STORAGE_KEY)!)
  expect(pages[0]).toMatchObject({ modeId: 'boundary-setting', modeTitle: 'Boundary setting' })
  expect(pages[0].content['prompt-0']).toContain('Need: Quiet evenings')
  expect(localStorage.getItem('bloom-life-tools-v1')).toBeNull()
  expect(migrateLifeTools()).toBe(0)
})
