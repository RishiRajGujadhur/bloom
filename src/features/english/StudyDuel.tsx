import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import QRCode from 'qrcode'
import { getStroke } from 'perfect-freehand'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { CapsBadge } from '../../platform/CapsBadge'
import { burst } from '../../components/ui/celebrate'
import { makeRound, points, roomCode } from './duelModel'
import './duel.css'

/**
 * Study Duel: race a friend through the same English round, peer to peer.
 * The room is a Yjs CRDT document shared over WebRTC (encrypted with the room
 * code), so there's no game server and a dropped connection simply re-merges.
 * Tabs on the same device sync through BroadcastChannel.
 */
type Player = { name: string; emoji: string; score: number; idx: number; streak: number; done: boolean; at: number }
type Stroke = { color: string; pts: number[][] }
const EMOJI = ['🦊', '🐼', '🦉', '🐙', '🦄', '🐯', '🐸', '🐧']
const COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#fcc419', '#cc5de8', '#ff922b']
const N = 10
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const me = (() => {
  try {
    const k = 'bloom-duel-me'
    const v = sessionStorage.getItem(k) ?? crypto.randomUUID()
    sessionStorage.setItem(k, v)
    return v
  } catch { return crypto.randomUUID() }
})()

function useRoom(code: string | null) {
  const [state, setState] = useState<{ players: Record<string, Player>; seed: string; phase: string; startAt: number; strokes: Stroke[]; peers: number }>({ players: {}, seed: '', phase: 'lobby', startAt: 0, strokes: [], peers: 0 })
  const ref = useRef<{ doc: Y.Doc; players: Y.Map<Player>; game: Y.Map<string | number>; strokes: Y.Array<Stroke> } | null>(null)
  useEffect(() => {
    if (!code) return
    const doc = new Y.Doc()
    const provider = new WebrtcProvider(`bloom-duel-${code}`, doc, { password: `bloom-${code}`, signaling: ['wss://signaling.yjs.dev'] })
    const players = doc.getMap<Player>('players')
    const game = doc.getMap<string | number>('game')
    const strokes = doc.getArray<Stroke>('strokes')
    ref.current = { doc, players, game, strokes }
    const sync = () => setState({ players: players.toJSON() as Record<string, Player>, seed: String(game.get('seed') ?? ''), phase: String(game.get('phase') ?? 'lobby'), startAt: Number(game.get('startAt') ?? 0), strokes: strokes.toArray(), peers: (provider.room?.webrtcConns.size ?? 0) + (provider.room?.bcConns.size ?? 0) })
    doc.on('update', sync)
    const peersTimer = setInterval(sync, 1500)
    sync()
    return () => { clearInterval(peersTimer); doc.off('update', sync); provider.destroy(); doc.destroy(); ref.current = null }
  }, [code])
  return { ...state, room: ref }
}

function Track({ players }: { players: [string, Player][] }) {
  const orbs = useRef<Record<string, SVGGElement | null>>({})
  const max = Math.max(N * 300, ...players.map(([, p]) => p.score))
  useLayoutEffect(() => {
    players.forEach(([id, p]) => {
      const el = orbs.current[id]
      if (!el) return
      const x = 40 + (p.score / max) * 520
      if (reduced()) gsap.set(el, { x })
      else gsap.to(el, { x, duration: 0.9, ease: 'elastic.out(1, 0.6)' })
    })
  })
  return (
    <svg className="du-track" viewBox={`0 0 620 ${players.length * 54 + 30}`} role="img" aria-label={players.map(([, p]) => `${p.name} ${p.score}`).join(', ')} data-matrix-native>
      <defs><filter id="du-glow"><feGaussianBlur stdDeviation="4" /></filter></defs>
      {players.map(([id, p], i) => (
        <g key={id} transform={`translate(0 ${i * 54 + 46})`}>
          <line x1="40" x2="580" y1="0" y2="0" className="du-lane" />
          <line x1="580" x2="580" y1="-18" y2="18" className="du-finish" />
          <g ref={(el) => { orbs.current[id] = el }}>
            <circle r="18" fill={COLORS[i % COLORS.length]} opacity="0.55" filter="url(#du-glow)" />
            <circle r="15" fill={COLORS[i % COLORS.length]} />
            <text y="6" textAnchor="middle" className="du-orb-emoji">{p.emoji}</text>
            <text y="-24" textAnchor="middle" className="du-orb-score">{p.score}</text>
          </g>
          <text x="0" y="5" className="du-lane-name">{id === me ? 'You' : p.name.slice(0, 6)}</text>
        </g>
      ))}
    </svg>
  )
}

function Whiteboard({ strokes, onAdd, onClear }: { strokes: Stroke[]; onAdd: (s: Stroke) => void; onClear: () => void }) {
  const [live, setLive] = useState<number[][] | null>(null)
  const [color, setColor] = useState(COLORS[1])
  const svg = useRef<SVGSVGElement>(null)
  const pt = (e: React.PointerEvent) => { const r = svg.current!.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 600, ((e.clientY - r.top) / r.height) * 300, e.pressure || 0.5] }
  const path = (pts: number[][]) => {
    const s = getStroke(pts, { size: 7, thinning: 0.6, smoothing: 0.5, streamline: 0.5 })
    return s.length ? `M${s.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} Z` : ''
  }
  return (
    <div className="du-board bloom-stack">
      <div className="du-board-bar bloom-inline">
        <strong>Shared whiteboard</strong>
        {COLORS.slice(0, 4).map((c) => <button key={c} type="button" className={`du-swatch ${c === color ? 'on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Ink ${c}`} />)}
        <button type="button" className="du-ghost" onClick={onClear}>Clear</button>
      </div>
      <svg ref={svg} viewBox="0 0 600 300" className="du-canvas" data-matrix-native
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setLive([pt(e)]) }}
        onPointerMove={(e) => { if (live) setLive((l) => [...(l ?? []), pt(e)]) }}
        onPointerUp={() => { if (live && live.length > 1) onAdd({ color, pts: live.map((p) => p.map((v) => Math.round(v * 10) / 10)) }); setLive(null) }}
        aria-label="Shared whiteboard: draw to explain an answer">
        {strokes.map((s, i) => <path key={i} d={path(s.pts)} fill={s.color} />)}
        {live && <path d={path(live)} fill={color} />}
      </svg>
    </div>
  )
}

export function StudyDuel({ onXp }: { onXp: (n: number) => void }) {
  const [code, setCode] = useState<string | null>(() => new URLSearchParams(location.search).get('duel'))
  const [joinCode, setJoinCode] = useState('')
  const [name, setName] = useState(() => { try { return localStorage.getItem('bloom-duel-name') ?? '' } catch { return '' } })
  const [qr, setQr] = useState('')
  const [now, setNow] = useState(Date.now())
  const [pick, setPick] = useState<{ i: number; chosen: string } | null>(null)
  const shownAt = useRef(Date.now())
  const room = useRoom(code)
  const players = Object.entries(room.players).sort((a, b) => a[1].at - b[1].at)
  const mine = room.players[me]
  const round = useMemo(() => (room.seed ? makeRound(room.seed, N) : []), [room.seed])
  const link = code ? `${location.origin}${location.pathname}?duel=${code}#english` : ''

  useEffect(() => { if (link) void QRCode.toDataURL(link, { margin: 1, width: 180, color: { dark: '#0b1020', light: '#ffffff' } }).then(setQr) }, [link])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(t) }, [])
  // Join the room as a player.
  useEffect(() => {
    const r = room.room.current
    if (!r || !code || r.players.get(me)) return
    const nm = name.trim() || `Player ${players.length + 1}`
    r.players.set(me, { name: nm, emoji: EMOJI[[...me].reduce((a, c) => a + c.charCodeAt(0), 0) % EMOJI.length], score: 0, idx: 0, streak: 0, done: false, at: Date.now() })
  }, [code, room.room, room.players, name, players.length])
  useEffect(() => { shownAt.current = Date.now(); setPick(null) }, [mine?.idx])

  const start = () => {
    const r = room.room.current
    if (!r) return
    r.doc.transact(() => {
      r.game.set('seed', `${code}-${Date.now()}`)
      r.game.set('startAt', Date.now() + 3500)
      r.game.set('phase', 'playing')
      r.players.forEach((p, id) => r.players.set(id, { ...p, score: 0, idx: 0, streak: 0, done: false }))
    })
  }
  const answer = (opt: string) => {
    const r = room.room.current
    const q = round[mine?.idx ?? 0]
    if (!r || !mine || !q || pick) return
    const ok = opt === q.answer
    const streak = ok ? mine.streak + 1 : 0
    setPick({ i: mine.idx, chosen: opt })
    if (ok && !reduced()) burst(undefined, 'stars')
    setTimeout(() => {
      const idx = mine.idx + 1
      const done = idx >= round.length
      r.players.set(me, { ...mine, score: mine.score + points(ok, Date.now() - shownAt.current, mine.streak), idx, streak, done })
      if (done) onXp(20)
    }, 650)
  }

  const counting = room.phase === 'playing' && now < room.startAt
  const allDone = players.length > 0 && players.every(([, p]) => p.done)
  const winner = [...players].sort((a, b) => b[1].score - a[1].score)[0]

  if (!code) {
    return (
      <section className="du" aria-label="Study duel">
        <header className="du-head">
          <div><p className="du-eyebrow">Study duel</p><h3>Race a friend. Same questions, peer to peer.</h3></div>
          <CapsBadge caps={['crdt', 'gpu']} />
        </header>
        <div className="du-lobby">
          <label className="du-name">Your name<input className="studio-input" value={name} maxLength={16} onChange={(e) => { setName(e.target.value); try { localStorage.setItem('bloom-duel-name', e.target.value) } catch { /* optional */ } }} placeholder="e.g. Rishi" /></label>
          <button type="button" className="du-cta" onClick={() => setCode(roomCode())}>⚔️ Create a duel</button>
          <form className="du-join bloom-wrap" onSubmit={(e) => { e.preventDefault(); if (joinCode.trim().length === 5) setCode(joinCode.trim().toUpperCase()) }}>
            <input className="studio-input" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Room code" maxLength={5} aria-label="Room code" />
            <button type="submit" className="du-ghost">Join</button>
          </form>
          <p className="du-small">No accounts, no game server: devices talk directly over encrypted WebRTC and merge the game as a CRDT. Tabs on this device join instantly.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="du" aria-label="Study duel">
      <header className="du-head">
        <div><p className="du-eyebrow">Study duel · room {code}</p><h3>{room.phase === 'lobby' ? 'Waiting for players…' : allDone ? `${winner?.[0] === me ? 'You win! 🏆' : `${winner?.[1].name} wins 🏆`}` : counting ? 'Get ready…' : 'Go!'}</h3></div>
        <div className="du-status"><CapsBadge caps={['crdt', 'gpu']} /><span className={`du-peers ${room.peers ? 'on' : ''}`}>● {room.peers} peer{room.peers === 1 ? '' : 's'} connected</span></div>
      </header>
      <Track players={players} />
      <div className="du-grid">
        <div className="du-play">
          {room.phase === 'lobby' || allDone ? (
            <div className="du-waiting bloom-controls">
              {qr && <img src={qr} alt={`QR code to join room ${code}`} className="du-qr" />}
            {link && (
              <button type="button" className="du-cta" onClick={(e) => { void navigator.clipboard?.writeText(link); e.currentTarget.textContent = '✓ Link copied' }}>
                🔗 Copy invite link
              </button>
            )}
              <div>
                <p>Scan to join, or enter code <b className="du-code">{code}</b> in Bloom → English → Duel.</p>
                <ul className="du-roster">{players.map(([id, p]) => <li key={id}>{p.emoji} {id === me ? `${p.name} (you)` : p.name}{allDone ? ` — ${p.score}` : ''}</li>)}</ul>
                <div className="du-row bloom-wrap">
                  <button type="button" className="du-cta" onClick={start}>{allDone ? 'Rematch' : players.length > 1 ? `Start (${players.length} players)` : 'Start solo'}</button>
                  <button type="button" className="du-ghost" onClick={() => setCode(null)}>Leave</button>
                </div>
              </div>
            </div>
          ) : counting ? (
            <div className="du-count" key={Math.ceil((room.startAt - now) / 1000)}>{Math.ceil((room.startAt - now) / 1000)}</div>
          ) : mine && !mine.done && round[mine.idx] ? (
            <div className="du-q">
              <p className="du-qn">Question {mine.idx + 1} / {round.length}{mine.streak > 1 ? ` · 🔥 ${mine.streak} in a row` : ''}</p>
              <h4>{round[mine.idx].prompt}</h4>
              {round[mine.idx].hint && <p className="du-hint">{round[mine.idx].hint}</p>}
              <div className="du-opts bloom-columns">
                {round[mine.idx].options.map((o) => {
                  const state = pick && pick.i === mine.idx ? (o === round[mine.idx].answer ? 'right' : o === pick.chosen ? 'wrong' : '') : ''
                  return <button key={o} type="button" className={`du-opt ${state}`} onClick={() => answer(o)}>{o}</button>
                })}
              </div>
            </div>
          ) : (
            <div className="du-waiting bloom-controls"><p>Finished with <b>{mine?.score}</b> points. Waiting for the others…</p></div>
          )}
        </div>
        <Whiteboard strokes={room.strokes} onAdd={(s) => room.room.current?.strokes.push([s])} onClear={() => { const a = room.room.current?.strokes; if (a) a.delete(0, a.length) }} />
      </div>
    </section>
  )
}
