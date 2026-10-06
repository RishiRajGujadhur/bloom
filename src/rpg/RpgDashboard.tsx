import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import {
  BookOpen,
  Flame,
  Info,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { AppData } from '../model'
import { dayKey } from '../dates'
import { Modal } from '../components/Modal'
import {
  bossHealth,
  combo,
  commitBoss,
  openLoot,
  totals,
  unlocks,
} from './engine'
import { Sprite } from './Sprite'
import { enableAudio, victoryChord } from './audio'
import { statNames } from './schema'
import type { Stat } from './schema'
import { GamificationShowcase } from './GamificationShowcase'
import { MomentumFeatures } from './MomentumFeatures'
import './rpg.css'
import { LivingSeedling } from './LivingSeedling'
import { subOn } from '../features/subFeatures'
import { readStore, writeStore } from '../components/studio/Studio'
import type { ReactNode } from 'react'

const elapsedLabel = (elapsed: number) => {
  const minutes = Math.floor(elapsed / 60000)
  return `${Math.floor(minutes / 1440)}d ${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}h ${String(minutes % 60).padStart(2, '0')}m`
}
export function RpgDashboard({
  data,
  setData,
  onReflect,
  showWeeklyRaid,
  showWalkthroughTour,
  compact = false,
  externalFeedback = false,
  constellation,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  onReflect: () => void
  showWeeklyRaid: boolean
  showWalkthroughTour: boolean
  compact?: boolean
  externalFeedback?: boolean
  /** The 3D constellation, shown instead of the skill tree when chosen. */
  constellation?: ReactNode
}) {
  const { t } = useTranslation(undefined, { i18n })
  const [growthTab, setGrowthTab] = useState<'avatar' | 'skills' | 'rewards'>(
    'avatar',
  )
  const [skillView, setSkillViewState] = useState<'tree' | 'constellation'>(() => readStore('bloom-growth-skill-view-v1', 'tree'))
  const setSkillView = (v: 'tree' | 'constellation') => {
    setSkillViewState(v)
    writeStore('bloom-growth-skill-view-v1', v)
  }
  const showConstellation = compact && growthTab === 'skills' && !!constellation && skillView === 'constellation'
  const [clock, setClock] = useState(Date.now)
  const [showRules, setShowRules] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [lootModal, setLootModal] = useState<7 | 30 | null>(null)
  const [selection, setSelection] = useState<string[]>([])
  const [soundError, setSoundError] = useState('')
  const [audioReady, setAudioReady] = useState(false)
  const [feedback, setFeedback] = useState<{
    text: string
    kind: 'attack' | 'journal' | 'victory'
    nonce: number
    x: number
    y: number
  } | null>(null)
  const clickPosition = useRef({ x: 200, y: 160 })
  const prior = useRef(data.rpg)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    const tick = setInterval(() => setClock(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    const capture = (event: MouseEvent) => {
      const target =
        event.target instanceof Element ? event.target.closest('button') : null
      if (!target) return
      const rect = target.getBoundingClientRect()
      clickPosition.current = {
        x: Math.min(
          Math.max(rect.left + rect.width / 2, 140),
          window.innerWidth - 140,
        ),
        y: Math.max(75, Math.min(rect.top, window.innerHeight - 100)),
      }
    }
    document.addEventListener('click', capture, true)
    return () => document.removeEventListener('click', capture, true)
  }, [])
  useEffect(() => {
    const old = prior.current
    prior.current = data.rpg
    const newRewards = Object.entries(data.rpg.ledger).filter(
      ([key, e]) => e.active && e.exp > 0 && !old.ledger[key]?.active,
    )
    if (!newRewards.length) return
    const earned = newRewards.reduce((sum, [, e]) => sum + e.exp, 0)
    const kind = newRewards.some(([, e]) => e.kind === 'boss')
      ? 'victory'
      : newRewards.some(([, e]) => e.kind === 'journal')
        ? 'journal'
        : 'attack'
    const base = t('rpg.feedbackExp', { earned })
    setFeedback({
      text: kind === 'victory' ? `${base}${t('rpg.feedbackBoss')}` : base,
      kind,
      nonce: Date.now(),
      ...clickPosition.current,
    })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setFeedback(null), 2200)
    if (!externalFeedback && kind === 'victory' && data.rpg.sound && audioReady) victoryChord()
  }, [data.rpg, audioReady, t, externalFeedback])
  const now = Math.max(clock, data.rpg.lastSeenAt)
  const today = dayKey(new Date(now)),
    stats = totals(data.rpg),
    streak = combo(data.rpg, now),
    owned = unlocks(data.rpg)
  const boss = data.rpg.bosses[today],
    health = bossHealth(data, today)
  const priorities = data.plans.filter((p) => p.date === today)
  const pending = data.rpg.loot.filter((l) => !l.opened)
  const titles = [t('rpg.tier0'), t('rpg.tier1'), t('rpg.tier2')]
  const statLabels: Record<Stat, string> = {
    strength: t('rpg.statStrength'),
    intelligence: t('rpg.statIntelligence'),
    spirit: t('rpg.statSpirit'),
  }
  const statShorts: Record<Stat, string> = {
    strength: t('rpg.statMove'),
    intelligence: t('rpg.statFocus'),
    spirit: t('rpg.statReflect'),
  }
  const companionNames: Record<'none' | 'fox' | 'spirit', string> = {
    none: t('rpg.companionNone'),
    fox: t('rpg.companionFox'),
    spirit: t('rpg.companionSpirit'),
  }
  const paletteNames: Record<'bloom' | 'forest' | 'amber', string> = {
    bloom: t('rpg.paletteBloom'),
    forest: t('rpg.paletteForest'),
    amber: t('rpg.paletteAmber'),
  }
  const row =
    feedback?.kind === 'victory'
      ? 2
      : feedback?.kind === 'journal'
        ? 3
        : feedback?.kind === 'attack'
          ? 1
          : 0
  const changeSound = async () => {
    if (data.rpg.sound && audioReady) {
      setData((d) => ({ ...d, rpg: { ...d.rpg, sound: false } }))
      setAudioReady(false)
      return
    }
    const ready = await enableAudio()
    setAudioReady(ready)
    setSoundError(ready ? '' : t('rpg.audioUnavailable'))
    if (ready) setData((d) => ({ ...d, rpg: { ...d.rpg, sound: true } }))
  }
  return (
    <section
      className={`rpg-zone flex min-w-0 flex-col gap-5 ${feedback?.kind === 'victory' ? 'victory-shake' : ''}`}
      aria-label={t('rpg.zoneAria')}
    >
      <div className="rpg-heading">
        <span className="eyebrow">
          <Swords size={15} /> {t('rpg.eyebrow')}
        </span>
        <button className="rpg-link" onClick={() => setShowRules(true)}>
          <Info size={14} /> {t('rpg.howToPlay')}
        </button>
      </div>
      {compact && (
        <div className="segmented growth-tabs" aria-label="Growth areas">
          {(['avatar', 'skills', 'rewards'] as const).map((tab) => (
            <button
              key={tab}
              aria-pressed={growthTab === tab}
              onClick={() => setGrowthTab(tab)}
            >
              {tab === 'avatar'
                ? 'Seedling'
                : tab === 'skills'
                  ? 'Skill tree'
                  : 'Rewards'}
            </button>
          ))}
        </div>
      )}
      {(!compact || growthTab === 'avatar') && (
        <div className="adventure-grid">
          <div className="character-card" id="avatar-card">
            <div className="character-title">
              <span className="level-tag">
                {t('rpg.level', { level: stats.level })}
              </span>
              <div>
                <h2>{titles[stats.tier]}</h2>
                <p>{t('rpg.tagline')}</p>
              </div>
              <button
                className="inventory-button"
                onClick={() => setShowInventory(true)}
              >
                {t('rpg.inventory')} <Sparkles size={14} />
              </button>
            </div>
            <div className="character-body">
              <div className={`pixel-stage tier-${stats.tier}`}>
                <div className="pixel-moon" />
                <span className="pixel-star star-one">✦</span>
                <span className="pixel-star star-two">✧</span>
                <div className="pixel-ground" />
                <div className={`avatar-aura aura-${stats.tier}`}>
                  <Sprite
                    name={`hero-${stats.tier}`}
                    label={t('rpg.pixelAvatar', { name: titles[stats.tier] })}
                    row={row}
                    size={128}
                  />
                </div>
                {data.rpg.companion !== 'none' &&
                  ((data.rpg.companion === 'fox' && owned.forest) ||
                    (data.rpg.companion === 'spirit' && owned.amber)) && (
                    <div className="companion-sprite">
                      <Sprite
                        name={data.rpg.companion}
                        label={t('rpg.companionSprite', {
                          name: companionNames[data.rpg.companion],
                        })}
                        size={64}
                      />
                    </div>
                  )}
                <span className="stage-caption">
                  {stats.tier === 0
                    ? t('rpg.stage0')
                    : stats.tier === 1
                      ? t('rpg.stage1')
                      : t('rpg.stage2')}
                </span>
              </div>
              <div className="character-details">
                <div className="rpg-meter-label">
                  <span>
                    <HeartGlyph /> {t('rpg.vitality')}
                  </span>
                  <strong>{t('rpg.hp', { hp: stats.hp })}</strong>
                </div>
                <meter
                  className="hp-meter"
                  min={0}
                  max={100}
                  value={stats.hp}
                  aria-label={t('rpg.avatarHealth')}
                />
                <div className="rpg-meter-label">
                  <span>{t('rpg.experience')}</span>
                  <strong>{t('rpg.expValue', { exp: stats.exp })}</strong>
                </div>
                <progress
                  className="xp-meter"
                  value={stats.exp % 100}
                  max={100}
                  aria-label={t('rpg.progressToNextLevel')}
                />
                <p className="level-next">
                  {t('rpg.expToLevel', {
                    exp: stats.nextLevel,
                    level: stats.level + 1,
                  })}
                </p>
                <div className="rpg-stats">
                  {(Object.keys(statNames) as Stat[]).map((stat) => (
                    <div key={stat} className={`stat-${stat}`}>
                      <span>{statLabels[stat]}</span>
                      <strong>{stats.stats[stat]}</strong>
                      <small>{statShorts[stat]}</small>
                    </div>
                  ))}
                </div>
                <p className="evolution-note">
                  {stats.tier === 2
                    ? t('rpg.auraAwake')
                    : t('rpg.statPointsUntil', {
                        count:
                          (stats.tier === 0 ? 100 : 300) -
                          Object.values(stats.stats).reduce((a, b) => a + b, 0),
                      })}
                </p>
              </div>
            </div>
          </div>
          <aside className="combo-card">
            <span className="combo-label">
              <Flame size={16} /> {t('rpg.streakCombo')}
            </span>
            <div className="combo-multiplier">
              {streak.multiplier.toFixed(2)}
              <span>×</span>
            </div>
            <strong className="combo-time" aria-label={t('rpg.streakTime')}>
              {elapsedLabel(streak.elapsed)}
            </strong>
            <p>
              {streak.days
                ? t('rpg.streakDays', { count: streak.days })
                : t('rpg.streakStart')}
            </p>
            <div className="combo-anchors">
              <span>
                {t('rpg.days3')} <b>1.5×</b>
              </span>
              <i />
              <span>
                {t('rpg.days14')} <b>3×</b>
              </span>
            </div>
            <div className="combo-status">
              <span className={`tiny-dot ${streak.loggedToday ? 'lit' : ''}`} />
              {streak.loggedToday
                ? t('rpg.comboProtected')
                : streak.days
                  ? t('rpg.comboKeep')
                  : t('rpg.comboStart')}
            </div>
            <button className="rpg-reflect" onClick={onReflect}>
              <BookOpen size={14} /> {t('rpg.reflect')}
            </button>
          </aside>
        </div>
      )}
      {compact && growthTab === 'avatar' && subOn('rpgSkillTree', 'livingSeedling') && <LivingSeedling data={data} />}
      {compact && growthTab === 'skills' && constellation && (
        <div className="segmented growth-tabs" aria-label="Skill view">
          <button aria-pressed={skillView === 'tree'} onClick={() => setSkillView('tree')}>Tree</button>
          <button aria-pressed={skillView === 'constellation'} onClick={() => setSkillView('constellation')}>Constellation</button>
        </div>
      )}
      {showConstellation && constellation}
      {compact && growthTab === 'avatar' && (
        <section className="card seedling-journey">
          <h3>Your next chapter</h3>
          <div className="evolution-path">
            {[0, 1, 2].map((tier) => (
              <div
                key={tier}
                className={stats.tier < tier ? 'evolution-locked' : ''}
              >
                <Sprite name={`hero-${tier}`} label={titles[tier]} size={64} />
                <strong>{titles[tier]}</strong>
                <small>
                  {tier === 0
                    ? 'Start here'
                    : `${tier === 1 ? 100 : 300} attribute points`}
                </small>
              </div>
            ))}
          </div>
          <progress
            aria-label="Evolution progress"
            max={stats.tier < 1 ? 100 : 300}
            value={Object.values(stats.stats).reduce(
              (sum, value) => sum + value,
              0,
            )}
          />
          <div className="feature-actions bloom-controls">
            <button
              className="primary"
              onClick={() => {
                window.location.hash = 'focus'
              }}
            >
              Grow with focus
            </button>
            <button
              className="quiet-button"
              onClick={() => {
                window.location.hash = 'challenges'
              }}
            >
              Try a challenge
            </button>
          </div>
        </section>
      )}
      {(!compact || growthTab === 'rewards') && (
        <>
          <div className={`daily-boss ${boss?.defeated ? 'boss-won' : ''}`}>
            <div className="boss-art">
              <Sprite name="boss" label={t('rpg.bossName')} size={96} />
              {boss?.defeated && (
                <span className="defeated-stamp">{t('rpg.bossDefeated')}</span>
              )}
            </div>
            <div className="boss-content">
              <div className="boss-title">
                <div>
                  <span className="eyebrow">{t('rpg.bossEyebrow')}</span>
                  <h3>{t('rpg.bossName')}</h3>
                </div>
                <span className="boss-reward">
                  <Trophy size={13} /> {t('rpg.bossReward')}
                </span>
              </div>
              {boss && health ? (
                <>
                  <div className="rpg-meter-label">
                    <span>
                      {boss.defeated
                        ? t('rpg.bossVictory')
                        : t('rpg.bossAttack')}
                    </span>
                    <strong>
                      {t('rpg.bossHp', {
                        remaining: health.remaining,
                        max: health.max,
                      })}
                    </strong>
                  </div>
                  <progress
                    className="boss-meter"
                    value={health.remaining}
                    max={health.max}
                    aria-label={t('rpg.bossHealth')}
                  />
                  <div className="boss-objectives">
                    {boss.priorityIds.map((id) => {
                      const p = data.plans.find((p) => p.id === id)
                      return (
                        <span
                          key={id}
                          className={p?.done ? 'objective-done' : ''}
                        >
                          {p?.done ? '✓' : '◇'}{' '}
                          {p?.title ?? t('rpg.committedIntention')}
                        </span>
                      )
                    })}
                  </div>
                  <small>
                    {t('rpg.bossSummary', {
                      habitHits: health.habitHits,
                      habitTotal: boss.habitIds.length,
                      priorityHits: health.priorityHits,
                      priorityTotal: boss.priorityIds.length,
                    })}
                  </small>
                </>
              ) : (
                <>
                  <p>{t('rpg.bossIntro')}</p>
                  {priorities.length ? (
                    <>
                      <div className="boss-select">
                        {priorities.map((p) => (
                          <label key={p.id}>
                            <input
                              type="checkbox"
                              checked={selection.includes(p.id)}
                              disabled={
                                !selection.includes(p.id) &&
                                selection.length >= 3
                              }
                              onChange={() =>
                                setSelection((ids) =>
                                  ids.includes(p.id)
                                    ? ids.filter((id) => id !== p.id)
                                    : [...ids, p.id],
                                )
                              }
                            />
                            <span>{p.title}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        className="boss-start"
                        disabled={!selection.length}
                        onClick={() => setData((d) => commitBoss(d, selection))}
                      >
                        <Swords size={14} />{' '}
                        {t('rpg.commitBoss', { count: selection.length })}
                      </button>
                      <small>{t('rpg.bossPenalty')}</small>
                    </>
                  ) : (
                    <button
                      className="rpg-link"
                      onClick={() => {
                        window.location.hash = 'planning'
                      }}
                    >
                      {t('rpg.addIntention')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="loot-row">
            <div>
              <Sparkles size={15} />
              <span>{t('rpg.lootEyebrow')}</span>
            </div>
            {([7, 30] as const).map((m) => {
              const loot = data.rpg.loot.find((l) => l.milestone === m)
              return (
                <button
                  key={m}
                  className={`loot-button ${loot && !loot.opened ? 'chest-drop' : ''}`}
                  disabled={!loot}
                  onClick={() => setLootModal(m)}
                >
                  <Sprite
                    name="chest"
                    label={t('rpg.chest', { count: m })}
                    size={40}
                  />
                  <span>
                    {t('rpg.chest', { count: m })}
                    <small>
                      {loot?.opened
                        ? t('rpg.chestCollected')
                        : loot
                          ? t('rpg.chestReady')
                          : m === 7
                            ? t('rpg.chest7')
                            : t('rpg.chest30')}
                    </small>
                  </span>
                  {loot?.opened
                    ? '✓'
                    : loot
                      ? t('rpg.chestOpen')
                      : t('rpg.chestLocked')}
                </button>
              )
            })}
          </div>
        </>
      )}
      {feedback && !externalFeedback && (
        <div
          key={feedback.nonce}
          className="pixel-feedback"
          role="status"
          style={{ left: feedback.x, top: feedback.y }}
        >
          {feedback.text}
        </div>
      )}
      {pending.length > 0 && (
        <div className="loot-notice" role="status">
          {t('rpg.lootNotice')}
        </div>
      )}
      {(!compact || growthTab !== 'avatar') && !showConstellation && (
        <GamificationShowcase
          data={data}
          setData={setData}
          showWeeklyRaid={showWeeklyRaid}
          showWalkthroughTour={showWalkthroughTour}
          view={
            compact ? (growthTab === 'skills' ? 'skills' : 'rewards') : 'all'
          }
        />
      )}
      {!compact && <MomentumFeatures data={data} setData={setData} />}
      {lootModal && (
        <Modal
          title={t('rpg.lootModalTitle', { count: lootModal })}
          onClose={() => setLootModal(null)}
        >
          <div className="loot-reveal">
            <Sprite name="chest" label={t('rpg.treasureAria')} size={128} />
            {data.rpg.loot.find((l) => l.milestone === lootModal)?.opened ? (
              <>
                <h3>{t('rpg.treasuresUnlocked')}</h3>
                <p>
                  {lootModal === 7 ? t('rpg.treasures7') : t('rpg.treasures30')}
                </p>
                <button
                  className="primary"
                  onClick={() => {
                    setLootModal(null)
                    setShowInventory(true)
                  }}
                >
                  {t('rpg.equipInventory')}
                </button>
              </>
            ) : (
              <>
                <p>{t('rpg.chestYours')}</p>
                <button
                  className="primary"
                  onClick={() => setData((d) => openLoot(d, lootModal))}
                >
                  {t('rpg.openChest')}
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
      {showInventory && (
        <Modal
          title={t('rpg.inventoryTitle')}
          onClose={() => setShowInventory(false)}
        >
          <div className="inventory-section"><h3>Camera battle loot</h3>{data.rpg.cameraLoot?.length ? <ul>{[...data.rpg.cameraLoot].reverse().slice(0, 20).map(item => <li key={item.id}>✦ {item.item} · {item.hits} movement cycles · {new Date(item.at).toLocaleDateString()}</li>)}</ul> : <p className="muted">Defeat a boss in the seated camera arcade to earn a training collectible.</p>}</div>
          <div className="inventory-section">
            <h3>{t('rpg.worldPalette')}</h3>
            <div className="equipment-grid">
              {(['bloom', 'forest', 'amber'] as const).map((p) => (
                <button
                  key={p}
                  disabled={p !== 'bloom' && !owned[p]}
                  aria-pressed={data.rpg.palette === p}
                  className={`palette-option palette-${p}`}
                  onClick={() =>
                    setData((d) => ({ ...d, rpg: { ...d.rpg, palette: p } }))
                  }
                >
                  <span />
                  {paletteNames[p]}
                  {p !== 'bloom' && !owned[p] && (
                    <small>
                      {t('rpg.chest', { count: p === 'forest' ? 7 : 30 })}
                    </small>
                  )}
                </button>
              ))}
            </div>
            <h3>{t('rpg.travelCompanion')}</h3>
            <div className="equipment-grid">
              {(['none', 'fox', 'spirit'] as const).map((p) => (
                <button
                  key={p}
                  disabled={
                    p === 'fox'
                      ? !owned.forest
                      : p === 'spirit'
                        ? !owned.amber
                        : false
                  }
                  aria-pressed={data.rpg.companion === p}
                  onClick={() =>
                    setData((d) => ({ ...d, rpg: { ...d.rpg, companion: p } }))
                  }
                >
                  {p === 'none' ? (
                    <Shield size={32} />
                  ) : (
                    <Sprite name={p} label={companionNames[p]} size={48} />
                  )}
                  <span>{companionNames[p]}</span>
                </button>
              ))}
            </div>
            <h3>{t('rpg.victorySound')}</h3>
            <button
              className="sound-toggle"
              disabled={!owned.amber}
              aria-pressed={data.rpg.sound && audioReady}
              onClick={changeSound}
            >
              {data.rpg.sound && audioReady ? (
                <Volume2 size={17} />
              ) : (
                <VolumeX size={17} />
              )}{' '}
              {owned.amber
                ? data.rpg.sound && audioReady
                  ? t('rpg.soundOn')
                  : t('rpg.soundEnable')
                : t('rpg.soundLocked')}
            </button>
            <p className="muted">{t('rpg.soundNote')}</p>
            {soundError && <p role="alert">{soundError}</p>}
          </div>
        </Modal>
      )}
      {showRules && (
        <Modal title={t('rpg.rulesTitle')} onClose={() => setShowRules(false)}>
          <div className="rpg-rules">
            <h3>{t('rpg.rulesGrowTitle')}</h3>
            <p>{t('rpg.rulesGrow')}</p>
            <h3>{t('rpg.rulesComboTitle')}</h3>
            <p>{t('rpg.rulesCombo')}</p>
            <h3>{t('rpg.rulesBossTitle')}</h3>
            <p>{t('rpg.rulesBoss')}</p>
            <h3>{t('rpg.rulesUnlocksTitle')}</h3>
            <p>{t('rpg.rulesUnlocks')}</p>
            <h3>{t('rpg.rulesHonestTitle')}</h3>
            <p>{t('rpg.rulesHonest')}</p>
          </div>
        </Modal>
      )}
    </section>
  )
}
function HeartGlyph() {
  return <span aria-hidden="true">♥</span>
}
