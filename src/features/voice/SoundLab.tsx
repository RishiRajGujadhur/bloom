import { Checkbox } from '../../components/ui/Checkbox'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type WaveSurfer from 'wavesurfer.js'
import { CapsBadge } from '../../platform/CapsBadge'
import { saveFile } from '../../platform/fsa'
import { burst } from '../../components/ui/celebrate'
import { subOn } from '../subFeatures'
import type { VoiceMemo } from '../../search/db'
import { clean, decode48k, getPool, spectro, toMp3, type CleanResult } from './soundEngine'
import { Spectro3D } from './Spectro3D'
import { useObjectUrl } from './useObjectUrl'

/**
 * Sound Lab: one-tap noise removal for a voice memo. RNNoise (a neural net in
 * Wasm) and a SIMD spectral gate run on every core at once; a 3D spectral
 * mountain morphs from before to after, and an A/B switch lets you hear it.
 */
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** HUD ring: one segment per CPU core, lighting up as the shared Atomics counter advances. */
function CoreRing({ threads, done, total }: { threads: number; done: number; total: number }) {
  const ring = useRef<SVGGElement>(null)
  useLayoutEffect(() => {
    if (!ring.current || reduced()) return
    const t = gsap.to(ring.current, { rotation: 360, svgOrigin: '60 60', duration: 6, ease: 'none', repeat: -1 })
    return () => { t.kill() }
  }, [])
  const pct = total ? done / total : 0
  const seg = (2 * Math.PI * 44) / threads
  return (
    <svg className="sl-ring" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="54" className="sl-ring-track" />
      <circle cx="60" cy="60" r="54" className="sl-ring-fill" strokeDasharray={`${pct * 339.3} 339.3`} transform="rotate(-90 60 60)" />
      <g ref={ring}>
        {Array.from({ length: threads }, (_, i) => (
          <circle key={i} cx="60" cy="60" r="44" className={`sl-core ${i < Math.ceil(pct * threads) ? 'on' : ''}`} strokeDasharray={`${seg - 3} ${2 * Math.PI * 44 - seg + 3}`} strokeDashoffset={-i * seg} />
        ))}
      </g>
      <text x="60" y="58" textAnchor="middle" className="sl-ring-num">{Math.round(pct * 100)}%</text>
      <text x="60" y="74" textAnchor="middle" className="sl-ring-sub">{threads} cores</text>
    </svg>
  )
}

export function SoundLab({ memo, onApply, onRestore }: { memo: VoiceMemo; onApply: (blob: Blob, duration: number) => Promise<void>; onRestore: () => Promise<void> }) {
  const [before, setBefore] = useState<Float32Array | null>(null)
  const [specA, setSpecA] = useState<Uint8Array | null>(null)
  const [specB, setSpecB] = useState<Uint8Array | null>(null)
  const [res, setRes] = useState<CleanResult | null>(null)
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null)
  const [showAfter, setShowAfter] = useState(true)
  // Keyboard A/B: press A for the original, B for the cleaned version.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement | null)?.closest?.('input, textarea, [contenteditable="true"]')) return
      if (e.key === 'a' || e.key === 'A') setShowAfter(false)
      else if (e.key === 'b' || e.key === 'B') setShowAfter(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const [opts, setOpts] = useState({ ai: true, gate: true, strength: 0.8, level: true, trim: false })
  const [play, setPlay] = useState(0)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')
  const wave = useRef<HTMLDivElement>(null)
  const spec = useRef<HTMLDivElement>(null)
  const ws = useRef<WaveSurfer | null>(null)
  const beforeUrl = useObjectUrl(memo.blob)
  const afterUrl = useObjectUrl(res?.blob)
  const threads = getPool().size

  useEffect(() => {
    let off = false
    void decode48k(memo.blob)
      .then(async (s) => { if (off) return; setBefore(s); const sp = await spectro(s); if (!off) setSpecA(sp) })
      .catch(() => setErr('This recording could not be decoded.'))
    return () => { off = true }
  }, [memo.blob])

  // Waveform + 2D spectrogram of whichever version is selected (wavesurfer and its spectrogram plugin).
  const current = showAfter && afterUrl ? afterUrl : beforeUrl
  useEffect(() => {
    if (!wave.current || !current) return
    if (spec.current) spec.current.innerHTML = ''
    let cancelled = false
    const at = ws.current?.getCurrentTime() ?? 0
    const wasPlaying = ws.current?.isPlaying() ?? false
    ws.current?.destroy()
    void Promise.all([import('wavesurfer.js'), import('wavesurfer.js/dist/plugins/spectrogram.esm.js')]).then(([{ default: WS }, { default: Spectrogram }]) => {
      if (cancelled || !wave.current) return
      const w = WS.create({ container: wave.current, url: current, sampleRate: 16000, height: 54, barWidth: 2, barGap: 1, barRadius: 2, waveColor: '#8c7ab8', progressColor: '#7df9ff', cursorColor: '#7df9ff', normalize: true })
      w.registerPlugin(Spectrogram.create({ container: spec.current ?? undefined, labels: false, height: 90, splitChannels: false, scale: 'mel', frequencyMax: 8000, colorMap: 'roseus' }))
      w.on('ready', () => { if (at) w.setTime(at); if (wasPlaying) void w.play() })
      w.on('timeupdate', (t) => setPlay(t / Math.max(0.01, w.getDuration())))
      ws.current = w
    })
    return () => { cancelled = true }
  }, [current])
  useEffect(() => () => { ws.current?.destroy(); ws.current = null }, [])

  const run = async () => {
    if (!before) return
    setErr('')
    setNote('')
    setBusy({ done: 0, total: 1 })
    try {
      const r = await clean(before, opts, (done, total) => setBusy({ done, total }))
      setRes(r)
      setShowAfter(true)
      setSpecB(await spectro(r.samples))
      burst(undefined, 'stars')
    } catch (e) {
      setErr(`Cleaning failed: ${(e as Error).message}`)
    } finally {
      setBusy(null)
    }
  }
  const save = async (kind: 'wav' | 'mp3') => {
    if (!res) return
    const blob = kind === 'wav' ? res.blob : await toMp3(res.samples)
    const back = kind === 'wav' && memo.handle?.name.toLowerCase().endsWith('.wav') ? memo.handle : null
    const ok = await saveFile(blob, `${memo.title.replace(/[^\w\- ]+/g, '').trim() || 'memo'} (clean).${kind}`, kind === 'wav' ? { 'audio/wav': ['.wav'] } : { 'audio/mpeg': ['.mp3'] }, back)
    if (ok) setNote(back ? `Saved back to ${back.name}` : 'Saved.')
  }
  const drop = res ? Math.max(0, res.beforeDb - res.afterDb) : 0

  return (
    <section className="sl" aria-label="Sound Lab">
      <header className="sl-head">
        <div>
          <p className="sl-eyebrow">Sound Lab</p>
          <h4>Remove the noise, keep the voice</h4>
        </div>
        <CapsBadge caps={['simd', 'mt', 'gpu', 'oc', 'opfs', 'fsa']} />
      </header>
      <div className="sl-grid">
        <div className="sl-stage">
          {subOn('voiceMemos', 'spectrogram3d') && specA ? <Spectro3D before={specA} after={specB} showAfter={showAfter} progress={play} /> : <div className="sl-mountain sl-wait">{err || 'Reading the recording…'}</div>}
          {busy && (
            <div className="sl-overlay">
              <div className="sl-scan" aria-hidden="true" />
              <CoreRing threads={threads} done={busy.done} total={busy.total} />
            </div>
          )}
          <div className="sl-ab bloom-wrap" role="radiogroup" aria-label="Listen to">
            <button type="button" role="radio" aria-checked={!showAfter || !res} className={!showAfter || !res ? 'on' : ''} onClick={() => setShowAfter(false)}>A · Original</button>
            <button type="button" role="radio" aria-checked={showAfter && !!res} className={showAfter && res ? 'on' : ''} disabled={!res} onClick={() => setShowAfter(true)}>B · Cleaned</button>
            <button type="button" className="sl-play" onClick={() => void ws.current?.playPause()}>▶︎ / ❚❚</button>
          </div>
          <div className="sl-wave"><div ref={wave} /><div ref={spec} className="sl-spec" /></div>
        </div>
        <div className="sl-side bloom-start-stack">
          <fieldset className="sl-opts">
            <legend>Cleaning</legend>
            <label><Checkbox checked={opts.ai} onCheckedChange={(checked) => setOpts({ ...opts, ai: checked })} /> AI voice isolation <small>RNNoise neural net</small></label>
            <label><Checkbox checked={opts.gate} onCheckedChange={(checked) => setOpts({ ...opts, gate: checked })} /> Spectral gate <small>SIMD FFT, learns the hiss</small></label>
            <label className="sl-range">Strength <input type="range" min={0.2} max={1} step={0.05} value={opts.strength} onChange={(e) => setOpts({ ...opts, strength: Number(e.target.value) })} /> <b>{Math.round(opts.strength * 100)}%</b></label>
            <label><Checkbox checked={opts.level} onCheckedChange={(checked) => setOpts({ ...opts, level: checked })} /> Level the voice</label>
            <label><Checkbox checked={opts.trim} onCheckedChange={(checked) => setOpts({ ...opts, trim: checked })} /> Trim long pauses</label>
          </fieldset>
          <button type="button" className="sl-cta" onClick={() => void run()} disabled={!before || !!busy || (!opts.ai && !opts.gate && !opts.level && !opts.trim)}>{busy ? 'Cleaning…' : res ? 'Clean again' : '✨ Clean it'}</button>
          {res && (
            <div className="sl-stats">
              <p><b>{drop.toFixed(0)} dB</b> quieter background</p>
              <p>{res.threads} cores · {res.backend === 'simd' ? 'Wasm SIMD128' : res.backend === 'wasm' ? 'Wasm' : 'JS'} FFT · {(res.ms / 1000).toFixed(2)} s</p>
              <div className="sl-actions">
                <button type="button" className="sl-ghost" onClick={() => void onApply(res.blob, res.samples.length / 48000).then(() => setNote('The memo now uses the cleaned audio. Transcribe it again for a cleaner transcript.'))}>Use cleaned version</button>
                <button type="button" className="sl-ghost" onClick={() => void save('wav')}>{memo.handle?.name.toLowerCase().endsWith('.wav') ? `Save back to ${memo.handle.name}` : 'Save WAV'}</button>
                <button type="button" className="sl-ghost" onClick={() => void save('mp3')}>Save MP3</button>
              </div>
            </div>
          )}
          {memo.cleaned && <button type="button" className="sl-link" onClick={() => void onRestore().then(() => { setRes(null); setSpecB(null); setNote('Original restored.') })}>Restore the original recording</button>}
          {note && <p className="sl-note">{note}</p>}
          {err && <p className="voice-error">{err}</p>}
        </div>
      </div>
    </section>
  )
}
