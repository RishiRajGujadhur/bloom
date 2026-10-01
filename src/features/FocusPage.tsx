import { useLeaveGuard } from '../utils/useLeaveGuard'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { idleGranted, idleSupported, requestIdle, useAway, useKeepAwake } from '../platform/presence'
import { writeStore } from '../components/studio/Studio'
import { Play, Square, Check, Timer } from 'lucide-react'
import { toggleTodo } from './productivity'
import type { AppData } from '../model'
import { FocusCompanion } from './collectibles/Collectibles'
import {
  completeFocusQuest,
  failFocusQuest,
  focusQuestState,
  startFocusQuest,
} from '../rpg/engine'
import { readStore } from '../components/studio/Studio'
import { FocusQuick, SCENE_KEY, focusOn } from './quick/FocusQuick'
import { GrowScene, scenes, type SceneId } from './quick/GrowScene'
import { FocusDiorama } from './showcase/FocusDiorama'
import { usePageActions } from '../components/ui/PageMenu'
import '../styles/presence.css'

export function PixelPlant({ stage = 2 }: { stage?: number }) {
  return (
    <svg
      className="pixel-plant"
      viewBox="0 0 32 32"
      role="img"
      aria-label={
        stage === 0 ? 'Seed' : stage === 1 ? 'Seedling' : 'Grown tree'
      }
      shapeRendering="crispEdges"
    >
      <path fill="#9d775b" d="M5 26h22v3H5z" />
      <path fill="#b8946e" d="M8 25h16v2H8z" />
      {stage === 0 ? (
        <path fill="#72543e" d="M14 22h4v4h-4z" />
      ) : (
        <>
          <path fill="#87664b" d="M14 13h4v13h-4z" />
          <path
            fill="#548c67"
            d={
              stage === 1
                ? 'M6 16h8v6H9v-3H6zM18 12h9v6h-9z'
                : 'M8 5h16v4h4v12H4V9h4z'
            }
          />
          <path
            fill="#85b882"
            d={
              stage === 1
                ? 'M7 16h7v3H7zM18 12h6v3h-6z'
                : 'M9 5h14v4H9zM5 10h9v5H5zM17 9h7v5h-7z'
            }
          />
          {stage > 2 && <path fill="#e7ba6e" d="M8 15h3v3H8zM21 12h3v3h-3z" />}
        </>
      )}
    </svg>
  )
}
export function useFocusLifecycle(
  data: AppData,
  setData: Dispatch<SetStateAction<AppData>>,
) {
  const quest = data.rpg.focusQuest
  useEffect(() => {
    if (!quest.startedAt || quest.completedAt || quest.failedAt) return
    const tick = () => {
      if (Date.now() - quest.startedAt! >= quest.durationMinutes * 60000)
        setData((current) => completeFocusQuest(current))
    }
    const visibility = () => {
      if (document.visibilityState === 'hidden' && quest.strict)
        setData((current) => {
          const completed = completeFocusQuest(current)
          return completed === current ? failFocusQuest(current) : completed
        })
      else tick()
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [
    quest.startedAt,
    quest.completedAt,
    quest.failedAt,
    quest.strict,
    quest.durationMinutes,
    setData,
  ])
}
export function FocusPage({
  data,
  setData,
  showCollectibles = false,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  showCollectibles?: boolean
}) {
  const [now, setNow] = useState(Date.now)
  const [confirmStop, setConfirmStop] = useState(false)
  const [scene, setScene] = useState<SceneId | 'pixel'>(() => {
    const saved = readStore<string>(SCENE_KEY, 'tree')
    return saved === 'pixel' || scenes.some((x) => x.id === saved) ? (saved as SceneId | 'pixel') : 'tree'
  })
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const quest = data.rpg.focusQuest
  // Step away from the computer and the session pauses; come back and it resumes (Idle Detection).
  const [awayOn, setAwayOn] = useState(() => readStore<boolean>('bloom-focus-away', true))
  const [osIdle, setOsIdle] = useState(idleGranted)
  const running = focusQuestState(data.rpg, now) === 'active'
  const away = useAway(running && awayOn, 60_000)
  const awayStart = useRef<number | null>(null)
  const [awayNote, setAwayNote] = useState('')
  useKeepAwake(running)
  useLeaveGuard(running)
  useEffect(() => {
    if (!running) { awayStart.current = null; return }
    if (away.away) { awayStart.current ??= away.since ?? Date.now(); return }
    if (awayStart.current == null) return
    const ms = Date.now() - awayStart.current
    awayStart.current = null
    if (ms < 20_000) return
    setData((c) => ({ ...c, rpg: { ...c.rpg, focusQuest: { ...c.rpg.focusQuest, startedAt: (c.rpg.focusQuest.startedAt ?? Date.now()) + ms } } }))
    setAwayNote(`Paused for ${Math.max(1, Math.round(ms / 60000))} min while you were away — picking up where you left off.`)
  }, [away.away, away.since, running, setData])
  // While away, the clock stands still.
  const clock = away.away && awayStart.current ? awayStart.current : now
  const active = focusQuestState(data.rpg, clock) === 'active'
  const total = quest.durationMinutes * 60000
  const left = active ? Math.max(0, total - (clock - quest.startedAt!)) : total
  const progress = active
    ? Math.min(1, (clock - quest.startedAt!) / total)
    : quest.completedAt
      ? 1
      : 0
  const history = data.rpg.focusHistory
  const update = (patch: Partial<typeof quest>) =>
    setData((current) => ({
      ...current,
      rpg: {
        ...current.rpg,
        focusQuest: { ...current.rpg.focusQuest, ...patch, startedAt: null, completedAt: null, failedAt: null },
      },
    }))
  const since = new Date().setHours(0, 0, 0, 0)
  // Tab title: live countdown while focusing, today's count otherwise.
  const todayDone = history.filter((h) => h.completedAt >= since).length
  const titleText = active ? `⏱ ${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')} · Focus` : todayDone ? `🍅 ${todayDone} today · Focus` : ''
  useEffect(() => {
    if (!titleText) return
    const before = document.title
    document.title = titleText
    return () => {
      document.title = before
    }
  }, [titleText])
  usePageActions(
    active
      ? []
      : [
          { id: 'focus-25', label: 'Set 25 minutes', icon: '🍅', run: () => update({ durationMinutes: 25 }) },
          { id: 'focus-50', label: 'Set 50 minutes', icon: '🔥', run: () => update({ durationMinutes: 50 }) },
          { id: 'focus-strict', label: quest.strict ? 'Turn strict mode off' : 'Turn strict mode on', icon: '🔒', run: () => update({ strict: !quest.strict }) },
          { id: 'focus-window', label: 'Open Focus in a small window', icon: '🪟', run: () => void window.open('#focus', 'bloom-focus', 'width=440,height=760') },
        ],
  )
  // Space starts a session when none is running (it never stops one, to avoid accidents).
  const activeRef = useRef(active)
  activeRef.current = active
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || activeRef.current || (e.target as HTMLElement | null)?.closest?.('input, textarea, button, select, [contenteditable="true"]')) return
      e.preventDefault()
      setNow(Date.now())
      setData((current) => startFocusQuest(current, current.rpg.focusQuest.soundscape))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setData])
  const doneToday = history.filter((h) => h.completedAt >= since).length
  const [dailyGoal, setDailyGoalState] = useState(() => readStore<number>('bloom-focus-daily-goal', 4))
  const setDailyGoal = (n: number) => {
    setDailyGoalState(n)
    writeStore('bloom-focus-daily-goal', n)
  }
  // Distraction log: jot it down mid-session instead of acting on it.
  const [distractions, setDistractionsState] = useState(() => readStore<{ at: number; text: string }[]>('bloom-focus-distractions', []))
  const setDistractions = (f: (l: { at: number; text: string }[]) => { at: number; text: string }[]) =>
    setDistractionsState((l) => {
      const n = f(l)
      writeStore('bloom-focus-distractions', n)
      return n
    })
  const [distraction, setDistraction] = useState('')
  return (
    <div id="focus-page" className="focus-layout grid grid-cols-1 gap-5 xl:grid-cols-2">
      {/* Timer and set-up side by side, diorama and garden below: no empty gaps. */}
      {!active && (
        <div style={{ order: 2 }}>
          <FocusQuick data={data} scene={scene} setScene={setScene} onPlan={update} />
        </div>
      )}
      {!active && (
        <div style={{ order: 3 }}>
          <FocusDiorama data={data} />
        </div>
      )}
      <section style={{ order: 1 }} className="card focus-room rounded-ui-lg border border-ui-border bg-surface p-5 sm:p-6">
        {focusOn('growScenes') && scene !== 'pixel' ? (
          <GrowScene scene={scene} progress={progress} extra={focusOn('sceneScale') ? doneToday : 0} />
        ) : showCollectibles ? (
          <FocusCompanion active={active} fallback={<PixelPlant stage={progress >= 1 ? 3 : progress > 0.3 ? 1 : 0} />} />
        ) : (
          <PixelPlant stage={progress >= 1 ? 3 : progress > 0.3 ? 1 : 0} />
        )}
        <h2>
          {active
            ? 'One thing at a time.'
            : quest.completedAt
              ? 'A little more grown.'
              : 'Plant some focus.'}
        </h2>
        <div
          className="focus-countdown"
          role="timer"
          aria-label="Time remaining"
        >
          {String(Math.floor(left / 60000)).padStart(2, '0')}:
          {String(Math.floor(left / 1000) % 60).padStart(2, '0')}
        </div>
        {active && <p className="focus-ends">Finishes at {new Date(Date.now() + left).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>}
        <p className="focus-goal">
          {doneToday}/{dailyGoal} sessions today{doneToday >= dailyGoal ? ' 🎉' : ''} · {history.filter((h) => Date.now() - h.completedAt < 7 * 864e5).reduce((a, h) => a + h.minutes, 0)} min this week
          {(() => {
            const byDay = history
              .filter((h) => Date.now() - h.completedAt < 7 * 864e5)
              .reduce<Record<string, number>>((a, h) => {
                const k = new Date(h.completedAt).toLocaleDateString([], { weekday: 'short' })
                return { ...a, [k]: (a[k] ?? 0) + h.minutes }
              }, {})
            const best = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
            return best && Object.keys(byDay).length > 1 ? ` (best: ${best[0]}, ${best[1]} min)` : ''
          })()} ·{' '}
          <label>
            goal{' '}
            <select aria-label="Daily focus goal" value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </p>
        {active && (
          <form
            className="focus-distract"
            onSubmit={(e) => {
              e.preventDefault()
              const v = distraction.trim()
              if (!v) return
              setDistractions((list) => [{ at: Date.now(), text: v }, ...list].slice(0, 200))
              setDistraction('')
            }}
          >
            <input aria-label="Note a distraction" placeholder="Distracted? Park it here and carry on…" value={distraction} maxLength={120} onChange={(e) => setDistraction(e.target.value)} />
          </form>
        )}
        {!active && quest.completedAt && history.length > 0 && Date.now() - history[history.length - 1].completedAt < 30 * 60000 && (
          <textarea
            className="focus-note"
            rows={2}
            maxLength={300}
            placeholder="What did you get done? (optional note on this session)"
            aria-label="Session note"
            defaultValue={history[history.length - 1].note ?? ''}
            onBlur={(e) => {
              const note = e.currentTarget.value.trim()
              setData((c) => {
                const list = [...(c.rpg.focusHistory ?? [])]
                if (!list.length) return c
                list[list.length - 1] = { ...list[list.length - 1], note: note || undefined }
                return { ...c, rpg: { ...c.rpg, focusHistory: list } }
              })
            }}
          />
        )}
        {!active && distractions.some((d) => d.at >= since) && (
          <details className="focus-distract-log">
            <summary>{distractions.filter((d) => d.at >= since).length} distractions parked today</summary>
            <ul>
              {distractions
                .filter((d) => d.at >= since)
                .map((d) => (
                  <li key={d.at}>
                    <small>{new Date(d.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small> {d.text}
                  </li>
                ))}
            </ul>
          </details>
        )}
        {!active && (
          <div className="focus-setup">
            <div className="segmented" aria-label="Session length">
              {[5, 15, 25, 50].map((minutes) => (
                <button
                  key={minutes}
                  aria-pressed={quest.durationMinutes === minutes}
                  onClick={() => update({ durationMinutes: minutes })}
                >
                  {minutes} min
                </button>
              ))}
            </div>
            <select
              aria-label="Focus task"
              value={quest.taskId ?? ''}
              onChange={(event) =>
                update({ taskId: event.target.value || null })
              }
            >
              <option value="">Open focus</option>
              {data.todos
                .filter((task) => !task.done)
                .map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
            </select>
            <label className="strict-option">
              <input type="checkbox" checked={awayOn} onChange={(e) => { setAwayOn(e.target.checked); writeStore('bloom-focus-away', e.target.checked) }} />{' '}
              Pause when I step away{' '}
              <small>
                {osIdle ? 'Uses your computer’s idle and screen-lock state.' : 'Watches this page for activity.'}{' '}
                {idleSupported() && !osIdle && <button type="button" className="focus-idle-btn" onClick={() => void requestIdle().then(setOsIdle)}>Use system idle detection</button>}
              </small>
            </label>
            <label className="strict-option">
              <input
                type="checkbox"
                checked={quest.strict}
                onChange={(event) => update({ strict: event.target.checked })}
              />{' '}
              Strict mode{' '}
              <small>Leaving this browser tab ends the session.</small>
            </label>
          </div>
        )}
        {active ? (
          <>
            <progress
              max={total}
              value={total - left}
              aria-label="Focus progress"
            />
            {away.away && <p className="focus-away" role="status">👣 Away{away.locked ? ' (screen locked)' : ''} — timer paused</p>}
            {!away.away && awayNote && <p className="focus-away back" role="status">{awayNote}</p>}
            <p>
              {data.todos.find((task) => task.id === quest.taskId)?.title ??
                'Keep your attention here.'}
            </p>
            {confirmStop ? (
              <div className="feature-actions">
                <button
                  className="quiet-button"
                  onClick={() => setConfirmStop(false)}
                >
                  Keep focusing
                </button>
                <button
                  className="quiet-button"
                  onClick={() => {
                    setData((current) => failFocusQuest(current))
                    setConfirmStop(false)
                  }}
                >
                  End session
                </button>
              </div>
            ) : (
              <button
                className="quiet-button"
                onClick={() => setConfirmStop(true)}
              >
                <Square size={16} /> Stop
              </button>
            )}
          </>
        ) : (
          <button
            className="primary"
            onClick={() => {
              setNow(Date.now())
              setData((current) =>
                startFocusQuest(current, current.rpg.focusQuest.soundscape),
              )
            }}
          >
            <Play size={17} /> Start focus
          </button>
        )}
        {!active &&
          quest.completedAt &&
          data.todos.some((task) => task.id === quest.taskId && !task.done) && (
            <button
              className="quiet-button"
              onClick={() =>
                setData((current) =>
                  toggleTodo(current, current.rpg.focusQuest.taskId!),
                )
              }
            >
              <Check size={16} /> Mark task complete
            </button>
          )}
        <p className="focus-result" role="status">
          {!active && quest.completedAt
            ? `Tree planted · +${quest.durationMinutes + (data.rpg.skills.meditation?.state === 'unlocked' ? 5 : 0)} XP · +5 gold`
            : !active && quest.failedAt
              ? 'No tree this time. Start fresh when you’re ready.'
              : ''}
        </p>
      </section>
      <section style={{ order: 4 }} className="card focus-garden rounded-ui-lg border border-ui-border bg-surface p-5 sm:p-6">
        <div className="section-title">
          <Timer size={20} />
          <h2>Your garden</h2>
        </div>
        <div className="garden-stats">
          <strong>
            {history.length}
            <small>trees grown</small>
          </strong>
          <strong>
            {history.reduce((sum, session) => sum + session.minutes, 0)}
            <small>focused minutes</small>
          </strong>
        </div>
        <div className="garden-plots">
          {history.slice(-12).map((session) => (
            <div
              key={session.id}
              title={`${session.taskTitle} · ${session.minutes} min`}
            >
              <PixelPlant stage={3} />
            </div>
          ))}
          {!history.length && <PixelPlant stage={0} />}
        </div>
        <details>
          <summary>Session history</summary>
          <ul className="session-history">
            {[...history]
              .reverse()
              .slice(0, 20)
              .map((session) => (
                <li key={session.id}>
                  <Check size={14} />
                  <span>
                    {session.taskTitle}
                    <small>
                      {new Date(session.completedAt).toLocaleDateString()} ·{' '}
                      {session.minutes} min
                    </small>
                  </span>
                </li>
              ))}
            {!history.length && (
              <li>Complete a session to grow your first tree.</li>
            )}
          </ul>
        </details>
      </section>
    </div>
  )
}
