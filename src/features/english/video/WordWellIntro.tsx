import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion'
import { BloomFace } from '../../../components/ui/BloomFace'
import type { AvatarDrawing } from '../../../components/ui/avatarStyle'

/**
 * “The Word Well” — the story-mode intro, as a Remotion composition.
 * Played in-app with @remotion/player (30 fps, ~17 s). Everything is driven
 * by the current frame, so scrubbing and replay are exact.
 */
export const INTRO_FPS = 30
export const INTRO_FRAMES = 30 * 17
export const INTRO_W = 1280
export const INTRO_H = 720

const Sky = ({ from, to }: { from: string; to: string }) => <AbsoluteFill style={{ background: `linear-gradient(180deg, ${from}, ${to})` }} />

function Letters({ count = 24, rise = true }: { count?: number; rise?: boolean }) {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill>
      {Array.from({ length: count }, (_, i) => {
        const x = (i * 157) % INTRO_W
        const speed = 1.2 + (i % 5) * 0.5
        const y = rise ? INTRO_H - ((f * speed + i * 60) % (INTRO_H + 120)) : ((f * speed + i * 60) % (INTRO_H + 120)) - 60
        return (
          <span key={i} style={{ position: 'absolute', left: x, top: y, fontSize: 28 + (i % 4) * 14, fontWeight: 900, color: '#fff', opacity: 0.35 + (i % 3) * 0.15, transform: `rotate(${Math.sin((f + i * 10) / 20) * 25}deg)`, fontFamily: 'Manrope, sans-serif' }}>
            {'ABCDEFGHIJKLMNOPRSTUWY'[(i * 7) % 22]}
          </span>
        )
      })}
    </AbsoluteFill>
  )
}

function Caption({ text, at = 0, color = '#0d0d12' }: { text: string; at?: number; color?: string }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - at, fps, config: { damping: 14 } })
  const chars = Math.floor(interpolate(f - at, [0, 40], [0, text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, bottom: 60, padding: '26px 34px', background: color, color: '#fff', fontSize: 38, fontWeight: 800, fontFamily: 'Manrope, sans-serif', clipPath: 'polygon(0 12%, 100% 0, 99% 100%, 1% 92%)', transform: `translateY(${(1 - s) * 80}px)`, opacity: s }}>
      {text.slice(0, chars)}
    </div>
  )
}

/* 1. Title */
function Title() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const word = 'THE WORD WELL'
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Sky from="#2b2350" to="#ff8a5a" />
      <Letters />
      <div style={{ display: 'flex', gap: 6 }}>
        {[...word].map((ch, i) => {
          const s = spring({ frame: f - i * 3, fps, config: { damping: 9, stiffness: 120 } })
          return <span key={i} style={{ fontSize: 120, fontWeight: 900, color: '#fff', fontFamily: 'Manrope, sans-serif', transform: `translateY(${(1 - s) * -200}px) rotate(${(1 - s) * -30}deg)`, textShadow: '6px 6px 0 #d0643f', minWidth: ch === ' ' ? 40 : undefined }}>{ch}</span>
        })}
      </div>
      <div style={{ position: 'absolute', top: '64%', fontSize: 34, color: '#fff', fontWeight: 700, opacity: interpolate(f, [40, 60], [0, 1], { extrapolateRight: 'clamp' }), fontFamily: 'Manrope, sans-serif' }}>A Bloom English side quest</div>
    </AbsoluteFill>
  )
}

/* 2. The well is leaking words */
function Leak() {
  const f = useCurrentFrame()
  const water = interpolate(f, [0, 110], [70, 12], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) })
  return (
    <AbsoluteFill>
      <Sky from="#bfe6ff" to="#ffe0b8" />
      <Letters count={30} />
      <svg viewBox="0 0 1280 720" style={{ position: 'absolute', inset: 0 }}>
        <rect x="0" y="560" width="1280" height="160" fill="#8fd46a" />
        <g transform="translate(640 470)">
          <rect x="-150" y="-10" width="300" height="190" rx="18" fill="#8d6e63" />
          <clipPath id="ww-c"><rect x="-130" y="10" width="260" height="150" rx="10" /></clipPath>
          <rect x="-130" y={160 - (water / 100) * 150} width="260" height="200" fill="#1cb0f6" clipPath="url(#ww-c)" />
          <path d="M-170 -10 L0 -110 L170 -10 Z" fill="#d0643f" />
          <text y="120" textAnchor="middle" fontSize="30" fontWeight="900" fill="#fff">WORD WELL</text>
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 120, top: 180 }}><BloomFace variant="bloom" size={220} follow={false} waveOnMount={false} label="Bloom" /></div>
      <Caption text="Bloom World is leaking words… the Word Well is running dry!" at={15} />
    </AbsoluteFill>
  )
}

/* 3. The cast */
const castList: { face: AvatarDrawing; name: string; line: string; color: string }[] = [
  { face: 'orb', name: 'Mochi', line: '“Good morning” came out as “goo mor”.', color: '#8f7ae5' },
  { face: 'globe', name: 'Professor Globe', line: 'Only a tournament champion can refill the Well!', color: '#4a5fd6' },
  { face: 'spark', name: 'Sparky', line: 'Is there a prize? Are there snacks?', color: '#ff8a2a' },
]
function Cast() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <AbsoluteFill>
      <Sky from="#1c2b3f" to="#8f7ae5" />
      <Letters count={16} rise={false} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 120 }}>
        {castList.map((c, i) => {
          const s = spring({ frame: f - i * 25, fps, config: { damping: 12 } })
          return (
            <div key={c.name} style={{ display: 'grid', justifyItems: 'center', gap: 14, transform: `translateY(${(1 - s) * 300}px) scale(${0.6 + s * 0.4})`, opacity: s }}>
              <BloomFace variant={c.face} size={200} follow={false} waveOnMount={false} label={c.name} />
              <span style={{ padding: '6px 22px', background: c.color, color: '#0d0d12', fontWeight: 900, fontSize: 28, transform: 'skewX(-12deg)', fontFamily: 'Manrope, sans-serif' }}>{c.name.toUpperCase()}</span>
              <span style={{ maxWidth: 300, textAlign: 'center', color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}>{c.line}</span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/* 4. The rival */
function Rival() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f, fps, config: { damping: 10 } })
  const flash = f % 45 < 3 ? 1 : 0
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Sky from="#030a05" to="#0b2a14" />
      <AbsoluteFill style={{ background: '#39ff6a', opacity: flash * 0.25 }} />
      <div style={{ transform: `scale(${0.3 + s * 0.7})`, filter: 'drop-shadow(0 0 40px #39ff6a)' }}>
        <BloomFace variant="robot" size={300} follow={false} waveOnMount={false} label="UNIT-7" />
      </div>
      <div style={{ position: 'absolute', top: 80, fontSize: 60, fontWeight: 900, color: '#39ff6a', fontFamily: 'Fira Code, monospace', letterSpacing: 6, opacity: interpolate(f, [10, 25], [0, 1], { extrapolateRight: 'clamp' }) }}>UNIT-7</div>
      <Caption text="“I have calculated 14 million outcomes. I was bored in all of them.”" at={20} color="#0b2a14" />
    </AbsoluteFill>
  )
}

/* 5. The mission */
function Mission() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f, fps, config: { damping: 8 } })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Sky from="#ffc800" to="#ff4b4b" />
      {[0, 1, 2].map((k) => <div key={k} style={{ position: 'absolute', left: '-10%', width: '120%', height: 90, top: `${22 + k * 24}%`, background: ['#0d0d12', '#1cb0f6', '#58cc02'][k], opacity: 0.85, transform: `skewY(-8deg) translateX(${interpolate(f, [k * 4, k * 4 + 15], [-110, 0], { extrapolateRight: 'clamp' })}%)` }} />)}
      <div style={{ position: 'relative', textAlign: 'center', color: '#fff', fontFamily: 'Manrope, sans-serif', transform: `scale(${s})` }}>
        <div style={{ fontSize: 90, fontWeight: 900, fontStyle: 'italic', textShadow: '6px 6px 0 #0d0d12' }}>WIN THE TOURNAMENT</div>
        <div style={{ fontSize: 50, fontWeight: 800, textShadow: '4px 4px 0 #0d0d12' }}>Save Bloom World 🌱</div>
      </div>
    </AbsoluteFill>
  )
}

export function WordWellIntro() {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Sequence durationInFrames={90}><Title /></Sequence>
      <Sequence from={90} durationInFrames={120}><Leak /></Sequence>
      <Sequence from={210} durationInFrames={120}><Cast /></Sequence>
      <Sequence from={330} durationInFrames={105}><Rival /></Sequence>
      <Sequence from={435} durationInFrames={75}><Mission /></Sequence>
    </AbsoluteFill>
  )
}
