import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Plus,
  Search,
  Sprout,
  Trash2,
} from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import type { Analysis, LifeRecord, Tool } from './types'
import { lifeTools } from './catalog'
import {
  LIFE_KEY,
  parseLife,
  preference,
  restoreLife,
  updateLife,
  useLife,
} from './store'
import { download } from '../lab/exportSuite'
import { taskSchema } from '../../model'
import type { NavKey } from '../../components/layout/Sidebar'
import { pageDetails } from '../../components/layout/FeatureGuide'
import './life.css'

function Results({ result, animate }: { result: Analysis; animate: boolean }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (!animate || !ref.current) return
      const context = gsap.context(
        () =>
          gsap.from('.life-bar', {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 0.65,
            stagger: 0.06,
            ease: 'power2.out',
          }),
        ref,
      )
      return () => context.revert()
    })
    return () => media.revert()
  }, [result, animate])
  const bars = result.bars?.slice(0, 12) ?? []
  const max = Math.max(1, ...bars.map((b) => Math.abs(b.value)))
  return (
    <section className="life-result" aria-label="Your summary">
      <span className="life-eyebrow">A little clarity</span>
      <h3>{result.title}</h3>
      <svg
        ref={ref}
        viewBox={`0 0 440 ${Math.max(90, bars.length * 46)}`}
        role="img"
        aria-label={
          bars.length
            ? bars.map((b) => `${b.label}: ${b.value}`).join('; ')
            : 'A branching path represents your next step'
        }
      >
        {bars.length ? (
          bars.map((bar, i) => (
            <g key={i} transform={`translate(0 ${i * 46})`}>
              <text x="0" y="15" fill="currentColor" fontSize="12">
                {bar.label.slice(0, 38)} · {bar.value}
              </text>
              <rect
                x="0"
                y="23"
                width="440"
                height="12"
                rx="6"
                fill="currentColor"
                opacity=".08"
              />
              <rect
                className="life-bar"
                x="0"
                y="23"
                width={(Math.abs(bar.value) / max) * 440}
                height="12"
                rx="6"
                fill="var(--life-accent)"
              />
            </g>
          ))
        ) : (
          <g
            className="life-bar"
            fill="none"
            stroke="var(--life-accent)"
            strokeWidth="3"
          >
            <path d="M30 65 C130 65 130 20 220 20 S310 65 410 65" />
            <circle cx="30" cy="65" r="9" />
            <circle cx="220" cy="20" r="9" />
            <circle cx="410" cy="65" r="9" />
          </g>
        )}
      </svg>
      <ul>
        {result.lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      {result.download && (
        <button
          type="button"
          onClick={() => {
            const d = result.download!
            download(new Blob([d.text], { type: d.mime }), d.name)
          }}
        >
          <Download size={16} />
          Download {result.download.name}
        </button>
      )}
    </section>
  )
}

function Workspace({ tool, ...props }: FeaturePageProps & { tool: Tool }) {
  const { data: store, error, blocked } = useLife()
  const prefs = preference(store, tool.id)
  const [fieldStep, setFieldStep] = useState(0)
  const visibleFields = tool.fields.filter((f) => !prefs.hidden.includes(f.key))
  const stepCount = Math.max(1, Math.ceil(visibleFields.length / 5))
  const records = store.records.filter((r) => r.tool === tool.id)
  const initial = () =>
    Object.fromEntries(tool.fields.map((f) => [f.key, f.initial ?? '']))
  const draft = store.drafts[tool.id]
  const [selected, setSelected] = useState<string | null>(draft?.id || null)
  const [title, setTitle] = useState(draft?.title ?? '')
  const [values, setValues] = useState(draft?.values ?? initial())
  const [next, setNext] = useState(draft?.next ?? '')
  const [dirty, setDirty] = useState(Boolean(draft))
  const [result, setResult] = useState<Analysis | null>(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [recordSearch, setRecordSearch] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [deleted, setDeleted] = useState<LifeRecord | null>(null)
  useEffect(() => {
    if (!dirty) return
    updateLife((state) => ({
      ...state,
      drafts: {
        ...state.drafts,
        [tool.id]: {
          id: selected ?? '',
          tool: tool.id,
          title,
          values,
          next,
          done: false,
          created: Date.now(),
          updated: Date.now(),
        },
      },
    }))
  }, [dirty, title, values, next, selected, tool.id])
  const clearDraft = () =>
    updateLife((state) => ({
      ...state,
      drafts: Object.fromEntries(
        Object.entries(state.drafts).filter(([key]) => key !== tool.id),
      ),
    }))
  const active = records.find((r) => r.id === selected)
  const taskId = selected ? `life-${selected}` : ''
  const handed = props.data.todos.some((t) => t.id === taskId)
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  function load(record?: LifeRecord) {
    if (dirty && !window.confirm('Discard unsaved changes to this draft?'))
      return
    clearDraft()
    setSelected(record?.id ?? null)
    setTitle(record?.title ?? '')
    setValues(record?.values ?? initial())
    setNext(record?.next ?? '')
    setResult(null)
    setStatus('')
    setDirty(false)
  }
  const save = () => {
    if (!title.trim()) {
      setStatus('Give this record a title before saving.')
      return null
    }
    const now = Date.now()
    const record: LifeRecord = {
      id: selected ?? crypto.randomUUID(),
      tool: tool.id,
      title: title.trim(),
      values,
      next: next.trim(),
      created: active?.created ?? now,
      updated: now,
      done: active?.done ?? false,
    }
    if (
      !updateLife((s) => ({
        ...s,
        records: [...s.records.filter((r) => r.id !== record.id), record],
      }))
    )
      return null
    clearDraft()
    setSelected(record.id)
    setDirty(false)
    setStatus('Saved on this device.')
    return record
  }
  const analyze = async () => {
    setBusy(true)
    try {
      setResult(await tool.analyze(values, store.records))
      setStatus('Summary updated from your current inputs.')
    } catch (e) {
      setStatus(
        e instanceof Error ? e.message : 'Check your inputs and try again.',
      )
      setResult(null)
    } finally {
      setBusy(false)
    }
  }
  const handoff = () => {
    if (!next.trim()) {
      setStatus('Write a next action first.')
      return
    }
    const record = save()
    if (!record) return
    const id = `life-${record.id}`
    props.setData((d) =>
      d.todos.some((t) => t.id === id)
        ? d
        : {
            ...d,
            todos: [
              ...d.todos,
              taskSchema.parse({
                id,
                title: record.next,
                done: false,
                due: props.today,
                challengeId: null,
                tags: ['life-tools', tool.id],
              }),
            ],
          },
    )
    setStatus('Added to today’s to-dos. You can schedule it in the calendar.')
  }
  const edit = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setDirty(true)
    setResult(null)
  }
  return (
    <div className="life-workspace">
      <aside className="life-records">
        <div className="life-row">
          <h3>Your collection</h3>
          <button aria-label="New record" onClick={() => load()}>
            <Plus size={18} />
          </button>
        </div>
        <label>
          Find a record
          <input
            type="search"
            value={recordSearch}
            onChange={(e) => setRecordSearch(e.target.value)}
          />
        </label>
        <label className="life-check">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
          />{' '}
          Include completed
        </label>
        {records
          .filter(
            (r) =>
              (showDone || !r.done) &&
              r.title.toLowerCase().includes(recordSearch.toLowerCase()),
          )
          .sort((a, b) => b.updated - a.updated)
          .map((r) => (
            <button
              className={`life-record ${selected === r.id ? 'is-active' : ''}`}
              key={r.id}
              onClick={() => load(r)}
            >
              <span>
                {r.done && <Check size={14} />}
                {r.title}
              </span>
              <small>{new Date(r.updated).toLocaleDateString()}</small>
            </button>
          ))}
        {!records.length && (
          <p className="life-muted">
            Your first small step belongs here. Create a record to keep it for
            later.
          </p>
        )}
        {deleted && (
          <button
            onClick={() => {
              if (
                updateLife((s) => ({ ...s, records: [...s.records, deleted] }))
              )
                setDeleted(null)
            }}
          >
            Undo deletion
          </button>
        )}
        <div className="life-connected">
          <span className="life-eyebrow">Continue your flow</span>
          {tool.links
            .filter((k) => k in pageDetails)
            .map((k) => (
              <button
                key={k}
                onClick={() => {
                  if (!dirty || window.confirm('Leave this unsaved draft?'))
                    props.onNavigate(k as NavKey)
                }}
              >
                {pageDetails[k as NavKey].title}
                <ArrowRight size={14} />
              </button>
            ))}
        </div>
      </aside>
      <div className="life-editor">
        {error && <p role="alert">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <div className="life-row">
            <span className="life-eyebrow">
              {selected ? 'Your saved record' : 'Make room for a new step'}
            </span>
            <small>
              {dirty
                ? error
                  ? 'Draft could not be saved'
                  : 'Draft saved on this device'
                : selected
                  ? 'Saved locally'
                  : 'Private to this browser'}
            </small>
          </div>
          <label className="life-title-label">
            Title
            <input
              className="life-title-input"
              required
              maxLength={150}
              placeholder={`Name your ${tool.name.toLowerCase()} record`}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setDirty(true)
              }}
            />
          </label>
          <div className="life-steps" role="group" aria-label="Record sections">
            {Array.from({ length: stepCount }, (_, i) => (
              <button
                type="button"
                key={i}
                aria-pressed={fieldStep === i}
                onClick={() => setFieldStep(i)}
              >
                {i + 1}.{' '}
                {['Start', 'Details', 'Context', 'Review'][i] ?? 'More'}
              </button>
            ))}
          </div>
          <div className="life-fields">
            {visibleFields
              .slice(fieldStep * 5, (fieldStep + 1) * 5)
              .map((f) => (
                <label
                  key={f.key}
                  className={f.kind === 'area' ? 'life-wide' : ''}
                >
                  {f.label}
                  {f.kind === 'area' ? (
                    <textarea
                      rows={3}
                      maxLength={12000}
                      value={values[f.key] ?? ''}
                      onChange={(e) => edit(f.key, e.target.value)}
                    />
                  ) : f.kind === 'select' ? (
                    <select
                      value={values[f.key] ?? ''}
                      onChange={(e) => edit(f.key, e.target.value)}
                    >
                      <option value="">Choose…</option>
                      {f.options?.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.kind ?? 'text'}
                      step={f.kind === 'number' ? 'any' : undefined}
                      min={f.min}
                      max={f.max}
                      maxLength={1000}
                      value={values[f.key] ?? ''}
                      onChange={(e) => edit(f.key, e.target.value)}
                    />
                  )}
                  {f.hint && <small>{f.hint}</small>}
                </label>
              ))}
          </div>
          <div className="life-actions">
            <button className="life-primary" type="submit" disabled={blocked}>
              Save record
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void analyze()}
            >
              {busy ? 'Working…' : 'Build my summary'}
            </button>
            {active && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      updateLife((s) => ({
                        ...s,
                        records: s.records.map((r) =>
                          r.id === active.id
                            ? { ...r, done: !r.done, updated: Date.now() }
                            : r,
                        ),
                      }))
                    )
                      setStatus(active.done ? 'Reopened.' : 'Marked complete.')
                  }}
                >
                  {active.done ? 'Reopen' : 'Mark complete'}
                </button>
                <button
                  type="button"
                  aria-label="Delete this record"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Delete this record? You can undo until you leave this tool.',
                      ) &&
                      updateLife((s) => ({
                        ...s,
                        records: s.records.filter((r) => r.id !== active.id),
                      }))
                    ) {
                      setDeleted(active)
                      setSelected(null)
                      setTitle('')
                      setValues(initial())
                      setNext('')
                      setDirty(false)
                      setResult(null)
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </form>
        {result && <Results result={result} animate={prefs.animate} />}
        <section className="life-next">
          <span className="life-eyebrow">Turn clarity into action</span>
          <label>
            One next step
            <input
              maxLength={150}
              value={next}
              placeholder="Something small enough for today"
              onChange={(e) => {
                setNext(e.target.value)
                setDirty(true)
              }}
            />
          </label>
          <button onClick={handoff} disabled={handed || blocked}>
            {handed ? 'Already in your daily plan' : 'Add to today’s to-dos'}
            <ArrowRight size={16} />
          </button>
        </section>
        <p role="status" className="life-status">
          {status}
        </p>
      </div>
    </div>
  )
}

export function LifePage(props: FeaturePageProps) {
  const { data, error } = useLife()
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [backup, setBackup] = useState('')
  const [message, setMessage] = useState('')
  const tool = lifeTools.find(
    (t) => t.id === selected && preference(data, t.id).enabled,
  )
  const enabled = lifeTools.filter((t) => preference(data, t.id).enabled)
  return (
    <div
      className="life"
      style={
        { '--life-accent': tool?.color ?? '#8e70c7' } as React.CSSProperties
      }
    >
      <header className="life-hero">
        {tool && (
          <button
            className="life-back"
            onClick={() => {
              if (
                window.confirm(
                  'Return to Life tools? Save any draft changes first.',
                )
              )
                setSelected(null)
            }}
          >
            <ArrowLeft size={16} />
            All life tools
          </button>
        )}
        <span className="life-eyebrow">
          <Sprout size={16} />A life with room to grow
        </span>
        <h2>{tool?.name ?? 'Small tools. Meaningful days.'}</h2>
        <p>
          {tool?.description ??
            'Make space for what matters, turn a thought into a next step, and keep your progress together.'}
        </p>
        <div className="life-hero-stats">
          <span>{data.records.length} saved steps</span>
          <span>{data.records.filter((r) => r.done).length} completed</span>
          <span>Stored on your device</span>
        </div>
      </header>
      {tool ? (
        <Workspace key={tool.id} tool={tool} {...props} />
      ) : (
        <>
          <label className="life-search">
            <Search size={18} />
            <input
              type="search"
              aria-label="Find a life tool"
              placeholder="What would help today?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="life-grid">
            {enabled
              .filter((t) =>
                `${t.name} ${t.description}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((t) => (
                <button
                  className="life-tool"
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  style={{ '--life-accent': t.color } as React.CSSProperties}
                >
                  <span className="life-eyebrow">{t.category}</span>
                  <h3>{t.name}</h3>
                  <p>{t.description}</p>
                  <span>
                    {t.fields.length} ways to make it yours
                    <ArrowRight size={18} />
                  </span>
                </button>
              ))}
          </div>
          {!enabled.length && (
            <p>
              Life tools are switched off. Choose the ones you want in Settings.
            </p>
          )}
        </>
      )}
      <details className="life-backup">
        <summary>Data, backup & restore</summary>
        <p>
          Life tools data is stored separately from your main dashboard export.
          Download it here or use the full backup in Insights Lab.
        </p>
        {error && <p role="alert">{error}</p>}
        <button
          onClick={() => {
            try {
              download(
                new Blob(
                  [localStorage.getItem(LIFE_KEY) ?? JSON.stringify(data)],
                  { type: 'application/json' },
                ),
                'bloom-life-tools.json',
              )
            } catch {
              setMessage('Unable to access saved data.')
            }
          }}
        >
          <Download size={16} />
          Download backup
        </button>
        <label>
          Paste a Life tools backup
          <textarea
            value={backup}
            onChange={(e) => setBackup(e.target.value)}
            rows={3}
          />
        </label>
        <button
          onClick={() => {
            try {
              const parsed = parseLife(backup)
              if (
                window.confirm(
                  `Replace Life tools data with ${parsed.records.length} records and their settings? Download your current backup first.`,
                )
              ) {
                restoreLife(backup)
                setBackup('')
                setSelected(null)
                setMessage('Backup restored.')
              }
            } catch {
              setMessage(
                'Invalid backup or storage unavailable. No records were replaced.',
              )
            }
          }}
        >
          Validate and restore
        </button>
        <p role="status">{message}</p>
      </details>
    </div>
  )
}
