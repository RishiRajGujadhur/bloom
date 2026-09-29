import gsap from 'gsap'

export type SpaceVariant = 'stardroid' | 'nebula' | 'cosmocat'
export const isSpace = (value: string): value is SpaceVariant => value === 'stardroid' || value === 'nebula' || value === 'cosmocat'

/** Original space companions with the same animation hooks as Bloom. */
export function SpaceBot({ variant, uid }: { variant: SpaceVariant; uid: string }) {
  const droid = variant === 'stardroid', cat = variant === 'cosmocat'
  const base = droid ? '#d9e2ec' : cat ? '#8d79c9' : '#4454a9'
  const trim = droid ? '#f7ae49' : cat ? '#f5cbec' : '#85e6e4'
  return <g className="bf-body">
    <defs><linearGradient id={`space-${uid}`} x2="0.8" y2="1"><stop stopColor={trim}/><stop offset="1" stopColor={base}/></linearGradient></defs>
    <g className="bf-arm" opacity="0"><g className="bf-arm-swing"><path d="M72 64 Q86 60 86 44" fill="none" stroke={base} strokeWidth="8" strokeLinecap="round"/><circle cx="86" cy="42" r="7" fill={trim}/></g></g>
    <g className="bf-breath">
      {droid ? <><rect x="18" y="25" width="64" height="58" rx="20" fill={base} stroke="#738397" strokeWidth="3"/><rect x="22" y="36" width="56" height="28" rx="11" fill="#23374a"/><rect className="space-signal" x="47" y="15" width="6" height="13" rx="3" fill={trim}/><circle className="space-signal" cx="50" cy="13" r="5" fill={trim}/><circle cx="29" cy="72" r="4" fill={trim}/><circle cx="43" cy="72" r="4" fill={trim}/><circle cx="57" cy="72" r="4" fill={trim}/></> : cat ? <><path d="M24 43 L20 14 L39 30 Q50 25 61 30 L80 14 L76 43 Q84 57 76 74 Q50 92 24 74 Q16 57 24 43Z" fill={`url(#space-${uid})`} stroke="#594a89" strokeWidth="2"/><path d="M25 25 L29 35 L37 32Z M75 25 L71 35 L63 32Z" fill="#f5cbec"/><path d="M46 66 L50 70 L54 66" fill="none" stroke="#492e67" strokeWidth="2" strokeLinecap="round"/></> : <><circle cx="50" cy="54" r="34" fill={`url(#space-${uid})`} stroke="#8ce7ea" strokeWidth="2"/><path className="space-orbit" d="M7 56 Q50 12 93 56 Q50 99 7 56Z" fill="none" stroke="#b8f4e7" strokeWidth="3" opacity=".8"/><circle className="space-signal" cx="87" cy="58" r="5" fill="#ffd88c"/></>}
      <g className="bf-eye"><g className="bf-pupil"><ellipse cx="39" cy="48" rx="5" ry="7" fill={droid ? '#85e6e4' : '#20294b'}/><ellipse cx="61" cy="48" rx="5" ry="7" fill={droid ? '#85e6e4' : '#20294b'}/><circle cx="40" cy="45" r="1.5" fill="#fff"/><circle cx="62" cy="45" r="1.5" fill="#fff"/></g><rect className="bf-lid" x="32" y="40" width="36" height="16" rx="8" fill={base}/></g>
      <path className="bf-happy" d="M33 49 Q39 41 45 49 M55 49 Q61 41 67 49" fill="none" stroke={droid ? '#85e6e4' : '#20294b'} strokeWidth="3" opacity="0"/>
      <path d="M43 66 Q50 72 57 66" fill="none" stroke={droid ? '#516879' : '#262b54'} strokeWidth="2.5" strokeLinecap="round"/>
      {droid && [0,1,2,3].map(i => <rect key={i} className="rb-bar" x={39+i*7} y="67" width="4" height="8" rx="2" fill={trim}/>)}
    </g>
  </g>
}

export function spaceIdle(el: SVGSVGElement) {
  const signal = el.querySelectorAll('.space-signal')
  const orbit = el.querySelector('.space-orbit')
  const a = gsap.to(signal, { opacity: 0.35, scale: 0.8, transformOrigin: '50% 50%', duration: 0.8, stagger: 0.18, yoyo: true, repeat: -1 })
  const b = orbit ? gsap.to(orbit, { rotation: 360, svgOrigin: '50 54', duration: 12, ease: 'none', repeat: -1 }) : null
  return () => { a.kill(); b?.kill() }
}
