import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Chess, type Square } from 'chess.js'
import { Crown, GraduationCap, Puzzle as PuzzleIcon, Swords } from 'lucide-react'
import { Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import { setQuiz } from '../../companion/quizContext'
import { ChessBoard } from './ChessBoard'
import { bestMove, lessons, loneMoves, par, positionOf, puzzles, type PieceCode } from './chessModel'
import './chess.css'

/**
 * Chess Academy — learn the pieces by collecting stars, solve verified
 * mate-in-one puzzles, then play Bloom. Rules by chess.js; the board is our
 * own SVG with GSAP glides, drag (use-gesture) and a pointer-tilt; wins get a
 * kinetic split-letter title and confetti.
 */
const KEY = 'bloom-chess-v1'
type Store = { lessons: Record<string, number>; puzzles: Record<string, boolean>; wins: number; games: number }
const empty: Store = { lessons: {}, puzzles: {}, wins: 0, games: 0 }
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Big split-letter title that crashes in (kinetic typography). */
function Kinetic({ text, tone }: { text: string; tone: 'win' | 'lose' | 'draw' }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!ref.current || reduced()) return
    gsap.fromTo(ref.current.querySelectorAll('span'), { yPercent: 120, rotate: () => gsap.utils.random(-30, 30), opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: 'back.out(2.2)' })
  }, [text])
  return (
    <div ref={ref} className={`ch-kinetic ${tone}`} role="status" aria-label={text}>
      {[...text].map((c, i) => <span key={i} aria-hidden="true">{c === ' ' ? ' ' : c}</span>)}
    </div>
  )
}

/* ---------- Learn: move a lone piece to collect the stars ---------- */
function LearnTab({ store, save }: { store: Store; save: (f: (s: Store) => Store) => void }) {
  const [li, setLi] = useState(0)
  const lesson = lessons[li]
  const [at, setAt] = useState<string>(lesson.start)
  const [left, setLeft] = useState<string[]>(lesson.stars)
  const [moves, setMoves] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [last, setLast] = useState<{ from: string; to: string } | null>(null)
  const target = useMemo(() => par(lesson), [lesson])
  useEffect(() => {
    setAt(lesson.start)
    setLeft(lesson.stars)
    setMoves(0)
    setSelected(null)
    setLast(null)
  }, [lesson])
  const done = left.length === 0
  const move = (from: string, to: string) => {
    setAt(to)
    setLast({ from, to })
    setSelected(null)
    const n = moves + 1
    setMoves(n)
    if (left.includes(to)) {
      const rest = left.filter((s) => s !== to)
      setLeft(rest)
      if (!rest.length) {
        burst(undefined, 'stars')
        save((s) => ({ ...s, lessons: { ...s.lessons, [lesson.id]: Math.min(s.lessons[lesson.id] ?? 99, n) } }))
        logActivity('chess', { lesson: lesson.id })
      }
    }
  }
  const targets = selected ? loneMoves(lesson.piece, at as Square, at !== lesson.start) : []
  return (
    <div className="ch-layout">
      <ChessBoard position={{ [at]: lesson.piece as PieceCode }} targets={targets} selected={selected} onSelect={(s) => setSelected(s)} onMove={move} stars={left} lastMove={last} disabled={done} />
      <aside className="ch-side">
        <div className="ch-lessons">
          {lessons.map((l, i) => (
            <button key={l.id} type="button" className={`ch-pill ${i === li ? 'on' : ''} ${store.lessons[l.id] ? 'done' : ''}`} onClick={() => setLi(i)}>
              {store.lessons[l.id] ? '★ ' : ''}{l.title.replace('The ', '')}
            </button>
          ))}
        </div>
        <h3>{lesson.title}</h3>
        <p>{lesson.tip}</p>
        <p className="ch-meta">Collect every ★ · moves {moves} · best possible {target}</p>
        {done ? (
          <>
            <Kinetic text={moves <= target ? 'PERFECT!' : 'NICE!'} tone="win" />
            <p>{moves <= target ? 'You found the fastest route.' : `Done in ${moves} — try for ${target}.`}</p>
            <div className="ch-row">
              <button type="button" className="studio-btn" onClick={() => { setAt(lesson.start); setLeft(lesson.stars); setMoves(0); setLast(null) }}>Try again</button>
              {li + 1 < lessons.length && <button type="button" className="ch-cta" onClick={() => setLi(li + 1)}>Next piece →</button>}
            </div>
          </>
        ) : (
          <p className="ch-meta">Tap the piece, then a glowing dot — or drag it.</p>
        )}
      </aside>
    </div>
  )
}

/* ---------- Puzzles: mate in one ---------- */
function PuzzleTab({ store, save }: { store: Store; save: (f: (s: Store) => Store) => void }) {
  const [pi, setPi] = useState(0)
  const p = puzzles[pi]
  const [game, setGame] = useState(() => new Chess(p.fen))
  const [selected, setSelected] = useState<string | null>(null)
  const [last, setLast] = useState<{ from: string; to: string } | null>(null)
  const [result, setResult] = useState<'mate' | 'miss' | null>(null)
  const [hint, setHint] = useState(false)
  useEffect(() => {
    setGame(new Chess(p.fen))
    setSelected(null)
    setLast(null)
    setResult(null)
    setHint(false)
  }, [p])
  const mateMoves = useMemo(() => {
    const g = new Chess(p.fen)
    return g.moves({ verbose: true }).filter((m) => { g.move(m); const ok = g.isCheckmate(); g.undo(); return ok })
  }, [p])
  useEffect(() => {
    setQuiz({ source: 'Chess puzzle', question: `${p.title}: find mate in one (white to move).`, answer: mateMoves[0]?.san ?? '', explain: p.hint })
    return () => setQuiz(null)
  }, [p, mateMoves])
  const targets = selected ? game.moves({ square: selected as Square, verbose: true }).map((m) => m.to) : []
  const move = (from: string, to: string) => {
    const g = new Chess(game.fen())
    g.move({ from, to, promotion: 'q' })
    setGame(g)
    setLast({ from, to })
    setSelected(null)
    if (g.isCheckmate()) {
      setResult('mate')
      burst(undefined, 'stars')
      save((s) => ({ ...s, puzzles: { ...s.puzzles, [p.id]: true } }))
    } else setResult('miss')
  }
  const kingInCheck = game.isCheck() ? Object.entries(positionOf(game)).find(([, v]) => v === `${game.turn()}K`)?.[0] : null
  return (
    <div className="ch-layout">
      <ChessBoard position={positionOf(game)} targets={targets} selected={selected} onSelect={(s) => setSelected(s && game.get(s as Square)?.color === 'w' ? s : null)} onMove={move} lastMove={last} check={kingInCheck} disabled={result !== null} />
      <aside className="ch-side">
        <div className="ch-lessons">
          {puzzles.map((x, i) => (
            <button key={x.id} type="button" className={`ch-pill ${i === pi ? 'on' : ''} ${store.puzzles[x.id] ? 'done' : ''}`} onClick={() => setPi(i)}>{store.puzzles[x.id] ? '✓ ' : ''}{i + 1}</button>
          ))}
        </div>
        <h3>{p.title}</h3>
        <p className="ch-meta">White to move — checkmate in one. Theme: {p.theme}</p>
        {result === 'mate' && <Kinetic text="CHECKMATE" tone="win" />}
        {result === 'miss' && <><Kinetic text="NOT MATE" tone="lose" /><p>That move doesn’t finish the game. Look again!</p></>}
        {hint && <p className="ch-hint">💡 {p.hint}</p>}
        <div className="ch-row">
          {result === null && <button type="button" className="studio-btn" onClick={() => setHint(true)}>Hint</button>}
          {result !== null && <button type="button" className="studio-btn" onClick={() => { setGame(new Chess(p.fen)); setResult(null); setLast(null) }}>Retry</button>}
          {result === 'mate' && pi + 1 < puzzles.length && <button type="button" className="ch-cta" onClick={() => setPi(pi + 1)}>Next puzzle →</button>}
        </div>
      </aside>
    </div>
  )
}

/** Copy a game *with its history* (new Chess(fen) would forget earlier moves). */
const cloneGame = (g: Chess) => {
  const c = new Chess()
  c.loadPgn(g.pgn())
  return c
}

/* ---------- Play Bloom ---------- */
function PlayTab({ save }: { save: (f: (s: Store) => Store) => void }) {
  const [game, setGame] = useState(() => new Chess())
  const [selected, setSelected] = useState<string | null>(null)
  const [last, setLast] = useState<{ from: string; to: string } | null>(null)
  const [level, setLevel] = useState<1 | 2 | 3>(2)
  const [thinking, setThinking] = useState(false)
  const over = game.isGameOver()
  const bloomTurn = game.turn() === 'b' && !over
  useEffect(() => {
    if (!bloomTurn) return
    setThinking(true)
    const t = window.setTimeout(() => {
      const m = bestMove(game.fen(), level)
      if (m) {
        const g = cloneGame(game)
        g.move(m)
        setGame(g)
        setLast({ from: m.from, to: m.to })
        if (g.isGameOver()) save((s) => ({ ...s, games: s.games + 1 }))
      }
      setThinking(false)
    }, 450)
    return () => window.clearTimeout(t)
  }, [bloomTurn, game, level, save])
  const move = (from: string, to: string) => {
    const g = cloneGame(game)
    g.move({ from, to, promotion: 'q' })
    setGame(g)
    setLast({ from, to })
    setSelected(null)
    if (g.isCheckmate()) {
      burst(undefined, 'stars')
      save((s) => ({ ...s, wins: s.wins + 1, games: s.games + 1 }))
    } else if (g.isGameOver()) save((s) => ({ ...s, games: s.games + 1 }))
  }
  const targets = selected ? game.moves({ square: selected as Square, verbose: true }).map((m) => m.to) : []
  const kingInCheck = game.isCheck() ? Object.entries(positionOf(game)).find(([, v]) => v === `${game.turn()}K`)?.[0] : null
  const history = game.history()
  return (
    <div className="ch-layout">
      <ChessBoard position={positionOf(game)} targets={targets} selected={selected} onSelect={(s) => setSelected(s && game.get(s as Square)?.color === 'w' ? s : null)} onMove={move} lastMove={last} check={kingInCheck} disabled={bloomTurn || over} />
      <aside className="ch-side">
        <h3>Play Bloom</h3>
        <div className="ch-lessons">
          {([1, 2, 3] as const).map((l) => <button key={l} type="button" className={`ch-pill ${level === l ? 'on' : ''}`} onClick={() => setLevel(l)}>{['', 'Playful', 'Solid', 'Sharp'][l]}</button>)}
        </div>
        {over ? (
          <Kinetic text={game.isCheckmate() ? (game.turn() === 'b' ? 'YOU WIN' : 'BLOOM WINS') : 'DRAW'} tone={game.isCheckmate() && game.turn() === 'b' ? 'win' : game.isCheckmate() ? 'lose' : 'draw'} />
        ) : (
          <p className="ch-meta">{thinking ? 'Bloom is thinking…' : game.isCheck() ? 'Check! Protect your king.' : 'You play white. Your move.'}</p>
        )}
        <ol className="ch-moves" aria-label="Moves">
          {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => <li key={i}><span>{i + 1}.</span> {history[i * 2]} <em>{history[i * 2 + 1] ?? ''}</em></li>)}
        </ol>
        <div className="ch-row">
          <button type="button" className="studio-btn" disabled={thinking || history.length < 2} onClick={() => { const g = new Chess(); for (const m of history.slice(0, -2)) g.move(m); setGame(g); setLast(null) }}>Undo</button>
          <button type="button" className="ch-cta" onClick={() => { setGame(new Chess()); setLast(null); setSelected(null) }}>New game</button>
        </div>
      </aside>
    </div>
  )
}

export function ChessPage() {
  const [store, setStore] = useState<Store>(() => ({ ...empty, ...readStore(KEY, empty) }))
  const save = useMemo(
    () => (f: (s: Store) => Store) =>
      setStore((s) => {
        const n = f(s)
        writeStore(KEY, n)
        return n
      }),
    [],
  )
  const [tab, setTab] = useState('learn')
  const learned = Object.keys(store.lessons).length
  const solved = Object.values(store.puzzles).filter(Boolean).length
  return (
    <Studio
      name="chess"
      accent="#b58863"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#b58863', '#f0d9b5', '#1f1d2b']} line="pulse" />}
      aside={<span className="ch-aside"><Crown size={15} /> {learned}/{lessons.length} pieces · {solved}/{puzzles.length} puzzles · {store.wins} wins</span>}
      tabs={[
        { id: 'learn', label: 'Learn', icon: <GraduationCap size={15} />, render: () => <LearnTab store={store} save={save} /> },
        { id: 'puzzles', label: 'Puzzles', icon: <PuzzleIcon size={15} />, render: () => <PuzzleTab store={store} save={save} /> },
        { id: 'play', label: 'Play Bloom', icon: <Swords size={15} />, render: () => <PlayTab save={save} /> },
      ]}
    />
  )
}
