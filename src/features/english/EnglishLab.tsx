import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Mic, Volume2 } from 'lucide-react'
import { allWords, minimalPairs, spellingWords } from './englishCourse'
import { canListen, checkTyped, conjugate, isWord, listen, numberWords, phonemes, plural, pick, rhymes, soundScore, speak, syllableChunks, syllables, toPast } from './englishNlp'
import { sfx } from './sfx'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('englishLearning', id)

/** Pronunciation lab: phonemes with stress, syllable claps and a speak check. */
function Pronounce({ onXp }: { onXp: (n: number) => void }) {
  const [word, setWord] = useState('beautiful')
  const [ph, setPh] = useState<string | null>(null)
  const [chunks, setChunks] = useState<string[]>([])
  const [score, setScore] = useState<number | null>(null)
  const claps = useRef<HTMLDivElement>(null)
  const look = async (w: string) => {
    setWord(w)
    setScore(null)
    setPh(await phonemes(w))
    setChunks(await syllableChunks(w))
  }
  useLayoutEffect(() => {
    if (claps.current) gsap.fromTo(claps.current.children, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.18, duration: 0.3, ease: 'back.out(3)' })
  }, [chunks])
  const stressed = ph?.split(' ').map((p, k) => <span key={k} className={/1$/.test(p) ? 'stress' : /2$/.test(p) ? 'second' : ''}>{p.replace(/\d/, '')}</span>)
  return (
    <div className="en-lab">
      <form className="en-inline" onSubmit={(e) => { e.preventDefault(); void look(String(new FormData(e.currentTarget).get('w') || '').trim()) }}>
        <input name="w" className="studio-input" defaultValue={word} aria-label="Word to pronounce" />
        <button type="submit" className="studio-btn">Look up</button>
        <button type="button" className="studio-btn" onClick={() => void look(pick(allWords).en.split(' ')[0])}>Random</button>
      </form>
      <div className="en-pron">
        <button type="button" className="en-speaker" aria-label="Hear it" onClick={() => speak(word, 0.8)}><Volume2 size={28} /></button>
        <div>
          <strong className="en-pron-word">{word}</strong>
          <div className="en-phon">{stressed ?? <small>Press “Look up”</small>}</div>
          <small>{syllables(word)} syllable{syllables(word) === 1 ? '' : 's'} · the stressed sound is highlighted</small>
        </div>
      </div>
      <div ref={claps} className="en-claps" aria-label="Syllables">{chunks.map((c, k) => <span key={k}>👏 {c}</span>)}</div>
      {canListen() && (
        <button type="button" className="en-mic" onClick={async () => {
          const heard = await listen()
          const sc = heard ? soundScore(heard, word) : 0
          setScore(Math.round(sc * 100))
          sfx(sc >= 0.7 ? 'right' : 'wrong')
          if (sc >= 0.7) onXp(2)
        }}><Mic size={18} /> Say it</button>
      )}
      {score !== null && <p className="quick-note">{score >= 70 ? `Great pronunciation (${score}%)!` : `Close — ${score}%. Listen again and copy the stress.`}</p>}
    </div>
  )
}

/** Rhyme time: type as many rhymes as you can (checked with the CMU dictionary). */
function Rhymes({ onXp }: { onXp: (n: number) => void }) {
  const seeds = ['cat', 'light', 'day', 'blue', 'fun', 'tree', 'rain', 'cold']
  const [seed, setSeed] = useState(seeds[0])
  const [found, setFound] = useState<string[]>([])
  const [all, setAll] = useState<string[] | null>(null)
  const [msg, setMsg] = useState('')
  const guess = async (w: string) => {
    const list = all ?? (await rhymes(seed, 400))
    setAll(list)
    const x = w.toLowerCase().trim()
    if (found.includes(x)) return setMsg('Already found!')
    if (list.includes(x)) {
      setFound((f) => [...f, x])
      setMsg('✓ Rhymes!')
      sfx('right')
      onXp(1)
    } else {
      setMsg(`“${x}” doesn’t rhyme with “${seed}”.`)
      sfx('wrong')
    }
  }
  return (
    <div className="en-lab">
      <p>Words that rhyme with <strong className="en-pron-word">{seed}</strong></p>
      <form className="en-inline" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; void guess(String(new FormData(f).get('r') || '')); f.reset() }}>
        <input name="r" className="studio-input" aria-label="A rhyme" placeholder="Type a rhyme" />
        <button type="submit" className="studio-btn">Check</button>
        <button type="button" className="studio-btn" onClick={() => { setSeed(pick(seeds.filter((s) => s !== seed))); setFound([]); setAll(null); setMsg('') }}>New word</button>
      </form>
      <p className="quick-note">{msg}</p>
      <div className="en-tags">{found.map((f) => <span key={f}>{f}</span>)}</div>
      {all && <button type="button" className="en-link" onClick={() => setFound(all.slice(0, 12))}>Show some</button>}
    </div>
  )
}

/** Minimal pairs: hear one word, pick which it was (ship / sheep). */
function MinimalPairs({ onXp }: { onXp: (n: number) => void }) {
  const [pair, setPair] = useState(() => pick(minimalPairs))
  const [target, setTarget] = useState(() => pick(pair))
  const [res, setRes] = useState<string | null>(null)
  const nextPair = () => {
    const p = pick(minimalPairs)
    const t = pick(p)
    setPair(p)
    setTarget(t)
    setRes(null)
    speak(t, 0.8)
  }
  return (
    <div className="en-lab">
      <button type="button" className="en-speaker" aria-label="Play word" onClick={() => speak(target, 0.8)}><Volume2 size={30} /></button>
      <div className="en-options">
        {pair.map((w) => (
          <button key={w} type="button" className={`en-option ${res && w === target ? 'is-right' : ''}`} disabled={!!res} onClick={() => { const ok = w === target; setRes(ok ? 'right' : 'wrong'); sfx(ok ? 'right' : 'wrong'); if (ok) onXp(1) }}>{w}</button>
        ))}
      </div>
      {res && <button type="button" className="en-check" onClick={nextPair}>Next pair</button>}
    </div>
  )
}

/** Spelling bee: hear a tricky word and spell it (checked against a real word list). */
function SpellingBee({ onXp }: { onXp: (n: number) => void }) {
  const [word, setWord] = useState(() => pick(spellingWords))
  const [msg, setMsg] = useState('')
  const [typed, setTyped] = useState('')
  const check = async () => {
    const v = checkTyped(typed, word)
    if (v === 'exact') {
      setMsg('🐝 Perfect spelling!')
      sfx('right')
      onXp(3)
    } else {
      const real = await isWord(typed.trim())
      setMsg(`${real ? `“${typed}” is a word, but not this one.` : 'Not quite.'} It’s spelled: ${word}`)
      sfx('wrong')
    }
  }
  return (
    <div className="en-lab">
      <div className="en-inline">
        <button type="button" className="en-speaker" aria-label="Hear the word" onClick={() => speak(word, 0.75)}><Volume2 size={28} /></button>
        <input className="studio-input" aria-label="Spell the word" value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void check()} />
        <button type="button" className="studio-btn" onClick={() => void check()}>Check</button>
        <button type="button" className="studio-btn" onClick={() => { setWord(pick(spellingWords)); setTyped(''); setMsg('') }}>Next</button>
      </div>
      <p className="quick-note">{msg}</p>
    </div>
  )
}

/** Numbers: read the number, write it in words (and back). */
function Numbers({ onXp }: { onXp: (n: number) => void }) {
  const make = () => Math.floor(Math.random() * (Math.random() < 0.5 ? 100 : 10000))
  const [n, setN] = useState(make)
  const [typed, setTyped] = useState('')
  const [msg, setMsg] = useState('')
  const answer = numberWords(n)
  return (
    <div className="en-lab">
      <p>Write in words: <strong className="en-pron-word">{n.toLocaleString('en-GB')}</strong></p>
      <div className="en-inline">
        <input className="studio-input" aria-label="Number in words" value={typed} onChange={(e) => setTyped(e.target.value)} />
        <button type="button" className="studio-btn" onClick={() => { const ok = checkTyped(typed.replace(/-/g, ' '), answer.replace(/-/g, ' ').replace(/,/g, '')) !== 'wrong'; setMsg(ok ? '✓ Correct!' : `It’s “${answer}”`); sfx(ok ? 'right' : 'wrong'); if (ok) onXp(2) }}>Check</button>
        <button type="button" className="studio-btn" onClick={() => { speak(String(n)) }}><Volume2 size={15} /></button>
        <button type="button" className="studio-btn" onClick={() => { setN(make()); setTyped(''); setMsg('') }}>Next</button>
      </div>
      <p className="quick-note">{msg}</p>
    </div>
  )
}

/** Plurals & tenses drills generated with pluralize and compromise. */
function Forms({ onXp }: { onXp: (n: number) => void }) {
  const nouns = ['child', 'mouse', 'city', 'knife', 'person', 'tooth', 'box', 'woman', 'leaf', 'baby', 'foot', 'bus']
  const verbs = ['go', 'eat', 'see', 'write', 'take', 'buy', 'think', 'run', 'swim', 'bring', 'teach', 'fly']
  const [mode, setMode] = useState<'plural' | 'past'>('plural')
  const [w, setW] = useState(() => pick(nouns))
  const [typed, setTyped] = useState('')
  const [msg, setMsg] = useState('')
  const answer = mode === 'plural' ? plural(w) : conjugate(w)?.past ?? ''
  const next = (m = mode) => {
    setW(pick(m === 'plural' ? nouns : verbs))
    setTyped('')
    setMsg('')
  }
  return (
    <div className="en-lab">
      <div className="en-options">
        <button type="button" className="en-option" aria-pressed={mode === 'plural'} onClick={() => { setMode('plural'); next('plural') }}>Plurals</button>
        <button type="button" className="en-option" aria-pressed={mode === 'past'} onClick={() => { setMode('past'); next('past') }}>Past tense</button>
      </div>
      <p>{mode === 'plural' ? 'One' : 'Today I'} <strong className="en-pron-word">{w}</strong>, {mode === 'plural' ? 'two …' : 'yesterday I …'}</p>
      <div className="en-inline">
        <input className="studio-input" aria-label="Your answer" value={typed} onChange={(e) => setTyped(e.target.value)} />
        <button type="button" className="studio-btn" onClick={() => { const ok = typed.trim().toLowerCase() === answer.toLowerCase(); setMsg(ok ? '✓ Correct!' : `It’s “${answer}”`); sfx(ok ? 'right' : 'wrong'); if (ok) onXp(1) }}>Check</button>
        <button type="button" className="studio-btn" onClick={() => next()}>Next</button>
      </div>
      <p className="quick-note">{msg}</p>
      {mode === 'past' && <p className="quick-note">Example: “{toPast(`I ${w} every day.`)}”</p>}
    </div>
  )
}

export function EnglishLab({ onXp }: { onXp: (n: number) => void }) {
  const tools = [
    on('pronunciation') && { id: 'pron', emoji: '🗣️', title: 'Pronunciation lab', node: <Pronounce onXp={onXp} /> },
    on('rhymes') && { id: 'rhymes', emoji: '🎵', title: 'Rhyme time', node: <Rhymes onXp={onXp} /> },
    on('minimalPairs') && { id: 'pairs', emoji: '👂', title: 'Minimal pairs', node: <MinimalPairs onXp={onXp} /> },
    on('spellingBee') && { id: 'bee', emoji: '🐝', title: 'Spelling bee', node: <SpellingBee onXp={onXp} /> },
    on('numbers') && { id: 'num', emoji: '🔢', title: 'Numbers', node: <Numbers onXp={onXp} /> },
    on('forms') && { id: 'forms', emoji: '🔤', title: 'Plurals & tenses', node: <Forms onXp={onXp} /> },
  ].filter(Boolean) as { id: string; emoji: string; title: string; node: React.ReactNode }[]
  return (
    <div className="en-grid">
      {tools.map((t) => (
        <section key={t.id} className="studio-card">
          <h3>{t.emoji} {t.title}</h3>
          {t.node}
        </section>
      ))}
    </div>
  )
}
