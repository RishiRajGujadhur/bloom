import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useRef, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import gsap from 'gsap'
import './boardLessons.css'

type Kind = 'chess' | 'checkers'
type Piece = { side: 'light' | 'dark'; king?: boolean } | null
const chessLessons = [
  { title: 'Meet the board', prompt: 'Move your white pawn from e2 to e4.', from: 'e2', to: 'e4', fen: undefined },
  { title: 'Knight jump', prompt: 'Jump the knight from g1 to f3.', from: 'g1', to: 'f3', fen: undefined },
  { title: 'Capture', prompt: 'Take the black pawn with your white rook.', from: 'a1', to: 'a7', fen: '7k/p7/8/8/8/8/8/R6K w - - 0 1' },
]
const checkersLessons = [
  { title: 'Diagonal steps', prompt: 'Move your light checker diagonally forward.', target: 'step' },
  { title: 'Jump & capture', prompt: 'Jump over the dark checker to capture it.', target: 'capture' },
  { title: 'King me', prompt: 'Reach the far side to crown your checker.', target: 'crown' },
] as const
const square = (r: number, c: number) => `${'abcdefgh'[c]}${8 - r}` as Square
const glyph: Record<string, string> = { wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙', bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟' }

function initialCheckers(level: number): Piece[][] {
  const board: Piece[][] = Array.from({ length: 8 }, () => Array<Piece>(8).fill(null))
  if (level === 0) board[5][2] = { side: 'light' }
  if (level === 1) { board[5][2] = { side: 'light' }; board[4][3] = { side: 'dark' } }
  if (level === 2) board[1][2] = { side: 'light' }
  return board
}

export function BoardLessons({ kind }: { kind: Kind }) {
  const [level, setLevel] = useState(0)
  const [chess, setChess] = useState(() => new Chess())
  const [checkers, setCheckers] = useState(() => initialCheckers(0))
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [message, setMessage] = useState('Pick the highlighted piece to begin.')
  const [complete, setComplete] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const lessons = kind === 'chess' ? chessLessons : checkersLessons
  const lesson = lessons[level]
  useEffect(() => {
    const board = boardRef.current
    if (!board || prefersReducedMotion()) return
    const ctx = gsap.context(() => gsap.from('.bl-cell', { opacity: 0, scale: 0.88, duration: 0.28, stagger: { amount: 0.32, from: 'center' }, ease: 'back.out(1.5)' }), board)
    return () => ctx.revert()
  }, [kind, level])
  const reset = (next: number) => {
    setLevel(next)
    setChess(new Chess(chessLessons[next]?.fen))
    setCheckers(initialCheckers(next))
    setSelected(null)
    setComplete(false)
    setMessage('Pick the highlighted piece to begin.')
  }
  const success = () => { setComplete(true); setSelected(null); setMessage('Excellent move! Lesson complete.'); if (!prefersReducedMotion()) gsap.fromTo(boardRef.current, { scale: 1.025 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.4)' }) }
  const playChess = (r: number, c: number) => {
    const target = square(r, c)
    if (!selected) { if (chess.get(target)?.color === 'w') setSelected([r, c]); return }
    const from = square(...selected)
    if (from === target) { setSelected(null); return }
    const copy = new Chess(chess.fen())
    try {
      const move = copy.move({ from, to: target, promotion: 'q' })
      setChess(copy); setSelected(null)
      if (move.from === chessLessons[level].from && move.to === chessLessons[level].to) success()
      else setMessage('Legal move! Now try the lesson goal. You can reset the board.')
    } catch { setMessage('That move is not legal yet. Try another square.') }
  }
  const playCheckers = (r: number, c: number) => {
    if (!selected) { if (checkers[r][c]?.side === 'light') setSelected([r, c]); return }
    const [sr, sc] = selected
    if (sr === r && sc === c) { setSelected(null); return }
    const piece = checkers[sr][sc]
    const dr = r - sr, dc = c - sc
    const step = Math.abs(dr) === 1 && Math.abs(dc) === 1 && (dr < 0 || !!piece?.king)
    const jump = Math.abs(dr) === 2 && Math.abs(dc) === 2 && (dr < 0 || !!piece?.king) && checkers[(r + sr) / 2][(c + sc) / 2]?.side === 'dark'
    if (!piece || checkers[r][c] || (!step && !jump)) { setMessage('Checkers move diagonally on dark squares.'); return }
    const next = checkers.map(row => [...row]); next[sr][sc] = null
    if (jump) next[(r + sr) / 2][(c + sc) / 2] = null
    next[r][c] = { ...piece, king: piece.king || r === 0 }; setCheckers(next); setSelected(null)
    if ((level === 0 && step) || (level === 1 && jump) || (level === 2 && r === 0)) success()
    else setMessage('Nice move. Reset and try the lesson goal!')
  }
  const possible = (r: number, c: number) => {
    if (!selected) return false
    const [sr, sc] = selected
    if (kind === 'chess') return chess.moves({ square: square(sr, sc), verbose: true }).some(m => m.to === square(r, c))
    const dr = r - sr, dc = c - sc
    return !checkers[r][c] && ((dr === -1 && Math.abs(dc) === 1) || (dr === -2 && Math.abs(dc) === 2 && checkers[(r + sr) / 2][(c + sc) / 2]?.side === 'dark'))
  }
  return <section className="bl-wrap" aria-label={`${kind} lessons`}>
    <div className="bl-head"><span className="bl-mascot" aria-hidden="true">{kind === 'chess' ? '♘' : '●'}</span><div><small>LEARN BY PLAYING</small><h2>{kind === 'chess' ? 'Chess quest' : 'Checkers quest'}</h2><p>Small moves. Big brain energy.</p></div></div>
    <div className="bl-progress" aria-label={`Lesson ${level + 1} of ${lessons.length}`}>{lessons.map((item, i) => <button key={item.title} type="button" className={i === level ? 'active' : i < level ? 'done' : ''} onClick={() => reset(i)} aria-label={`Lesson ${i + 1}: ${item.title}`}>{i < level ? '✓' : i + 1}</button>)}</div>
    <div className="bl-layout"><div ref={boardRef} className="bl-board" role="grid" aria-label={`${kind} board`}>{Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => { const cp = chess.board()[r][c]; const dp = checkers[r][c]; const dark = (r + c) % 2 === 1; const active = selected?.[0] === r && selected?.[1] === c; const hint = !selected && (kind === 'chess' ? square(r,c) === chessLessons[level].from : dp?.side === 'light'); return <button key={`${r}-${c}`} type="button" role="gridcell" className={`bl-cell ${dark ? 'dark' : 'light'} ${active ? 'selected' : ''} ${possible(r,c) ? 'possible' : ''} ${hint ? 'hint' : ''}`} aria-label={`${square(r,c)} ${kind === 'chess' ? cp ? `${cp.color === 'w' ? 'white' : 'black'} ${cp.type}` : 'empty' : dp ? `${dp.side} ${dp.king ? 'king' : 'checker'}` : 'empty'}`} onClick={() => kind === 'chess' ? playChess(r,c) : playCheckers(r,c)}>{kind === 'chess' ? cp && <span className={`bl-chess ${cp.color === 'w' ? 'white' : 'black'}`}>{glyph[cp.color + cp.type]}</span> : dp && <span className={`bl-checker ${dp.side}`}>{dp.king ? '★' : ''}</span>}</button> }))}</div>
    <aside className="bl-lesson"><span className="bl-badge">LESSON {level + 1} OF {lessons.length}</span><h3>{lesson.title}</h3><p>{lesson.prompt}</p><div className={`bl-feedback ${complete ? 'complete' : ''}`} role="status">{complete ? '★ ' : '➜ '}{message}</div><div className="bl-actions"><button type="button" onClick={() => reset(level)}>Reset board</button>{complete && level < lessons.length - 1 && <button type="button" className="bl-next" onClick={() => reset(level + 1)}>Next lesson →</button>}</div></aside></div>
  </section>
}
