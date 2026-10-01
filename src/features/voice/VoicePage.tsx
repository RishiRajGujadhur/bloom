import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AudioLines, BookOpen, FolderOpen, Loader2, Mic, Pause, Play, Plus, Sparkles, Square, Trash2 } from 'lucide-react'
import type WaveSurfer from 'wavesurfer.js'
import type { FeaturePageProps } from '../shared/pageProps'
import { subOn } from '../subFeatures'
import { db, type VoiceMemo } from '../../search/db'
import { inferStat } from '../../rpg/schema'
import { DAYBOOK_STORAGE_KEY } from '../../components/daybook/storage'
import { openDaybookPage } from '../../components/layout/CommandPalette'
import { burst } from '../../components/ui/celebrate'
import WhisperWorker from './whisperWorker?worker'
import { extract, toTipTap } from './voiceExtract'
import { onLaunchFiles, openFiles, type Opened } from '../../platform/fsa'
import { opfsDelete, opfsRead, opfsWrite } from '../../platform/opfs'
import { useObjectUrl } from './useObjectUrl'
import { capturePlace } from '../places/placesStore'
import { loadSettings } from '../../SettingsPage'
import './voice.css'
import './soundlab.css'

const SoundLab = lazy(() => import('./SoundLab').then((m) => ({ default: m.SoundLab })))
const AUDIO_ACCEPT = { 'audio/*': ['.wav', '.m4a', '.mp3', '.webm', '.ogg'] }

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/** Whisper wants 16 kHz mono float samples. */
async function toMono16k(blob: Blob) {
  const buf = await blob.arrayBuffer()
  const ctx = new AudioContext()
  const decoded = await ctx.decodeAudioData(buf)
  void ctx.close()
  const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000)
  const src = off.createBufferSource()
  src.buffer = decoded
  src.connect(off.destination)
  src.start()
  return (await off.startRendering()).getChannelData(0)
}

const RATES = [1, 1.25, 1.5, 2, 0.75]

/** One worker for the page; transcriptions queue through it. */
function useWhisper() {
  const worker = useRef<Worker | null>(null)
  const pending = useRef(new Map<number, (r: { text?: string; chunks?: VoiceMemo['chunks']; error?: string }) => void>())
  const next = useRef(0)
  const [status, setStatus] = useState('')
  useEffect(() => () => worker.current?.terminate(), [])
  const transcribe = useCallback((audio: Float32Array) => {
    if (!worker.current) {
      worker.current = new WhisperWorker()
      worker.current.onmessage = ({ data }) => {
        if (data.type === 'progress') {
          setStatus(data.status === 'ready' ? 'Model ready' : `Preparing Whisper${typeof data.progress === 'number' ? ` · ${Math.round(data.progress)}%` : '…'}`)
          return
        }
        pending.current.get(data.id)?.(data)
        pending.current.delete(data.id)
      }
    }
    const id = ++next.current
    return new Promise<{ text?: string; chunks?: VoiceMemo['chunks']; error?: string }>((resolve) => {
      pending.current.set(id, resolve)
      worker.current!.postMessage({ id, audio }, [audio.buffer])
    })
  }, [])
  return { transcribe, status }
}

/** Live level bars while recording. */
function LiveMeter({ stream }: { stream: MediaStream }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    ctx.createMediaStreamSource(stream).connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    let raf = 0
    const draw = () => {
      const c = canvas.current
      const g = c?.getContext('2d')
      if (!c || !g) return
      analyser.getByteFrequencyData(data)
      g.clearRect(0, 0, c.width, c.height)
      const bars = 48
      const w = c.width / bars
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * data.length * 0.7)] / 255
        const h = Math.max(4, v * c.height * 0.9)
        g.fillStyle = `hsl(${12 + v * 30} 70% ${60 - v * 10}%)`
        g.beginPath()
        g.roundRect(i * w + 2, (c.height - h) / 2, w - 4, h, 4)
        g.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      void ctx.close()
    }
  }, [stream])
  return <canvas ref={canvas} className="voice-meter" width={560} height={90} aria-hidden="true" />
}

function MemoCard({
  memo,
  onChange,
  onDelete,
  transcribe,
  status,
  props,
}: {
  memo: VoiceMemo
  onChange: (m: VoiceMemo) => void
  onDelete: () => void
  transcribe: ReturnType<typeof useWhisper>['transcribe']
  status: string
  props: FeaturePageProps
}) {
  const host = useRef<HTMLDivElement>(null)
  const ws = useRef<WaveSurfer | null>(null)
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lab, setLab] = useState(false)
  const url = useObjectUrl(memo.blob)

  useEffect(() => {
    if (!subOn('voiceMemos', 'waveform') || !host.current || !url) return
    let cancelled = false
    void import('wavesurfer.js').then(({ default: WS }) => {
      if (cancelled || !host.current) return
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#d9653b'
      const w = WS.create({
        container: host.current,
        url,
        height: 64,
        barWidth: 3,
        barGap: 2,
        barRadius: 3,
        cursorWidth: 2,
        waveColor: '#d8c7bb',
        progressColor: accent,
        cursorColor: accent,
        normalize: true,
      })
      w.on('play', () => setPlaying(true))
      w.on('pause', () => setPlaying(false))
      w.on('finish', () => setPlaying(false))
      w.on('timeupdate', (t) => setTime(t))
      ws.current = w
    })
    return () => {
      cancelled = true
      ws.current?.destroy()
      ws.current = null
    }
  }, [url])

  // Playback speed, shared by every memo and remembered between visits.
  const [rate, setRate] = useState(() => Number(localStorage.getItem('bloom-voice-rate')) || 1)
  useEffect(() => {
    ws.current?.setPlaybackRate(rate)
    if (audio.current) audio.current.playbackRate = rate
  }, [rate, playing])
  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length]
    setRate(next)
    try {
      localStorage.setItem('bloom-voice-rate', String(next))
    } catch {
      /* this visit only */
    }
  }
  const toggle = () => {
    if (ws.current) void ws.current.playPause()
    else if (audio.current) void (audio.current.paused ? audio.current.play() : audio.current.pause())
  }
  const seek = (t: number) => {
    if (ws.current) {
      ws.current.setTime(t)
      void ws.current.play()
    } else if (audio.current) {
      audio.current.currentTime = t
      void audio.current.play()
    }
  }
  const run = async () => {
    setBusy(true)
    setError('')
    try {
      const r = await transcribe(await toMono16k(memo.blob))
      if (r.error || r.text == null) setError(r.error ?? 'No speech found.')
      else onChange({ ...memo, transcript: r.text, chunks: r.chunks })
    } catch {
      setError('This recording could not be decoded.')
    } finally {
      setBusy(false)
    }
  }
  const toDaybook = () => {
    if (!memo.transcript) return
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    try {
      const list: unknown[] = JSON.parse(localStorage.getItem(DAYBOOK_STORAGE_KEY) ?? '[]')
      list.push({ id, modeId: 'voice-note', modeTitle: 'Voice note', createdAt: now, updatedAt: now, content: { body: toTipTap(memo.title, memo.transcript, memo.chunks ?? []) } })
      localStorage.setItem(DAYBOOK_STORAGE_KEY, JSON.stringify(list))
    } catch {
      setError('Could not save to the Daybook.')
      return
    }
    props.onNavigate('daybook')
    openDaybookPage(id)
  }
  // The untouched original goes to the Origin Private File System the first time a memo is cleaned.
  const applyClean = async (blob: Blob, duration: number) => {
    if (!memo.cleaned) await opfsWrite(`voice-originals/${memo.id}`, memo.blob)
    onChange({ ...memo, blob, mimeType: 'audio/wav', duration, cleaned: true, transcript: undefined, chunks: undefined })
  }
  const restore = async () => {
    const orig = await opfsRead(`voice-originals/${memo.id}`)
    if (!orig) return
    onChange({ ...memo, blob: orig, cleaned: false, transcript: undefined, chunks: undefined })
    await opfsDelete(`voice-originals/${memo.id}`)
  }
  const info = memo.transcript ? extract(memo.transcript) : null
  const activeChunk = memo.chunks?.findIndex((c) => time >= c.start && (c.end == null || time < c.end)) ?? -1

  return (
    <li className="voice-memo">
      <div className="voice-memo-head">
        <button className="voice-play" type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="voice-rate" type="button" onClick={cycleRate} title="Playback speed" aria-label={`Playback speed ${rate}×`}>
          {rate}×
        </button>
        <input
          className="voice-title"
          aria-label="Memo title"
          value={memo.title}
          onChange={(e) => onChange({ ...memo, title: e.target.value })}
        />
        <span className="voice-meta">
          {new Date(memo.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · {fmt(memo.duration)}
        </span>
        {url && (
          <a className="icon-button" href={url} download={`${memo.title.replace(/[^\w-]+/g, '-') || 'memo'}.${memo.mimeType.includes('wav') ? 'wav' : memo.mimeType.includes('ogg') ? 'ogg' : memo.mimeType.includes('mp4') ? 'm4a' : 'webm'}`} aria-label="Download audio" title="Download audio">
            ⬇
          </a>
        )}
        <button className="icon-button" type="button" aria-label="Delete memo" onClick={onDelete}>
          <Trash2 size={15} />
        </button>
      </div>
      {subOn('voiceMemos', 'waveform') ? (
        <div ref={host} className="voice-wave" />
      ) : (
        <audio ref={audio} src={url ?? undefined} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} />
      )}
      {subOn('voiceMemos', 'soundLab') && (
        <button className="voice-action sl-open" type="button" onClick={() => setLab((v) => !v)} aria-expanded={lab}>
          <AudioLines size={15} /> {lab ? 'Close Sound Lab' : memo.cleaned ? 'Sound Lab · cleaned ✓' : 'Sound Lab · remove noise'}
        </button>
      )}
      {lab && (
        <Suspense fallback={<p className="voice-meta">Opening Sound Lab…</p>}>
          <SoundLab memo={memo} onApply={applyClean} onRestore={restore} />
        </Suspense>
      )}
      {subOn('voiceMemos', 'transcribe') && !memo.transcript && (
        <button className="voice-action" type="button" onClick={run} disabled={busy}>
          {busy ? <Loader2 size={15} className="voice-spin" /> : <Sparkles size={15} />} {busy ? status || 'Listening…' : 'Transcribe on this device'}
        </button>
      )}
      {error && <p className="voice-error">{error}</p>}
      {memo.transcript && (
        <div className="voice-transcript">
          {memo.chunks?.length ? (
            <p>
              {memo.chunks.map((c, i) => (
                <button key={i} type="button" className="voice-chunk" data-active={i === activeChunk} onClick={() => seek(c.start)} title={`Jump to ${fmt(c.start)}`}>
                  {c.text}{' '}
                </button>
              ))}
            </p>
          ) : (
            <p>{memo.transcript}</p>
          )}
        </div>
      )}
      {info && subOn('voiceMemos', 'extract') && (
        <div className="voice-extract">
          {info.moods.length > 0 && (
            <div className="voice-tags">
              {info.moods.map((m) => (
                <span key={m}>#{m}</span>
              ))}
            </div>
          )}
          {info.bullets.length > 0 && (
            <ul className="voice-bullets">
              {info.bullets.slice(0, 5).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          {info.habits.length > 0 && (
            <div className="voice-habits">
              <span>Ideas to act on</span>
              {info.habits.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={(e) => {
                    props.setData((d) => ({ ...d, habits: [...d.habits, { id: crypto.randomUUID(), title: h.slice(0, 100), detail: 'From a voice memo', dates: [], stat: inferStat(h) }] }))
                    burst(e.currentTarget, 'stars')
                    e.currentTarget.disabled = true
                  }}
                >
                  <Plus size={14} /> {h}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {memo.transcript && subOn('voiceMemos', 'toDaybook') && (
        <button className="voice-action" type="button" onClick={toDaybook}>
          <BookOpen size={15} /> Open as a Daybook page
        </button>
      )}
    </li>
  )
}

export function VoicePage(props: FeaturePageProps) {
  const [memos, setMemos] = useState<VoiceMemo[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const recorder = useRef<MediaRecorder | null>(null)
  const started = useRef(0)
  const { transcribe, status } = useWhisper()

  useEffect(() => {
    void db.voice_memos
      .orderBy('createdAt')
      .reverse()
      .toArray()
      .then(setMemos)
      .catch(() => setError('Voice memos need browser storage (IndexedDB).'))
  }, [])
  useEffect(() => {
    if (!stream) return
    const t = setInterval(() => setElapsed((Date.now() - started.current) / 1000), 250)
    return () => clearInterval(t)
  }, [stream])

  const start = async () => {
    setError('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(s)
      const parts: Blob[] = []
      rec.ondataavailable = (e) => e.data.size && parts.push(e.data)
      rec.onstop = async () => {
        s.getTracks().forEach((t) => t.stop())
        const blob = new Blob(parts, { type: rec.mimeType })
        const memo: VoiceMemo = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          duration: (Date.now() - started.current) / 1000,
          mimeType: rec.mimeType,
          blob,
          title: `Voice memo · ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
        }
        await db.voice_memos.put(memo)
        setMemos((m) => [memo, ...m])
        if (loadSettings().features.placesMap && subOn('placesMap', 'memoCapture')) capturePlace('memo', null, { ref: memo.id, label: memo.title })
      }
      started.current = Date.now()
      setElapsed(0)
      rec.start(1000)
      recorder.current = rec
      setStream(s)
    } catch {
      setError('Microphone access was blocked. Allow it in your browser to record.')
    }
  }
  const importFiles = useCallback(async (files: Opened[]) => {
    const added: VoiceMemo[] = []
    for (const { file, handle } of files) {
      let duration: number
      try {
        const ctx = new AudioContext()
        duration = (await ctx.decodeAudioData(await file.arrayBuffer())).duration
        void ctx.close()
      } catch {
        setError(`${file.name} isn't an audio file this browser can read.`)
        continue
      }
      const memo: VoiceMemo = { id: crypto.randomUUID(), createdAt: Date.now(), duration, mimeType: file.type || 'audio/wav', blob: file, title: file.name.replace(/\.[^.]+$/, ''), handle: handle ?? undefined }
      await db.voice_memos.put(memo)
      added.push(memo)
    }
    if (added.length) setMemos((m) => [...added, ...m])
  }, [])
  // Opened from the OS ("Open with Bloom") via the manifest's file_handlers.
  useEffect(() => onLaunchFiles((files) => void importFiles(files)), [importFiles])

  const stop = () => {
    recorder.current?.stop()
    recorder.current = null
    setStream(null)
  }
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = q ? memos.filter((m) => `${m.title} ${m.transcript ?? ''}`.toLowerCase().includes(q)) : memos
  const update = (m: VoiceMemo) => {
    setMemos((list) => list.map((x) => (x.id === m.id ? m : x)))
    void db.voice_memos.put(m)
  }

  return (
    <div className="voice-page">
      <section className="voice-recorder" data-recording={!!stream}>
        <button className="voice-rec" type="button" onClick={stream ? stop : start} aria-label={stream ? 'Stop recording' : 'Start recording'}>
          {stream ? <Square size={26} /> : <Mic size={30} />}
        </button>
        <div className="voice-rec-side">
          <h3>{stream ? `Recording · ${fmt(elapsed)}` : 'Think out loud'}</h3>
          {!stream && memos.length > 0 && <small className="voice-meta">{memos.length} memos · {Math.round(memos.reduce((a, m) => a + m.duration, 0) / 60)} min recorded</small>}
          {stream && subOn('voiceMemos', 'liveMeter') ? (
            <LiveMeter stream={stream} />
          ) : (
            <p>Ramble freely. Bloom can transcribe it on this device and pull out the key points, ideas and mood. Audio never leaves your browser.</p>
          )}
          {error && <p className="voice-error">{error}</p>}
          {subOn('voiceMemos', 'openFile') && !stream && (
            <button className="voice-action" type="button" onClick={() => void openFiles('Audio', AUDIO_ACCEPT, true).then(importFiles)}>
              <FolderOpen size={15} /> Open audio files
            </button>
          )}
        </div>
      </section>
      {memos.length > 2 && (
        <input
          type="search"
          className="voice-search"
          aria-label="Search memos"
          placeholder={`Search ${memos.length} memos and transcripts…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      {memos.length === 0 ? (
        <p className="voice-empty">No memos yet. Your first one is a tap away.</p>
      ) : shown.length === 0 ? (
        <p className="voice-empty">No memo mentions “{query}”.</p>
      ) : (
        <ul className="voice-list">
          {shown.map((m) => (
            <MemoCard
              key={m.id}
              memo={m}
              onChange={update}
              onDelete={() => {
                setMemos((list) => list.filter((x) => x.id !== m.id))
                void db.voice_memos.delete(m.id)
              }}
              transcribe={transcribe}
              status={status}
              props={props}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
