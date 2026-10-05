import { prefersReducedMotion } from '../utils/motion'
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
import gsap from 'gsap'
import { CalendarClock, Compass, PanelRightClose, PanelRightOpen, X } from 'lucide-react'
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
import { ChoiceSlider } from './ChoiceSlider'
import { readDraft, writeSession, readConversation, exportConversation } from './chatSession'
import './companion.css'
import { useChatAppearance } from './chatAppearance'

type Props = {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  navigate: (page: NavKey) => void
  blocked: boolean
}
type Turn = { role: 'user' | 'assistant'; content: string }

const WIDTH_KEY = 'bloom-companion-width'
/** Sets (and remembers) the Bloom panel width; null goes back to the default. */
function setPanelWidth(px: number | null) {
  const root = document.documentElement
  if (px === null) {
    root.style.removeProperty('--bc-width')
    try {
      localStorage.removeItem(WIDTH_KEY)
    } catch {
      /* optional */
    }
    return
  }
  const w = Math.round(Math.min(Math.max(px, 300), Math.min(760, window.innerWidth * 0.7)))
  root.style.setProperty('--bc-width', `${w}px`)
  try {
    localStorage.setItem(WIDTH_KEY, String(w))
  } catch {
    /* this visit only */
  }
}
try {
  const saved = Number(localStorage.getItem(WIDTH_KEY))
  if (Number.isFinite(saved) && saved >= 300) setPanelWidth(saved)
} catch {
  /* default width */
}

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
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  const [mode, setMode] = useState<'guide' | 'plan'>(initialMode)
  const { avatar, followTheme } = useChatAppearance()
  const [docked, setDockedState] = useState(() => {
    try {
      return localStorage.getItem('bloom-guide-docked') !== '0'
    } catch {
      return false
    }
  })
  const setDocked = (d: boolean) => {
    setDockedState(d)
    try {
      localStorage.setItem('bloom-guide-docked', d ? '1' : '0')
    } catch {
      /* optional */
    }
  }
  useEffect(() => {
    if (!open) return
    const media = window.matchMedia('(max-width: 600px)')
    const previous = document.body.style.overflow
    const sync = () => { document.body.style.overflow = media.matches ? 'hidden' : previous }
    sync()
    media.addEventListener('change', sync)
    return () => { document.body.style.overflow = previous; media.removeEventListener('change', sync) }
  }, [open])
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = panel.current
    if (!open || !el) return
    const viewport = window.visualViewport
    const sync = () => el.style.setProperty('--bc-viewport-height', `${viewport?.height ?? window.innerHeight}px`)
    sync()
    viewport?.addEventListener('resize', sync)
    window.addEventListener('resize', sync)
    return () => { viewport?.removeEventListener('resize', sync); window.removeEventListener('resize', sync); el.style.removeProperty('--bc-viewport-height') }
  }, [open])
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLButtonElement>('[aria-label="Close Bloom"]')?.focus()
    else if (wasOpen.current) document.querySelector<HTMLButtonElement>('.bloom-companion-launch')?.focus()
    wasOpen.current = open
  }, [open])
  // Pages where you've hidden the floating Bloom button (right-click it).
  const [hiddenOn, setHiddenOn] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bloom-companion-hidden-pages') ?? '[]')
    } catch {
      return []
    }
  })
  // Drag the panel's edge to resize; the width lives on <html> so the docked layout follows it.
  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = panel.current
    if (!el) return
    e.preventDefault()
    const rect = el.getBoundingClientRect()
    // On the right-hand side the handle sits on the left edge, so dragging left widens.
    const fromRight = document.documentElement.hasAttribute('data-bloom-right') && !el.classList.contains('is-docked')
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    handle.dataset.dragging = ''
    document.documentElement.dataset.bcResizing = ''
    const move = (ev: PointerEvent) => setPanelWidth(fromRight ? rect.right - ev.clientX : ev.clientX - rect.left)
    const up = () => {
      delete handle.dataset.dragging
      delete document.documentElement.dataset.bcResizing
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      handle.removeEventListener('pointercancel', up)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
    handle.addEventListener('pointercancel', up)
  }
  // "Ask Bloom" on a page opens the guide docked beside it.
  useEffect(() => {
    const ask = (e: Event) => {
      if ((e as CustomEvent<{ dock?: boolean }>).detail?.dock) setDocked(true)
      setMode('guide')
      onOpen()
    }
    window.addEventListener('bloom:guide', ask)
    return () => window.removeEventListener('bloom:guide', ask)
     
  }, [onOpen])
  // Docked: the page makes room beside the panel.
  useEffect(() => {
    const on = open && docked
    document.documentElement.toggleAttribute('data-bloom-docked', on)
    return () => document.documentElement.removeAttribute('data-bloom-docked')
  }, [open, docked])
  // Open like the soundscape box: grow from the button corner (GSAP).
  useEffect(() => {
    if (!open || !panel.current || prefersReducedMotion()) return
    const tw = gsap.fromTo(panel.current, docked ? { x: -40, opacity: 0 } : { scale: 0.85, opacity: 0, y: 16, transformOrigin: '0% 100%' }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.6)', clearProps: 'transform' })
    return () => void tw.progress(1)
  }, [open, docked])
  const [text, setText] = useState(() => readDraft('bloom-plan-draft'))
  useEffect(() => writeSession('bloom-plan-draft', text), [text])
  const [turns, setTurns] = useState<Turn[]>(() => readConversation('bloom-plan-turns', (v): v is Turn =>
    !!v && typeof v === 'object' && 'role' in v && (v.role === 'user' || v.role === 'assistant') &&
    'content' in v && typeof v.content === 'string' && v.content.length <= 20000))
  useEffect(() => writeSession('bloom-plan-turns', JSON.stringify(turns)), [turns])
  const [clearedTurns, setClearedTurns] = useState<Turn[]>([])
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
  const followLatest = useRef(true)
  useEffect(() => {
    if (followLatest.current) feed.current?.scrollTo({ top: feed.current.scrollHeight })
  }, [turns, busy, open])

  const stop = () => {
    revision.current++
    ai.current?.dispose()
    ai.current = null
    const wasPending = pending.current
    pending.current = false
    setBusy(false)
    if (wasPending) {
      setText((draft) => draft || turns.filter((turn) => turn.role === 'user').at(-1)?.content || '')
      setNotice('Response stopped. You can edit your last message and send it again.')
    }
    setStatus('off')
  }
  const enable = async () => {
    if (!navigator.onLine) { setNotice('Connect to the internet to download local AI. The lightweight planner is ready now.'); return }
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
    input = input.trim().slice(0, 1000)
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
          error instanceof Error && /too long|timeout/i.test(error.message)
            ? 'Local AI took too long. Bloom used the lightweight planner instead; try a shorter request.'
            : 'Local AI could not finish this response. Bloom used the lightweight planner instead.',
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
      {!open && !hiddenOn.includes(page) && (
        <button
          onContextMenu={(e) => {
            e.preventDefault()
            if (!window.confirm('Hide the Bloom button on this page? (Settings → Reset layout brings it back.)')) return
            const next = [...hiddenOn, page]
            setHiddenOn(next)
            try {
              localStorage.setItem('bloom-companion-hidden-pages', JSON.stringify(next))
            } catch {
              /* optional */
            }
          }}
          className="bloom-companion-launch has-face"
          aria-expanded={open}
          aria-controls="bloom-chat-panel"
          onClick={open ? onClose : onOpen}
          onPointerEnter={() => launchFace.current?.react('excited')}
          aria-label="Talk to Bloom"
          data-hint="Ask Bloom anything about this page"
        >
          <BloomFace ref={launchFace} size={46} label="" waveOnMount={false}
            variant={avatar === 'glass' || avatar === 'auto' ? undefined : avatar} />
          <span>Talk to Bloom</span>
        </button>
      )}
      {open && (
        <section
          ref={panel}
          id="bloom-chat-panel"
          className={`bc-panel${docked ? ' is-docked' : ''}${followTheme ? ' uses-app-theme' : ''}`}
          aria-label="Talk to Bloom"
          onKeyDown={(e) => {
            if (e.key === 'Tab' && window.matchMedia('(max-width: 600px)').matches) {
              const items = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select, summary, [tabindex="0"]')]
                .filter((el) => el.getClientRects().length > 0 && (!el.closest('details:not([open])') || el.tagName === 'SUMMARY'))
              const first = items[0], last = items.at(-1)
              if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
              else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
            }
            if (e.key === 'Escape') {
              e.stopPropagation()
              onClose()
            }
          }}
        >
          <div
            className="bc-resize"
            role="separator"
            aria-orientation="vertical"
            aria-valuemin={300}
            aria-valuemax={760}
            aria-label="Resize Bloom panel (arrow keys; double-click to reset)"
            tabIndex={0}
            onPointerDown={startResize}
            onDoubleClick={() => setPanelWidth(null)}
            onKeyDown={(e) => {
              if (e.key === 'Home') { e.preventDefault(); setPanelWidth(null); return }
              if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
              e.preventDefault()
              const w = panel.current?.getBoundingClientRect().width ?? 380
              const fromRight = document.documentElement.hasAttribute('data-bloom-right') && !docked
              setPanelWidth(w + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 80 : 24) * (fromRight ? -1 : 1))
            }}
          />
          <header className="bc-head">
            <div className="bc-head-actions" role="tablist" aria-label="Bloom mode" onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              const next = event.key === 'Home' ? 'guide' : event.key === 'End' ? 'plan' : mode === 'guide' ? 'plan' : 'guide'
              setMode(next)
              event.currentTarget.querySelector<HTMLButtonElement>(next === 'guide' ? '[aria-label="Guide me"]' : '[aria-label="Plan with Bloom"]')?.focus()
            }}>
              <button type="button" id="bloom-guide-tab" aria-controls="bloom-guide-content" role="tab" tabIndex={mode === 'guide' ? 0 : -1} aria-selected={mode === 'guide'} aria-pressed={mode === 'guide'} aria-label="Guide me" data-hint="Guide me" onClick={() => setMode('guide')}>
                <Compass size={17} />
              </button>
              <button type="button" id="bloom-plan-tab" aria-controls="bloom-plan-content" role="tab" tabIndex={mode === 'plan' ? 0 : -1} aria-selected={mode === 'plan'} aria-pressed={mode === 'plan'} aria-label="Plan with Bloom" data-hint="Plan with Bloom" onClick={() => setMode('plan')}>
                <CalendarClock size={17} />
              </button>
            </div>
            <div className="bc-head-actions">
              <button type="button" aria-label={docked ? 'Float the chat' : 'Dock beside the page'} aria-pressed={docked} onClick={() => setDocked(!docked)} data-hint={docked ? 'Float as a small box' : 'Keep Bloom open beside this page'}>
                {docked ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
              </button>
              <button type="button" aria-label="Close Bloom" data-hint="Close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
          </header>
          {!online && <p className="chat-offline" role="status">You’re offline. Page guidance and lightweight planning still work; a new AI download needs a connection.</p>}
          <div className={`companion-orb-stage${busy ? ' is-thinking' : ''}`}>
            {avatar === 'glass' ? (
            <div className="companion-orb" role="img" aria-label="Bloom, your glowing assistant">
              <span className="companion-orb-ribbon" />
              <span className="companion-orb-ribbon ribbon-two" />
              <span className="companion-orb-ribbon ribbon-three" />
            </div>
            ) : (
              <BloomFace size={108} variant={avatar === 'auto' ? undefined : avatar}
                mood={busy ? 'think' : 'idle'} label="Bloom, your chat avatar" />
            )}
            <span className="companion-orb-caption">YOUR SPACE TO BLOOM</span>
          </div>
          {mode === 'guide' ? (
            <BloomGuide
              page={page}
              names={names}
              enabled={enabled}
              extra={extra}
              data={data}
              setData={setData}
              navigate={(p) => navigate(p as never)}
              onPlan={() => setMode('plan')}
            />
          ) : (
          <div className="bloom-companion" id="bloom-plan-content" role="tabpanel" aria-labelledby="bloom-plan-tab">
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
                Messages stay on this device. Drafts and the recent conversation are
                recovered in this browser tab. Recovery is limited to this tab.
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
              <div role="status" aria-live="polite" aria-atomic="true">
                <p>
                  {loadingStage ||
                    `Preparing local AI… ${Math.round(progress * 100)}%`}
                </p>
                <progress
                  value={Math.max(0, Math.min(1, progress))}
                  max={1}
                  aria-label="Local AI loading"
                  aria-valuetext={`${Math.round(Math.max(0, Math.min(1, progress)) * 100)}% downloaded`}
                />
              </div>
            )}
            <div
              className="companion-feed"
              ref={feed}
              onScroll={(event) => {
                const el = event.currentTarget
                followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
              }}
              role="log"
              aria-label="Conversation with Bloom"
              aria-live="polite"
              aria-relevant="additions text"
              aria-busy={busy}
            >
              {turns.length > 0 && !busy && (
                <button type="button" className="companion-clear" onClick={() => { setClearedTurns(turns); setTurns([]) }}>
                  Clear conversation
                </button>
              )}
              {!turns.length && clearedTurns.length > 0 && <button type="button" className="chat-undo" onClick={() => { setTurns(clearedTurns); setClearedTurns([]) }}>Undo clear conversation</button>}
              {!turns.length && (
                <p className="companion-welcome">
                  I can plan a short session, reflect with you, or review your recorded week.
                  Plans are suggestions; you choose whether to apply them.
                </p>
              )}
              {turns.map((turn, index) => (
                <div key={index} className={`companion-message ${turn.role}`}>
                  <small>
                    {turn.role === 'user' ? 'You' : 'Bloom'}
                    {turn.role === 'assistant' && (
                      <button type="button" className="companion-copy" aria-label={`Copy Bloom reply ${index + 1}`} title="Copy" onClick={() => { void (async () => {
                        try {
                          if (!navigator.clipboard) throw new Error('Clipboard unavailable')
                          await navigator.clipboard.writeText(turn.content)
                          setNotice('Reply copied.')
                        } catch { setNotice('Could not copy. Select the reply text and copy it manually.') }
                      })() }}>
                        ⧉
                      </button>
                    )}
                  </small>
                  {turn.content.split(/\n\s*\n/).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
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
            <details className="chat-tools"><summary>Conversation tools</summary>
            {turns.some((turn) => turn.role === 'user') && !busy && <button type="button" className="chat-edit" onClick={() => {
              setText(turns.filter((turn) => turn.role === 'user').at(-1)?.content ?? '')
              panel.current?.querySelector<HTMLInputElement>('#bloom-message')?.focus()
            }}>Edit last prompt</button>}
            {turns.length > 0 && <button type="button" className="chat-export" onClick={() => {
              try { exportConversation(turns.map((turn) => ({ speaker: turn.role === 'user' ? 'You' : 'Bloom', text: turn.content })), 'bloom-plan'); setNotice('Conversation exported.') }
              catch { setNotice('Export unavailable. You can copy individual replies.') }
            }}>Export conversation</button>}
            {turns.length > 0 && <button type="button" className="chat-latest" onClick={() => {
              followLatest.current = true
              feed.current?.scrollTo({ top: feed.current.scrollHeight })
            }}>Jump to latest reply</button>}
            </details>
            <ChoiceSlider label="Planning prompts" actions={[
              'I have 40 minutes', 'I’m tired today', 'Look back at my week', 'I have 15 minutes', 'Help me reflect on today',
            ].map((prompt) => ({ id: prompt, label: prompt, disabled: busy, run: () => void ask(prompt) }))} />
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
                aria-describedby="bloom-message-count"
                enterKeyHint="send"
                autoComplete="off"
                placeholder="What would help today?"
                maxLength={1000}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault() }}
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
                  aria-label="Stop generating"
                >
                  Stop
                </button>
              )}
            </form>
            <small className="chat-character-count" id="bloom-message-count" aria-live="off">{text.length}/1000 characters</small>
            {notice && (
              <p role="status" className="companion-notice">
                {notice}
                <button type="button" className="chat-dismiss" aria-label="Dismiss notice" onClick={() => setNotice('')}>×</button>
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
                      setNotice('Plan added to today’s intentions. Open daily intentions to review it.')
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
                    Resolve the data recovery alert before applying a plan. You can still adjust or review this suggestion.
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
        </section>
      )}
    </>
  )
}
