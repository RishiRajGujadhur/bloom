import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import chroma from 'chroma-js'
import { Note } from 'tonal'
import { readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import { setQuiz } from '../../companion/quizContext'
import { earQuestion, isBlack, keyFor, keys, noteForKey, norm, play, playSeq, songs, type EarQ } from './pianoModel'
import './piano.css'

/**
 * Piano & Ear Trainer — a playable two-octave SVG piano (mouse, touch or the
 * computer keyboard). Keys glow in a colour for their pitch and ripple on
 * press; Note Quest asks you to find notes; Ear Training plays intervals and
 * chords to name; Songs drop the next notes onto the keys to follow along.
 */
const KEY = 'bloom-piano-v1'
type Mode = 'play' | 'quest' | 'ear' | 'songs'
type Store = { quest: number; ear: number; songs: string[] }
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const hue = (n: string) => chroma.hsl(((Note.chroma(n) ?? 0) / 12) * 360, 0.75, 0.6).hex()
const W = 44

function Piano({ onPress, lit, target }: { onPress: (n: string) => void; lit: Record<string, number>; target?: string | null }) {
  const svg = useRef<SVGSVGElement>(null)
  const whites = keys.filter((k) => !isBlack(k))
  const xOf = (n: string) => {
    const wi = whites.indexOf(n)
    if (wi >= 0) return wi * W
    const prev = Note.fromMidi((Note.midi(n) ?? 60) - 1)
    return whites.indexOf(prev) * W + W * 0.68
  }
  const litKey = Object.keys(lit).join()
  useLayoutEffect(() => {
    if (!svg.current || reduced()) return
    for (const n of Object.keys(lit)) {
      const el = svg.current.querySelector(`[data-note="${n}"]`)
      const ring = svg.current.querySelector(`[data-ring="${n}"]`)
      if (el) gsap.fromTo(el, { y: 3 }, { y: 0, duration: 0.25, ease: 'back.out(3)' })
      if (ring) gsap.fromTo(ring, { attr: { r: 6 }, opacity: 0.9 }, { attr: { r: 34 }, opacity: 0, duration: 0.7, ease: 'power2.out' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [litKey])
  const key = (n: string) => {
    const black = isBlack(n)
    const x = xOf(n)
    const on = lit[n]
    const isT = target === n
    return (
      <g key={n} className={`pn-key ${black ? 'black' : 'white'} ${isT ? 'target' : ''}`} onPointerDown={(e) => { e.preventDefault(); onPress(n) }} role="button" aria-label={n}>
        <rect data-note={n} x={x} y={0} width={black ? W * 0.64 : W - 2} height={black ? 118 : 190} rx={black ? 5 : 8} style={{ ['--c' as string]: hue(n) }} className={on ? 'on' : ''} />
        <circle data-ring={n} cx={x + (black ? W * 0.32 : W / 2)} cy={black ? 95 : 160} r={0} fill={hue(n)} opacity={0} pointerEvents="none" />
        {!black && <text x={x + W / 2 - 1} y={176} textAnchor="middle" className="pn-name">{n.replace(/\d/, '')}</text>}
        <text x={x + (black ? W * 0.32 : W / 2 - 1)} y={black ? 108 : 150} textAnchor="middle" className="pn-kbd">{keyFor[n]}</text>
      </g>
    )
  }
  return (
    <svg ref={svg} className="pn-piano" viewBox={`0 0 ${whites.length * W} 192`} role="group" aria-label="Piano" data-matrix-native>
      {whites.map(key)}
      {keys.filter(isBlack).map(key)}
    </svg>
  )
}

export function PianoPage() {
  const [store, setStore] = useState<Store>(() => readStore(KEY, { quest: 0, ear: 0, songs: [] }))
  const save = (f: (s: Store) => Store) => setStore((s) => { const n = f(s); writeStore(KEY, n); return n })
  const [mode, setMode] = useState<Mode>('play')
  // Hide key labels to practise by ear and position.
  const [labels, setLabels] = useState(() => localStorage.getItem('bloom-piano-labels') !== '0')
  const [lit, setLit] = useState<Record<string, number>>({})
  const [target, setTarget] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [ear, setEar] = useState<EarQ | null>(null)
  const [earKind, setEarKind] = useState<'interval' | 'chord'>('interval')
  const [picked, setPicked] = useState<string | null>(null)
  const [songId, setSongId] = useState(songs[0].id)
  const [step, setStep] = useState(0)
  const lane = useRef<HTMLDivElement>(null)
  const song = songs.find((s) => s.id === songId)!

  const flash = useCallback((n: string) => {
    const stamp = Date.now()
    setLit((l) => ({ ...l, [n]: stamp }))
    window.setTimeout(() => setLit((l) => (l[n] === stamp ? Object.fromEntries(Object.entries(l).filter(([k]) => k !== n)) : l)), 320)
  }, [])
  const newQuest = useCallback(() => {
    const whites = keys.filter((k) => !isBlack(k))
    const n = whites[Math.floor(Math.random() * whites.length)]
    setTarget(null)
    setMsg(`Find ${n.replace(/\d/, '')} in octave ${n.slice(-1)}`)
    setQuestNote(n)
  }, [])
  const [questNote, setQuestNote] = useState<string | null>(null)

  const press = useCallback((n: string) => {
    flash(n)
    void play(n)
    if (mode === 'quest' && questNote) {
      if (n === questNote) {
        setMsg(`✓ That’s ${n}!`)
        save((s) => ({ ...s, quest: s.quest + 1 }))
        window.setTimeout(newQuest, 700)
      } else setMsg(`That’s ${n} — try again.`)
    }
    if (mode === 'songs') {
      if (n === norm(song.notes[step])) {
        const next = step + 1
        if (lane.current && !reduced()) gsap.fromTo(lane.current.querySelectorAll('.pn-drop'), { y: -34 }, { y: 0, duration: 0.3, ease: 'power2.out' })
        if (next >= song.notes.length) {
          setStep(0)
          setMsg(`🎉 You played ${song.title}!`)
          burst(undefined, 'stars')
          save((s) => ({ ...s, songs: s.songs.includes(song.id) ? s.songs : [...s.songs, song.id] }))
        } else setStep(next)
      }
    }
  }, [flash, mode, questNote, song, step, newQuest])

  // MIDI keyboards (Web MIDI): note-on messages play through the same path as clicks.
  const [midi, setMidi] = useState<{ status: 'off' | 'on' | 'none' | 'error'; name?: string }>({ status: 'off' })
  const pressRef = useRef(press)
  useEffect(() => {
    pressRef.current = press
  }, [press])
  const midiAccess = useRef<MIDIAccess | null>(null)
  const connectMidi = async () => {
    if (!navigator.requestMIDIAccess) return setMidi({ status: 'error' })
    try {
      const access = await navigator.requestMIDIAccess()
      midiAccess.current = access
      const hook = () => {
        const inputs = [...access.inputs.values()]
        for (const input of inputs)
          input.onmidimessage = (e) => {
            const [cmd, noteNo, vel] = e.data ?? []
            if ((cmd & 0xf0) !== 0x90 || !vel) return
            // Fold into the on-screen two octaves so the key lights up.
            let m = noteNo
            while (m < 48) m += 12
            while (m > 71) m -= 12
            pressRef.current(Note.fromMidi(m))
          }
        setMidi(inputs.length ? { status: 'on', name: inputs.map((i) => i.name).join(', ') } : { status: 'none' })
      }
      hook()
      access.onstatechange = hook
    } catch {
      setMidi({ status: 'error' })
    }
  }
  useEffect(
    () => () => {
      const a = midiAccess.current
      if (!a) return
      a.onstatechange = null
      for (const input of a.inputs.values()) input.onmidimessage = null
    },
    [],
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || (e.target as HTMLElement)?.closest?.('input, textarea, select')) return
      const n = noteForKey[e.key.toLowerCase()]
      if (n) {
        e.preventDefault()
        press(n)
      }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [press])
  useEffect(() => {
    setMsg('')
    setTarget(null)
    setPicked(null)
    if (mode === 'quest') newQuest()
    if (mode === 'ear') setEar(earQuestion(earKind))
    if (mode === 'songs') setStep(0)
  }, [mode, earKind, newQuest])
  useEffect(() => {
    if (mode === 'songs') setTarget(norm(song.notes[step]))
  }, [mode, song, step])
  useEffect(() => {
    if (!ear) return setQuiz(null)
    setQuiz({ source: 'Ear training', question: `Name this ${ear.kind}.`, answer: ear.answer, options: ear.options, explain: ear.hint })
    return () => setQuiz(null)
  }, [ear])

  const listen = () => ear && (ear.kind === 'chord' ? void play(ear.notes, '2n') : void playSeq(ear.notes, 0.6))
  const upcoming = song.notes.slice(step, step + 6)
  return (
    <div className="pn-page" data-labels={labels ? 'on' : 'off'}>
      <header className="pn-head">
        <div>
          <p className="pn-eyebrow">Piano & ear trainer</p>
          <h2>{mode === 'play' ? 'Just play' : mode === 'quest' ? 'Note quest' : mode === 'ear' ? 'Ear training' : song.title}</h2>
        </div>
        <button type="button" className="pn-mode" aria-pressed={labels} title="Show or hide note names and keyboard letters" onClick={() => setLabels((v) => { try { localStorage.setItem('bloom-piano-labels', v ? '0' : '1') } catch { /* optional */ } return !v })}>
          {labels ? '🔤 Labels on' : '🔤 Labels off'}
        </button>
        <div className="pn-modes" role="tablist" aria-label="Mode">
          {(['play', 'quest', 'ear', 'songs'] as Mode[]).map((m) => <button key={m} type="button" role="tab" aria-selected={mode === m} className={`pn-mode ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}>{{ play: '🎹 Play', quest: '🎯 Note quest', ear: '👂 Ear', songs: '🎵 Songs' }[m]}</button>)}
        </div>
      </header>
      <section className="pn-stage">
        {mode === 'play' && <p className="pn-big">Play with your mouse, touch or keyboard — <kbd>Z</kbd>–<kbd>M</kbd> for the low octave, <kbd>Q</kbd>–<kbd>U</kbd> for the high one.</p>}
        {'requestMIDIAccess' in navigator && (
          <p className="pn-midi">
            {midi.status === 'on' ? (
              <>🎹 MIDI: {midi.name}</>
            ) : (
              <button type="button" className="pn-mode" onClick={() => void connectMidi()}>
                🎹 {midi.status === 'none' ? 'No MIDI keyboard found — plug one in' : midi.status === 'error' ? 'MIDI blocked — try again' : 'Connect a MIDI keyboard'}
              </button>
            )}
          </p>
        )}
        {mode === 'quest' && <p className="pn-big">{msg} <small>· {store.quest} found</small></p>}
        {mode === 'ear' && ear && (
          <div className="pn-ear">
            <div className="pn-chips">
              {(['interval', 'chord'] as const).map((k) => <button key={k} type="button" className={`pn-mode ${earKind === k ? 'on' : ''}`} onClick={() => setEarKind(k)}>{k === 'interval' ? 'Intervals' : 'Chords'}</button>)}
              <button type="button" className="pn-cta" onClick={listen}>▶ Listen</button>
            </div>
            <div className="pn-options">
              {ear.options.map((o) => (
                <button key={o} type="button" disabled={!!picked} className={`pn-opt ${picked && o === ear.answer ? 'right' : ''} ${picked === o && o !== ear.answer ? 'wrong' : ''}`} onClick={() => {
                  setPicked(o)
                  if (o === ear.answer) { save((s) => ({ ...s, ear: s.ear + 1 })); burst(undefined, 'stars') }
                  for (const n of ear.notes) flash(n)
                }}>{o}</button>
              ))}
            </div>
            {picked && <p className="pn-note">{picked === ear.answer ? '✓ ' : '✗ '}{ear.hint} <button type="button" className="pn-cta" onClick={() => { setPicked(null); setEar(earQuestion(earKind)) }}>Next</button></p>}
            {!picked && <p className="pn-note">Press Listen, then choose · {store.ear} correct so far</p>}
          </div>
        )}
        {mode === 'songs' && (
          <div className="pn-songs">
            <div className="pn-chips">{songs.map((s) => <button key={s.id} type="button" className={`pn-mode ${s.id === songId ? 'on' : ''}`} onClick={() => { setSongId(s.id); setStep(0); setMsg('') }}>{store.songs.includes(s.id) ? '★ ' : ''}{s.title}</button>)}</div>
            <div ref={lane} className="pn-lane" aria-label="Upcoming notes">
              {upcoming.map((n, i) => <span key={`${step}-${i}`} className={`pn-drop ${i === 0 ? 'now' : ''}`} style={{ ['--c' as string]: hue(n) }}>{norm(n).replace(/\d/, '')}<small>{keyFor[norm(n)]}</small></span>)}
            </div>
            <p className="pn-note">{msg || `Note ${step + 1} of ${song.notes.length} — press the glowing key.`}</p>
          </div>
        )}
      </section>
      <Piano onPress={press} lit={lit} target={target} />
    </div>
  )
}
