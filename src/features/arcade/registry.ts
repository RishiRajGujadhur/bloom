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
  g(4, 'burners', 'Burner Juggle', 'Four burners, a stack of orders and ninety seconds of heat.', 'GSAP · SVG', 18,
    '<circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="44" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="20" cy="44" r="11" fill="currentColor" opacity=".7"/><circle cx="44" cy="44" r="11" fill="none" stroke="currentColor" stroke-width="3"/><path d="M16 50q4-10 8 0M40 26q4-10 8 0" fill="none" stroke="currentColor" stroke-width="2"/>',
    () => import('./games/BurnerJuggle')),
  g(5, 'laundry', 'Laundry Sorter', 'Grab and fling the pile into the right baskets before it topples.', 'matter-js · SVG', 210,
    '<path d="M16 12l8-4h16l8 4-4 8-4-2v26H24V18l-4 2z" fill="currentColor" opacity=".8"/><path d="M8 50h48l-4 10H12z" fill="none" stroke="currentColor" stroke-width="3"/>',
    () => import('./games/LaundrySorter')),
  g(6, 'orchard', 'Compound Orchard', 'Plant, wait, harvest. Trees grow on what they’ve already grown.', 'Babylon.js 3D', 130,
    '<ellipse cx="32" cy="52" rx="26" ry="7" fill="currentColor" opacity=".3"/><rect x="18" y="30" width="4" height="18" fill="currentColor"/><circle cx="20" cy="26" r="8" fill="currentColor" opacity=".8"/><rect x="40" y="22" width="5" height="26" fill="currentColor"/><circle cx="42" cy="16" r="13" fill="currentColor"/><circle cx="36" cy="18" r="2.5" fill="#fff"/><circle cx="47" cy="12" r="2.5" fill="#fff"/>',
    () => import('./games/CompoundOrchard')),
  g(7, 'scam', 'Scam Bubbles', 'Pop the sketchy messages before they reach your phone.', 'GSAP · SVG', 200,
    '<circle cx="22" cy="40" r="14" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="42" cy="22" r="11" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="46" cy="48" r="7" fill="currentColor" opacity=".6"/><path d="M16 36h12M16 42h9" stroke="currentColor" stroke-width="2.5"/><path d="M38 18l8 8M46 18l-8 8" stroke="currentColor" stroke-width="2.5"/>',
    () => import('./games/ScamBubbles')),
  g(8, 'lighthouse', 'Focus Lighthouse', 'Hold the beam steady and guide every ship past the rocks.', 'Three.js 3D', 230,
    '<path d="M28 58l3-40h6l3 40z" fill="currentColor"/><rect x="27" y="10" width="14" height="8" rx="2" fill="currentColor" opacity=".7"/><path d="M41 12L62 4v18z" fill="currentColor" opacity=".35"/><path d="M4 58c8-4 16-4 24 0" stroke="currentColor" stroke-width="3" fill="none"/>',
    () => import('./games/FocusLighthouse')),
  g(9, 'kite', 'Breath Kite', 'Hold to climb, let go to glide, and thread the rings on the wind.', 'SVG · GSAP', 350,
    '<path d="M32 6l14 18-14 22-14-22z" fill="currentColor" opacity=".85"/><path d="M32 46c-4 6 4 8 0 12" stroke="currentColor" stroke-width="2.5" fill="none"/><ellipse cx="52" cy="40" rx="4" ry="10" fill="none" stroke="currentColor" stroke-width="3"/>',
    () => import('./games/BreathKite')),
  g(10, 'crossing', 'Traffic Light Crossing', 'Hop across four busy lanes to run the day’s errands.', 'PlayCanvas 3D', 10,
    '<rect x="4" y="22" width="56" height="26" fill="currentColor" opacity=".25"/><path d="M28 22v26M36 22v26" stroke="currentColor" stroke-width="3" stroke-dasharray="3 3"/><rect x="50" y="4" width="8" height="18" rx="2" fill="currentColor"/><circle cx="54" cy="9" r="2.5" fill="#fff"/><rect x="8" y="28" width="14" height="7" rx="2" fill="currentColor"/>',
    () => import('./games/TrafficCrossing')),
  g(11, 'sleep', 'Sleep Tide', 'Hush the glowing room and let the moon-tide of sleep rise.', 'SVG · GSAP', 240,
    '<rect x="8" y="8" width="30" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="28" cy="18" r="5" fill="currentColor"/><path d="M8 30q8-4 15 0t15 0" stroke="currentColor" stroke-width="3" fill="none"/><rect x="10" y="44" width="46" height="10" rx="4" fill="currentColor" opacity=".7"/><text x="44" y="30" font-size="12" fill="currentColor">z</text>',
    () => import('./games/SleepTide')),
  g(12, 'recycle', 'Recycling Rush', 'Drop each item off the conveyor into the right bin.', 'matter-js · SVG', 150,
    '<rect x="4" y="12" width="56" height="8" rx="3" fill="currentColor" opacity=".5"/><circle cx="20" cy="8" r="5" fill="currentColor"/><circle cx="40" cy="8" r="5" fill="currentColor" opacity=".7"/><path d="M10 30h14l-2 26H12zM28 30h14l-2 26H30zM46 30h12l-2 26H48z" fill="currentColor" opacity=".85"/>',
    () => import('./games/RecyclingRush')),
  g(13, 'pond', 'Listening Pond', 'Koi only rise when the water is still. Wait for them.', 'p5.js generative', 175,
    '<ellipse cx="32" cy="34" rx="28" ry="20" fill="none" stroke="currentColor" stroke-width="3"/><path d="M20 34q8-8 18 0q-10 8-18 0z" fill="currentColor"/><path d="M38 34l8-5v10z" fill="currentColor"/><circle cx="46" cy="22" r="6" fill="currentColor" opacity=".5"/>',
    () => import('./games/ListeningPond')),
  g(14, 'dessert', 'Delay Dessert', 'Wait for a taller cake… if the cat lets you.', 'SVG · GSAP', 330,
    '<rect x="16" y="40" width="32" height="10" rx="3" fill="currentColor"/><rect x="18" y="30" width="28" height="10" rx="3" fill="currentColor" opacity=".75"/><rect x="20" y="20" width="24" height="10" rx="3" fill="currentColor" opacity=".55"/><circle cx="32" cy="15" r="4" fill="currentColor"/><path d="M4 56h56" stroke="currentColor" stroke-width="3"/>',
    () => import('./games/DelayDessert')),
  g(15, 'campfire', 'Camp Fire', 'Stack tinder, kindling and logs and keep the night warm.', 'matter-js · canvas', 25,
    '<path d="M32 10c6 10 12 14 12 24a12 12 0 0 1-24 0c0-6 4-8 6-14 2 6 6 6 6-10z" fill="currentColor"/><path d="M10 54l44-10M10 44l44 10" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".7"/>',
    () => import('./games/CampFire')),
  g(16, 'germs', 'Germ Wash', 'Scrub the wiggly germs off before the song ends.', 'SVG · GSAP', 195,
    '<path d="M20 58V30l-4-14a3 3 0 0 1 6-1l4 12V10a3 3 0 0 1 6 0v16V8a3 3 0 0 1 6 0v18V12a3 3 0 0 1 6 0v30c0 8-6 16-14 16z" fill="currentColor" opacity=".8"/><circle cx="48" cy="46" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="12" cy="42" r="4" fill="none" stroke="currentColor" stroke-width="2"/>',
    () => import('./games/GermWash')),
  g(17, 'stars', 'Star Compass', 'No phone, no map. Find north in a turning night sky.', 'Three.js 3D', 250,
    '<circle cx="12" cy="40" r="2.5" fill="currentColor"/><circle cx="20" cy="46" r="2.5" fill="currentColor"/><circle cx="28" cy="42" r="2.5" fill="currentColor"/><circle cx="34" cy="34" r="2.5" fill="currentColor"/><circle cx="38" cy="26" r="2.5" fill="currentColor"/><path d="M38 26L48 10" stroke="currentColor" stroke-dasharray="2 3" stroke-width="2"/><path d="M48 4l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="currentColor"/>',
    () => import('./games/StarCompass')),
  g(18, 'suitcase', 'Pack the Suitcase', 'Everything you need, one carry-on, and the taxi’s coming.', 'SVG · GSAP', 215,
    '<rect x="8" y="18" width="48" height="36" rx="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 18v-6h16v6" stroke="currentColor" stroke-width="3" fill="none"/><rect x="12" y="22" width="14" height="14" rx="2" fill="currentColor"/><rect x="28" y="22" width="10" height="28" rx="2" fill="currentColor" opacity=".6"/><rect x="40" y="36" width="12" height="14" rx="2" fill="currentColor" opacity=".8"/>',
    () => import('./games/PackSuitcase')),
  g(19, 'dragon', 'Debt Dragon', 'Mine crystals and feed the dragon before it outgrows the cave.', 'Babylon.js 3D', 350,
    '<path d="M10 44c4-14 18-20 30-16l8-10 2 12c6 4 8 10 6 16H10z" fill="currentColor"/><path d="M26 30l-8-14 14 8z" fill="currentColor" opacity=".7"/><circle cx="46" cy="36" r="2" fill="#fff"/><path d="M8 52h48" stroke="currentColor" stroke-width="3"/>',
    () => import('./games/DebtDragon')),
  g(20, 'forge', 'Pomodoro Forge', 'Strike while the iron’s hot, then let it glow again.', 'SVG · GSAP', 28,
    '<path d="M10 40h36l6-6v8H40l-4 10h8v4H16v-4h8l-4-10H10z" fill="currentColor"/><rect x="30" y="8" width="8" height="24" rx="2" fill="currentColor" opacity=".6" transform="rotate(-35 34 20)"/><rect x="18" y="8" width="20" height="10" rx="2" fill="currentColor" transform="rotate(-35 34 20)"/><circle cx="46" cy="30" r="2" fill="currentColor"/><circle cx="52" cy="24" r="1.5" fill="currentColor"/>',
    () => import('./games/PomodoroForge')),
  g(21, 'plate', 'Plate Painter', 'Paint the meal onto a spinning plate the way the chef likes it.', 'SVG · GSAP', 100,
    '<circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 32V12a20 20 0 0 1 0 40z" fill="currentColor"/><path d="M32 32H12a20 20 0 0 1 20-20z" fill="currentColor" opacity=".6"/><path d="M32 32V52a20 20 0 0 1-20-20z" fill="currentColor" opacity=".35"/>',
    () => import('./games/PlatePainter')),
  g(22, 'posture', 'Posture Tower', 'Stack a tall spine while the chair keeps slumping.', 'matter-js · SVG', 40,
    '<rect x="22" y="8" width="20" height="7" rx="3" fill="currentColor"/><rect x="21" y="17" width="22" height="7" rx="3" fill="currentColor" opacity=".85"/><rect x="20" y="26" width="24" height="7" rx="3" fill="currentColor" opacity=".7"/><rect x="19" y="35" width="26" height="7" rx="3" fill="currentColor" opacity=".55"/><rect x="12" y="46" width="40" height="7" rx="3" fill="currentColor" transform="rotate(-6 32 50)"/>',
    () => import('./games/PostureTower')),
  g(23, 'hose', 'Hydration Hose', 'Keep every pot happy and every jogger refreshed.', 'canvas particles', 205,
    '<path d="M6 56q10-2 14-14" stroke="currentColor" stroke-width="5" fill="none"/><rect x="18" y="36" width="12" height="7" rx="2" fill="currentColor" transform="rotate(-40 24 40)"/><path d="M30 30q10-14 20-8" stroke="currentColor" stroke-dasharray="2 4" stroke-width="3" fill="none"/><path d="M44 44h14l-2 12H46z" fill="currentColor" opacity=".7"/><path d="M51 44v-8" stroke="currentColor" stroke-width="3"/>',
    () => import('./games/HydrationHose')),
  g(24, 'bike', 'Bike Fix', 'Dunk the tyre, follow the bubbles, patch and pump.', 'Three.js 3D', 185,
    '<circle cx="32" cy="28" r="20" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="32" cy="28" r="3" fill="currentColor"/><path d="M32 28L32 10M32 28L48 36M32 28L16 36" stroke="currentColor" stroke-width="1.5"/><rect x="4" y="42" width="56" height="18" rx="3" fill="currentColor" opacity=".35"/><circle cx="40" cy="50" r="2" fill="currentColor"/><circle cx="43" cy="44" r="1.5" fill="currentColor"/>',
    () => import('./games/BikeFix')),
  g(25, 'clocks', 'Clock Juggler', 'Bread, laundry, parking, tea: tap each timer just in time.', 'SVG · GSAP', 265,
    '<circle cx="20" cy="22" r="13" fill="none" stroke="currentColor" stroke-width="3"/><path d="M20 22V13M20 22l6 4" stroke="currentColor" stroke-width="2.5"/><circle cx="44" cy="42" r="15" fill="none" stroke="currentColor" stroke-width="3"/><path d="M44 42V31M44 42l-7 5" stroke="currentColor" stroke-width="2.5"/><path d="M44 27a15 15 0 0 1 12 8" stroke="currentColor" stroke-width="5" fill="none" opacity=".5"/>',
    () => import('./games/ClockJuggler')),
  g(26, 'knife', 'Knife Rhythm', 'Slice on the beat for even, perfect pieces.', 'p5.js', 30,
    '<rect x="6" y="36" width="44" height="14" rx="7" fill="currentColor" opacity=".7"/><path d="M40 6h6v26H34z" fill="currentColor"/><rect x="40" y="0" width="6" height="8" rx="2" fill="currentColor" opacity=".6"/><path d="M18 36v14M26 36v14" stroke="#fff" stroke-width="2" stroke-dasharray="2 2"/>',
    () => import('./games/KnifeRhythm')),
]
