import { useEffect, useRef, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, CameraOff, Crosshair, HeartPulse, ShieldCheck, Skull, Zap } from 'lucide-react'
import type { AppData } from '../../model'
import type { FeaturePageProps } from '../shared/pageProps'
import { totals } from '../../rpg/engine'
import { subOn } from '../subFeatures'
import {
  acknowledgePosture,
  calibratePosture,
  getPosture,
  onPostureEvent,
  postureSettings,
  savePostureSettings,
  startPosture,
  stopPosture,
  subscribePosture,
} from './postureRuntime'
import { useTabTitle } from '../../utils/useTabTitle'
import './posture.css'

const usePosture = () => useSyncExternalStore(subscribePosture, getPosture, getPosture)
const CONNECTIONS: [number, number][] = [[7, 11], [8, 12], [11, 12], [11, 13], [12, 14], [13, 15], [14, 16], [7, 8]]

/**
 * Applies posture events to the RPG (poison −HP, stamina +HP) and shows the
 * slouch warning anywhere in the app. Mounted once by the app shell.
 */
export function PostureGuardian({ setData }: { setData: Dispatch<SetStateAction<AppData>> }) {
  const posture = usePosture()
  const [flash, setFlash] = useState<'poison' | 'stamina' | null>(null)
  useEffect(
    () =>
      onPostureEvent((event) => {
        if (event.type !== 'poison' && event.type !== 'stamina') return
        if (event.type === 'poison' && !subOn('postureGuard', 'poison')) return
        if (event.type === 'stamina' && !subOn('postureGuard', 'stamina')) return
        const amount = event.type === 'poison' ? postureSettings().rules.poison : 1
        setData((d) => ({
          ...d,
          rpg: { ...d.rpg, posture: [...(d.rpg.posture ?? []), { at: event.at, kind: event.type as 'poison' | 'stamina', amount }] },
        }))
        setFlash(event.type as 'poison' | 'stamina')
        setTimeout(() => setFlash(null), 2500)
      }),
    [setData],
  )
  const warning = posture.status === 'running' && posture.warnedAt !== null && subOn('postureGuard', 'warnings')
  return (
    <AnimatePresence>
      {warning && (
        <motion.div
          className="posture-warning"
          role="alert"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
        >
          <Skull size={20} aria-hidden="true" />
          <span>
            <strong>You’ve been slouching for a while</strong>
            <small>Sit tall and roll your shoulders back, or poison starts to sting.</small>
          </span>
          <button className="ov-primary" onClick={acknowledgePosture}>
            I’m sitting up
          </button>
          <a className="ov-secondary posture-move" href="#habits" onClick={acknowledgePosture}>
            Movement snack
          </a>
        </motion.div>
      )}
      {flash && (
        <motion.div
          key={flash}
          className={`posture-flash is-${flash}`}
          aria-live="polite"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {flash === 'poison' ? '☠️ Poison damage −HP' : '⚡ Stamina +1 HP'}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function PosturePage({ data }: FeaturePageProps) {
  const posture = usePosture()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [settings, setSettings] = useState(postureSettings)
  const [consented, setConsented] = useState(() => Boolean(settings.baseline) || posture.status !== 'off')
  const hp = totals(data.rpg).hp
  const log = data.rpg.posture ?? []
  const todayStart = new Date().setHours(0, 0, 0, 0)
  const today = log.filter((p) => p.at >= todayStart)

  useEffect(() => {
    if (videoRef.current && posture.stream && videoRef.current.srcObject !== posture.stream) {
      videoRef.current.srcObject = posture.stream
      void videoRef.current.play().catch(() => {})
    }
  }, [posture.stream])

  // Skeleton overlay.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!posture.landmarks || !subOn('postureGuard', 'skeleton')) return
    ctx.lineWidth = 4
    ctx.strokeStyle = posture.slouching ? '#ff6b6b' : '#7cffb2'
    for (const [a, b] of CONNECTIONS) {
      const p = posture.landmarks[a]
      const q = posture.landmarks[b]
      if (!p || !q) continue
      ctx.beginPath()
      ctx.moveTo((1 - p.x) * canvas.width, p.y * canvas.height)
      ctx.lineTo((1 - q.x) * canvas.width, q.y * canvas.height)
      ctx.stroke()
    }
  }, [posture.landmarks, posture.slouching])
  useTabTitle(posture.status === 'running' && posture.score !== null ? `${posture.slouching ? '⚠️' : '✓'} ${posture.score}` : '', 'Posture', 'posture')
  // C calibrates while the guard is running.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'c' || e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement | null)?.closest?.('input, textarea')) return
      if (getPosture().status === 'running' && calibratePosture()) {
        setSettings(postureSettings())
        window.dispatchEvent(new CustomEvent('bloom:toast', { detail: 'Calibrated' }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!consented)
    return (
      <section className="posture-consent places-consent">
        <ShieldCheck size={32} aria-hidden="true" />
        <h2>Posture guard</h2>
        <p>
          Bloom can watch your shoulder and neck alignment through your webcam while you work. The pose model runs
          entirely in your browser; no video is recorded, stored or uploaded. The first start downloads the model
          (about 6 MB) from Google’s MediaPipe servers.
        </p>
        <p>Good posture earns Stamina (+HP). Slouching for 5 minutes triggers a warning; ignore it and poison chips away at your HP.</p>
        <button className="ov-primary" onClick={() => setConsented(true)}>
          <Camera size={17} aria-hidden="true" /> Set it up
        </button>
      </section>
    )

  const running = posture.status === 'running'
  const slouchMinutes = posture.slouchSince ? Math.floor((Date.now() - posture.slouchSince) / 60000) : 0
  return (
    <section className="posture-page" aria-label="Posture guard">
      <div className="posture-stage" data-slouching={posture.slouching}>
        {subOn('postureGuard', 'preview') ? (
          <video ref={videoRef} muted playsInline className="posture-video" aria-label="Your camera preview" />
        ) : (
          <div className="posture-video posture-hidden">Camera preview hidden</div>
        )}
        <canvas ref={canvasRef} width={320} height={240} className="posture-skeleton" aria-hidden="true" />
        {!running && !(posture.status === 'loading' && posture.stream) && (
          <div className="posture-idle">
            {posture.status === 'loading'
              ? 'Loading the pose model (first time only)…'
              : posture.error || 'Camera is off'}
          </div>
        )}
        {running && posture.score !== null && (
          <div className="posture-score" aria-live="polite">
            <strong>{posture.score}</strong>
            <span>{posture.slouching ? 'Slouching' : 'Upright'}</span>
          </div>
        )}
      </div>
      <aside className="posture-side">
        <div className="posture-buttons">
          {running ? (
            <button className="ov-secondary" onClick={stopPosture}>
              <CameraOff size={17} aria-hidden="true" /> Stop camera
            </button>
          ) : (
            <button className="ov-primary" onClick={() => void startPosture()} disabled={posture.status === 'loading'}>
              <Camera size={17} aria-hidden="true" /> Start guard
            </button>
          )}
          <button
            className="ov-secondary"
            title="Calibrate (C)"
            disabled={!running || posture.absent}
            onClick={() => {
              if (calibratePosture()) setSettings(postureSettings())
            }}
          >
            <Crosshair size={17} aria-hidden="true" /> {settings.baseline ? 'Recalibrate' : 'Calibrate sitting tall'}
          </button>
        </div>
        {!running && posture.lastSession && (
          <div className="posture-summary" aria-label="Last session">
            <strong>Last session · {new Date(posture.lastSession.endedAt).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</strong>
            <span>{posture.lastSession.minutes} min watched</span>
            <span>{posture.lastSession.uprightPct}% upright</span>
            <span>avg score {posture.lastSession.avgScore}</span>
            <span>{posture.lastSession.warnings} {posture.lastSession.warnings === 1 ? 'nudge' : 'nudges'}</span>
          </div>
        )}
        {running && !settings.baseline && <p className="posture-hint">Sit up comfortably, then press Calibrate.</p>}
        {running && posture.absent && <p className="posture-hint">I can’t see your shoulders — adjust the camera.</p>}
        {posture.slouching && slouchMinutes > 0 && <p className="posture-hint is-warn">Slouching for {slouchMinutes} min</p>}
        <dl className="posture-stats">
          <div>
            <dt><HeartPulse size={15} aria-hidden="true" /> HP</dt>
            <dd>{hp}</dd>
          </div>
          <div>
            <dt><Zap size={15} aria-hidden="true" /> Stamina today</dt>
            <dd>+{today.filter((p) => p.kind === 'stamina').reduce((n, p) => n + p.amount, 0)}</dd>
          </div>
          <div>
            <dt><Skull size={15} aria-hidden="true" /> Poison today</dt>
            <dd>−{today.filter((p) => p.kind === 'poison').reduce((n, p) => n + p.amount, 0)}</dd>
          </div>
        </dl>
        {subOn('postureGuard', 'tuning') && (
          <fieldset className="posture-tuning">
            <legend>Tuning</legend>
            <label>
              Warn after <strong>{settings.rules.warnAfter} min</strong>
              <input type="range" min={1} max={15} value={settings.rules.warnAfter} onChange={(e) => setSettings(savePostureSettings({ rules: { ...settings.rules, warnAfter: Number(e.target.value) } }))} />
            </label>
            <label>
              Sensitivity <strong>{settings.sensitivity.toFixed(1)}×</strong>
              <input type="range" min={0.5} max={2} step={0.1} value={settings.sensitivity} onChange={(e) => setSettings(savePostureSettings({ sensitivity: Number(e.target.value) }))} />
            </label>
            <label>
              Poison damage <strong>{settings.rules.poison} HP</strong>
              <input type="range" min={1} max={10} value={settings.rules.poison} onChange={(e) => setSettings(savePostureSettings({ rules: { ...settings.rules, poison: Number(e.target.value) } }))} />
            </label>
          </fieldset>
        )}
      </aside>
    </section>
  )
}
