import gsap from 'gsap'

/**
 * Page acts: when you arrive on a page, Bloom briefly acts it out with a prop
 * — lifting a dumbbell on Exercise, burning a note on Let it go, writing in
 * the Daybook, dozing on Sleep… Props are SVG drawn around the face (viewBox
 * 0 -2 100 108) and animated with GSAP, then fade away.
 */
export type Act =
  | 'lift' | 'burn' | 'write' | 'sleep' | 'meditate' | 'timer' | 'coins' | 'water' | 'hearts'
  | 'think' | 'music' | 'check' | 'karate' | 'eat' | 'sun' | 'run' | 'wave'

export const pageActs: Record<string, Act> = {
  exercises: 'lift', workouts: 'lift', body: 'lift', intervals: 'timer',
  release: 'burn',
  english: 'write',
  joys: 'hearts',
  daybook: 'write', journal: 'write', ink: 'write', epiphanies: 'think', voice: 'music',
  sleep: 'sleep',
  meditate: 'meditate', breathe: 'meditate', breathwork: 'meditate', yoga: 'meditate', mala: 'meditate', taichi: 'meditate', monk: 'meditate',
  focus: 'timer', 'focus-room': 'timer',
  money: 'coins', shop: 'coins', collectibles: 'coins',
  habits: 'water', growth: 'water', world: 'water',
  mood: 'hearts', gratitude: 'hearts', affirm: 'hearts', mirror: 'hearts',
  games: 'think', cards: 'think', palace: 'think', mindmaps: 'think', lab: 'think', explore: 'think',
  sounds: 'music', mixer: 'music',
  todos: 'check', calendar: 'check', planning: 'check', routines: 'check', roadmap: 'check', challenges: 'check',
  dojo: 'karate',
  diet: 'eat', fasting: 'eat', scan: 'eat',
  daylight: 'sun', eyes: 'sun', screen: 'sun',
  run: 'run', stretch: 'run', posture: 'run',
}

const G = '#39ff6a'
/** The SVG prop for an act (drawn in the face's coordinate space). */
export function ActProp({ act, robot }: { act: Act; robot: boolean }) {
  const ink = robot ? G : '#5b3a2e'
  const accent = robot ? G : '#e0703f'
  switch (act) {
    case 'lift':
      return (
        <g className="act act-lift">
          <g className="act-dumbbell">
            <rect x="18" y="-1" width="64" height="4" rx="2" fill={ink} />
            <rect x="12" y="-7" width="8" height="16" rx="2" fill={accent} />
            <rect x="80" y="-7" width="8" height="16" rx="2" fill={accent} />
            <path d="M30 3 L26 24 M70 3 L74 24" stroke={robot ? G : '#ff9458'} strokeWidth="5" strokeLinecap="round" />
          </g>
          <text className="act-sweat" x="84" y="30" fontSize="9">💧</text>
        </g>
      )
    case 'burn':
      return (
        <g className="act act-burn">
          <g className="act-paper">
            <rect x="72" y="46" width="22" height="28" rx="2" fill={robot ? '#0b2a14' : '#fffaf0'} stroke={ink} strokeWidth="1.5" />
            <path d="M76 54 H90 M76 59 H88 M76 64 H90" stroke={ink} strokeWidth="1.2" opacity="0.6" />
          </g>
          <path className="act-flame" d="M83 74 C 76 66, 80 58, 83 52 C 86 58, 92 64, 83 74 Z" fill={robot ? G : '#ff7a2f'} />
          <path className="act-flame2" d="M83 72 C 80 67, 82 62, 83 59 C 85 62, 87 67, 83 72 Z" fill={robot ? '#b6ffc8' : '#ffd24d'} />
          {[0, 1, 2, 3, 4].map((k) => <circle key={k} className="act-ash" cx={78 + k * 4} cy={50} r="1.4" fill={robot ? G : '#888'} opacity="0" />)}
        </g>
      )
    case 'write':
      return (
        <g className="act act-write">
          <rect x="62" y="70" width="34" height="24" rx="3" fill={robot ? '#0b2a14' : '#fffaf0'} stroke={ink} strokeWidth="1.2" />
          <path className="act-line" d="M66 77 H92" stroke={ink} strokeWidth="1.4" strokeDasharray="26" strokeDashoffset="26" />
          <path className="act-line" d="M66 83 H88" stroke={ink} strokeWidth="1.4" strokeDasharray="22" strokeDashoffset="22" />
          <path className="act-line" d="M66 89 H84" stroke={ink} strokeWidth="1.4" strokeDasharray="18" strokeDashoffset="18" />
          <g className="act-pencil">
            <path d="M66 70 L82 54 L86 58 L70 74 Z" fill={robot ? G : '#f5c542'} stroke={ink} strokeWidth="1" />
            <path d="M66 70 L64 76 L70 74 Z" fill={ink} />
          </g>
        </g>
      )
    case 'sleep':
      return (
        <g className="act act-sleep">
          {['Z', 'z', 'Z'].map((z, k) => (
            <text key={k} className="act-z" x={70 + k * 7} y={30 - k * 8} fontSize={10 - k} fontWeight="800" fill={robot ? G : '#6c8ebf'} opacity="0">{z}</text>
          ))}
        </g>
      )
    case 'meditate':
      return (
        <g className="act act-meditate">
          {[0, 1, 2].map((k) => <circle key={k} className="act-aura" cx="50" cy="52" r="30" fill="none" stroke={robot ? G : '#b39ddb'} strokeWidth="1.5" opacity="0" />)}
          <text className="act-om" x="50" y="4" textAnchor="middle" fontSize="12" fill={robot ? G : '#8f7ae5'} opacity="0">ॐ</text>
        </g>
      )
    case 'timer':
      return (
        <g className="act act-timer">
          <circle cx="84" cy="30" r="12" fill={robot ? '#0b2a14' : '#fff'} stroke={ink} strokeWidth="2" />
          <rect x="82" y="15" width="4" height="4" rx="1" fill={ink} />
          <line className="act-hand" x1="84" y1="30" x2="84" y2="22" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        </g>
      )
    case 'coins':
      return (
        <g className="act act-coins">
          {[0, 1, 2, 3].map((k) => (
            <g key={k} className="act-coin" opacity="0">
              <ellipse cx={84} cy={88 - k * 5} rx="8" ry="3" fill={robot ? G : '#f5c542'} stroke={robot ? '#0b2a14' : '#c79a00'} strokeWidth="1" />
            </g>
          ))}
        </g>
      )
    case 'water':
      return (
        <g className="act act-water">
          <g className="act-can">
            <path d="M72 30 H90 V44 H72 Z" fill={robot ? '#0b2a14' : '#7fb3d5'} stroke={ink} strokeWidth="1.2" />
            <path d="M72 34 L62 28" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          </g>
          {[0, 1, 2].map((k) => <circle key={k} className="act-drop" cx={60 - k * 2} cy={32} r="1.6" fill={robot ? G : '#4fb3d9'} opacity="0" />)}
          <path className="act-sprout" d="M58 94 C 58 88, 58 84, 58 80 M58 84 C 54 80, 50 82, 50 82 M58 82 C 62 78, 66 80, 66 80" stroke={robot ? G : '#4f9d3a'} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'hearts':
      return (
        <g className="act act-hearts">
          {[0, 1, 2].map((k) => (
            <path key={k} className="act-heart" d="M0 3 C 0 -1, 6 -1, 6 3 C 6 -1, 12 -1, 12 3 C 12 8, 6 11, 6 13 C 6 11, 0 8, 0 3 Z" transform={`translate(${66 + k * 10} ${34 - k * 6}) scale(0.8)`} fill={robot ? G : '#f06b8a'} opacity="0" />
          ))}
        </g>
      )
    case 'think':
      return (
        <g className="act act-think">
          <circle className="act-glow" cx="80" cy="18" r="14" fill={robot ? G : '#ffd54f'} opacity="0.2" />
          <path d="M80 8 C 72 8, 70 16, 74 20 C 76 22, 76 24, 76 26 H84 C 84 24, 84 22, 86 20 C 90 16, 88 8, 80 8 Z" fill={robot ? '#0b2a14' : '#fff8e1'} stroke={robot ? G : '#f0a500'} strokeWidth="1.5" />
          <rect x="77" y="26" width="6" height="4" rx="1" fill={ink} opacity="0.6" />
        </g>
      )
    case 'music':
      return (
        <g className="act act-music">
          {['♪', '♫', '♪'].map((n, k) => (
            <text key={k} className="act-note" x={70 + k * 8} y={36 - k * 6} fontSize="12" fill={robot ? G : '#8f7ae5'} opacity="0">{n}</text>
          ))}
        </g>
      )
    case 'check':
      return (
        <g className="act act-check">
          <rect x="66" y="58" width="30" height="36" rx="3" fill={robot ? '#0b2a14' : '#fffaf0'} stroke={ink} strokeWidth="1.2" />
          {[0, 1, 2].map((k) => (
            <path key={k} className="act-tick" d={`M70 ${68 + k * 9} l3 3 l6 -6`} stroke={robot ? G : '#2e9d6a'} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14" strokeDashoffset="14" />
          ))}
        </g>
      )
    case 'karate':
      return (
        <g className="act act-karate">
          <rect x="22" y="24" width="56" height="6" rx="2" fill={robot ? G : '#d9534f'} />
          <path d="M78 26 L90 20 M78 28 L92 30" stroke={robot ? G : '#d9534f'} strokeWidth="3" strokeLinecap="round" />
          <g className="act-chop">
            <rect x="76" y="56" width="18" height="6" rx="3" fill={robot ? G : '#ff9458'} />
          </g>
          <path className="act-swoosh" d="M70 40 Q 92 48, 88 70" stroke={robot ? G : '#999'} strokeWidth="1.5" fill="none" strokeDasharray="40" strokeDashoffset="40" />
        </g>
      )
    case 'eat':
      return (
        <g className="act act-eat">
          <path d="M66 84 H98 C 98 94, 90 98, 82 98 C 74 98, 66 94, 66 84 Z" fill={robot ? '#0b2a14' : '#fff'} stroke={ink} strokeWidth="1.2" />
          {[0, 1, 2].map((k) => <path key={k} className="act-steam" d={`M${74 + k * 8} 80 c -3 -4, 3 -6, 0 -10`} stroke={robot ? G : '#bbb'} strokeWidth="1.5" fill="none" opacity="0" />)}
        </g>
      )
    case 'sun':
      return (
        <g className="act act-sun">
          <g className="act-sunball">
            <circle cx="82" cy="24" r="9" fill={robot ? G : '#ffd54f'} />
            {Array.from({ length: 8 }, (_, k) => {
              const a = (k / 8) * Math.PI * 2
              return <line key={k} x1={82 + Math.cos(a) * 12} y1={24 + Math.sin(a) * 12} x2={82 + Math.cos(a) * 16} y2={24 + Math.sin(a) * 16} stroke={robot ? G : '#ffb300'} strokeWidth="2" strokeLinecap="round" />
            })}
          </g>
        </g>
      )
    case 'run':
      return (
        <g className="act act-run">
          {[0, 1, 2].map((k) => <line key={k} className="act-speed" x1={4} y1={44 + k * 10} x2={16} y2={44 + k * 10} stroke={robot ? G : '#e0703f'} strokeWidth="2.5" strokeLinecap="round" opacity="0" />)}
        </g>
      )
    default:
      return null
  }
}

/** Build the GSAP timeline for an act inside the face's SVG. */
export function playAct(svg: SVGSVGElement, act: Act): gsap.core.Timeline {
  const q = (s: string) => svg.querySelectorAll(s)
  const one = (s: string) => svg.querySelector(s)
  const tl = gsap.timeline()
  const lid = one('.bf-lid')
  const closeEyes = (at: number, hold: number) => tl.to(lid, { scaleY: 1, duration: 0.4, ease: 'sine.inOut' }, at).to(lid, { scaleY: 0, duration: 0.4, ease: 'sine.inOut' }, at + hold)
  tl.fromTo(one('.act'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
  switch (act) {
    case 'lift':
      tl.fromTo(one('.act-dumbbell'), { y: 22 }, { y: 0, duration: 0.55, yoyo: true, repeat: 3, ease: 'power2.inOut' }, 0.2).fromTo(one('.act-sweat'), { y: 0, opacity: 0 }, { y: 10, opacity: 1, duration: 0.8 }, 1)
      break
    case 'burn':
      tl.fromTo(q('.act-flame, .act-flame2'), { scaleY: 0.2, transformOrigin: '50% 100%' }, { scaleY: 1.15, duration: 0.25, yoyo: true, repeat: 7, stagger: 0.07, ease: 'sine.inOut' }, 0.2)
        .to(one('.act-paper'), { scaleY: 0, transformOrigin: '50% 100%', opacity: 0.2, duration: 1.8, ease: 'power1.in' }, 0.4)
        .to(q('.act-ash'), { opacity: 0.8, duration: 0.2, stagger: 0.1 }, 1.4)
        .to(q('.act-ash'), { y: -26, x: () => gsap.utils.random(-6, 6), opacity: 0, duration: 1.2, stagger: 0.1, ease: 'power1.out' }, 1.6)
      break
    case 'write':
      tl.to(one('.act-pencil'), { x: 10, y: 4, duration: 0.25, yoyo: true, repeat: 7, ease: 'sine.inOut' }, 0.2).to(q('.act-line'), { strokeDashoffset: 0, duration: 0.7, stagger: 0.6, ease: 'none' }, 0.2)
      break
    case 'sleep':
      closeEyes(0.1, 2.4)
      tl.to(q('.act-z'), { opacity: 1, y: -8, duration: 0.8, stagger: 0.4, repeat: 1, yoyo: true, ease: 'sine.inOut' }, 0.3)
      break
    case 'meditate':
      closeEyes(0.1, 2.6)
      tl.fromTo(q('.act-aura'), { attr: { r: 28 }, opacity: 0.7 }, { attr: { r: 50 }, opacity: 0, duration: 1.6, stagger: 0.5, ease: 'sine.out' }, 0.2).to(one('.act-om'), { opacity: 1, y: -4, duration: 0.8, yoyo: true, repeat: 1 }, 0.4)
      break
    case 'timer':
      tl.to(one('.act-hand'), { rotate: 720, svgOrigin: '84 30', duration: 2.4, ease: 'power1.inOut' }, 0.2)
      break
    case 'coins':
      tl.fromTo(q('.act-coin'), { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.25, ease: 'bounce.out' }, 0.2)
      break
    case 'water':
      tl.to(one('.act-can'), { rotate: -25, svgOrigin: '80 38', duration: 0.5 }, 0.2)
        .fromTo(q('.act-drop'), { y: 0, opacity: 1 }, { y: 50, opacity: 0, duration: 0.7, stagger: 0.2, repeat: 2, ease: 'power1.in' }, 0.6)
        .fromTo(one('.act-sprout'), { scaleY: 0.2, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 1.2, ease: 'back.out(2)' }, 1)
        .to(one('.act-can'), { rotate: 0, svgOrigin: '80 38', duration: 0.4 }, 2.6)
      break
    case 'hearts':
      tl.fromTo(q('.act-heart'), { y: 10, opacity: 0 }, { y: -18, opacity: 1, duration: 1.2, stagger: 0.35, ease: 'sine.out' }, 0.2).to(q('.act-heart'), { opacity: 0, duration: 0.5, stagger: 0.35 }, 1.2)
      break
    case 'think':
      tl.fromTo(one('.act-glow'), { attr: { r: 8 }, opacity: 0.1 }, { attr: { r: 18 }, opacity: 0.6, duration: 0.5, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.2)
      break
    case 'music':
      tl.fromTo(q('.act-note'), { y: 8, opacity: 0 }, { y: -14, opacity: 1, duration: 1, stagger: 0.35, ease: 'sine.out' }, 0.2).to(q('.act-note'), { opacity: 0, duration: 0.4, stagger: 0.35 }, 1.1)
      break
    case 'check':
      tl.to(q('.act-tick'), { strokeDashoffset: 0, duration: 0.4, stagger: 0.45, ease: 'power2.out' }, 0.3)
      break
    case 'karate':
      tl.fromTo(one('.act-chop'), { rotate: -70, svgOrigin: '76 59' }, { rotate: 20, svgOrigin: '76 59', duration: 0.18, repeat: 2, yoyo: true, repeatDelay: 0.4, ease: 'power4.in' }, 0.3).to(one('.act-swoosh'), { strokeDashoffset: 0, duration: 0.2 }, 0.35)
      break
    case 'eat':
      tl.to(q('.act-steam'), { opacity: 0.8, y: -6, duration: 0.8, stagger: 0.25, yoyo: true, repeat: 2, ease: 'sine.inOut' }, 0.2)
      break
    case 'sun':
      tl.fromTo(one('.act-sunball'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power2.out' }, 0.1).to(one('.act-sunball'), { rotate: 90, svgOrigin: '82 24', duration: 2 }, 0.4)
      break
    case 'run':
      tl.fromTo(q('.act-speed'), { x: 10, opacity: 0 }, { x: -6, opacity: 1, duration: 0.3, stagger: 0.1, repeat: 5, yoyo: true, ease: 'none' }, 0.1)
      break
  }
  tl.to(one('.act'), { opacity: 0, duration: 0.4 }, '+=0.3')
  return tl
}
