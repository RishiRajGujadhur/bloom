import { useMemo, useState } from 'react'
import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import { scaleLinear } from '@visx/scale'
import { Flame, CalendarDays, Sparkles, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { AppData } from '../../model'
import type { JournalEntry } from '../daybook/types'
import {
  chatActivity,
  collectActivity,
  dateRange,
  streaks,
  type ActivitySource,
} from '../../analytics/activity'
import { totals } from '../../rpg/engine'
import { statNames, type Stat } from '../../rpg/schema'
import styles from './insights.module.css'

type Point = { day: string; value: number | null }
const shortDate = (day: string, locale: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })

function Trend({
  points,
  maximum,
  minimum = 0,
  label,
  locale,
}: {
  points: Point[]
  maximum: number
  minimum?: number
  label: string
  locale: string
}) {
  const [selected, setSelected] = useState('')
  const x = scaleLinear({
    domain: [0, Math.max(1, points.length - 1)],
    range: [42, 710],
  })
  const y = scaleLinear({ domain: [minimum, maximum], range: [170, 20] })
  const ticks = Array.from(
    new Set([minimum, Math.round((minimum + maximum) / 2), maximum]),
  )
  return (
    <>
      <div className={styles.scroll}>
        <svg
          className={styles.trend}
          viewBox="0 0 750 215"
          role="group"
          aria-label={label}
        >
          {ticks.map((value) => (
            <g key={value}>
              <line
                x1="42"
                x2="710"
                y1={y(value)}
                y2={y(value)}
                className={styles.grid}
              />
              <text x="30" y={y(value) + 4} textAnchor="end">
                {value}
              </text>
            </g>
          ))}
          <LinePath<Point>
            data={points}
            defined={(point) => point.value !== null}
            x={(_, index) => x(index)}
            y={(point) => y(point.value ?? minimum)}
            className={styles.line}
          />
          {points.map(
            (point, index) =>
              point.value !== null && (
                <circle
                  key={point.day}
                  cx={x(index)}
                  cy={y(point.value)}
                  r="4"
                  className={styles.dot}
                >
                  <title>
                    {shortDate(point.day, locale)}: {point.value.toFixed(1)}
                  </title>
                </circle>
              ),
          )}
          {[0, Math.floor((points.length - 1) / 2), points.length - 1].map(
            (index) => (
              <text key={index} x={x(index)} y="199" textAnchor="middle">
                {shortDate(points[index].day, locale)}
              </text>
            ),
          )}
        </svg>
      </div>
      <label className={styles.inspect}>
        Explore a day{' '}
        <select
          aria-label={`Explore ${label}`}
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">Select date</option>
          {points.map((point) => (
            <option key={point.day} value={point.day}>
              {shortDate(point.day, locale)}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <p role="status">
          {shortDate(selected, locale)}:{' '}
          {points.find((point) => point.day === selected)?.value?.toFixed(1) ??
            'Not recorded'}
        </p>
      )}
      <details>
        <summary>View chart data</summary>
        <div className={styles.tableScroll}>
          <table>
            <caption>{label}</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.day}>
                  <th scope="row">{shortDate(point.day, locale)}</th>
                  <td>{point.value?.toFixed(1) ?? 'Not recorded'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  )
}

function JournalHeatmap({
  days,
  counts,
  locale,
}: {
  days: string[]
  counts: Map<string, number>
  locale: string
}) {
  const [selected, setSelected] = useState('')
  const chosen = days.includes(selected) ? selected : days[days.length - 1]
  const offset = new Date(`${days[0]}T12:00:00`).getDay()
  const width = Math.max(240, Math.ceil((days.length + offset) / 7) * 19 + 45)
  const description = (day: string) =>
    `${new Date(`${day}T12:00:00`).toLocaleDateString(locale, { dateStyle: 'full' })}: ${counts.get(day) ?? 0} completed journal entries`
  return (
    <>
      <div className={styles.scroll}>
        <svg
          width={width}
          height="174"
          role="group"
          aria-label="Journaling activity calendar"
        >
          <Group left={30} top={25}>
            {[1, 3, 5].map((row) => (
              <text key={row} x="-7" y={row * 19 + 12} textAnchor="end">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][row]}
              </text>
            ))}
            {days.map((day, index) => {
              const col = Math.floor((index + offset) / 7),
                row = (index + offset) % 7,
                count = counts.get(day) ?? 0
              return (
                <g key={day}>
                  {((index === 0 && Number(day.slice(-2)) < 25) || day.endsWith('-01')) && (
                    <text x={col * 19} y="-9">
                      {new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
                        month: 'short',
                      })}
                    </text>
                  )}
                  <rect
                    data-day-index={index}
                    x={col * 19}
                    y={row * 19}
                    width="16"
                    height="16"
                    rx="3"
                    className={styles.cell}
                    data-level={Math.min(3, count)}
                    data-selected={chosen === day}
                    role="button"
                    tabIndex={chosen === day ? 0 : -1}
                    aria-label={description(day)}
                    aria-pressed={chosen === day}
                    onClick={() => setSelected(day)}
                    onFocus={() => setSelected(day)}
                    onKeyDown={(event) => {
                      const movements: Record<string, number> = {
                        ArrowLeft: -7,
                        ArrowRight: 7,
                        ArrowUp: -1,
                        ArrowDown: 1,
                        Home: -index,
                        End: days.length - 1 - index,
                      }
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelected(day)
                      }
                      if (event.key in movements) {
                        event.preventDefault()
                        const next = Math.max(
                          0,
                          Math.min(
                            days.length - 1,
                            index + movements[event.key],
                          ),
                        )
                        event.currentTarget.ownerSVGElement
                          ?.querySelector<SVGRectElement>(
                            `[data-day-index="${next}"]`,
                          )
                          ?.focus()
                      }
                    }}
                  >
                    <title>{description(day)}</title>
                  </rect>
                </g>
              )
            })}
          </Group>
        </svg>
      </div>
      <div className={styles.legend}>
        <span>Less</span>
        {[0, 1, 2, 3].map((level) => (
          <i
            key={level}
            data-level={level}
            className={styles.cell}
            aria-label={`${level}${level === 3 ? '+' : ''} entries`}
          />
        ))}
        <span>More</span>
      </div>
      <p className={styles.selection} role="status">
        {description(chosen)}
      </p>
      <p className={styles.hint}>
        Tap a day or use arrow keys to explore. Multiple entries still count as
        one streak day.
      </p>
      <details>
        <summary>View journaling dates</summary>
        <div className={styles.tableScroll}>
          <table>
            <caption>Completed entries by day</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Entries</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day}>
                  <th scope="row">{shortDate(day, locale)}</th>
                  <td>{counts.get(day) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  )
}

function Attributes({ data }: { data: AppData }) {
  const values = totals(data.rpg).stats
  const keys: Stat[] = ['strength', 'intelligence', 'spirit']
  const maximum = Math.max(
    10,
    Math.ceil(Math.max(...Object.values(values)) / 10) * 10,
  )
  const position = (index: number, ratio: number) => ({
    x: 180 + Math.sin((index * Math.PI * 2) / 3) * 105 * ratio,
    y: 150 - Math.cos((index * Math.PI * 2) / 3) * 105 * ratio,
  })
  const vertices = keys.map((key, index) =>
    position(index, values[key] / maximum),
  )
  return (
    <>
      <svg
        className={styles.radar}
        viewBox="0 0 360 300"
        role="img"
        aria-label={`RPG attributes: ${keys.map((key) => `${statNames[key]} ${values[key]}`).join(', ')}`}
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <circle
            key={ratio}
            cx="180"
            cy="150"
            r={105 * ratio}
            className={styles.grid}
          />
        ))}
        {keys.map((key, index) => {
          const end = position(index, 1),
            label = position(index, 1.25)
          return (
            <g key={key}>
              <line
                x1="180"
                y1="150"
                x2={end.x}
                y2={end.y}
                className={styles.grid}
              />
              <text x={label.x} y={label.y} textAnchor="middle">
                {statNames[key]}
              </text>
            </g>
          )
        })}
        <LinePath
          data={[...vertices, vertices[0]]}
          x={(point) => point.x}
          y={(point) => point.y}
          className={styles.radarShape}
        />
      </svg>
      <dl className={styles.attributeValues}>
        {keys.map((key) => (
          <div key={key}>
            <dt>{statNames[key]}</dt>
            <dd>{values[key]} points</dd>
          </div>
        ))}
      </dl>
      <p className={styles.hint}>
        All-time earned attributes · shared scale 0–{maximum}. These match your
        RPG dashboard.
      </p>
    </>
  )
}

export default function InsightsPage({
  data,
  entries,
  today,
  storageError,
}: {
  data: AppData
  entries: JournalEntry[]
  today: string
  storageError: string
}) {
  const { i18n: language } = useTranslation(undefined, { i18n })
  const locale = language.resolvedLanguage ?? 'en'
  const [range, setRange] = useState(90)
  const [source, setSource] = useState<ActivitySource | 'all'>('all')
  const [habit, setHabit] = useState('all')
  const allActivity = useMemo(
    () => collectActivity(entries, data.sessions, today),
    [entries, data.sessions, today],
  )
  const events = allActivity.filter(
    (event) => source === 'all' || event.source === source,
  )
  const days = dateRange(today, range)
  const counts = new Map<string, number>()
  for (const event of events)
    counts.set(event.day, (counts.get(event.day) ?? 0) + 1)
  const summary = streaks(events, today)
  const activeDays = days.filter((day) => counts.has(day)).length
  const moodByDay = new Map<string, number[]>()
  for (const session of new Map(
    data.sessions.map((item) => [item.metadata.id, item]),
  ).values()) {
    const event = chatActivity(session),
      mood = session.metadata.mood
    if (
      event &&
      mood !== null &&
      Number.isFinite(mood) &&
      mood >= 1 &&
      mood <= 5
    )
      moodByDay.set(event.day, [...(moodByDay.get(event.day) ?? []), mood])
  }
  const moods = days.map((day) => {
    const ratings = moodByDay.get(day)
    return {
      day,
      value: ratings
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null,
    }
  })
  const habits = data.habits.filter(
    (item) => habit === 'all' || item.id === habit,
  )
  const habitPoints = days.map((day) => ({
    day,
    value: habits.filter((item) => item.dates.includes(day)).length,
  }))
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Your growth, in perspective</p>
        <h1>Insights</h1>
        <p>Small moments add up. See the rhythm of showing up for yourself.</p>
      </header>
      {storageError && (
        <p role="alert" className={styles.notice}>
          {storageError} Insights may not include unsaved changes.
        </p>
      )}
      <div className={styles.filters}>
        <label>
          Time range
          <select
            value={range}
            onChange={(event) => setRange(Number(event.target.value))}
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 365 days</option>
          </select>
        </label>
        <label>
          Journal source
          <select
            value={source}
            onChange={(event) =>
              setSource(event.target.value as ActivitySource | 'all')
            }
          >
            <option value="all">All journals</option>
            <option value="daybook">Daybook</option>
            <option value="chat">Chat journal</option>
          </select>
        </label>
        <span>Private · on this device</span>
      </div>
      <div className={styles.stats}>
        {[
          {
            label: 'Current streak',
            value: `${summary.current} days`,
            Icon: Flame,
            hint: counts.has(today)
              ? 'You showed up today.'
              : 'Today is still yours to write.',
          },
          {
            label: 'Longest streak',
            value: `${summary.longest} days`,
            Icon: Sparkles,
            hint: 'Across your recorded history',
          },
          {
            label: 'Days journaled this month',
            value: String(summary.month),
            Icon: CalendarDays,
            hint: 'One day at a time',
          },
          {
            label: 'Consistency',
            value: `${Math.round((activeDays / range) * 100)}%`,
            Icon: TrendingUp,
            hint: `${activeDays} of the last ${range} calendar days`,
          },
        ].map(({ label, value, Icon, hint }) => (
          <section className={styles.stat} key={label}>
            <Icon size={19} aria-hidden="true" />
            <h2>{label}</h2>
            <strong>{value}</strong>
            <p>{hint}</p>
          </section>
        ))}
      </div>
      <section className={styles.card}>
        <h2>Your journaling rhythm</h2>
        <p className={styles.subtitle}>
          Every completed reflection leaves a little mark.
        </p>
        {!events.length && (
          <p className={styles.notice}>
            Your story starts with one saved reflection. Complete a Daybook page
            or save a chat check-in to begin.
          </p>
        )}
        <JournalHeatmap days={days} counts={counts} locale={locale} />
        <p className={styles.hint}>
          Older Daybook history includes only the latest saved date we can
          verify. New completions preserve each local calendar day. Legacy dates
          use this device’s timezone.
        </p>
      </section>
      <div className={styles.columns}>
        <section className={styles.card}>
          <h2>Your RPG attributes</h2>
          <Attributes data={data} />
        </section>
        <section className={styles.card}>
          <h2>Mood over time</h2>
          <p className={styles.subtitle}>
            Daily average of saved chat check-ins · 1 low → 5 great.
            Journal-source filters do not change this chart.
          </p>
          {moods.some((point) => point.value !== null) ? (
            <Trend
              points={moods}
              minimum={1}
              maximum={5}
              label="Mood trend"
              locale={locale}
            />
          ) : (
            <p className={styles.empty}>
              No mood ratings in this period. Add a mood rating to a saved chat
              check-in when it feels right.
            </p>
          )}
          <p className={styles.hint}>
            Unrecorded days are gaps, not low moods. This is reflection, not a
            clinical assessment.
          </p>
        </section>
      </div>
      <section className={styles.card}>
        <div className={styles.habitHeading}>
          <div>
            <h2>Habit momentum</h2>
            <p className={styles.subtitle}>
              Recorded daily completions, not a success-rate estimate.
            </p>
          </div>
          <label>
            Habit
            <select
              value={habit}
              onChange={(event) => setHabit(event.target.value)}
            >
              <option value="all">All habits</option>
              {data.habits.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {data.habits.length ? (
          <Trend
            points={habitPoints}
            maximum={Math.max(1, habits.length)}
            label="Habit completions"
            locale={locale}
          />
        ) : (
          <p className={styles.empty}>
            Create a habit to start seeing its rhythm here.
          </p>
        )}
      </section>
      <p className={styles.hint}>
        Turning Insights off hides this page without removing your history.
        Audio continues as you browse.
      </p>
    </div>
  )
}
