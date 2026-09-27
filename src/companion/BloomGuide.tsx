import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import Fuse from 'fuse.js'
import { MainContainer, ChatContainer, MessageList, Message, TypingIndicator } from '@chatscope/chat-ui-kit-react'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import { BloomFace, type BloomFaceHandle } from '../components/ui/BloomFace'
import { currentPageActions } from '../components/ui/PageMenu'
import { navSections } from '../components/layout/Sidebar'
import { guideFor, pageGuides, type Choice } from './guideScripts'
import './guide.css'

type Line = { from: 'bloom' | 'you'; text: string }

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
}: {
  page: string
  names: (p: string) => string
  enabled: (p: string) => boolean
  navigate: (p: string) => void
  onPlan: () => void
  /** App-wide actions (the right-click menu's common items). */
  extra?: { id: string; label: string; icon?: string; run: () => void }[]
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
  const [lines, setLines] = useState<Line[]>([{ from: 'bloom', text: start.say }])
  const [choices, setChoices] = useState<Choice[]>(() => withNav(start.choices))
  const [typing, setTyping] = useState(false)
  const [query, setQuery] = useState('')
  const face = useRef<BloomFaceHandle>(null)
  const chips = useRef<HTMLDivElement>(null)
  const timer = useRef(0)

  const pages = useMemo(() => navSections.flatMap((s) => s.keys.filter(enabled).map((k) => ({ key: k, title: names(k), section: s.label }))), [enabled, names])
  const fuse = useMemo(() => new Fuse(pages, { keys: ['title', 'key', 'section'], threshold: 0.4 }), [pages])

  const say = (text: string, then: Choice[], after?: () => void) => {
    setTyping(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setTyping(false)
      setLines((l) => [...l, { from: 'bloom', text }])
      setChoices(withNav(then))
      face.current?.react('talk')
      after?.()
    }, 550)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
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
    if (!chips.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
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
    setLines((l) => [...l, { from: 'you', text: c.label }])
    face.current?.react('happy')
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
        a.run()
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

  const results = query.trim() ? fuse.search(query).slice(0, 6).map((r) => r.item) : []
  return (
    <div className="bg-guide">
      <div className="bg-guide-head">
        <BloomFace ref={face} size={72} label={`Bloom, your guide on ${names(page)}`} />
      </div>
      <div className="bg-guide-chat">
        <MainContainer>
          <ChatContainer>
            <MessageList typingIndicator={typing ? <TypingIndicator content="Bloom is typing" /> : undefined}>
              {lines.map((l, i) => (
                <Message key={i} model={{ message: l.text, sender: l.from, direction: l.from === 'you' ? 'outgoing' : 'incoming', position: 'single' }} />
              ))}
            </MessageList>
          </ChatContainer>
        </MainContainer>
      </div>
      <div ref={chips} className="bg-guide-chips" role="group" aria-label={results.length ? 'Matching pages' : 'Choices'}>
        {results.length
          ? results.map((r) => (
              <button key={r.key} type="button" className="bg-chip ghost" onClick={() => { setQuery(''); pick({ label: r.title, go: r.key }) }}>
                {r.title} <small>{r.section}</small>
              </button>
            ))
          : choices.map((c) => (
              <button key={c.label} type="button" className="bg-chip" onClick={() => pick(c)} disabled={typing}>
                {c.label}
              </button>
            ))}
      </div>
      <label className="bg-guide-search">
        <span className="sr-only">Find a page</span>
        <input type="search" placeholder="Or type where you want to go…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && results[0] && (setQuery(''), pick({ label: results[0].title, go: results[0].key }))} />
      </label>
    </div>
  )
}
