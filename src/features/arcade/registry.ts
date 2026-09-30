import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/** One Arcade game. `art` is a small SVG string for the hub card. */
export type GameDef = {
  id: string
  n: number
  title: string
  blurb: string
  tech: string
  hue: number
  art: string
  Game: LazyExoticComponent<ComponentType>
}

const g = (n: number, id: string, title: string, blurb: string, tech: string, hue: number, art: string, load: () => Promise<{ default: ComponentType }>): GameDef =>
  ({ n, id, title, blurb, tech, hue, art, Game: lazy(load) })

export const GAMES: GameDef[] = [
  g(1, 'pantry', 'Pantry Tetris', 'Drop the shopping into the fridge so the door still shuts.', 'matter-js · SVG', 190,
    '<rect x="14" y="8" width="36" height="48" rx="5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="26" cy="44" r="6" fill="currentColor"/><rect x="33" y="36" width="10" height="14" rx="2" fill="currentColor" opacity=".6"/><rect x="22" y="26" width="18" height="8" rx="3" fill="currentColor" opacity=".8"/>',
    () => import('./games/PantryTetris')),
  g(2, 'coins', 'Coin Cascade', 'A month of coins, a board of pegs and four hungry jars.', 'matter-js · SVG', 45,
    '<circle cx="20" cy="14" r="4" fill="currentColor"/><circle cx="36" cy="14" r="4" fill="currentColor"/><circle cx="28" cy="26" r="4" fill="currentColor"/><circle cx="44" cy="26" r="4" fill="currentColor"/><path d="M8 40h14v16H8zM26 40h14v16H26zM44 40h14v16H44z" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="33" cy="48" r="5" fill="currentColor" opacity=".7"/>',
    () => import('./games/CoinCascade')),
  g(3, 'knots', 'Knot Garden', 'Follow the firefly and tie the rope to light each lantern.', 'p5.js · verlet rope', 95,
    '<path d="M10 8c20 6 30 14 22 24s-20 12-6 20 24 2 28-6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="22" cy="24" r="4" fill="currentColor"/><circle cx="42" cy="36" r="4" fill="currentColor"/><rect x="44" y="46" width="10" height="14" rx="3" fill="currentColor" opacity=".7"/>',
    () => import('./games/KnotGarden')),
]
