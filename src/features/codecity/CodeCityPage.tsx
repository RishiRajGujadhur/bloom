import { loadHandle, regrant, saveHandle } from '../../platform/handleStore'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { mean } from 'simple-statistics'
import { Building2, FolderGit2 } from 'lucide-react'
import { CapsBadge } from '../../platform/CapsBadge'
import { pickDirectory } from '../../platform/fsa'
import { WorkerPool } from '../../platform/workerPool'
import { readStore } from '../../components/studio/Studio'
import { SLEEP_KEY, duration, type SleepEntry } from '../sleep/sleepModel'
import { MOOD_KEY, type MoodEntry } from '../wellbeing/store'
import { loadScans } from '../readiness/sources'
import { fileStats, radar, rhythm, type Body, type CommitLite, type FileStat } from './cityModel'
import { fsaFs, headFiles, listCommits } from './gitReader'
import CityWorker from './cityWorker?worker'
import type { CityResult, CityTask } from './cityWorker'
import './codecity.css'

const CityScene = lazy(() => import('./CityScene').then((m) => ({ default: m.CityScene })))
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Burnout Radar: Code City. Pick a local git repository (read-only). Commits
 * are walked on every core, then your code becomes a 3D city — tall towers are
 * files you keep changing, hot colours are late-night work — and a radar sets
 * your work rhythm against Bloom's own sleep, mood and readiness data.
 */
function Radar({ axes, risk }: { axes: { label: string; value: number }[]; risk: number }) {
  const poly = useRef<SVGPolygonElement>(null)
  const R = 120
  const pts = (scale: number) => axes.map((a, i) => { const t = (i / axes.length) * Math.PI * 2 - Math.PI / 2; const r = R * (0.08 + 0.92 * a.value * scale); return `${Math.cos(t) * r},${Math.sin(t) * r}` }).join(' ')
  useLayoutEffect(() => {
    if (!poly.current || reduced()) return
    const o = { s: 0 }
    const t = gsap.to(o, { s: 1, duration: 1.4, ease: 'elastic.out(1, 0.55)', onUpdate: () => poly.current?.setAttribute('points', pts(o.s)) })
    return () => { t.kill() }
  })
  const color = risk >= 60 ? '#f43f5e' : risk >= 35 ? '#f59e0b' : '#22c55e'
  return (
    <svg className="cc-radar" viewBox="-190 -170 380 340" role="img" aria-label={`Burnout risk ${risk} of 100. ${axes.map((a) => `${a.label} ${Math.round(a.value * 100)}%`).join(', ')}`} data-matrix-native>
      {[0.25, 0.5, 0.75, 1].map((k) => <polygon key={k} points={axes.map((_, i) => { const t = (i / axes.length) * Math.PI * 2 - Math.PI / 2; return `${Math.cos(t) * R * k},${Math.sin(t) * R * k}` }).join(' ')} className="cc-web" />)}
      {axes.map((a, i) => { const t = (i / axes.length) * Math.PI * 2 - Math.PI / 2; return <g key={a.label}><line x1="0" y1="0" x2={Math.cos(t) * R} y2={Math.sin(t) * R} className="cc-spoke" /><text x={Math.cos(t) * (R + 26)} y={Math.sin(t) * (R + 26) + 4} textAnchor="middle" className="cc-axis">{a.label}</text></g> })}
      <polygon ref={poly} points={pts(1)} fill={`${color}44`} stroke={color} strokeWidth="3" style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      <text y="8" textAnchor="middle" className="cc-risk" fill={color}>{risk}</text>
    </svg>
  )
}

/** A synthetic but realistic repository so the city can be explored without picking a folder. */
function sampleRepo(): { files: Map<string, number>; commits: CommitLite[] } {
  let seed = 7
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
  const dirs = ['src/api', 'src/api/payments', 'src/ui/components', 'src/ui/pages', 'src/core', 'src/workers', 'tests', 'tests/e2e', 'docs', 'scripts', 'infra/terraform']
  const files = new Map<string, number>()
  for (const d of dirs) for (let i = 0; i < 6 + Math.floor(rnd() * 16); i++) files.set(`${d}/${['index', 'service', 'model', 'client', 'utils', 'hooks', 'router', 'store', 'schema', 'handler'][i % 10]}${i > 9 ? i : ''}.ts`, 400 + Math.floor(rnd() * rnd() * 30000))
  const paths = [...files.keys()]
  const hot = paths.filter((p) => p.includes('payments') || p.includes('workers'))
  const commits: CommitLite[] = []
  const now = Date.now()
  for (let d = 42; d >= 0; d--) {
    const day = new Date(now - d * 864e5)
    const weekend = day.getDay() === 0 || day.getDay() === 6
    const n = weekend ? (rnd() < 0.55 ? 2 + Math.floor(rnd() * 3) : 0) : 3 + Math.floor(rnd() * 6)
    for (let k = 0; k < n; k++) {
      const late = d < 18 && rnd() < 0.45
      const hour = late ? 22 + Math.floor(rnd() * 4) : 9 + Math.floor(rnd() * 9)
      const ts = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour % 24, Math.floor(rnd() * 60)).getTime() + (hour >= 24 ? 864e5 : 0)
      const pool = late || rnd() < 0.5 ? hot : paths
      commits.push({ ts, tz: new Date(ts).getTimezoneOffset(), author: 'you', files: Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => pool[Math.floor(rnd() * pool.length)]) })
    }
  }
  return { files, commits }
}

export function CodeCityPage() {
  const [files, setFiles] = useState<FileStat[]>([])
  const [commits, setCommits] = useState<CommitLite[]>([])
  const [name, setName] = useState('')
  const [progress, setProgress] = useState<{ done: number; total: number; cores: number } | null>(null)
  const [err, setErr] = useState('')
  const [body, setBody] = useState<Body>({ sleepHours: null, mood: null, readiness: null })

  useEffect(() => {
    const since = Date.now() - 14 * 864e5
    const sleep = readStore<SleepEntry[]>(SLEEP_KEY, []).filter((e) => Date.parse(`${e.date}T12:00:00`) >= since)
    const moods = readStore<MoodEntry[]>(MOOD_KEY, []).filter((m) => m.at >= since)
    void loadScans().then((s) => {
      const recent = s.filter((x) => x.at >= since && x.score != null)
      setBody({ sleepHours: sleep.length ? mean(sleep.map((e) => duration(e.bedtime, e.wake))) : null, mood: moods.length ? mean(moods.map((m) => m.mood)) * 2 : null, readiness: recent.length ? mean(recent.map((x) => x.score!)) : null })
    })
  }, [])

  const [lastRepo, setLastRepo] = useState<FileSystemDirectoryHandle | null>(null)
  useEffect(() => {
    void loadHandle<FileSystemDirectoryHandle>('codecity-repo').then(setLastRepo)
  }, [])
  const openRepo = async (given?: FileSystemDirectoryHandle) => {
    setErr('')
    const handle = given ?? (await pickDirectory())
    if (!handle) return
    try {
      const fs = fsaFs(handle)
      setProgress({ done: 0, total: 1, cores: 0 })
      const list = await listCommits(fs, '/', 400)
      const sizes = new Map((await headFiles(fs, '/')).slice(0, 5000).map((f) => [f.path, f.size]))
      // Walk commit/parent trees on every core; progress comes from the pool's shared Atomics counter.
      const pool = new WorkerPool<CityTask, CityResult>(() => new CityWorker())
      const chunks: [string, string | null][][] = Array.from({ length: pool.size * 3 }, () => [])
      list.forEach((c, i) => chunks[i % chunks.length].push([c.oid, c.parent]))
      const live = setInterval(() => setProgress({ done: pool.done, total: chunks.length, cores: pool.size }), 150)
      const results = await Promise.all(chunks.filter((c) => c.length).map((pairs) => pool.run({ handle, pairs })))
      clearInterval(live)
      pool.dispose()
      const changed: CityResult = Object.assign({}, ...results)
      const cs = list.map((c) => ({ ts: c.ts, tz: c.tz, author: c.author, files: changed[c.oid] ?? [] }))
      setCommits(cs)
      setFiles(fileStats(cs, sizes))
      setName(handle.name)
      void saveHandle('codecity-repo', handle)
      setLastRepo(handle)
    } catch (e) {
      setErr(`That folder doesn’t look like a git repository (${(e as Error).message}). Pick the folder that contains .git.`)
    } finally {
      setProgress(null)
    }
  }
  const sample = () => {
    const s = sampleRepo()
    setCommits(s.commits)
    setFiles(fileStats(s.commits, s.files))
    setName('sample-app (demo)')
  }

  const r = rhythm(commits)
  const rd = radar(r, body)
  const top = [...files].sort((a, b) => b.churn - a.churn).slice(0, 5)
  return (
    <div className="cc-page">
      <section className="cc-main">
        <header className="cc-head">
          <div><p className="cc-eyebrow"><Building2 size={14} /> Burnout radar</p><h2>{name ? `${name} — ${files.length} files, ${commits.length} commits` : 'Your code as a city. Your rhythm as a radar.'}</h2></div>
          <CapsBadge caps={['gpu', 'oc', 'mt', 'fsa', 'simd']} />
        </header>
        <div className="cc-actions">
          <button type="button" className="cc-cta" onClick={() => void openRepo()}><FolderGit2 size={16} /> Open a local repository</button>
            {lastRepo && <button type="button" className="cc-cta" onClick={() => void regrant(lastRepo).then((ok) => { if (ok) void openRepo(lastRepo) })}>↻ Reopen {lastRepo.name}</button>}
          <button type="button" className="cc-ghost" onClick={sample}>Try the sample city</button>
          {progress && <span className="cc-prog">Walking history on {progress.cores || '…'} cores · {progress.done}/{progress.total} batches</span>}
        </div>
        {err && <p className="voice-error">{err}</p>}
        {files.length ? (
          <Suspense fallback={<div className="cc-scene" />}><CityScene files={files} /></Suspense>
        ) : (
          <div className="cc-scene cc-empty">Pick the folder of a git repository (read-only, nothing leaves your machine), or try the sample city.</div>
        )}
        <div className="cc-legend"><span>Height = changes</span><span>Footprint = file size</span><span className="cc-heat">Colour = share of late-night (10 pm–5 am) changes</span></div>
      </section>
      <aside className="cc-side">
        <div className="cc-card">
          <h3>Burnout risk <small>last 4 weeks</small></h3>
          <Radar axes={rd.axes} risk={commits.length ? rd.risk : 0} />
          <ul className="cc-notes">{(commits.length ? rd.notes : ['Open a repository to read your rhythm.']).map((n) => <li key={n}>{n}</li>)}</ul>
          <p className="cc-small">Blends commit times with your Bloom sleep{body.sleepHours != null ? ` (${body.sleepHours.toFixed(1)} h)` : ''}, mood{body.mood != null ? ` (${(body.mood / 2).toFixed(1)}/5)` : ''} and readiness{body.readiness != null ? ` (${Math.round(body.readiness)})` : ''}.</p>
        </div>
        {top.length > 0 && (
          <div className="cc-card">
            <h3>Hottest files</h3>
            <ol className="cc-top">{top.map((f) => <li key={f.path}><span>{f.path}</span><b>{f.churn}</b></li>)}</ol>
          </div>
        )}
      </aside>
    </div>
  )
}
