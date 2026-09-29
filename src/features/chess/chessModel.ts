import { Chess, type Move, type Square } from 'chess.js'
import seedrandom from 'seedrandom'

/**
 * Chess Academy model: piece lessons (move a lone piece to collect stars),
 * verified mate-in-one puzzles, and a small alpha-beta engine for Bloom.
 */
export type PieceCode = 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP' | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP'
export const FILES = 'abcdefgh'
export const sq = (f: number, r: number) => `${FILES[f]}${r + 1}` as Square
export const fr = (s: string) => [FILES.indexOf(s[0]), Number(s[1]) - 1] as const

/* ---------- Lessons: a lone piece on an empty board ---------- */
export type Lesson = { id: string; piece: PieceCode; title: string; tip: string; start: Square; stars: Square[] }
export const lessons: Lesson[] = [
  { id: 'rook', piece: 'wR', title: 'The Rook', tip: 'Rooks slide any distance in straight lines — up, down, left or right.', start: 'a1', stars: ['a8', 'h8', 'h1'] },
  { id: 'bishop', piece: 'wB', title: 'The Bishop', tip: 'Bishops slide diagonally and stay on their colour forever.', start: 'c1', stars: ['f4', 'h6', 'a3'] },
  { id: 'queen', piece: 'wQ', title: 'The Queen', tip: 'The queen combines rook and bishop: straight lines and diagonals.', start: 'd1', stars: ['d8', 'a5', 'h4'] },
  { id: 'king', piece: 'wK', title: 'The King', tip: 'The king moves one square in any direction. Keep him safe!', start: 'e1', stars: ['e3', 'g4', 'f2'] },
  { id: 'knight', piece: 'wN', title: 'The Knight', tip: 'Knights jump in an L: two squares one way, one square sideways. They can hop over pieces.', start: 'b1', stars: ['c3', 'e4', 'g5'] },
  { id: 'pawn', piece: 'wP', title: 'The Pawn', tip: 'Pawns move forward one square — or two on their first move — and capture diagonally.', start: 'e2', stars: ['e4', 'e6'] },
]

/** Moves for a lone piece on an empty board (lessons). */
export function loneMoves(piece: PieceCode, from: Square, moved: boolean): Square[] {
  const [f, r] = fr(from)
  const out: Square[] = []
  const inside = (x: number, y: number) => x >= 0 && x < 8 && y >= 0 && y < 8
  const slide = (dirs: [number, number][]) => {
    for (const [dx, dy] of dirs) for (let k = 1; k < 8; k++) if (inside(f + dx * k, r + dy * k)) out.push(sq(f + dx * k, r + dy * k))
  }
  const step = (dirs: [number, number][]) => {
    for (const [dx, dy] of dirs) if (inside(f + dx, r + dy)) out.push(sq(f + dx, r + dy))
  }
  const straight: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  const diag: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
  switch (piece[1]) {
    case 'R': slide(straight); break
    case 'B': slide(diag); break
    case 'Q': slide([...straight, ...diag]); break
    case 'K': step([...straight, ...diag]); break
    case 'N': step([[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]); break
    case 'P':
      step([[0, 1]])
      if (!moved && r === 1) out.push(sq(f, r + 2))
      break
  }
  return out
}

/** Fewest moves to collect the stars in order (breadth-first search per leg). */
export function par(lesson: Lesson) {
  let at = lesson.start
  let moved = false
  let total = 0
  for (const star of lesson.stars) {
    const seen = new Map<string, number>([[at, 0]])
    const queue: [Square, boolean][] = [[at, moved]]
    while (queue.length) {
      const [s, m] = queue.shift()!
      if (s === star) break
      for (const n of loneMoves(lesson.piece, s, m)) if (!seen.has(n)) {
        seen.set(n, seen.get(s)! + 1)
        queue.push([n, true])
      }
    }
    total += seen.get(star) ?? 0
    at = star
    moved = true
  }
  return total
}

/* ---------- Puzzles (verified mate in one) ---------- */
export type Puzzle = { id: string; title: string; fen: string; hint: string; theme: string }
export const puzzles: Puzzle[] = [
  { id: 'backrank', title: 'Back-rank mate', fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', hint: 'The black king is trapped behind its own pawns.', theme: 'Back rank' },
  { id: 'scholar', title: 'Scholar’s mate', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', hint: 'f7 is only defended by the king.', theme: 'Weak f7' },
  { id: 'smothered', title: 'Smothered mate', fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', hint: 'The king is boxed in by its own pieces — only a knight can reach it.', theme: 'Knight' },
  { id: 'kq', title: 'King and queen', fen: 'k7/8/1K6/8/8/8/8/7Q w - - 0 1', hint: 'Your king guards the escape squares; the queen gives the check.', theme: 'Endgame' },
  { id: 'rooks', title: 'Rook ladder', fen: '7k/R7/8/8/8/8/8/KR6 w - - 0 1', hint: 'One rook cuts off the 7th rank; the other delivers on the 8th.', theme: 'Two rooks' },
  { id: 'arabian', title: 'Arabian mate', fen: '7k/R7/5N2/8/8/8/8/6K1 w - - 0 1', hint: 'The knight protects the rook next to the king.', theme: 'Rook + knight' },
]

/* ---------- Engine ---------- */
const value: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }
const centre = (s: string) => {
  const [f, r] = fr(s)
  return 14 - (Math.abs(3.5 - f) + Math.abs(3.5 - r)) * 4
}
export function evaluate(game: Chess) {
  if (game.isCheckmate()) return game.turn() === 'w' ? -100000 : 100000
  if (game.isDraw()) return 0
  let score = 0
  for (const row of game.board()) for (const p of row) {
    if (!p) continue
    const v = value[p.type] + (p.type === 'n' || p.type === 'b' || p.type === 'p' ? centre(p.square) : 0)
    score += p.color === 'w' ? v : -v
  }
  return score
}
function negamax(game: Chess, depth: number, alpha: number, beta: number, sign: number): number {
  if (depth === 0 || game.isGameOver()) return sign * evaluate(game)
  let best = -Infinity
  const moves = game.moves({ verbose: true }).sort((a, b) => Number(!!b.captured) - Number(!!a.captured))
  for (const m of moves) {
    game.move(m)
    const score = -negamax(game, depth - 1, -beta, -alpha, -sign)
    game.undo()
    if (score > best) best = score
    if (best > alpha) alpha = best
    if (alpha >= beta) break
  }
  return best
}
/** Pick a move for the side to move. Level 1 = playful, 2 = solid, 3 = sharp. */
export function bestMove(fen: string, level: 1 | 2 | 3, seed = String(Date.now())): Move | null {
  const game = new Chess(fen)
  const moves = game.moves({ verbose: true })
  if (!moves.length) return null
  const rng = seedrandom(seed)
  const sign = game.turn() === 'w' ? 1 : -1
  const depth = level === 3 ? 3 : level === 2 ? 2 : 1
  let best: Move[] = []
  let bestScore = -Infinity
  for (const m of moves) {
    game.move(m)
    const score = -negamax(game, depth - 1, -Infinity, Infinity, -sign) + (level === 1 ? rng() * 120 : rng() * 8)
    game.undo()
    if (score > bestScore + 1e-9) {
      bestScore = score
      best = [m]
    } else if (Math.abs(score - bestScore) < 1e-9) best.push(m)
  }
  return best[Math.floor(rng() * best.length)]
}

export const glyph: Record<PieceCode, string> = {
  // Solid glyphs for both sides; colour comes from the SVG fill.
  wK: '♚', wQ: '♛', wR: '♜', wB: '♝', wN: '♞', wP: '♟',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
}
/** chess.js board → { square: PieceCode } */
export function positionOf(game: Chess) {
  const out: Record<string, PieceCode> = {}
  for (const row of game.board()) for (const p of row) if (p) out[p.square] = `${p.color}${p.type.toUpperCase()}` as PieceCode
  return out
}
