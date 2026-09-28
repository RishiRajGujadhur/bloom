import { useRef, type CSSProperties, type MouseEvent } from 'react'
import gsap from 'gsap'
import './gameCards.css'

type Props = { id: string; title: string; index: number; level?: number; onClick: () => void }

const palettes: Record<string, [string, string, string]> = {
  chess: ['#0799ed', '#f7f4ef', 'knight'], checkers: ['#ff7800', '#ffd300', 'disc'],
  nback: ['#f7a1ce', '#ff7800', 'double'], memory: ['#ffd300', '#0799ed', 'grid'],
  stroop: ['#ff7800', '#f7a1ce', 'blob'], reaction: ['#0799ed', '#ffd300', 'bolt'],
  maths: ['#ffd300', '#ff7800', 'square'], simon: ['#f7a1ce', '#0799ed', 'double'],
  rotate: ['#0799ed', '#f7f4ef', 'diamond'], scramble: ['#ff7800', '#ffd300', 'square'],
  track: ['#ffd300', '#0799ed', 'blob'], stream: ['#f7a1ce', '#ff7800', 'double'],
  matrix: ['#0799ed', '#ffd300', 'grid'], analogy: ['#ff7800', '#f7a1ce', 'diamond'],
  faces: ['#f7a1ce', '#ffd300', 'blob'], replies: ['#ffd300', '#0799ed', 'disc'],
}

function SceneDetails({ id }: { id: string }) {
  switch (id) {
    case 'chess': return <><g className="gc-prop"><path d="M129 115h18v22h-24l3-8h-5l5-14Z" fill="#fff5dc" stroke="#1c2240" strokeWidth="3"/><circle cx="136" cy="109" r="6" fill="#fff5dc" stroke="#1c2240" strokeWidth="3"/></g><path className="gc-action" d="m54 53-10-17-8 20" fill="var(--gc-b)" stroke="#1c2240" strokeWidth="3"/></>
    case 'checkers': return <><g className="gc-prop"><ellipse cx="142" cy="116" rx="19" ry="9" fill="#ffd300" stroke="#1c2240" strokeWidth="3"/><ellipse cx="142" cy="109" rx="19" ry="9" fill="#ff7800" stroke="#1c2240" strokeWidth="3"/></g><path className="gc-action" d="M39 113q-12-6-14-18" fill="none" stroke="var(--gc-b)" strokeWidth="9" strokeLinecap="round"/></>
    case 'nback': return <><g className="gc-prop"><rect x="132" y="35" width="25" height="25" rx="5" fill="var(--gc-b)" stroke="#1c2240" strokeWidth="3"/><text x="144" y="52" textAnchor="middle" fontSize="14" fontWeight="900" fill="#1c2240">2</text></g><path className="gc-action" d="M32 114h22" stroke="var(--gc-b)" strokeWidth="8" strokeLinecap="round"/></>
    case 'memory': return <><g className="gc-prop"><rect x="131" y="30" width="27" height="27" rx="6" fill="var(--gc-b)"/><path d="m137 43 5 5 9-11" fill="none" stroke="white" strokeWidth="4"/></g><path className="gc-action" d="M25 54h21" stroke="var(--gc-b)" strokeWidth="8" strokeLinecap="round"/></>
    case 'stroop': return null
    case 'reaction': return <><g className="gc-prop"><path d="m139 39-10 19h10l-5 15 19-24h-11l6-10Z" fill="#ffd300"/></g><path className="gc-action" d="M31 58h-14m18 15H21" stroke="#ffd300" strokeWidth="5" strokeLinecap="round"/></>
    case 'maths': return <><g className="gc-prop"><rect x="133" y="35" width="29" height="29" rx="5" fill="#fff5dc"/><path d="M140 49h15m-8-8v16" stroke="#1c2240" strokeWidth="3"/></g><path className="gc-action" d="M31 112q-10 9-9 20" fill="none" stroke="var(--gc-b)" strokeWidth="7" strokeLinecap="round"/></>
    case 'simon': return <><g className="gc-prop"><circle cx="146" cy="45" r="17" fill="var(--gc-b)"/><path d="M146 30v30m-15-15h30" stroke="white" strokeWidth="4"/></g><path className="gc-action" d="M29 107q-8-10-2-20" fill="none" stroke="var(--gc-b)" strokeWidth="8" strokeLinecap="round"/></>
    case 'rotate': return <><path d="M139 12v16" stroke="var(--gc-b)" strokeWidth="3"/><g className="gc-disco-ball"><circle cx="139" cy="49" r="23" fill="#e9f7ff" stroke="#163b89" strokeWidth="3"/><path d="M119 40h40m-43 10h46m-40 10h34M130 28q-8 21 0 42m17-42q8 21 0 42" fill="none" stroke="#0799ed" strokeWidth="3"/><path d="m127 34 5-3 5 4-5 4Zm19 12 5-3 5 4-5 4Zm-23 10 5-3 5 4-5 4Z" fill="#f7a1ce"/></g><g className="gc-disco-sparkles"><path d="m108 30 3 6 6 3-6 3-3 6-3-6-6-3 6-3Zm53 39 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#ffd300"/></g></>
    case 'scramble': return <><g className="gc-prop"><rect x="128" y="40" width="30" height="30" rx="6" fill="var(--gc-b)"/><text x="143" y="62" textAnchor="middle" fill="#1c2240" fontSize="21" fontWeight="900">A</text></g><path className="gc-action" d="M33 116q-11 0-13-11" fill="none" stroke="var(--gc-b)" strokeWidth="7" strokeLinecap="round"/></>
    case 'track': return <><g className="gc-prop"><circle cx="142" cy="52" r="13" fill="none" stroke="var(--gc-b)" strokeWidth="4"/><circle cx="142" cy="52" r="4" fill="var(--gc-b)"/></g><path className="gc-action" d="M30 103q-13-10-13-20" fill="none" stroke="var(--gc-b)" strokeWidth="7" strokeLinecap="round"/></>
    case 'stream': return <><g className="gc-prop"><text x="129" y="55" fill="var(--gc-b)" fontSize="25" fontWeight="900">01</text></g><path className="gc-action" d="M30 121h27" stroke="var(--gc-b)" strokeWidth="7" strokeLinecap="round"/></>
    case 'matrix': return <><g className="gc-prop"><rect x="128" y="36" width="31" height="31" rx="4" fill="none" stroke="var(--gc-b)" strokeWidth="3"/><path d="M139 37v29m10-29v29m-20-19h29m-29 10h29" stroke="var(--gc-b)" strokeWidth="2"/></g><path className="gc-action" d="M25 112h29" stroke="var(--gc-b)" strokeWidth="6" strokeLinecap="round"/></>
    case 'analogy': return <><g className="gc-prop"><path d="m128 53 12-13 12 13-12 13Z" fill="var(--gc-b)"/><text x="140" y="59" textAnchor="middle" fill="#1c2240" fontSize="16" fontWeight="900">?</text></g><path className="gc-action" d="M30 114q-9-4-10-13" fill="none" stroke="var(--gc-b)" strokeWidth="7" strokeLinecap="round"/></>
    case 'faces': return null
    default: return <><g className="gc-prop"><path d="M128 48q-2-12 10-12 6 0 8 7 10-8 17 1 8 13-20 30-24-12-15-26Z" fill="#f7a1ce"/></g><path className="gc-action" d="M27 108q-8-11-3-20" fill="none" stroke="var(--gc-b)" strokeWidth="7" strokeLinecap="round"/></>
  }
}

function Art({ id, shape }: { id: string; shape: string }) {
  return <svg className={`gc-scene gc-scene-${id}`} viewBox="0 0 180 180" aria-hidden="true">
    <ellipse cx="91" cy="151" rx="53" ry="9" fill="#060b28" opacity=".28"/>
    <g className="gc-main-shape">
      {shape === 'knight' ? <path d="M46 137h91v-15l-18-8 5-26-13-29-17-7-7-22-13 9-2 20-22 23-15 28 17 10Z" fill="var(--gc-a)"/> : null}
      {shape === 'disc' ? <><ellipse cx="90" cy="108" rx="61" ry="34" fill="var(--gc-b)"/><ellipse cx="90" cy="92" rx="61" ry="34" fill="var(--gc-a)"/><ellipse cx="90" cy="91" rx="48" ry="24" fill="none" stroke="#1c2240" strokeWidth="3" opacity=".25"/></> : null}
      {shape === 'double' ? <path d="M39 43Q39 23 75 23h30q36 0 36 20 0 22-22 39 22 14 22 36 0 27-36 27H75q-36 0-36-27 0-22 22-36Q39 65 39 43Z" fill="var(--gc-a)"/> : null}
      {shape === 'grid' ? <><rect x="30" y="30" width="120" height="116" rx="35" fill="var(--gc-a)"/><path d="M72 32v109M111 32v109M32 72h116M32 111h116" stroke="var(--gc-b)" strokeWidth="5" opacity=".55"/></> : null}
      {shape === 'blob' ? <path d="M87 25q40-6 57 28 18 29-5 62-14 33-58 30-40-1-48-39-11-39 13-62 14-17 41-19Z" fill="var(--gc-a)"/> : null}
      {shape === 'bolt' ? <path d="M93 22 40 96h43l-7 54 65-83h-43l9-45Z" fill="var(--gc-a)" stroke="var(--gc-b)" strokeWidth="6" strokeLinejoin="round"/> : null}
      {shape === 'square' ? <rect x="33" y="30" width="114" height="114" rx="25" fill="var(--gc-a)"/> : null}
      {shape === 'diamond' ? <rect x="48" y="45" width="84" height="84" rx="25" fill="var(--gc-a)" transform="rotate(45 90 87)"/> : null}
      <g className="gc-face"><path className="gc-eye gc-eye-left" d="M65 82q8 13 17 0" fill="none" stroke="#1c2240" strokeWidth="5" strokeLinecap="round"/><path className="gc-eye gc-eye-right" d="M98 82q8 13 17 0" fill="none" stroke="#1c2240" strokeWidth="5" strokeLinecap="round"/><path className="gc-smile" d="M66 101q24 25 49 0" fill="none" stroke="#1c2240" strokeWidth="5" strokeLinecap="round"/></g>
    </g>
    <g className="gc-satellites"><circle cx="30" cy="52" r="5" fill="var(--gc-b)"/><path d="m143 40 5 12 12 5-12 5-5 12-5-12-12-5 12-5Z" fill="var(--gc-b)"/></g>
    <SceneDetails id={id}/>
  </svg>
}

function playCharacterAction(card: HTMLButtonElement, id: string) {
  const q = (selector: string) => card.querySelector(selector)
  const tl = gsap.timeline()
  const prop = q('.gc-prop')
  const action = q('.gc-action')
  const face = q('.gc-face')
  const eye = q('.gc-eye-right')
  const smile = q('.gc-smile')
  switch (id) {
    case 'chess': // The knight nods, winks, then nudges a rook.
      tl.to(face, { rotation: -5, transformOrigin: '90px 90px', duration: .3, ease: 'sine.out' }).to(eye, { scaleY: .12, transformOrigin: '106px 86px', duration: .11 }, .08).to(eye, { scaleY: 1, duration: .17 }, .3).fromTo(prop, { x: 10, y: -6 }, { x: -3, y: 2, duration: .55, ease: 'power2.out' }, .15).to(action, { rotation: -8, transformOrigin: '50px 55px', yoyo: true, repeat: 1, duration: .3, ease: 'sine.inOut' }, .12); break
    case 'checkers': // Flips a second checker into place.
      tl.fromTo(prop, { y: -44, rotation: -55, transformOrigin: '142px 110px' }, { y: 1, rotation: 360, duration: .8, ease: 'bounce.out' }).to(face, { y: -7, yoyo: true, repeat: 1, duration: .2 }, .08).to(action, { rotation: 26, transformOrigin: '38px 111px', yoyo: true, repeat: 1, duration: .3 }, .18); break
    case 'nback': // Recalls a numbered tile, then points at it.
      tl.fromTo(prop, { opacity: 0, scale: .2, transformOrigin: '145px 48px' }, { opacity: 1, scale: 1.25, duration: .4, ease: 'back.out(2)' }).to(action, { x: 23, y: -29, duration: .35 }, .17).to(face, { rotation: 10, transformOrigin: '90px 90px', duration: .27 }, .22); break
    case 'memory': // Lights up a remembered square.
      tl.fromTo(prop, { scale: .4, opacity: .2, transformOrigin: '145px 44px' }, { scale: 1.35, opacity: 1, duration: .35, ease: 'back.out(2)' }).to(prop, { rotation: 12, yoyo: true, repeat: 1, duration: .16 }).to(action, { x: 20, y: -13, duration: .35 }, .12); break
    case 'stroop': // A gentle side-to-side swing.
      tl.fromTo(q('.gc-main-shape'), { rotation: -13, transformOrigin: '90px 28px' }, { rotation: 13, repeat: -1, yoyo: true, duration: .65, ease: 'sine.inOut' }); break
    case 'reaction': // Zaps forward in surprise.
      tl.fromTo(prop, { scale: .2, opacity: 0, transformOrigin: '140px 55px' }, { scale: 1.45, opacity: 1, duration: .24, ease: 'power4.out' }).to(face, { x: 9, rotation: -9, transformOrigin: '90px 90px', duration: .16 }, 0).fromTo(action, { opacity: 0, x: 18 }, { opacity: 1, x: -7, duration: .26 }, .08); break
    case 'maths': // Writes a sum on a floating tile.
      tl.fromTo(prop, { x: -30, rotation: -20, opacity: 0, transformOrigin: '147px 50px' }, { x: 0, rotation: 0, opacity: 1, duration: .45, ease: 'back.out(1.5)' }).to(action, { rotation: -25, transformOrigin: '30px 115px', yoyo: true, repeat: 2, duration: .18 }, .2).to(face, { y: -5, duration: .2 }, .35); break
    case 'simon': // Presses a round game button twice.
      tl.to(prop, { scale: .75, transformOrigin: '146px 45px', duration: .15, yoyo: true, repeat: 3 }).to(action, { x: 25, y: -32, duration: .25, yoyo: true, repeat: 1 }, 0).to(smile, { scaleX: 1.3, transformOrigin: '90px 105px', duration: .2 }, .3); break
    case 'rotate': // The character stays put while its disco ball spins around a vertical axis.
      tl.to(q('.gc-disco-ball'), { rotationY: 360, transformOrigin: '139px 49px', transformPerspective: 360, repeat: -1, duration: 2.8, ease: 'none' }).fromTo(q('.gc-disco-sparkles'), { opacity: .3, scale: .8, transformOrigin: '139px 49px' }, { opacity: 1, scale: 1.2, repeat: -1, yoyo: true, duration: .5 }, 0); break
    case 'scramble': // Juggles a letter tile.
      tl.fromTo(prop, { y: 36, rotation: -60, transformOrigin: '143px 55px' }, { y: -18, rotation: 20, duration: .4, ease: 'power2.out' }).to(prop, { y: 4, rotation: 0, duration: .38, ease: 'bounce.out' }).to(action, { x: 19, y: -18, duration: .3, yoyo: true, repeat: 1 }, .15); break
    case 'track': // Tracks a moving target with its face.
      tl.to(prop, { x: -35, y: 38, duration: .3 }).to(prop, { x: 15, y: -10, duration: .4 }).to(face, { x: -11, y: 5, duration: .3 }, 0).to(face, { x: 6, y: -3, duration: .4 }, .3).to(action, { rotation: 24, transformOrigin: '30px 103px', duration: .3 }, .15); break
    case 'stream': // Catches falling digits.
      tl.fromTo(prop, { y: -46, opacity: 0 }, { y: 10, opacity: 1, duration: .5, ease: 'bounce.out' }).to(action, { y: -28, rotation: -15, transformOrigin: '40px 120px', duration: .35 }, .18).to(face, { y: -8, duration: .3 }, .2); break
    case 'matrix': // Scans the grid and finds its answer.
      tl.fromTo(prop, { scale: .6, rotation: -20, transformOrigin: '143px 52px' }, { scale: 1.2, rotation: 0, duration: .45, ease: 'back.out(2)' }).to(action, { x: 20, y: -30, duration: .35 }, .2).to(face, { rotation: -10, transformOrigin: '90px 90px', duration: .3 }, .2); break
    case 'analogy': // Thinks, then has an idea.
      tl.to(face, { rotation: -17, transformOrigin: '90px 90px', duration: .3 }).fromTo(prop, { opacity: 0, y: 22, scale: .4, transformOrigin: '140px 53px' }, { opacity: 1, y: -11, scale: 1.3, duration: .5, ease: 'elastic.out(1,.4)' }, .3).to(action, { rotation: -22, transformOrigin: '30px 112px', duration: .3 }, .4); break
    case 'faces': // A soft, elastic bounce.
      tl.to(q('.gc-main-shape'), { y: -22, scaleX: .94, scaleY: 1.07, transformOrigin: '90px 140px', repeat: -1, yoyo: true, duration: .45, ease: 'sine.inOut' }); break
    default: // Sends a heart with a wave.
      tl.fromTo(prop, { y: 25, scale: .4, opacity: 0, transformOrigin: '143px 53px' }, { y: -20, scale: 1.2, opacity: 1, duration: .6, ease: 'power2.out' }).to(action, { rotation: 30, transformOrigin: '28px 106px', yoyo: true, repeat: 3, duration: .17 }, .1).to(smile, { scaleX: 1.35, transformOrigin: '90px 105px', duration: .3 }, .25)
  }
  return tl
}

export function GameCard({ id, title, index, level, onClick }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const active = useRef(false)
  const sceneTimeline = useRef<gsap.core.Timeline | null>(null)
  const palette = palettes[id] ?? palettes.nback
  const effect = ['rain', 'bubbles', 'sparks', 'rays', 'comets', 'drift'][(index * 5 + 2) % 6]
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const enter = () => {
    if (!ref.current || reduced()) return
    active.current = true
    gsap.killTweensOf(ref.current.querySelectorAll('.gc-art,.gc-title,.gc-main-shape,.gc-scene,.gc-satellites,.gc-face,.gc-eye-right,.gc-smile,.gc-prop,.gc-action,.gc-disco-ball,.gc-disco-sparkles'))
    gsap.to(ref.current.querySelector('.gc-art'), { z: 54, y: -7, scale: 1.07, duration: .5, ease: 'power2.out' })
    gsap.to(ref.current.querySelector('.gc-title'), { z: 62, y: -3, duration: .45, ease: 'power2.out' })
    if (id !== 'stroop' && id !== 'rotate' && id !== 'faces') {
      const flourish = id === 'chess' ? { y: -7, rotation: -4 } : id === 'checkers' ? { y: -7, rotation: 9 } : id === 'reaction' ? { x: 7, rotation: -5 } : id === 'memory' || id === 'matrix' ? { y: -5, rotation: 7 } : { y: -6, rotation: (index % 2 ? 5 : -5) }
      gsap.fromTo(ref.current.querySelector('.gc-main-shape'), { y: 5, scale: .97, transformOrigin: '90px 90px' }, { ...flourish, scale: 1.05, duration: .55, ease: 'power2.out' })
    }
    sceneTimeline.current?.kill()
    sceneTimeline.current = playCharacterAction(ref.current, id)
  }
  const leave = () => {
    if (!ref.current) return
    active.current = false
    sceneTimeline.current?.kill()
    sceneTimeline.current = null
    gsap.killTweensOf(ref.current.querySelectorAll('.gc-art,.gc-title,.gc-main-shape,.gc-scene,.gc-satellites,.gc-face,.gc-eye-right,.gc-smile,.gc-prop,.gc-action,.gc-disco-ball,.gc-disco-sparkles'))
    const parts = ref.current.querySelectorAll('.gc-art,.gc-title,.gc-main-shape,.gc-scene,.gc-satellites,.gc-face,.gc-eye-right,.gc-smile,.gc-prop,.gc-action,.gc-disco-ball,.gc-disco-sparkles')
    gsap.to(parts, { x: 0, y: 0, z: 0, rotation: 0, rotationY: 0, scale: 1, opacity: 1, duration: .32, ease: 'power2.out', onComplete: () => gsap.set(parts, { clearProps: 'all' }) })
    gsap.to(ref.current, { rotationX: 0, rotationY: 0, duration: .4 })
  }
  const move = (e: MouseEvent<HTMLButtonElement>) => {
    if (!ref.current || !active.current || reduced()) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    gsap.to(ref.current, { rotationY: (x - .5) * 42, rotationX: (.5 - y) * 42, duration: .2, overwrite: true })
  }
  return <button ref={ref} type="button" className={`game-card game-card-${id}`} style={{ '--gc-a': palette[0], '--gc-b': palette[1] } as CSSProperties} onClick={onClick} onMouseEnter={enter} onMouseMove={move} onMouseLeave={leave} onFocus={enter} onBlur={leave} aria-label={`Play ${title}${level ? `, level ${level}` : ''}`}>
    <span className="gc-pattern"/><span className={`gc-weather gc-weather-${effect}`} aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i}/>)}</span><span className="gc-prism"/><span className="gc-rainbow"/><span className="gc-number">{String(index + 1).padStart(2, '0')}</span><span className="gc-mark">✦</span>
    <span className="gc-art"><Art id={id} shape={palette[2]}/></span>
    <span className="gc-bottom"><strong className="gc-title">{title}<svg className="gc-title-line" viewBox="0 0 150 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3 8 Q45 2 79 8 T147 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></strong><span className="gc-footer"><small>{level ? `LEVEL ${level}` : 'QUEST'}</small><span className="gc-play">▶</span></span></span>
  </button>
}
