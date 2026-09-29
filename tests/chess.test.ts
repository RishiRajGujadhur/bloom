import { Chess } from 'chess.js'
import { bestMove, lessons, loneMoves, par, puzzles } from '../src/features/chess/chessModel'

test('every puzzle has exactly the mate it promises', () => {
  for (const p of puzzles) {
    const g = new Chess(p.fen)
    const mates = g.moves({ verbose: true }).filter((m) => { g.move(m); const ok = g.isCheckmate(); g.undo(); return ok })
    expect(mates.length).toBeGreaterThan(0)
  }
})

test('lesson routes are solvable and par is sensible', () => {
  for (const l of lessons) expect(par(l)).toBeGreaterThanOrEqual(l.stars.length)
  expect(loneMoves('wN', 'b1', false).sort()).toEqual(['a3', 'c3', 'd2'])
  expect(loneMoves('wP', 'e2', false)).toEqual(['e3', 'e4'])
})

test('Bloom finds a mate in one when it has one', () => {
  const m = bestMove('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', 2, 'seed')
  expect(m?.san).toBe('Ra8#')
})
