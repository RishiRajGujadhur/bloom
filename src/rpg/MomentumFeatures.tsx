import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, Check, Clock3, Headphones, KeyRound, Lock, Play, RotateCcw, Search, ShieldAlert, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import type { Dispatch, SetStateAction } from 'react'
import type { AppData } from '../model'
import type { Rpg } from './schema'
import { contractSignature, elapsedParts, failFocusQuest, FOCUS_QUEST_MS, focusQuestState, resetMomentum, shatterMomentum, startFocusQuest, startMomentum, completeFocusQuest, momentumState } from './engine'
import { filterArchive, journalArchive, unlockedLoreCards } from './featureEngine'

const pad = (value: number) => String(value).padStart(2, '0')
const formatCountdown = (ms: number) => {
  const left = Math.max(0, FOCUS_QUEST_MS - ms)
  const minutes = Math.floor(left / 60000)
  return `${pad(minutes)}:${pad(Math.floor(left / 1000) % 60)}`
}

export function MomentumFeatures({ data, setData }: { data: AppData; setData: Dispatch<SetStateAction<AppData>> }) {
  const { t } = useTranslation(undefined, { i18n })
  const [clock, setClock] = useState(Date.now)
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('all')
  const [contractOpen, setContractOpen] = useState(false)
  const [contract, setContract] = useState({ given: '', when: '', then: '' })
  const [soundOn, setSoundOn] = useState(false)
  const audio = useRef<AudioContext | null>(null)
  const oscillator = useRef<OscillatorNode | null>(null)
  const quest = data.rpg.focusQuest
  const momentum = momentumState(data.rpg, clock)
  const questState = focusQuestState(data.rpg, clock)

  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  useEffect(() => {
    const leave = () => {
      if (document.visibilityState === 'hidden' && focusQuestState(data.rpg, Date.now()) === 'active') setData(current => failFocusQuest(current))
    }
    document.addEventListener('visibilitychange', leave)
    return () => document.removeEventListener('visibilitychange', leave)
  }, [data.rpg, setData])
  useEffect(() => {
    if (questState === 'active' && quest.startedAt && clock - quest.startedAt >= FOCUS_QUEST_MS) setData(current => completeFocusQuest(current, clock))
  }, [clock, quest.startedAt, questState, setData])
  useEffect(() => () => {
    oscillator.current?.stop()
    audio.current?.close()
  }, [])

  const toggleSound = async () => {
    if (soundOn) {
      oscillator.current?.stop()
      oscillator.current = null
      setSoundOn(false)
      return
    }
    try {
      const context = audio.current ?? new AudioContext()
      audio.current = context
      await context.resume()
      const node = context.createOscillator()
      const gain = context.createGain()
      node.type = quest.soundscape === 'brown-noise' ? 'sawtooth' : 'sine'
      node.frequency.value = quest.soundscape === 'forest' ? 220 : quest.soundscape === 'brown-noise' ? 92 : 174
      gain.gain.value = 0.025
      node.connect(gain).connect(context.destination)
      node.start()
      oscillator.current = node
      setSoundOn(true)
    } catch {
      setSoundOn(false)
    }
  }
  const archive = useMemo(() => filterArchive(journalArchive(data.sessions, t('rpg.quietReflection')), query, tag), [data.sessions, query, tag, t])
  const tags = [...new Set(data.sessions.flatMap(session => session.metadata.tags))].filter(Boolean)
  const addContract = () => {
    const given = contract.given.trim(), when = contract.when.trim(), then = contract.then.trim()
    if (!given || !when || !then) return
    const next = { id: crypto.randomUUID(), given, when, then, createdAt: clock, completed: false, signature: contractSignature(given, when, then) }
    setData(current => ({ ...current, rpg: { ...current.rpg, contracts: [next, ...current.rpg.contracts] } }))
    setContract({ given: '', when: '', then: '' })
    setContractOpen(false)
  }
  const elapsed = elapsedParts(data.rpg.momentum.startedAt, clock)
  const momentumLabel = momentum.state === 'active' ? t('rpg.momentumRunning') : momentum.state === 'shattered' ? t('rpg.momentumShattered') : t('rpg.momentumIdle')
  return <div className="momentum-features">
    <section className={`momentum-panel momentum-${momentum.state}`} aria-labelledby="momentum-title">
      <div className="feature-heading"><div><span className="feature-kicker"><Clock3 size={14}/> {t('rpg.momentumKicker')}</span><h2 id="momentum-title">{t('rpg.momentumTitle')}</h2><p>{t('rpg.momentumSubtitle')}</p></div><span className="momentum-state">{momentumLabel}</span></div>
      <div className="momentum-readout" aria-live="polite"><span>{elapsed.days}<small>{t('rpg.unitDays')}</small></span><b>:</b><span>{pad(elapsed.hours)}<small>{t('rpg.unitHours')}</small></span><b>:</b><span>{pad(elapsed.minutes)}<small>{t('rpg.unitMinutes')}</small></span></div>
      <div className="feature-actions bloom-controls">{momentum.state === 'idle' || momentum.state === 'shattered' ? <button className="feature-primary" onClick={() => setData(current => startMomentum(current, clock))}><Play size={15}/> {t('rpg.startRun')}</button> : <><button className="feature-secondary" onClick={() => setData(current => resetMomentum(current, clock))}><RotateCcw size={14}/> {t('rpg.resetClock')}</button><button className="feature-secondary danger" onClick={() => setData(current => shatterMomentum(current, clock))}><ShieldAlert size={14}/> {t('rpg.markShattered')}</button></>}</div>
      {momentum.state === 'shattered' && <p className="feature-alert" role="status">{t('rpg.shatteredNote')}</p>}
    </section>
    <section className="quest-panel" aria-labelledby="quest-title">
      <div className="feature-heading"><div><span className="feature-kicker"><Headphones size={14}/> {t('rpg.focusKicker')}</span><h2 id="quest-title">{t('rpg.focusTitle')}</h2><p>{t('rpg.focusSubtitle')}</p></div><span className={`quest-badge quest-${questState}`}>{t(`rpg.questState.${questState}`)}</span></div>
      <div className="quest-controls bloom-controls"><select aria-label={t('rpg.soundscapeAria')} value={quest.soundscape} disabled={questState === 'active'} onChange={event => setData(current => ({ ...current, rpg: { ...current.rpg, focusQuest: { ...current.rpg.focusQuest, soundscape: event.target.value as Rpg['focusQuest']['soundscape'] } } }))}><option value="rain">{t('rpg.soundRain')}</option><option value="forest">{t('rpg.soundForest')}</option><option value="brown-noise">{t('rpg.soundBrown')}</option></select><button className="sound-button" onClick={toggleSound} aria-pressed={soundOn}>{soundOn ? <Volume2 size={15}/> : <VolumeX size={15}/>} {soundOn ? t('rpg.soundOnLabel') : t('rpg.previewLoop')}</button></div>
      <div className="quest-clock" aria-live="polite">{questState === 'active' && quest.startedAt ? formatCountdown(clock - quest.startedAt) : questState === 'completed' ? t('rpg.questComplete') : questState === 'failed' ? t('rpg.questDamaged') : t('rpg.questReady')}</div>
      {questState === 'idle' || questState === 'failed' || questState === 'completed' ? <button className="feature-primary" onClick={() => setData(current => startFocusQuest(current, quest.soundscape, clock))}><Play size={15}/> {questState === 'idle' ? t('rpg.beginQuest') : t('rpg.runAgain')}</button> : <button className="feature-primary" onClick={() => setData(current => completeFocusQuest(current, clock))} disabled={clock - (quest.startedAt ?? clock) < FOCUS_QUEST_MS}><Check size={15}/> {t('rpg.claimCompletion')}</button>}
      <p className="quest-note">{quest.damage ? t('rpg.damageTaken', { count: quest.damage }) : t('rpg.damageNote')}</p>
    </section>
    <section className="lore-panel" aria-labelledby="lore-title"><div className="feature-heading"><div><span className="feature-kicker"><Sparkles size={14}/> {t('rpg.loreKicker')}</span><h2 id="lore-title">{t('rpg.loreTitle')}</h2></div></div><div className="lore-grid">{unlockedLoreCards(elapsed.days).map(card => { const unlocked = card.unlocked; const title = t(card.titleKey); const unlock = t(card.unlockKey); return <article className={`lore-card ${unlocked ? 'lore-unlocked' : 'lore-locked'}`} key={card.titleKey}>{unlocked ? <svg viewBox="0 0 80 54" aria-hidden="true"><path d="M8 43C20 10 36 44 49 17S68 8 74 11" fill="none"/><circle cx="49" cy="17" r="4"/></svg> : <Lock size={22}/>}<h3>{title}</h3><p>{unlocked ? t(card.bodyKey) : t('rpg.loreUnlockAt', { unlock })}</p></article> })}</div></section>
    <section className="contracts-panel" aria-labelledby="contracts-title"><div className="feature-heading"><div><span className="feature-kicker"><KeyRound size={14}/> {t('rpg.contractsKicker')}</span><h2 id="contracts-title">{t('rpg.contractsTitle')}</h2><p>{t('rpg.contractsSubtitle')}</p></div><button className="feature-secondary" onClick={() => setContractOpen(value => !value)}>{contractOpen ? t('rpg.closeContract') : t('rpg.newContract')}</button></div>{contractOpen && <div className="contract-form">{(['given','when','then'] as const).map(field => <label key={field}>{t(`rpg.${field}`)}<input value={contract[field]} onChange={event => setContract(current => ({ ...current, [field]: event.target.value }))} placeholder={t(`rpg.placeholder${field.charAt(0).toUpperCase()}${field.slice(1)}`)} /></label>)}<button className="feature-primary" onClick={addContract}><KeyRound size={14}/> {t('rpg.signContract')}</button></div>}<div className="contract-list">{data.rpg.contracts.length === 0 && <p className="feature-empty">{t('rpg.noContracts')}</p>}{data.rpg.contracts.map(item => <article className={`contract-card ${item.completed ? 'contract-done' : ''}`} key={item.id}><div><span>{t('rpg.given')}</span><p>{item.given}</p><span>{t('rpg.when')}</span><p>{item.when}</p><span>{t('rpg.then')}</span><p>{item.then}</p></div><div className="contract-signature"><small>{item.signature}</small><button aria-label={item.completed ? t('rpg.reopenContract') : t('rpg.completeContract')} onClick={() => setData(current => ({ ...current, rpg: { ...current.rpg, contracts: current.rpg.contracts.map(contractItem => contractItem.id === item.id ? { ...contractItem, completed: !contractItem.completed } : contractItem) } }))}>{item.completed ? <Check size={17}/> : t('rpg.sign')}</button></div></article>)}</div></section>
    <section className="archive-panel" aria-labelledby="archive-title"><div className="feature-heading"><div><span className="feature-kicker"><Archive size={14}/> {t('rpg.archiveKicker')}</span><h2 id="archive-title">{t('rpg.archiveTitle')}</h2><p>{t('rpg.archiveSubtitle')}</p></div></div><div className="archive-tools"><label className="archive-search"><Search size={15}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('rpg.searchArchive')} aria-label={t('rpg.searchArchiveAria')} /></label><select value={tag} onChange={event => setTag(event.target.value)} aria-label={t('rpg.filterTagsAria')}><option value="all">{t('rpg.allTags')}</option>{tags.map(value => <option key={value} value={value}>{value}</option>)}</select></div><div className="archive-grid">{archive.map(entry => <article className="archive-item" key={entry.id}><span className="archive-icon">{entry.mood && entry.mood >= 4 ? '✦' : '◌'}</span><time dateTime={entry.date}>{new Date(entry.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}</time><h3>{entry.title}</h3><div>{entry.tags.map(value => <span key={value}>#{value}</span>)}</div></article>)}{archive.length === 0 && <p className="feature-empty">{data.sessions.length ? t('rpg.noMatch') : t('rpg.emptyArchive')}</p>}</div></section>
  </div>
}