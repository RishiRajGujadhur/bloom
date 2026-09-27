import gsap from 'gsap'

/**
 * Three orange robots built on the robot avatar's skeleton (same class hooks,
 * so blinks, waves, talking and page acts all work) but each with its own
 * idle life:
 *   spark  – antenna crackles with sparks, ring eyes pulse, head tilts curiously
 *   beacon – dome head, a spinning radar dish and a scanner eye sweeping side to side
 *   tinker – boxy workshop bot, a gear turning in its temple and steam puffing from its ears
 */
export type OrangeVariant = 'spark' | 'beacon' | 'tinker'
export const isOrange = (d: string): d is OrangeVariant => d === 'spark' || d === 'beacon' || d === 'tinker'

const O = '#ff8a2a'
const O2 = '#ffc27a'
const DARK = '#2a1405'

function Arm() {
  return (
    <g className="bf-arm" opacity="0">
      <g className="bf-arm-swing">
        <path d="M74 62 L84 58 L88 44" stroke={O} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
        <circle cx="88" cy="40" r="5.5" fill={DARK} stroke={O} strokeWidth="2" />
      </g>
    </g>
  )
}
function Mouth({ y = 70 }: { y?: number }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((k) => (
        <rect key={k} className="rb-bar" x={37 + k * 5.5} y={y} width="3.5" height="6" rx="1.5" fill={O} />
      ))}
    </g>
  )
}

export function OrangeBot({ variant, uid }: { variant: OrangeVariant; uid: string }) {
  const head = `ob-head-${uid}`
  const defs = (
    <defs>
      <linearGradient id={head} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4a240a" />
        <stop offset="1" stopColor={DARK} />
      </linearGradient>
      <radialGradient id={`ob-glow-${uid}`}>
        <stop offset="0" stopColor={O2} />
        <stop offset="1" stopColor={O} stopOpacity="0" />
      </radialGradient>
    </defs>
  )
  if (variant === 'spark')
    return (
      <g className="bf-body">
        {defs}
        <Arm />
        <g className="bf-breath">
          <g className="os-antenna">
            <path d="M50 22 Q46 16 50 12" stroke={O} strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle className="os-bulb" cx="50" cy="9" r="4.5" fill={O2} />
            {[0, 1, 2, 3].map((k) => {
              const a = (k / 4) * Math.PI * 2 + 0.4
              return <line key={k} className="os-spark" x1={50 + Math.cos(a) * 7} y1={9 + Math.sin(a) * 7} x2={50 + Math.cos(a) * 12} y2={9 + Math.sin(a) * 12} stroke="#ffe08a" strokeWidth="2" strokeLinecap="round" opacity="0" />
            })}
          </g>
          <rect x="16" y="22" width="68" height="60" rx="22" fill={`url(#${head})`} stroke={O} strokeWidth="2.5" />
          <circle cx="16" cy="52" r="5" fill={DARK} stroke={O} strokeWidth="1.5" />
          <circle cx="84" cy="52" r="5" fill={DARK} stroke={O} strokeWidth="1.5" />
          <g className="bf-eye">
            <rect x="24" y="32" width="52" height="30" rx="15" fill="#140800" />
            <g className="bf-pupil">
              <circle className="os-ring" cx="39" cy="47" r="7" fill="none" stroke={O} strokeWidth="3.5" />
              <circle className="os-ring" cx="61" cy="47" r="7" fill="none" stroke={O} strokeWidth="3.5" />
              <circle cx="39" cy="47" r="2.2" fill={O2} />
              <circle cx="61" cy="47" r="2.2" fill={O2} />
            </g>
            <rect className="bf-lid" x="23" y="31" width="54" height="32" rx="15" fill="#4a240a" />
          </g>
          <path className="bf-happy" d="M32 50 L39 43 L46 50 M54 50 L61 43 L68 50" stroke={O} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0" />
          <Mouth />
        </g>
      </g>
    )
  if (variant === 'beacon')
    return (
      <g className="bf-body">
        {defs}
        <Arm />
        <g className="bf-breath">
          <line x1="50" y1="24" x2="50" y2="14" stroke={O} strokeWidth="3" strokeLinecap="round" />
          <g className="ob-dish">
            <path d="M40 12 Q50 2 60 12 Z" fill={O} stroke={O2} strokeWidth="1" />
            <circle cx="50" cy="8" r="1.8" fill="#fff" />
          </g>
          <path d="M16 56 C16 30 32 20 50 20 C68 20 84 30 84 56 V70 Q84 82 72 82 H28 Q16 82 16 70 Z" fill={`url(#${head})`} stroke={O} strokeWidth="2.5" />
          <g className="bf-eye">
            <rect x="22" y="38" width="56" height="18" rx="9" fill="#140800" stroke="#6b3510" strokeWidth="1.5" />
            <g className="bf-pupil">
              <circle className="ob-glow" cx="50" cy="47" r="12" fill={`url(#ob-glow-${uid})`} />
              <rect className="ob-scan" x="44" y="42" width="12" height="10" rx="4" fill={O} />
            </g>
            <rect className="bf-lid" x="21" y="37" width="58" height="20" rx="10" fill="#4a240a" />
          </g>
          <path className="bf-happy" d="M30 50 Q40 40 50 50 Q60 40 70 50" stroke={O} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0" />
          <Mouth y={66} />
        </g>
      </g>
    )
  return (
    <g className="bf-body">
      {defs}
      <Arm />
      <g className="bf-breath">
        {[0, 1, 2].map((k) => <circle key={`l${k}`} className="ot-puff ot-puff-l" cx="10" cy="44" r={3 + k} fill="#fff" opacity="0" />)}
        {[0, 1, 2].map((k) => <circle key={`r${k}`} className="ot-puff ot-puff-r" cx="90" cy="44" r={3 + k} fill="#fff" opacity="0" />)}
        <rect x="42" y="14" width="16" height="8" rx="2" fill={O} />
        <rect x="46" y="10" width="8" height="5" rx="1.5" fill={O2} />
        <rect x="14" y="22" width="72" height="60" rx="8" fill={`url(#${head})`} stroke={O} strokeWidth="2.5" />
        {[20, 80].map((x) => [28, 76].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill={O2} />))}
        <g className="ot-gear" transform="translate(84 40)">
          {Array.from({ length: 8 }, (_, k) => <rect key={k} x="-1.8" y="-9" width="3.6" height="4" fill={O} transform={`rotate(${k * 45})`} />)}
          <circle r="6" fill={O} />
          <circle r="2.2" fill={DARK} />
        </g>
        <g className="bf-eye">
          <rect x="24" y="34" width="52" height="24" rx="4" fill="#140800" />
          <g className="bf-pupil">
            <rect x="32" y="40" width="12" height="12" rx="2" fill={O} />
            <rect x="56" y="40" width="12" height="12" rx="2" fill={O} />
            <rect x="34" y="42" width="3" height="3" fill="#fff" opacity="0.7" />
            <rect x="58" y="42" width="3" height="3" fill="#fff" opacity="0.7" />
          </g>
          <rect className="bf-lid" x="23" y="33" width="54" height="26" rx="4" fill="#4a240a" />
        </g>
        <path className="bf-happy" d="M32 50 L38 44 L44 50 M56 50 L62 44 L68 50" stroke={O} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0" />
        <Mouth y={66} />
      </g>
    </g>
  )
}

/** Each orange robot's own idle animation. Returns a cleanup. */
export function orangeIdle(el: SVGSVGElement, variant: OrangeVariant) {
  const q = (s: string) => el.querySelectorAll(s)
  const one = (s: string) => el.querySelector(s)
  const tweens: (gsap.core.Animation | gsap.core.Tween)[] = []
  if (variant === 'spark') {
    // Curious head tilt, pulsing ring eyes, and a crackle of sparks every few seconds.
    tweens.push(gsap.fromTo(one('.bf-breath'), { rotate: -4 }, { rotate: 4, svgOrigin: '50 82', duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }))
    tweens.push(gsap.to(q('.os-ring'), { attr: { r: 8.5 }, duration: 1.1, yoyo: true, repeat: -1, stagger: 0.25, ease: 'sine.inOut' }))
    const crackle = gsap.timeline({ repeat: -1, repeatDelay: 3.5 })
    crackle
      .to(one('.os-bulb'), { attr: { fill: '#fff6c8' }, duration: 0.08, yoyo: true, repeat: 5 }, 0)
      .fromTo(q('.os-spark'), { opacity: 0, scale: 0.4, svgOrigin: '50 9' }, { opacity: 1, scale: 1.3, svgOrigin: '50 9', duration: 0.12, stagger: 0.05, yoyo: true, repeat: 1, ease: 'power2.out' }, 0)
    tweens.push(crackle)
  } else if (variant === 'beacon') {
    // Radar dish spins (faked 3D with scaleX), scanner eye sweeps like a lighthouse.
    tweens.push(gsap.to(one('.ob-dish'), { scaleX: -1, svgOrigin: '50 10', duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut' }))
    tweens.push(gsap.fromTo(q('.ob-scan, .ob-glow'), { x: -18 }, { x: 18, duration: 1.8, yoyo: true, repeat: -1, ease: 'sine.inOut' }))
    tweens.push(gsap.to(one('.ob-glow'), { opacity: 0.4, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut' }))
  } else {
    // The gear turns steadily and steam puffs from both ears now and then.
    tweens.push(gsap.to(one('.ot-gear'), { rotate: 360, svgOrigin: '84 40', duration: 6, repeat: -1, ease: 'none' }))
    const steam = gsap.timeline({ repeat: -1, repeatDelay: 4 })
    steam
      .fromTo(q('.ot-puff-l'), { x: 0, y: 0, opacity: 0.8 }, { x: -8, y: -18, opacity: 0, duration: 1.4, stagger: 0.18, ease: 'power1.out' }, 0)
      .fromTo(q('.ot-puff-r'), { x: 0, y: 0, opacity: 0.8 }, { x: 8, y: -18, opacity: 0, duration: 1.4, stagger: 0.18, ease: 'power1.out' }, 0.1)
    tweens.push(steam)
  }
  return () => tweens.forEach((t) => t.kill())
}
