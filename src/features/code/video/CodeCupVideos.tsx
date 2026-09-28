import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BloomFace } from '../../../components/ui/BloomFace'
import type { AvatarDrawing } from '../../../components/ui/avatarStyle'

/**
 * “The Code Cup” — story-mode videos for Learn to code (Remotion, 30 fps).
 *   Intro:  GLITCH scrambles the Lighthouse code and Bloom World goes dark;
 *           Professor Tinker opens the Code Cup; the contestants line up.
 *   Finale: the champion turns the Debug Key, the lights come back, and
 *           GLITCH turns out to be… a feature.
 */
export const CODE_INTRO_FRAMES = 30 * 18
export const CODE_FINALE_FRAMES = 30 * 15
const font = 'Manrope, sans-serif'
const mono = 'Fira Code, monospace'
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

function Typed({ text, at = 0, speed = 1.4, style }: { text: string; at?: number; speed?: number; style?: React.CSSProperties }) {
  const f = useCurrentFrame()
  const n = Math.floor(Math.max(0, f - at) * speed)
  return <span style={{ fontFamily: mono, whiteSpace: 'pre', ...style }}>{text.slice(0, n)}<span style={{ opacity: f % 30 < 15 ? 1 : 0 }}>▌</span></span>
}

function Caption({ text, at = 0, color = '#0d0d12', name }: { text: string; at?: number; color?: string; name?: string }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - at, fps, config: { damping: 14 } })
  const chars = Math.floor(interpolate(f - at, [0, 40], [0, text.length], clamp))
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, bottom: 56, padding: '28px 34px 22px', background: color, color: '#fff', fontSize: 36, fontWeight: 800, fontFamily: font, clipPath: 'polygon(0 12%, 100% 0, 99% 100%, 1% 92%)', transform: `translateY(${(1 - s) * 80}px)`, opacity: s }}>
      {name && <span style={{ position: 'absolute', top: -2, left: 30, padding: '2px 16px', background: '#f7df1e', color: '#0d0d12', fontSize: 20, transform: 'skewX(-12deg)' }}>{name}</span>}
      {text.slice(0, chars)}
    </div>
  )
}

/** Falling code: scrambled (red) while GLITCH is loose, clean (green) once fixed. */
function CodeRain({ broken = true, count = 26 }: { broken?: boolean; count?: number }) {
  const f = useCurrentFrame()
  const bad = ['console.lgo(', 'fucntion', 'retrun;', 'cosnt x =', 'undefind', '}}{', 'NaN NaN', 'wihle(', ';;;', 'nul']
  const good = ['console.log()', 'function', 'return', 'const x =', 'true', '{ }', '=> ✓', 'while', 'let', '[ ]']
  return (
    <AbsoluteFill>
      {Array.from({ length: count }, (_, i) => {
        const x = (i * 97) % 1280
        const y = ((f * (2 + (i % 4)) + i * 70) % 820) - 60
        return <span key={i} style={{ position: 'absolute', left: x, top: y, fontFamily: mono, fontSize: 20 + (i % 3) * 6, color: broken ? '#ff4b4b' : '#39ff6a', opacity: 0.35 + (i % 3) * 0.15, transform: broken ? `skewX(${Math.sin((f + i) / 4) * 12}deg)` : undefined }}>{(broken ? bad : good)[i % 10]}</span>
      })}
    </AbsoluteFill>
  )
}

function Lighthouse({ lit }: { lit: number }) {
  const f = useCurrentFrame()
  const beam = interpolate(Math.sin(f / 12), [-1, 1], [-30, 30])
  return (
    <svg viewBox="0 0 400 420" style={{ position: 'absolute', right: 90, bottom: 60, width: 330 }}>
      <g opacity={lit}>
        <path d={`M200 90 L${-200 + beam * 4} 20 L${-200 + beam * 4} 180 Z`} fill="#fff6a8" opacity="0.35" />
        <path d={`M200 90 L${600 + beam * 4} 20 L${600 + beam * 4} 180 Z`} fill="#fff6a8" opacity="0.35" />
      </g>
      <path d="M150 400 L170 130 L230 130 L250 400 Z" fill="#f4f1de" />
      <rect x="165" y="200" width="70" height="26" fill="#ff4b4b" />
      <rect x="160" y="300" width="80" height="26" fill="#ff4b4b" />
      <rect x="160" y="70" width="80" height="60" rx="8" fill="#1f1d2b" />
      <circle cx="200" cy="100" r="22" fill={lit > 0.5 ? '#fff6a8' : '#333'} />
      <path d="M150 70 L200 30 L250 70 Z" fill="#ff4b4b" />
    </svg>
  )
}

const Face = ({ v, size, tint }: { v: AvatarDrawing; size: number; tint?: string }) => (
  <div style={{ filter: tint }}><BloomFace variant={v} size={size} follow={false} waveOnMount={false} label="" /></div>
)
const RED = 'hue-rotate(230deg) saturate(2.2)'

/* ---------------- Intro ---------------- */
function Title() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - 40, fps, config: { damping: 9 } })
  return (
    <AbsoluteFill style={{ background: '#0d0d12', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 44, color: '#9ef04a', padding: '0 80px' }}><Typed text={"const champion = await codeCup()\n// Bloom World needs a coder…"} /></div>
      <div style={{ position: 'absolute', bottom: 120, fontSize: 130, fontWeight: 900, fontFamily: font, color: '#f7df1e', transform: `scale(${s}) rotate(${(1 - s) * -8}deg)`, textShadow: '8px 8px 0 #ff4b4b' }}>THE CODE CUP</div>
    </AbsoluteFill>
  )
}
function Blackout() {
  const f = useCurrentFrame()
  const flicker = f < 70 ? (f % 9 < 4 ? 1 : 0.2) : interpolate(f, [70, 90], [0.2, 0], clamp)
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #1c2b3f, #0d0d12)` }}>
      <CodeRain />
      <Lighthouse lit={flicker} />
      <div style={{ position: 'absolute', left: 140, top: 150, transform: `translateX(${Math.sin(f / 5) * 8}px) rotate(${Math.sin(f / 7) * 6}deg)` }}><Face v="robot" size={240} tint={RED} /></div>
      <Caption name="GLITCH" text="Heh heh. I scrambled the Lighthouse code. Enjoy the dark, Bloom World!" at={10} color="#3a0d0d" />
    </AbsoluteFill>
  )
}
function Host() {
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #ffe0b8, #ff8a5a)' }}>
      <CodeRain count={14} />
      <div style={{ position: 'absolute', left: 140, top: 110 }}><Face v="tinker" size={260} /></div>
      <div style={{ position: 'absolute', right: 120, top: 150, width: 460, padding: 24, borderRadius: 20, background: '#1f1d2b', color: '#f7df1e', fontSize: 30 }}><Typed text={"if (youWin) {\n  debugKey.give(you)\n}"} at={10} /></div>
      <Caption name="PROFESSOR TINKER" text="Only the Code Cup champion can hold the Debug Key and fix the Lighthouse!" at={20} />
    </AbsoluteFill>
  )
}
const contestants: { v: AvatarDrawing; name: string; line: string; color: string }[] = [
  { v: 'orb', name: 'Mochi', line: 'I only know console.log… emotionally.', color: '#8f7ae5' },
  { v: 'spark', name: 'Sparky', line: 'Free stickers? I’m in!', color: '#ff8a2a' },
  { v: 'robot', name: 'UNIT-7', line: 'I learned to code. Now I am bored faster.', color: '#39ff6a' },
]
function Lineup() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #070d1c, #4a5fd6)' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 80 }}>
        {contestants.map((c, i) => {
          const s = spring({ frame: f - i * 22, fps, config: { damping: 12 } })
          return (
            <div key={c.name} style={{ display: 'grid', justifyItems: 'center', gap: 12, transform: `translateY(${(1 - s) * 300}px)`, opacity: s }}>
              <Face v={c.v} size={200} />
              <span style={{ padding: '6px 22px', background: c.color, color: '#0d0d12', fontWeight: 900, fontSize: 28, fontFamily: font, transform: 'skewX(-12deg)' }}>{c.name.toUpperCase()}</span>
              <span style={{ maxWidth: 300, textAlign: 'center', color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: font }}>{c.line}</span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
function Mission() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f, fps, config: { damping: 8 } })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: '#f7df1e' }}>
      {[0, 1, 2].map((k) => <div key={k} style={{ position: 'absolute', left: '-10%', width: '120%', height: 90, top: `${22 + k * 24}%`, background: ['#0d0d12', '#ff4b4b', '#1cb0f6'][k], transform: `skewY(-8deg) translateX(${interpolate(f, [k * 4, k * 4 + 15], [-110, 0], clamp)}%)` }} />)}
      <div style={{ position: 'relative', textAlign: 'center', color: '#fff', fontFamily: font, transform: `scale(${s})` }}>
        <div style={{ fontSize: 96, fontWeight: 900, fontStyle: 'italic', textShadow: '6px 6px 0 #0d0d12' }}>WIN THE CODE CUP</div>
        <div style={{ fontSize: 46, fontWeight: 800, textShadow: '4px 4px 0 #0d0d12', fontFamily: mono }}>debug(bloomWorld) 💡</div>
      </div>
    </AbsoluteFill>
  )
}
export function CodeCupIntro() {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Sequence durationInFrames={105}><Title /></Sequence>
      <Sequence from={105} durationInFrames={135}><Blackout /></Sequence>
      <Sequence from={240} durationInFrames={120}><Host /></Sequence>
      <Sequence from={360} durationInFrames={105}><Lineup /></Sequence>
      <Sequence from={465} durationInFrames={75}><Mission /></Sequence>
    </AbsoluteFill>
  )
}

/* ---------------- Finale ---------------- */
function Trophy() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const drop = spring({ frame: f, fps, config: { damping: 7, stiffness: 90 } })
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #fff6c8, #ffc800 55%, #ff9600)', alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: 40 }, (_, i) => {
        const y = ((f * (3 + (i % 5)) + i * 40) % 800) - 40
        return <div key={i} style={{ position: 'absolute', left: (i * 131) % 1280, top: y, width: 14, height: 8, background: ['#ff4b4b', '#1cb0f6', '#58cc02', '#ce82ff'][i % 4], transform: `rotate(${f * 6 + i * 30}deg)` }} />
      })}
      <svg viewBox="0 0 200 220" style={{ width: 300, transform: `translateY(${(1 - drop) * -500}px)` }}>
        <path d="M50 20 H150 V70 C150 120 120 140 100 140 C80 140 50 120 50 70 Z" fill="#f7df1e" stroke="#c9a800" strokeWidth="6" />
        <path d="M50 35 C20 35 20 80 55 85 M150 35 C180 35 180 80 145 85" fill="none" stroke="#c9a800" strokeWidth="8" />
        <rect x="88" y="140" width="24" height="34" fill="#c9a800" />
        <rect x="60" y="174" width="80" height="24" rx="6" fill="#1f1d2b" />
        <text x="100" y="92" textAnchor="middle" fontSize="36" fontWeight="900" fill="#1f1d2b" fontFamily={mono}>JS</text>
      </svg>
      <div style={{ position: 'absolute', top: 70, fontSize: 80, fontWeight: 900, fontFamily: font, color: '#1f1d2b', opacity: interpolate(f, [15, 30], [0, 1], clamp) }}>CHAMPION!</div>
    </AbsoluteFill>
  )
}
function LightsOn() {
  const f = useCurrentFrame()
  const lit = interpolate(f, [30, 60], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${lit > 0.5 ? '#7fc8ff' : '#1c2b3f'}, ${lit > 0.5 ? '#ffe7b8' : '#0d0d12'})` }}>
      <CodeRain broken={lit < 0.5} />
      <Lighthouse lit={lit} />
      <div style={{ position: 'absolute', left: 150, top: 140, fontSize: 64, transform: `rotate(${interpolate(f, [0, 30], [0, 90], clamp)}deg)` }}>🗝️</div>
      <Caption name="PROFESSOR TINKER" text="The Debug Key works! The Lighthouse is back online!" at={40} />
    </AbsoluteFill>
  )
}
function Feature() {
  const f = useCurrentFrame()
  const heal = interpolate(f, [20, 60], [0, 1], clamp)
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0b2a14, #39ff6a)' }}>
      <div style={{ position: 'absolute', left: 150, top: 120 }}><Face v="robot" size={260} tint={heal < 1 ? `hue-rotate(${230 * (1 - heal)}deg) saturate(${1 + 1.2 * (1 - heal)})` : undefined} /></div>
      <div style={{ position: 'absolute', right: 140, top: 200, fontFamily: mono, fontSize: 42, color: '#d9ffe3' }}><Typed text={"// it's not a bug…\n// it's a feature ✨"} at={30} /></div>
      <Caption name="GLITCH" text="I just wanted someone to read my code. Can I be on your team?" at={70} color="#0b2a14" />
    </AbsoluteFill>
  )
}
function Credits() {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: '#0d0d12', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 52, color: '#9ef04a' }}><Typed text={"console.log('You did it, champion!')"} speed={1.2} /></div>
      <div style={{ position: 'absolute', bottom: 90, color: '#fff', fontSize: 26, fontFamily: font, opacity: interpolate(f, [40, 60], [0, 1], clamp), textAlign: 'center' }}>
        Starring you · Mochi · Sparky · UNIT-7 · Professor Tinker · and GLITCH (now a feature)
      </div>
    </AbsoluteFill>
  )
}
export function CodeCupFinale() {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Sequence durationInFrames={105}><Trophy /></Sequence>
      <Sequence from={105} durationInFrames={120}><LightsOn /></Sequence>
      <Sequence from={225} durationInFrames={135}><Feature /></Sequence>
      <Sequence from={360} durationInFrames={90}><Credits /></Sequence>
    </AbsoluteFill>
  )
}
