import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { BloomFace } from '../../../components/ui/BloomFace'
import type { AvatarDrawing } from '../../../components/ui/avatarStyle'

export const LOST_ART_INTRO_FRAMES = 30 * 18
export const LOST_ART_FINALE_FRAMES = 30 * 12
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const archive = staticFile('code-quest/lost-archive.png')
const restored = staticFile('code-quest/restored-archive.png')
const tablet = staticFile('code-quest/code-tablet.png')

function Backdrop({ bright = false, zoom = 1 }: { bright?: boolean; zoom?: number }) {
  const frame = useCurrentFrame()
  return <AbsoluteFill><Img src={bright ? restored : archive} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom + frame * 0.00012})` }} /><AbsoluteFill style={{ background: bright ? 'linear-gradient(0deg,#160d240e,#18244814)' : 'linear-gradient(0deg,#07132999,#07132922)' }} /></AbsoluteFill>
}

function Face({ variant, x, y, size = 210, tint, at = 0 }: { variant: AvatarDrawing; x: number; y: number; size?: number; tint?: string; at?: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const arrival = spring({ frame: frame - at, fps, config: { damping: 14 } })
  return <div style={{ position: 'absolute', left: x, top: y, transform: `translateY(${(1 - arrival) * 120}px) scale(${0.8 + arrival * 0.2})`, opacity: arrival, filter: tint }}><BloomFace variant={variant} size={size} follow={false} waveOnMount={false} label="" /></div>
}

function Caption({ name, line, at = 0, color = '#fcab68' }: { name: string; line: string; at?: number; color?: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const entrance = spring({ frame: frame - at, fps, config: { damping: 15 } })
  const count = Math.floor(interpolate(frame - at, [0, 48], [0, line.length], clamp))
  return <div style={{ position: 'absolute', left: 75, right: 75, bottom: 38, minHeight: 148, transform: `translateY(${(1 - entrance) * 80}px) skewX(-2deg)`, opacity: entrance, padding: '36px 38px 20px', borderLeft: `9px solid ${color}`, background: '#0a153bea', boxShadow: '0 16px 45px #0008', color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: 31, fontWeight: 800 }}><span style={{ position: 'absolute', top: -15, left: 24, padding: '3px 16px', background: color, color: '#152039', fontSize: 21, transform: 'skewX(-10deg)' }}>{name}</span>{line.slice(0, count)}</div>
}

function Opening() {
  const frame = useCurrentFrame()
  return <AbsoluteFill><Backdrop /><div style={{ position: 'absolute', left: 85, top: 70, maxWidth: 800, color: '#fff4d5', font: '900 76px/1.05 Manrope, sans-serif', textShadow: '6px 6px 0 #091326', opacity: interpolate(frame, [12, 38], [0, 1], clamp), transform: `translateY(${interpolate(frame, [12, 38], [30, 0], clamp)}px)` }}>THE LOST ART<br />OF PROGRAMMING</div><Img src={tablet} style={{ position: 'absolute', width: 340, right: 100, top: 125, filter: 'drop-shadow(0 20px 25px #0008)', transform: `rotate(${Math.sin(frame / 20) * 3}deg) translateY(${Math.sin(frame / 18) * 8}px)` }} /></AbsoluteFill>
}

function Discovery() {
  return <AbsoluteFill><Backdrop zoom={1.04} /><Face variant="tinker" x={100} y={180} size={250} /><Face variant="bloom" x={820} y={255} size={200} at={18} /><Caption name="PROFESSOR TINKER" line="The Archive of Source is fading. Its four programming arts have been scattered." at={12} /></AbsoluteFill>
}

function Threat() {
  const frame = useCurrentFrame()
  return <AbsoluteFill><Backdrop /><AbsoluteFill style={{ background: `rgba(65,8,54,${0.22 + Math.sin(frame / 5) * 0.07})` }} /><Face variant="robot" x={435} y={100} size={310} tint="hue-rotate(230deg) saturate(2.2)" /><Img src={tablet} style={{ position: 'absolute', width: 190, right: 170, top: 95, transform: `rotate(${frame * 0.3}deg)` }} /><Caption name="GLITCH" color="#f273ab" line="Syntax. Structure. Style. Flow. Find them before the last light goes out!" at={12} /></AbsoluteFill>
}

function Promise() {
  const frame = useCurrentFrame()
  const names = ['SYNTAX', 'STRUCTURE', 'STYLE', 'FLOW']
  return <AbsoluteFill><Backdrop /><div style={{ position: 'absolute', left: 90, right: 90, top: 85, display: 'flex', justifyContent: 'space-between', gap: 14 }}>{names.map((name, i) => { const reveal = interpolate(frame, [i * 12, i * 12 + 16], [0, 1], clamp); return <div key={name} style={{ flex: 1, padding: '22px 12px', textAlign: 'center', background: ['#f7df1e', '#ff936d', '#62c9ff', '#9de688'][i], color: '#14203c', font: '900 27px Manrope, sans-serif', transform: `translateY(${(1 - reveal) * 100}px) rotate(${-3 + i * 2}deg)`, opacity: reveal, boxShadow: '6px 7px 0 #101732' }}>{name}</div> })}</div><Face variant="pixel" x={135} y={245} size={200} /><Face variant="bloom" x={780} y={230} size={210} at={12} /><Caption name="BLOOM" color="#ff9b7a" line="Build one idea at a time. We can bring the lost art home." at={20} /></AbsoluteFill>
}

export function LostArtIntro() {
  return <AbsoluteFill style={{ background: '#08152a' }}><Sequence durationInFrames={105}><Opening /></Sequence><Sequence from={105} durationInFrames={125}><Discovery /></Sequence><Sequence from={230} durationInFrames={130}><Threat /></Sequence><Sequence from={360} durationInFrames={180}><Promise /></Sequence></AbsoluteFill>
}

function Dawn() {
  const frame = useCurrentFrame()
  return <AbsoluteFill><Backdrop bright /><Img src={tablet} style={{ position: 'absolute', width: 320, left: 485, top: 65, transform: `translateY(${Math.sin(frame / 18) * 10}px) rotate(${Math.sin(frame / 30) * 3}deg)`, filter: 'drop-shadow(0 0 30px #ffd978)' }} /><div style={{ position: 'absolute', bottom: 78, left: 90, right: 90, textAlign: 'center', font: '900 67px Manrope, sans-serif', color: '#fffbe6', textShadow: '4px 6px 0 #1a3060', opacity: interpolate(frame, [18, 38], [0, 1], clamp) }}>THE ARCHIVE REMEMBERS</div></AbsoluteFill>
}

function Reunion() {
  return <AbsoluteFill><Backdrop bright /><Face variant="tinker" x={130} y={165} size={235} /><Face variant="pixel" x={510} y={145} size={230} at={15} /><Face variant="bloom" x={890} y={180} size={215} at={30} /><Caption name="BLOOM" color="#ff9b7a" line="The art was never gone. It was waiting for someone to learn it again." at={36} /></AbsoluteFill>
}

export function LostArtFinale() {
  return <AbsoluteFill style={{ background: '#fff0c7' }}><Sequence durationInFrames={145}><Dawn /></Sequence><Sequence from={145} durationInFrames={215}><Reunion /></Sequence></AbsoluteFill>
}
