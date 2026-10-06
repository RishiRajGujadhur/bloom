import { Checkbox } from '../../components/ui/Checkbox'
import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { subOn } from '../subFeatures'
import { useEffect, useMemo, useState } from 'react'
import { BookMarked, Download, Loader2 } from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import { DAYBOOK_STORAGE_KEY } from '../../components/daybook/storage'
import type { JournalEntry } from '../../components/daybook/types'
import { GRATITUDE_KEY, MOOD_KEY, type GratitudeEntry, type MoodEntry } from '../wellbeing/store'
import { buildYearbook, type YearbookChapters } from './yearbookModel'
import { burst } from '../../components/ui/celebrate'
import './yearbook.css'

function readJson<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? (value as T[]) : []
  } catch {
    return []
  }
}

const chapterLabels: Record<keyof YearbookChapters, string> = {
  stats: 'The year in numbers',
  moods: 'Mood by month',
  daybook: 'Daybook pages',
  journal: 'Guided reflections',
  gratitude: 'Good things',
}

/** Typesets the year into a paperback-sized PDF, entirely in the browser. */
export function YearbookPage({ data, today }: FeaturePageProps) {
  const thisYear = Number(today.slice(0, 4))
  const [year, setYear] = useState(thisYear)
  // Title, author and chapter picks are remembered between visits.
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem('bloom-yearbook-opts') ?? 'null') as { title?: string; author?: string; chapters?: YearbookChapters } | null
    } catch {
      return null
    }
  })()
  const [title, setTitle] = useState(saved?.title ?? 'My year in Bloom')
  const [author, setAuthor] = useState(() => {
    if (saved?.author) return saved.author
    try { return localStorage.getItem('bloom-name') ?? '' } catch { return '' }
  })
  const [chapters, setChapters] = useState<YearbookChapters>(saved?.chapters ?? {
    stats: true,
    moods: true,
    daybook: true,
    journal: true,
    gratitude: true,
  })
  useEffect(() => {
    try { localStorage.setItem('bloom-yearbook-opts', JSON.stringify({ title, author, chapters })) } catch { /* optional */ }
  }, [title, author, chapters])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const book = useMemo(
    () =>
      buildYearbook(
        data,
        readJson<JournalEntry>(DAYBOOK_STORAGE_KEY),
        readJson<GratitudeEntry>(GRATITUDE_KEY),
        readJson<MoodEntry>(MOOD_KEY),
        year,
        title,
        author,
      ),
    [data, year, title, author],
  )
  const publish = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    setBusy(true)
    setError('')
    try {
      const { renderYearbook } = await import('./YearbookDocument')
      const blob = await renderYearbook(book, {
        ...chapters,
        daybook: chapters.daybook && subOn('yearbook', 'daybookChapter'),
        journal: chapters.journal && subOn('yearbook', 'journalChapter'),
        gratitude: chapters.gratitude && subOn('yearbook', 'gratitudeChapter'),
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bloom-year-${year}.pdf`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      burst(button, 'stars', 'yearbook')
    } catch {
      setError('The book could not be generated. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="yearbook-page" aria-label="Year book">
      <div className="yearbook-preview" aria-hidden="true" hidden={!subOn('yearbook', 'coverPreview')}>
        <div className="yearbook-cover">
          <span>{year}</span>
          <strong>{title || 'My year'}</strong>
          <small>{author || 'A year with Bloom'}</small>
        </div>
      </div>
      <div className="yearbook-options">
        <label>
          Year
          <DropdownSelect value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[thisYear, thisYear - 1, thisYear - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </DropdownSelect>
        </label>
        <label>
          Title
          <input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Author
          <input value={author} maxLength={60} placeholder="Your name" onChange={(e) => setAuthor(e.target.value)} />
        </label>
        <fieldset>
          <legend>Chapters</legend>
          {(Object.keys(chapterLabels) as (keyof YearbookChapters)[])
            .filter(
              (key) =>
                (key !== 'daybook' || subOn('yearbook', 'daybookChapter')) &&
                (key !== 'journal' || subOn('yearbook', 'journalChapter')) &&
                (key !== 'gratitude' || subOn('yearbook', 'gratitudeChapter')),
            )
            .map((key) => (
            <label key={key} className="yearbook-check">
              <Checkbox
                
                checked={chapters[key]}
                onCheckedChange={() => setChapters((c) => ({ ...c, [key]: !c[key] }))}
              />
              {chapterLabels[key]}
            </label>
          ))}
        </fieldset>
        <ul className="yearbook-stats" hidden={!subOn('yearbook', 'stats')}>
          {book.stats.map((stat) => (
            <li key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>
        <button className="ov-primary yearbook-generate" onClick={publish} disabled={busy}>
          {busy ? <Loader2 size={17} className="spin" /> : <Download size={17} />}
          {busy ? 'Typesetting…' : 'Download PDF book'}
        </button>
        {error && <p role="alert">{error}</p>}
        <p className="wb-muted">
          <BookMarked size={14} aria-hidden="true" /> A5 paperback layout with page numbers, ready for a print shop.
          Everything is generated on your device.
        </p>
      </div>
    </section>
  )
}
