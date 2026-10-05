import { prefersReducedMotion } from '../utils/motion'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import Fuse from 'fuse.js'
import { MainContainer, ChatContainer, MessageList, Message, TypingIndicator } from '@chatscope/chat-ui-kit-react'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import { BloomFace, type BloomFaceHandle } from '../components/ui/BloomFace'
import { currentPageActions } from '../components/ui/PageMenu'
import { navSections } from '../components/layout/Sidebar'
import { guideFor, pageGuides, type Choice } from './guideScripts'
import type { Dispatch, SetStateAction } from 'react'
import type { AppData } from '../model'
import { explain, nextHint, reveal, useQuiz } from './quizContext'
import { burst } from '../components/ui/celebrate'
import './guide.css'
import { ChoiceSlider } from './ChoiceSlider'
import { readDraft, writeSession, readConversation, exportConversation } from './chatSession'

type Line = { id: number; from: 'bloom' | 'you'; text: string }
/** Only the latest messages are kept, so long chats never slow the app down. */
const MAX_LINES = 60
let lineId = 0
const trim = (l: Line[]) => l.slice(-MAX_LINES)

/**
 * Guided "Talk to Bloom": a chat (chatscope UI kit) where Bloom offers
 * choices that fit the page you are on, can take you anywhere in the app, and
 * can run the page's own actions for you.
 */
export function BloomGuide({
  page,
  names,
  enabled,
  navigate,
  onPlan,
  extra = [],
  data,
  setData,
}: {
  page: string
  names: (p: string) => string
  enabled: (p: string) => boolean
  navigate: (p: string) => void
  onPlan: () => void
  /** App-wide actions (the right-click menu's common items). */
  extra?: { id: string; label: string; icon?: string; run: () => void }[]
  data?: AppData
  setData?: Dispatch<SetStateAction<AppData>>
}) {
  // Never offer (or open) a page that is switched off, and always keep a way
  // to move around Bloom.
  const allowed = (cs: Choice[]) => cs.filter((c) => !c.go || enabled(c.go))
  const withNav = (cs: Choice[]) => {
    const list = allowed(cs)
    const extra = [
      { label: 'Show me around this page', next: '__tour' },
      { label: 'Take me somewhere', next: '__sections' },
    ].filter((x) => !list.some((c) => c.next === x.next))
    return [...list, ...extra]
  }
  const start = guideFor(page, names)
  const [lines, setLines] = useState<Line[]>(() => {
    const recovered = readConversation('bloom-guide-lines', (v): v is Line =>
      !!v && typeof v === 'object' && 'from' in v && (v.from === 'bloom' || v.from === 'you') &&
      'text' in v && typeof v.text === 'string' && v.text.length <= 20000)
    return recovered.length ? recovered.map((line) => ({ ...line, id: ++lineId })) : [{ id: ++lineId, from: 'bloom', text: start.say }]
  })
  useEffect(() => writeSession('bloom-guide-lines', JSON.stringify(lines)), [lines])
  const [choices, setChoices] = useState<Choice[]>(() => withNav(start.choices))
  const [typing, setTyping] = useState(false)
  const [query, setQuery] = useState(() => readDraft('bloom-guide-draft'))
  useEffect(() => writeSession('bloom-guide-draft', query), [query])
  const face = useRef<BloomFaceHandle>(null)
  const chips = useRef<HTMLDivElement>(null)
  const timer = useRef(0)
  const submitting = useRef(false)
  const commandRevision = useRef(0)

  const pages = useMemo(() => navSections.flatMap((s) => s.keys.filter(enabled).map((k) => ({ key: k, title: names(k), section: s.label }))), [enabled, names])
  const fuse = useMemo(() => new Fuse(pages, { keys: ['title', 'key', 'section'], threshold: 0.4 }), [pages])

  const say = (text: string, then: Choice[], after?: () => void) => {
    setTyping(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setTyping(false)
      setLines((l) => trim([...l, { id: ++lineId, from: 'bloom', text }]))
      setChoices(withNav(then))
      face.current?.react('talk')
      after?.()
    }, 550)
  }
  useEffect(() => () => { window.clearTimeout(timer.current); commandRevision.current++ }, [])
  // Staying open across pages: Bloom greets each new page in the same chat.
  const lastPage = useRef(page)
  useEffect(() => {
    if (lastPage.current === page) return
    lastPage.current = page
    const g = guideFor(page, names)
    face.current?.actFor(page)
    say(g.say, g.choices)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Chips pop in whenever Bloom offers new choices.
  useLayoutEffect(() => {
    if (!chips.current || prefersReducedMotion()) return
    const tw = gsap.fromTo(chips.current.children, { y: 12, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, stagger: 0.04, duration: 0.3, ease: 'back.out(2)' })
    return () => void tw.progress(1)
  }, [choices])

  const root: Choice[] = [
    { label: 'What can I do here?', next: '__page' },
    { label: 'Take me somewhere', next: '__sections' },
    { label: 'Do it for me', next: '__actions' },
    { label: 'Plan my time with Bloom', next: '__plan' },
  ]
  const pageChoices = (p: string) => [...guideFor(p, names).choices, ...root.filter((r) => r.next !== '__page')]

  const pick = (c: Choice) => {
    if (typing) return
    setLines((l) => trim([...l, { id: ++lineId, from: 'you', text: c.label }]))
    face.current?.react('cheer')
    if (c.next === '__tour') return say('Let me show you around — follow the highlights.', root, () => window.dispatchEvent(new Event('bloom:tour')))
    if (c.next === '__page') return say(guideFor(page, names).say, pageChoices(page))
    if (c.next === '__sections')
      return say('Where to? Pick a part of Bloom.', navSections.map((s) => ({ label: s.label, next: `__section:${s.label}` })))
    if (c.next?.startsWith('__section:')) {
      const s = navSections.find((x) => x.label === c.next!.slice(10))
      return say(`Here’s everything in ${s?.label}.`, (s?.keys ?? []).filter(enabled).map((k) => ({ label: names(k), go: k, reply: `Opening ${names(k)}.` })))
    }
    if (c.next === '__actions') {
      const acts = currentPageActions()
      return say(acts.length ? 'Here’s what I can do on this page:' : 'This page has no shortcuts yet — but I can take you somewhere.', acts.length ? acts.map((a) => ({ label: `${a.icon ?? ''} ${a.label}`.trim(), action: a.id, reply: 'Done!' })) : root)
    }
    if (c.next === '__plan') return say('Let’s plan together.', root, onPlan)
    if (c.next && pageGuides[c.next]) return say(pageGuides[c.next].say, [...pageGuides[c.next].choices, { label: 'Something else', next: '__root' }])
    if (c.next === '__root') return say('What else can I help with?', root)
    if (c.action) {
      const a = [...currentPageActions(), ...extra].find((x) => x.id === c.action)
      if (a) {
        try { a.run() } catch {
          return say('That shortcut could not finish. Try the action directly on the page.', root)
        }
        face.current?.react('excited')
      }
      return say(a ? (c.reply ?? 'Done!') : 'That isn’t available right now — it may be switched off in Settings.', root)
    }
    if (c.go && !enabled(c.go)) return say(`${names(c.go)} is switched off. You can turn it on in Settings.`, root)
    if (c.go) {
      const to = c.go
      return say(c.reply ?? `Opening ${names(to)}.`, root, () => navigate(to))
    }
    say(c.reply ?? 'Okay!', [...(guideFor(page, names).choices.filter((x) => x.label !== c.label)), { label: 'Something else', next: '__root' }])
  }

  const quiz = useQuiz()
  const root2: Choice[] = [{ label: 'What can I do here?', next: '__page' }, { label: 'Take me somewhere', next: '__sections' }]
  /** Typed messages: try a command first (expenses, todos, hints…), then page search. */
  const submit = async () => {
    const text = query.trim()
    if (!text || typing || submitting.current) return
    submitting.current = true
    setTyping(true)
    const currentRevision = commandRevision.current
    // Loaded on first use so money / course code stays out of the main bundle.
    let res: import('./chatCommands').CommandResult
    try {
      const { runCommand } = await import('./chatCommands')
      if (currentRevision !== commandRevision.current) return
      res = runCommand(text, { data, setData, navigate, clear: () => setLines([]) })
    } catch {
      if (currentRevision !== commandRevision.current) return
      submitting.current = false
      say('That command could not finish. Your input is still here; check it and try again.', root2)
      return
    }
    submitting.current = false
    if (res) {
      setQuery('')
      setLines((l) => trim([...l, { id: ++lineId, from: 'you', text }]))
      face.current?.react(res.mood ?? 'cheer')
      if (res.mood === 'cheer') burst(document.querySelector('.bg-guide-search input') ?? undefined, 'stars')
      return say(res.reply, root2)
    }
    if (results[0]) {
      setQuery('')
      pick({ label: results[0].title, go: results[0].key })
      return
    }
    setQuery('')
    setLines((l) => trim([...l, { id: ++lineId, from: 'you', text }]))
    say('I didn’t catch that. Try “spent 5 on coffee”, “add todo …”, “hint”, or a page name — or type “help”.', root2)
  }
  const quizHelp = (label: string, fn: () => string) => {
    if (typing) return
    setLines((l) => trim([...l, { id: ++lineId, from: 'you', text: label }]))
    face.current?.react('think')
    say(fn(), root2)
  }
  const results = query.trim() ? fuse.search(query).slice(0, 6).map((r) => r.item) : []
  return (
    <div className="bg-guide" id="bloom-guide-content" role="tabpanel" aria-labelledby="bloom-guide-tab" aria-busy={typing}>
      <div className="bg-guide-head">
        <BloomFace ref={face} size={72} label={`Bloom, your guide on ${names(page)}`} />
      </div>
      <div className="bg-guide-chat">
        <MainContainer>
          <ChatContainer>
            <MessageList autoScrollToBottom={false} aria-label="Conversation with Bloom guide" typingIndicator={typing ? <TypingIndicator content="Bloom is typing" /> : undefined}>
              {lines.map((l) => (
                <Message key={l.id} model={{ type: 'text', message: l.text, sender: l.from, direction: l.from === 'you' ? 'outgoing' : 'incoming', position: 'single' }} />
              ))}
            </MessageList>
          </ChatContainer>
        </MainContainer>
      </div>
      <div ref={chips}>
        <ChoiceSlider key={results.length ? `search:${query}` : choices.map((c) => c.label).join('|')}
          label={results.length ? 'Matching pages' : 'Choices'}
          actions={results.length ? results.map((r) => ({
            id: r.key, label: <>{r.title} <small>{r.section}</small></>,
            run: () => { setQuery(''); pick({ label: r.title, go: r.key }) }, disabled: typing,
          })) : [...(quiz ? [
            { id: 'quiz-hint', label: 'Hint', run: () => quizHelp('Give me a hint', nextHint), disabled: typing },
            { id: 'quiz-explain', label: 'Explain', run: () => quizHelp('Explain it', explain), disabled: typing },
            { id: 'quiz-answer', label: 'Answer', run: () => quizHelp('Show the answer', reveal), disabled: typing },
          ] : []), ...choices.map((c, index) => ({
            id: `${index}:${c.label}`, label: c.label, run: () => pick(c), disabled: typing,
          }))]} />
      </div>
      {query.trim() && !results.length && <p className="chat-search-status" role="status">No matching page. Press Enter to try a command, or type “help”.</p>}
      {typing && <button type="button" className="chat-stop" onClick={() => { window.clearTimeout(timer.current); commandRevision.current++; submitting.current = false; setTyping(false) }}>Stop reply</button>}
      <details className="chat-tools">
        <summary>Conversation tools</summary>
        <button type="button" disabled={typing} onClick={() => say('Try “add todo call mum”, “spent 5 on coffee”, “hint”, or a page name. Your guide uses local commands, so specific short requests work best.', root)}>Show command examples</button>
        <button type="button" disabled={typing} onClick={() => { setLines([{ id: ++lineId, from: 'bloom', text: start.say }]); setChoices(withNav(start.choices)); setQuery('') }}>Restart this page guide</button>
        <button type="button" onClick={() => {
          try { exportConversation(lines.map((line) => ({ speaker: line.from === 'you' ? 'You' : 'Bloom', text: line.text })), 'bloom-guide') }
          catch { say('Export unavailable. Select the conversation text to copy it.', choices) }
        }}>Export conversation</button>
      </details>
      <p className="chat-scope" id="bloom-guide-scope">I can find pages, run shortcuts, and help you plan. Review changes to your tasks and spending.</p>
      <label className="bg-guide-search">
        <span className="sr-only">Ask Bloom or find a page</span>
        <input aria-describedby="bloom-guide-scope" type="search" autoComplete="off" enterKeyHint="send" maxLength={1000} placeholder="Ask Bloom: “spent 5 on coffee”, “hint”, a page…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && void submit()} />
      </label>
    </div>
  )
}
