import { defaults, newSession, parseData, reply, advance, toggleHabit } from '../src/model'
import { dayKey, previousDay } from '../src/dates'
import { initialRpg } from '../src/rpg/schema'
import { bossHealth, combo, commitBoss, contractSignature, elapsedParts, failFocusQuest, focusQuestState, habitKey, initializeGame, multiplier, openLoot, resetMomentum, startFocusQuest, startMomentum, syncGame, totals, unlocks, completeFocusQuest, FOCUS_QUEST_MS } from '../src/rpg/engine'
import type { AppData } from '../src/model'
const time=(day: number,hour=10)=>new Date(2026,8,day,hour).getTime()
function fresh(at=time(1)) { const data=defaults(); data.rpg=initialRpg(at);return data }
function log(data: AppData, at: number, index=0) { return syncGame(toggleHabit(data,data.habits[index].id,dayKey(new Date(at))),data,at) }
function run(days: number) { let data=fresh();for(let n=1;n<=days;n++)data=log(data,time(n));return data }
function completeJournal(data: AppData,at:number) { let session=newSession();session.metadata.date=new Date(at).toISOString();for(const answer of ['Steady','Walked','Rested','Read'])session=advance(reply(session,answer));return syncGame({...data,sessions:[...data.sessions,session]},data,at) }
test('momentum exposes exact parts and explicit reset/shatter states',()=>{
  let data=fresh(time(1));expect(elapsedParts(time(1),time(2,1))).toEqual({days:0,hours:15,minutes:0,milliseconds:15*60*60*1000})
  data=startMomentum(data,time(1));expect(data.rpg.momentum.startedAt).toBe(time(1))
  expect(resetMomentum(data,time(2)).rpg.momentum.resetAt).toBe(time(2))
  expect(data.rpg.momentum.shatteredAt).toBeNull()
})
test('focus quest requires the full 25 minutes and damage is idempotent',()=>{
  let data=startFocusQuest(fresh(), 'forest', time(1))
  expect(focusQuestState(data.rpg,time(1)+FOCUS_QUEST_MS-1)).toBe('active')
  expect(completeFocusQuest(data,time(1)+FOCUS_QUEST_MS)).not.toBe(data)
  data=failFocusQuest(data,time(1)+1000);expect(data.rpg.focusQuest.damage).toBe(1)
  expect(failFocusQuest(data,time(1)+2000)).toBe(data)
})
test('contract signatures are deterministic and input-sensitive',()=>{
  expect(contractSignature('a','b','c')).toBe(contractSignature('a','b','c'))
  expect(contractSignature('a','b','c')).not.toBe(contractSignature('a','b','d'))
})

test('legacy migration preserves all existing coaching records and does not grant retroactive rewards',()=>{
  const current=fresh();const {rpg: _rpg,...legacy}=current;void _rpg
  const old={...legacy,version:1,habits:legacy.habits.map(({stat:_stat,...h})=>{void _stat;return {...h,dates:['2026-09-01']}})}
  const migrated=initializeGame(parseData(old),time(1))
  expect(migrated.version).toBe(2)
  expect(migrated.habits[0].stat).toBe('strength')
  expect(migrated.habits[0].dates).toEqual(['2026-09-01'])
  expect(migrated.affirmation).toBe(old.affirmation)
  expect(totals(migrated.rpg).exp).toBe(0)
  const replay=log(log(migrated,time(1)),time(1))
  expect(totals(replay.rpg).exp).toBe(0)
})
test('workout grants five Strength, coding grants Intelligence and reassigning cannot move old awards',()=>{
  let data=fresh();data.habits[1].stat='intelligence'
  data=log(log(data,time(1)),time(1),1)
  expect(totals(data.rpg).stats).toEqual({strength:5,intelligence:5,spirit:0})
  const changed={...data,habits:data.habits.map(h=>({...h,stat:'spirit' as const}))}
  expect(totals(syncGame(changed,data,time(1)).rpg).stats.strength).toBe(5)
})
test('undo removes reward and replay restores original amount even at a later multiplier',()=>{
  const first=log(fresh(),time(1));const key=habitKey(first.habits[0].id,'2026-09-01')
  const undone=log(first,time(1,18));expect(totals(undone.rpg).exp).toBe(0)
  const restored=log(undone,time(1,23));expect(restored.rpg.ledger[key].exp).toBe(10)
  expect(totals(restored.rpg).stats.strength).toBe(5)
  expect(Object.keys(restored.rpg.ledger)).toHaveLength(1)
})
test('journal awards once per local day regardless of session count or edits',()=>{
  let data=completeJournal(fresh(),time(1));data=completeJournal(data,time(1,12))
  expect(data.sessions).toHaveLength(2)
  expect(totals(data.rpg).stats.spirit).toBe(5)
  expect(totals(data.rpg).exp).toBe(20)
  data=completeJournal(data,time(2));expect(totals(data.rpg).stats.spirit).toBe(10)
})
test('multipliers use exact elapsed thresholds, compound between them, and cap at 3x',()=>{
  expect(multiplier(0)).toBe(1)
  expect(multiplier(72*3600000)).toBe(1.5)
  expect(multiplier(14*86400000)).toBe(3)
  expect(multiplier(7*86400000)).toBeGreaterThan(1.5)
  expect(multiplier(100*86400000)).toBe(3)
  expect(multiplier(-1000)).toBe(1)
})
test('one log daily maintains streak, today has grace and a whole missed day resets it',()=>{
  const data=run(4)
  expect(combo(data.rpg,time(4)).elapsed).toBe(3*86400000)
  expect(combo(data.rpg,time(4)).multiplier).toBe(1.5)
  expect(combo(data.rpg,time(5,23)).days).toBe(4)
  expect(combo(data.rpg,time(6,0)).days).toBe(0)
  expect(combo(log(data,time(6)).rpg,time(6)).elapsed).toBe(0)
})
test('calendar continuity at midnight is distinct from elapsed 24-hour time',()=>{
  let data=log(fresh(time(1,23)),time(1,23));data=log(data,time(2,0))
  expect(combo(data.rpg,time(2,0)).days).toBe(2)
  expect(combo(data.rpg,time(2,0)).elapsed).toBe(3600000)
  expect(previousDay('2026-03-09')).toBe('2026-03-08')
  expect(previousDay('2026-01-01')).toBe('2025-12-31')
})
test('clock rollback does not produce negative elapsed time or duplicate rewards',()=>{
  const data=run(4)
  const rolled=syncGame(data,data,time(2))
  expect(rolled.rpg.lastSeenAt).toBe(time(4))
  expect(combo(rolled.rpg,time(2)).elapsed).toBe(3*86400000)
  expect(totals(rolled.rpg).exp).toBe(totals(data.rpg).exp)
})
test('loot appears at exact seven-day and thirty-day milestones and opens only once',()=>{
  let data=run(7);expect(data.rpg.loot).toHaveLength(0)
  data=log(data,time(8));expect(data.rpg.loot.map(l=>l.milestone)).toEqual([7])
  expect(unlocks(data.rpg).forest).toBe(false)
  data=openLoot(data,7);expect(unlocks(data.rpg).forest).toBe(true)
  expect(openLoot(data,7)).toBe(data)
  for(let n=9;n<=31;n++)data=log(data,time(n))
  expect(data.rpg.loot.map(l=>l.milestone)).toEqual([7,30])
  expect(unlocks(openLoot(data,30).rpg).amber).toBe(true)
  const afterReset=log(data,time(34));expect(afterReset.rpg.loot).toHaveLength(2)
})
test('waiting without a fresh log cannot claim milestone loot',()=>{
  const data=run(7)
  expect(syncGame(data,data,time(8,12)).rpg.loot).toHaveLength(0)
})
function withBoss(){let data=fresh();data.plans=[{id:'critical',title:'Ship a small feature',date:'2026-09-01',done:false}];data=syncGame(commitBoss(data,['critical'],time(1)),data,time(1));return data}
test('boss requires 1–3 valid priorities, locks once, and snapshots habit list',()=>{
  const data=withBoss();expect(data.rpg.bosses['2026-09-01'].priorityIds).toEqual(['critical'])
  expect(commitBoss(data,[],time(1))).toBe(data)
  expect(commitBoss(data,['missing'],time(1))).toBe(data)
  expect(commitBoss(data,['critical'],time(1))).toBe(data)
  const newData={...data,habits:[...data.habits,{id:'new',title:'New habit',stat:'spirit' as const,detail:'',dates:[]}]}
  expect(bossHealth(newData,'2026-09-01')?.max).toBe(90)
})
test('habits attack the boss, priorities gate victory, and undo restores health/reverses bonus',()=>{
  let data=withBoss();for(let i=0;i<3;i++)data=log(data,time(1),i)
  expect(bossHealth(data,'2026-09-01')?.remaining).toBe(30)
  data=syncGame({...data,plans:data.plans.map(p=>({...p,done:true}))},data,time(1))
  expect(bossHealth(data,'2026-09-01')?.remaining).toBe(0)
  expect(data.rpg.ledger['boss:2026-09-01'].exp).toBe(50)
  expect(totals(data.rpg).exp).toBe(90)
  const undone=log(data,time(1))
  expect(bossHealth(undone,'2026-09-01')?.remaining).toBe(20)
  expect(totals(undone.rpg).exp).toBe(30)
  expect(totals(log(undone,time(1)).rpg).exp).toBe(90)
})
test('missed critical tasks apply five HP once across repeated refresh and offline gaps',()=>{
  let data=withBoss();data=syncGame(data,data,time(5))
  expect(totals(data.rpg).hp).toBe(95)
  expect(data.rpg.bosses['2026-09-01'].settled).toBe(true)
  expect(totals(syncGame(data,data,time(6)).rpg).hp).toBe(95)
  expect(totals(syncGame(fresh(),fresh(),time(20)).rpg).hp).toBe(100)
})
test('finishing critical tasks avoids penalty even if noncritical habits remain',()=>{
  let data=withBoss();data=syncGame({...data,plans:data.plans.map(p=>({...p,done:true}))},data,time(1))
  expect(totals(syncGame(data,data,time(2)).rpg).hp).toBe(100)
})
test('health never falls below one and full-health victories cannot bank healing',()=>{
  const data=withBoss()
  data.rpg.ledger['boss:old']={day:'2026-08-31',at:time(0),exp:50,stat:null,points:0,active:true,kind:'boss',sourceId:'old'}
  let closed=syncGame(data,data,time(2));expect(totals(closed.rpg).hp).toBe(95)
  for(let n=2;n<=23;n++){const day=dayKey(new Date(time(n)));closed.rpg.bosses[day]={day,habitIds:[],priorityIds:['x'],startedAt:time(n),defeated:false,settled:true,penalty:5}}
  expect(totals(closed.rpg).hp).toBe(1)
})
test('armor evolves from earned stat points and survives schema round-trip',()=>{
  const data=fresh()
  data.rpg.ledger.test={day:'2026-09-01',at:time(1),exp:600,stat:'strength',points:100,active:true,kind:'habit',sourceId:'test'}
  expect(totals(data.rpg).tier).toBe(1)
  data.rpg.ledger.test.points=300
  expect(totals(parseData(JSON.parse(JSON.stringify(data))).rpg).tier).toBe(2)
})
