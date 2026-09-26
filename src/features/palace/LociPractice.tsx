import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { z } from 'zod'
import { useLife, updateLife } from '../life/store'
import { practiceSchedule } from '../life/tools/practice'
import { dayKey } from '../../dates'
import { download } from '../lab/exportSuite'
import '../life/life.css'

const locusSchema = z.object({
  id: z.string(),
  place: z.string(),
  item: z.string(),
  association: z.string(),
  history: z.string(),
  due: z.string(),
})
const lociSchema = z.array(locusSchema).max(100)
type Locus = z.infer<typeof locusSchema>
const fresh = (): Locus => ({
  id: crypto.randomUUID(),
  place: '',
  item: '',
  association: '',
  history: '',
  due: '',
})
export function LociPractice() {
  const { data, error } = useLife()
  const routes = data.records.filter((r) => r.tool === 'palace-route')
  const [routeId, setRouteId] = useState('')
  const [name, setName] = useState('')
  const [loci, setLoci] = useState<Locus[]>([fresh()])
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState('edit')
  const [reverse, setReverse] = useState(false)
  const [dueOnly, setDueOnly] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
  const today = dayKey()
  const ordered = (reverse ? [...loci].reverse() : loci).filter(
    (l) => !dueOnly || !l.due || l.due.slice(0, 10) <= today,
  )
  const current = ordered[index % Math.max(1, ordered.length)]
  useEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const tween = gsap.fromTo(
        svg.current,
        { opacity: 0.4 },
        { opacity: 1, duration: 0.35 },
      )
      return () => tween.kill()
    })
    return () => media.revert()
  }, [index, reverse, dueOnly])
  const save = (next = loci) => {
    if (!name.trim() || next.some((l) => !l.place.trim() || !l.item.trim())) {
      setStatus('Name the palace and give every location a place and an item.')
      return false
    }
    const id = routeId || crypto.randomUUID()
    const existing = routes.find((r) => r.id === id)
    if (
      !updateLife((s) => ({
        ...s,
        records: [
          ...s.records.filter((r) => r.id !== id),
          {
            id,
            tool: 'palace-route',
            title: name.trim(),
            values: { loci: JSON.stringify(next) },
            created: existing?.created ?? Date.now(),
            updated: Date.now(),
            done: false,
            next: '',
          },
        ],
      }))
    )
      return false
    setRouteId(id)
    setStatus('Palace saved. Its routes are included in Life tools backups.')
    return true
  }
  async function rate(rating: string) {
    if (!current || busy) return
    setBusy(true)
    try {
      const history = [
        ...current.history
          .split('\n')
          .filter((l) => l.trim() && !l.startsWith(today + ' |')),
        `${today} | ${rating}`,
      ].join('\n')
      const card = await practiceSchedule(history)
      const next = loci.map((l) =>
        l.id === current.id
          ? { ...l, history, due: card.due.toISOString() }
          : l,
      )
      if (save(next)) {
        setLoci(next)
        setRevealed(false)
        setIndex((i) => (i + 1) % Math.max(1, ordered.length))
        setStatus(`Review recorded. Next review: ${card.due.toLocaleString()}.`)
      }
    } catch (e) {
      setStatus(
        e instanceof Error ? e.message : 'Could not schedule this review.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="life life-palace">
      <header className="life-hero">
        <span className="life-eyebrow">A familiar place for new memories</span>
        <h2>Build a memory route</h2>
        <p>
          Choose familiar locations in a fixed order. Give each item a vivid
          association, then recall it before revealing the answer.
        </p>
      </header>
      {error && <p role="alert">{error}</p>}
      <div className="life-actions">
        <label>
          Saved palaces
          <select
            value={routeId}
            onChange={(e) => {
              if (!window.confirm('Switch palace? Save any edits first.'))
                return
              const route = routes.find((r) => r.id === e.target.value)
              try {
                setLoci(
                  route
                    ? lociSchema.parse(JSON.parse(route.values.loci))
                    : [fresh()],
                )
                setRouteId(route?.id ?? '')
                setName(route?.title ?? '')
                setIndex(0)
                setMode('edit')
                setStatus('')
              } catch {
                setStatus(
                  'This route could not be read. Its original data is preserved.',
                )
              }
            }}
          >
            <option value="">New palace</option>
            {routes.map((r) => (
              <option value={r.id} key={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => setMode('edit')}>Edit route</button>
        <button
          onClick={() => {
            if (save()) {
              setMode('recall')
              setIndex(0)
              setRevealed(false)
            }
          }}
        >
          Practice recall
        </button>
      </div>
      {mode === 'edit' ? (
        <>
          <label>
            Palace name
            <input
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {loci.map((l, i) => (
            <fieldset key={l.id} className="life-next">
              <legend>Location {i + 1}</legend>
              <div className="life-fields">
                <label>
                  Place
                  <input
                    value={l.place}
                    maxLength={150}
                    placeholder="Front door"
                    onChange={(e) =>
                      setLoci((a) =>
                        a.map((x) =>
                          x.id === l.id ? { ...x, place: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Item to remember
                  <input
                    value={l.item}
                    maxLength={500}
                    onChange={(e) =>
                      setLoci((a) =>
                        a.map((x) =>
                          x.id === l.id ? { ...x, item: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label className="life-wide">
                  Vivid association
                  <textarea
                    value={l.association}
                    maxLength={2000}
                    placeholder="Picture an exaggerated image connecting this item to the place."
                    onChange={(e) =>
                      setLoci((a) =>
                        a.map((x) =>
                          x.id === l.id
                            ? { ...x, association: e.target.value }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
              </div>
              <div className="life-actions">
                <button
                  disabled={i === 0}
                  onClick={() =>
                    setLoci((a) => {
                      const b = [...a]
                      ;[b[i - 1], b[i]] = [b[i], b[i - 1]]
                      return b
                    })
                  }
                >
                  Move up
                </button>
                <button
                  disabled={i === loci.length - 1}
                  onClick={() =>
                    setLoci((a) => {
                      const b = [...a]
                      ;[b[i + 1], b[i]] = [b[i], b[i + 1]]
                      return b
                    })
                  }
                >
                  Move down
                </button>
                <button
                  disabled={loci.length === 1}
                  onClick={() => {
                    if (
                      window.confirm(
                        'Remove this location from the draft route?',
                      )
                    )
                      setLoci((a) => a.filter((x) => x.id !== l.id))
                  }}
                >
                  Remove location
                </button>
              </div>
            </fieldset>
          ))}
          <div className="life-actions">
            <button
              disabled={loci.length >= 100}
              onClick={() => setLoci((a) => [...a, fresh()])}
            >
              Add location
            </button>
            <button onClick={() => save()}>Save palace</button>
            <button
              onClick={() =>
                download(
                  new Blob([JSON.stringify({ name, loci }, null, 2)], {
                    type: 'application/json',
                  }),
                  'memory-route.json',
                )
              }
            >
              Export route
            </button>
          </div>
        </>
      ) : (
        <section className="life-result">
          <div className="life-actions">
            <label className="life-check">
              <input
                type="checkbox"
                checked={reverse}
                onChange={(e) => {
                  setReverse(e.target.checked)
                  setIndex(0)
                  setRevealed(false)
                }}
              />
              Reverse route
            </label>
            <label className="life-check">
              <input
                type="checkbox"
                checked={dueOnly}
                onChange={(e) => {
                  setDueOnly(e.target.checked)
                  setIndex(0)
                  setRevealed(false)
                }}
              />
              Due locations only
            </label>
          </div>
          <svg
            ref={svg}
            viewBox="0 0 600 70"
            role="img"
            aria-label={`Route with ${ordered.length} locations; location ${index + 1} selected`}
          >
            <path d="M20 35H580" stroke="currentColor" opacity=".2" />
            {ordered.map((l, i) => (
              <g key={l.id}>
                <circle
                  cx={20 + (i * 560) / Math.max(1, ordered.length - 1)}
                  cy="35"
                  r={current?.id === l.id ? 12 : 6}
                  fill={
                    current?.id === l.id ? 'var(--life-accent)' : 'currentColor'
                  }
                />
                <text
                  x={20 + (i * 560) / Math.max(1, ordered.length - 1)}
                  y="63"
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                >
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
          {current ? (
            <>
              <h3>{current.place}</h3>
              <p>Recall the item and its association before revealing them.</p>
              <button onClick={() => setRevealed(true)}>Reveal answer</button>
              {revealed && (
                <>
                  <h4>{current.item}</h4>
                  <p>{current.association}</p>
                  <div className="life-actions">
                    {['Again', 'Hard', 'Good', 'Easy'].map((r) => (
                      <button
                        key={r}
                        disabled={busy}
                        onClick={() => void rate(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="life-actions">
                <button
                  onClick={() => {
                    setIndex((i) => (i - 1 + ordered.length) % ordered.length)
                    setRevealed(false)
                  }}
                >
                  Previous location
                </button>
                <button
                  onClick={() => {
                    setIndex((i) => (i + 1) % ordered.length)
                    setRevealed(false)
                  }}
                >
                  Next location
                </button>
              </div>
            </>
          ) : (
            <p>
              No locations are due. Turn off the due filter for extra practice.
            </p>
          )}
        </section>
      )}
      <p role="status">{status}</p>
    </section>
  )
}
