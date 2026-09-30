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
]
