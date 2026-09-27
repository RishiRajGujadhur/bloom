import gsap from 'gsap'

/**
 * Two more avatars sharing the face class hooks (blink, wave, talk, page acts):
 *   pixel – 8-bit Bloom drawn on a 20×20 grid, moving in stepped frames with twinkling pixels
 *   globe – a glossy 3D sphere that slowly turns its head (features slide and foreshorten
 *           with the yaw) while a moon orbits in front of and behind it
 */
export type ExtraVariant = 'pixel' | 'globe'
export const isExtra = (d: string): d is ExtraVariant => d === 'pixel' || d === 'globe'

/* ---------- pixel ---------- */
// 20×20 sprite: . empty, o outline, b body, l light, s sprout, d dark sprout
const SPRITE = [
  '........ds..........',
  '.......dss..........',
  '......ssd...........',
  '........o...........',
  '......oooooo........',
  '....oobbbbbboo......',
  '...obllbbbbbbbo.....',
  '..obllbbbbbbbbbo....',
  '..oblbbbbbbbbbbo....',
  '.obbbbbbbbbbbbbbo...',
  '.obbbbbbbbbbbbbbo...',
  '.obbbbbbbbbbbbbbo...',
  '.obbbbbbbbbbbbbbo...',
  '..obbbbbbbbbbbbo....',
  '..obbbbbbbbbbbbo....',
  '...obbbbbbbbbbo.....',
  '....oobbbbbboo......',
  '......oooooo........',
]
const PX = 4.6
const OX = 50 - (17 * PX) / 2
const OY = 6
const colors: Record<string, string> = { o: '#5b2a1c', b: '#ff8f5a', l: '#ffc98a', s: '#6cc04a', d: '#3f8f2c' }
const px = (x: number) => OX + x * PX
const py = (y: number) => OY + y * PX

export function PixelBot() {
  const cells: React.ReactNode[] = []
  SPRITE.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c !== '.') cells.push(<rect key={`${x}-${y}`} x={px(x)} y={py(y)} width={PX + 0.2} height={PX + 0.2} fill={colors[c]} />)
    }),
  )
  return (
    <g className="bf-body" shapeRendering="crispEdges">
      <g className="bf-arm" opacity="0">
        <g className="bf-arm-swing">
          <rect x={px(15)} y={py(10)} width={PX * 2} height={PX} fill="#ff8f5a" />
          <rect x={px(16.5)} y={py(8)} width={PX} height={PX * 2} fill="#ff8f5a" />
          <rect x={px(16)} y={py(6.5)} width={PX * 2} height={PX * 1.6} fill="#ffc98a" />
        </g>
      </g>
      <g className="bf-breath">
        {cells}
        <g className="bf-eye">
          <g className="bf-pupil">
            <rect x={px(5)} y={py(8)} width={PX * 2} height={PX * 3} fill="#1f1d2b" />
            <rect x={px(10)} y={py(8)} width={PX * 2} height={PX * 3} fill="#1f1d2b" />
            <rect x={px(5)} y={py(8)} width={PX} height={PX} fill="#fff" />
            <rect x={px(10)} y={py(8)} width={PX} height={PX} fill="#fff" />
          </g>
          <rect className="bf-lid" x={px(4.8)} y={py(7.8)} width={PX * 7.4} height={PX * 3.4} fill="#ff8f5a" />
        </g>
        <g className="bf-happy" opacity="0">
          {[[5, 9], [6, 8], [7, 9], [10, 9], [11, 8], [12, 9]].map(([x, y]) => <rect key={`${x}${y}`} x={px(x)} y={py(y)} width={PX} height={PX} fill="#1f1d2b" />)}
        </g>
        {[0, 1, 2, 3].map((k) => <rect key={k} className="rb-bar" x={px(6.5 + k)} y={py(12.5)} width={PX} height={PX} fill="#5b2a1c" />)}
        <rect x={px(3)} y={py(11.5)} width={PX * 1.5} height={PX} fill="#ff6f7f" opacity="0.6" />
        <rect x={px(12.5)} y={py(11.5)} width={PX * 1.5} height={PX} fill="#ff6f7f" opacity="0.6" />
      </g>
      {[[2, 3], [16, 5], [1, 13], [17, 15]].map(([x, y]) => (
        <g key={`${x}-${y}`} className="px-star" opacity="0">
          <rect x={px(x)} y={py(y) - PX} width={PX} height={PX * 3} fill="#ffe08a" />
          <rect x={px(x) - PX} y={py(y)} width={PX * 3} height={PX} fill="#ffe08a" />
        </g>
      ))}
    </g>
  )
}

/* ---------- 3D globe ---------- */
export function GlobeBot({ uid }: { uid: string }) {
  return (
    <g className="bf-body">
      <defs>
        <radialGradient id={`gl-body-${uid}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#e9f2ff" />
          <stop offset="0.35" stopColor="#8fb2ff" />
          <stop offset="0.8" stopColor="#4a5fd6" />
          <stop offset="1" stopColor="#262f86" />
        </radialGradient>
        <radialGradient id={`gl-moon-${uid}`} cx="0.35" cy="0.3">
          <stop offset="0" stopColor="#fff6d6" />
          <stop offset="1" stopColor="#f2b53a" />
        </radialGradient>
        <clipPath id={`gl-clip-${uid}`}><circle cx="50" cy="54" r="32" /></clipPath>
      </defs>
      <circle className="gl-moon gl-moon-b" cx="50" cy="54" r="6" fill={`url(#gl-moon-${uid})`} />
      <ellipse className="gl-orbit" cx="50" cy="54" rx="46" ry="11" fill="none" stroke="#8fb2ff" strokeWidth="1.2" opacity="0.45" transform="rotate(-14 50 54)" />
      <g className="bf-arm" opacity="0">
        <g className="bf-arm-swing">
          <path d="M76 62 Q86 56 86 46" stroke="#6f8cff" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="86" cy="42" r="6" fill={`url(#gl-body-${uid})`} />
        </g>
      </g>
      <g className="bf-breath">
        <circle cx="50" cy="54" r="32" fill={`url(#gl-body-${uid})`} />
        <g clipPath={`url(#gl-clip-${uid})`}>
          {/* latitude bands give the sphere its turn */}
          <g className="gl-bands" opacity="0.18">
            {[-16, 0, 16].map((d) => <ellipse key={d} className="gl-meridian" cx="50" cy="54" rx="12" ry="32" fill="none" stroke="#fff" strokeWidth="1" transform={`translate(${d} 0)`} />)}
          </g>
          <g className="gl-face">
            <g className="bf-eye">
              <g className="bf-pupil">
                <ellipse cx="40" cy="48" rx="4.2" ry="6" fill="#141733" />
                <ellipse cx="60" cy="48" rx="4.2" ry="6" fill="#141733" />
                <circle cx="41.5" cy="45.5" r="1.5" fill="#fff" />
                <circle cx="61.5" cy="45.5" r="1.5" fill="#fff" />
              </g>
              <rect className="bf-lid" x="34" y="41" width="32" height="14" rx="6" fill="#7a97f5" />
            </g>
            <path className="bf-happy" d="M35 50 Q40 43 45 50 M55 50 Q60 43 65 50" stroke="#141733" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0" />
            {[0, 1, 2].map((k) => <rect key={k} className="rb-bar" x={45 + k * 4} y="60" width="2.6" height="4" rx="1.2" fill="#141733" />)}
          </g>
        </g>
        <ellipse cx="40" cy="36" rx="10" ry="5" fill="#fff" opacity="0.35" transform="rotate(-20 40 36)" />
      </g>
      <circle className="gl-moon gl-moon-f" cx="50" cy="54" r="6" fill={`url(#gl-moon-${uid})`} opacity="0" />
    </g>
  )
}

/** Idle animation for the extra avatars. Returns a cleanup. */
export function extraIdle(el: SVGSVGElement, variant: ExtraVariant) {
  const all: gsap.core.Animation[] = []
  if (variant === 'pixel') {
    // 8-bit bob in two-frame steps, and pixel stars that twinkle in turn.
    all.push(gsap.to(el.querySelector('.bf-breath'), { y: -PX, duration: 0.9, yoyo: true, repeat: -1, ease: 'steps(1)' }))
    all.push(gsap.timeline({ repeat: -1, repeatDelay: 1.5 }).to(el.querySelectorAll('.px-star'), { opacity: 1, duration: 0.01, stagger: { each: 0.5, yoyo: true, repeat: 1 } }))
    return () => all.forEach((a) => a.kill())
  }
  // Globe: yaw back and forth; features slide and foreshorten like a turning sphere.
  const face = el.querySelector('.gl-face')
  const meridians = el.querySelectorAll('.gl-meridian')
  const moons = el.querySelectorAll<SVGCircleElement>('.gl-moon')
  const [mb, mf] = [el.querySelector('.gl-moon-b'), el.querySelector('.gl-moon-f')]
  const yaw = { a: 0 }
  all.push(
    gsap.to(yaw, {
      a: 1,
      duration: 4.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      onUpdate: () => {
        const t = (yaw.a - 0.5) * 1.1 // radians, about ±32°
        gsap.set(face, { x: Math.sin(t) * 16, scaleX: Math.cos(t), svgOrigin: '50 54' })
        meridians.forEach((m, i) => gsap.set(m, { x: (i - 1) * 16 + Math.sin(t) * 20, attr: { rx: 12 * Math.abs(Math.cos(t + (i - 1) * 0.5)) + 1 } }))
      },
    }),
  )
  // The moon orbits on a tilted ellipse, passing in front of and behind the sphere.
  const orbit = { a: 0 }
  all.push(
    gsap.to(orbit, {
      a: Math.PI * 2,
      duration: 7,
      repeat: -1,
      ease: 'none',
      onUpdate: () => {
        const x = 50 + Math.cos(orbit.a) * 46
        const y = 54 + Math.sin(orbit.a) * 11 - Math.cos(orbit.a) * 11 * 0.25
        const z = Math.sin(orbit.a)
        moons.forEach((m) => {
          m.setAttribute('cx', String(x))
          m.setAttribute('cy', String(y))
          m.setAttribute('r', String(5 + z * 1.6))
        })
        mb?.setAttribute('opacity', z > 0 ? '0' : '1')
        mf?.setAttribute('opacity', z > 0 ? '1' : '0')
      },
    }),
  )
  return () => all.forEach((a) => a.kill())
}
