import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { Leaf, MessageCircle, Send, Sparkles } from 'lucide-react'
import type { AppData } from '../model'
import type { NavKey } from '../components/layout/Sidebar'
import { Modal } from '../components/Modal'
import { Sprite } from '../rpg/Sprite'
import type { LocalCompanion } from './localAI'
import {
  applyProposal,
  proposePlan,
  proposalIsCurrent,
  understandRequest,
  weeklyMemory,
  type Intent,
  type Proposal,
} from './planner'
import { BloomFace, type BloomFaceHandle } from '../components/ui/BloomFace'
import { BloomGuide } from './BloomGuide'
import './companion.css'

type Props = {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  navigate: (page: NavKey) => void
  blocked: boolean
}
type Turn = { role: 'user' | 'assistant'; content: string }

export function BloomStory({
  data,
  onTalk,
  onReflect,
}: {
  data: AppData
  onTalk: () => void
  onReflect: () => void
}) {
  const memory = weeklyMemory(data)
  return (
    <section className="bloom-story" aria-label="Your Bloom story">
      <div className="bloom-story-art" aria-hidden="true">
        <Leaf size={42} />
        <span>GROW AT YOUR PACE</span>
      </div>
      <div>
        <span className="bloom-kicker">A LITTLE MORE CONNECTED</span>
        <h2>What shall we make room for?</h2>
        <p>
          Bring your tasks, your energy, and a little kindness. We’ll find a
          small next step together.
        </p>
        <button className="feature-primary" onClick={onTalk}>
          <MessageCircle size={16} /> Plan with Bloom
        </button>
      </div>
      <div className="bloom-memory">
        <span className="bloom-kicker">YOUR WEEK, REMEMBERED</span>
        <h3>Small steps leave a trace.</h3>
        <p>{memory.text}</p>
        <button className="feature-secondary" onClick={onReflect}>
          Continue your story <span aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  )
}

export function BloomCompanion({
  data,
  setData,
  navigate,
  blocked,
  open,
  onOpen,
  onClose,
  page = 'overview',
  names = (p: string) => p,
  enabled = () => true,
  extra = [],
  initialMode = 'guide',
}: Props & {
  open: boolean
  onOpen: () => void
  onClose: () => void
  page?: string
  names?: (p: string) => string
  enabled?: (p: string) => boolean
  extra?: { id: string; label: string; icon?: string; run: () => void }[]
  initialMode?: 'guide' | 'plan'
}) {
  const [mode, setMode] = useState<'guide' | 'plan'>(initialMode)
  const [text, setText] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [intent, setIntent] = useState<Intent['intent']>('chat')
  const [minutes, setMinutes] = useState(40)
  const [energy, setEnergy] = useState<Intent['energy']>('medium')
  const [status, setStatus] = useState<'off' | 'loading' | 'ready'>('off')
  const [progress, setProgress] = useState(0)
  const [loadingStage, setLoadingStage] = useState('')
  const [generatedTokens, setGeneratedTokens] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [applied, setApplied] = useState(false)
  const ai = useRef<LocalCompanion | null>(null)
  const revision = useRef(0)
  const pending = useRef(false)
  const feed = useRef<HTMLDivElement>(null)
  const launchFace = useRef<BloomFaceHandle>(null)
  useEffect(
    () => () => {
      revision.current++
      ai.current?.dispose()
    },
    [],
  )
  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight })
  }, [turns, busy, open])

  const stop = () => {
    revision.current++
    ai.current?.dispose()
    ai.current = null
    pending.current = false
    setBusy(false)
    setStatus('off')
  }
  const enable = async () => {
    stop()
    const current = revision.current
    setStatus('loading')
    setProgress(0)
    setLoadingStage('')
    setNotice('')
    try {
      const { LocalCompanion } = await import('./localAI')
      if (current !== revision.current) return
      const runtime = new LocalCompanion()
      ai.current = runtime
      await runtime.load((value, stage) => {
        if (current === revision.current) {
          setProgress(value)
          setLoadingStage(stage ?? '')
        }
      })
      if (current === revision.current) setStatus('ready')
    } catch (error) {
      if (current !== revision.current) return
      console.warn('Bloom local AI setup failed:', error)
      stop()
      setNotice(
        error instanceof Error && /GPU|shader-f16/i.test(error.message)
          ? 'Local AI could not start: this browser has no compatible GPU available. Try a browser with WebGPU and hardware acceleration enabled, or use the lightweight planner.'
          : 'Local AI could not start on this device or connection. You can retry, or keep using the lightweight planner.',
      )
    }
  }
  const build = (request: Intent) => {
    setProposal(proposePlan(data, request))
    setMinutes(request.minutes)
    setEnergy(request.energy)
    setApplied(false)
    setIntent('plan')
  }
  const ask = async (input: string) => {
    if (!input.trim() || pending.current) return
    pending.current = true
    setBusy(true)
    setGeneratedTokens(0)
    setText('')
    setNotice('')
    setProposal(null)
    const current = revision.current
    let request = understandRequest(input)
    setTurns(
      (previous) =>
        [...previous, { role: 'user', content: input }].slice(-20) as Turn[],
    )
    if (status === 'ready' && ai.current) {
      try {
        request = await ai.current.interpret(
          input,
          JSON.stringify({
            openTasks: data.todos.filter((task) => !task.done).length,
            weeklyActivity: weeklyMemory(data).text,
          }),
          turns,
          (tokens) => {
            if (current === revision.current) setGeneratedTokens(tokens)
          },
        )
      } catch (error) {
        if (current !== revision.current) return
        console.warn('Bloom local AI response failed:', error)
        ai.current?.dispose()
        ai.current = null
        setStatus('off')
        setNotice(
          'Local AI could not finish this response. Bloom used the lightweight planner instead.',
        )
      }
    }
    if (current !== revision.current) return
    setIntent(request.intent)
    if (request.intent === 'plan') build(request)
    const content =
      request.message ||
      (request.intent === 'plan'
        ? request.energy === 'low'
          ? 'Let’s leave some breathing room. Here is a gentler starting point.'
          : 'Let’s choose a few things that fit the time you have.'
        : request.intent === 'progress'
          ? weeklyMemory(data).text
          : request.intent === 'reflect'
            ? 'What made today a little easier, and what would you like to carry into tomorrow?'
            : 'I can help you plan a short session, reflect, or look back at your week. Try “I have 40 minutes and I’m tired.” Enable local AI for more flexible conversation.')
    setTurns(
      (previous) =>
        [...previous, { role: 'assistant', content }].slice(-20) as Turn[],
    )
    pending.current = false
    setBusy(false)
  }
  const stale = proposal && !proposalIsCurrent(data, proposal)
  const visit = (page: NavKey) => {
    onClose()
    navigate(page)
  }
  return (
    <>
      <button
        className="bloom-companion-launch has-face"
        onClick={onOpen}
        onPointerEnter={() => launchFace.current?.react('excited')}
        aria-label="Talk to Bloom"
        data-hint="Ask Bloom anything about this page"
      >
        <BloomFace ref={launchFace} size={34} label="" />
        <span>Talk to Bloom</span>
      </button>
      {open && (
        <Modal title="A little space with Bloom" onClose={onClose}>
          <div className="segmented companion-mode" role="tablist" aria-label="Bloom mode">
            <button role="tab" aria-selected={mode === 'guide'} aria-pressed={mode === 'guide'} className={mode === 'guide' ? 'active' : ''} onClick={() => setMode('guide')}>
              Guide me
            </button>
            <button role="tab" aria-selected={mode === 'plan'} aria-pressed={mode === 'plan'} className={mode === 'plan' ? 'active' : ''} onClick={() => setMode('plan')}>
              Plan with Bloom
            </button>
          </div>
          {mode === 'guide' ? (
            <BloomGuide
              key={page}
              page={page}
              names={names}
              enabled={enabled}
              extra={extra}
              navigate={(p) => {
                navigate(p as never)
                onClose()
              }}
              onPlan={() => setMode('plan')}
            />
          ) : (
          <div className="bloom-companion">
            <div className="companion-identity">
              {data.rpg.companion !== 'none' ? (
                <Sprite
                  name={data.rpg.companion}
                  label="Your Bloom companion"
                  size={48}
                />
              ) : (
                <span className="companion-leaf">
                  <Leaf size={27} />
                </span>
              )}
              <div>
                <strong>Bloom is here.</strong>
                <p>
                  {status === 'ready'
                    ? 'Local AI · running on this device'
                    : 'Lightweight planner · no model needed'}
                </p>
              </div>
            </div>
            <details className="companion-ai-options">
              <summary>
                <Sparkles size={14} />{' '}
                {status === 'ready'
                  ? 'Local AI settings'
                  : 'Try private, local AI'}
              </summary>
              <p>
                Optional Qwen 0.5B model via WebLLM. The first use downloads
                several hundred MB from Hugging Face and the WebLLM model host.
                Requires a compatible WebGPU device and available memory.
                Messages stay on this device; this chat is kept only until
                refresh.
              </p>
              <p>
                Bloom shares this conversation and activity totals with the
                local model. Journal text is not included. Small models can
                misunderstand requests; review the plan below.
              </p>
              {status === 'off' ? (
                <button className="feature-secondary" onClick={enable}>
                  Download & enable local AI
                </button>
              ) : (
                <button className="feature-secondary" onClick={stop}>
                  {status === 'loading'
                    ? 'Cancel download'
                    : 'Turn off & free memory'}
                </button>
              )}
            </details>
            {status === 'loading' && (
              <div role="status">
                <p>
                  {loadingStage ||
                    `Preparing local AI… ${Math.round(progress * 100)}%`}
                </p>
                <progress
                  value={progress}
                  max={1}
                  aria-label="Local AI loading"
                />
              </div>
            )}
            <div
              className="companion-feed"
              ref={feed}
              role="log"
              aria-label="Conversation with Bloom"
              aria-live="polite"
            >
              {!turns.length && (
                <p className="companion-welcome">
                  Welcome back. We can start with whatever feels manageable
                  today.
                </p>
              )}
              {turns.map((turn, index) => (
                <div key={index} className={`companion-message ${turn.role}`}>
                  <small>{turn.role === 'user' ? 'You' : 'Bloom'}</small>
                  <p>{turn.content}</p>
                </div>
              ))}
              {busy && (
                <p role="status">
                  {generatedTokens > 0
                    ? 'Bloom is writing…'
                    : 'Bloom is thinking… The first response can take a little longer.'}
                </p>
              )}
            </div>
            <div className="companion-prompts">
              {[
                'I have 40 minutes',
                'I’m tired today',
                'Look back at my week',
              ].map((prompt) => (
                <button
                  key={prompt}
                  disabled={busy}
                  onClick={() => void ask(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              className="companion-composer"
              onSubmit={(event) => {
                event.preventDefault()
                void ask(text)
              }}
            >
              <label className="sr-only" htmlFor="bloom-message">
                Message Bloom
              </label>
              <input
                id="bloom-message"
                placeholder="What would help today?"
                maxLength={1000}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
              <button
                className="feature-primary"
                disabled={busy || !text.trim()}
                aria-label="Send to Bloom"
              >
                <Send size={17} />
              </button>
              {busy && (
                <button
                  type="button"
                  className="feature-secondary"
                  onClick={stop}
                >
                  Stop
                </button>
              )}
            </form>
            {notice && (
              <p role="status" className="companion-notice">
                {notice}
              </p>
            )}
            {proposal && (
              <section
                className="companion-plan"
                aria-label="Suggested session"
              >
                <span className="bloom-kicker">A LITTLE ROOM TO BREATHE</span>
                <h3>Your next small steps</h3>
                <div className="companion-plan-controls">
                  <label>
                    Time available
                    <select
                      value={minutes}
                      onChange={(event) =>
                        build({
                          intent: 'plan',
                          message: '',
                          energy,
                          minutes: Number(event.target.value),
                        })
                      }
                    >
                      {[...new Set([15, 25, 40, 60, 90, minutes])]
                        .sort((a, b) => a - b)
                        .map((value) => (
                          <option key={value} value={value}>
                            {value} minutes
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Energy
                    <select
                      value={energy}
                      onChange={(event) =>
                        build({
                          intent: 'plan',
                          message: '',
                          minutes,
                          energy: event.target.value as Intent['energy'],
                        })
                      }
                    >
                      <option value="low">Low · keep it gentle</option>
                      <option value="medium">Some room to focus</option>
                      <option value="high">Feeling energized</option>
                    </select>
                  </label>
                </div>
                {proposal.tasks.length ? (
                  <ol>
                    {proposal.tasks.map((task) => (
                      <li key={task.id}>
                        <span>{task.title}</span>
                        <strong>{task.minutes} min</strong>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>
                    No available tasks fit this session. Try more time, adjust
                    energy, or add a small task in To-dos.
                  </p>
                )}
                {proposal.pause > 0 && (
                  <p className="companion-pause">
                    ◌ Leave {proposal.pause} minutes for a quiet reset.
                  </p>
                )}
                <p className="companion-plan-note">
                  Uses task estimates and skips blocked, deferred, and already
                  scheduled tasks. Adds daily intentions; task deadlines and
                  calendar bookings stay as they are. The reset is a suggestion.
                </p>
                {stale && (
                  <p role="status">
                    Your tasks or the day changed. Refresh this plan before
                    applying it.
                  </p>
                )}
                <div className="companion-plan-actions">
                  <button
                    className="feature-primary"
                    disabled={
                      blocked || applied || !!stale || !proposal.tasks.length
                    }
                    onClick={() => {
                      setData((current) => applyProposal(current, proposal))
                      setApplied(true)
                    }}
                  >
                    {applied
                      ? 'Added to today’s intentions'
                      : 'Add to today’s intentions'}
                  </button>
                  <button
                    className="feature-secondary"
                    onClick={() =>
                      build({
                        intent: 'plan',
                        message: '',
                        minutes: stale ? minutes : Math.max(15, minutes - 15),
                        energy: stale ? energy : 'low',
                      })
                    }
                  >
                    {stale ? 'Refresh plan' : 'Make it easier'}
                  </button>
                </div>
                <button
                  className="text-button"
                  onClick={() =>
                    visit(proposal.tasks.length ? 'planning' : 'todos')
                  }
                >
                  {proposal.tasks.length
                    ? 'Open daily intentions'
                    : 'Open To-dos'}{' '}
                  →
                </button>
                {blocked && (
                  <p role="status">
                    Resolve the data recovery alert before applying a plan.
                  </p>
                )}
              </section>
            )}
            {intent === 'reflect' && (
              <button
                className="feature-primary"
                onClick={() => visit('journal')}
              >
                Open your journal
              </button>
            )}
            {intent === 'progress' && (
              <div className="companion-plan">
                <h3>Your recorded week</h3>
                <p>{weeklyMemory(data).text}</p>
                <button
                  className="feature-secondary"
                  onClick={() => visit('growth')}
                >
                  Explore your growth
                </button>
              </div>
            )}
          </div>
          )}
        </Modal>
      )}
    </>
  )
}
