import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Keyboard, Mousewheel } from 'swiper/modules'
import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import type { Session } from '../../model'
import { usePageActions } from '../../components/ui/PageMenu'
import { subOn } from '../subFeatures'
import './showcase.css'

const moodFace = ['', '😞', '🙁', '😐', '🙂', '😊']
const covers = ['#ffcf56', '#8ecae6', '#f4a3c0', '#b5e48c', '#cdb4db', '#ffb4a2']

/**
 * Story carousel: past reflections as storybook cards in a 3D coverflow
 * (Swiper). Tap one to read its summary.
 */
export function StoryCarousel({ sessions, onOpen }: { sessions: Session[]; onOpen: (s: Session) => void }) {
  const [query, setQuery] = useState('')
  const all = useMemo(
    () => [...sessions]
      .filter((s) => s.messages.some((m) => m.sender === 'user'))
      .sort((a, b) => Date.parse(b.metadata.date) - Date.parse(a.metadata.date)),
    [sessions],
  )
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    if (!term) return all.slice(0, 24)
    return all.filter((session) => {
      const content = session.messages.filter((message) => message.sender === 'user').map((message) => message.text).join(' ')
      return `${content} ${session.metadata.tags.join(' ')} ${session.metadata.date}`.toLocaleLowerCase().includes(term)
    })
  }, [all, query])
  usePageActions(all.length ? [{ id: 'story-latest', label: 'Read my latest reflection', icon: '📖', run: () => onOpen(all[0]) }] : [])
  if (!subOn('chatJournal', 'storyCarousel') || all.length === 0) return null
  return (
    <section className="sc-wrap" aria-label="Your reflections">
      <h3>Your story so far</h3>
      <label className="sc-search">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Search past reflections</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reflections, tags, or dates…" />
        {query && <button type="button" aria-label="Clear reflection search" onClick={() => setQuery('')}><X size={15} /></button>}
      </label>
      {filtered.length > 0 ? (
        <Swiper
          modules={[EffectCoverflow, Keyboard, Mousewheel]}
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          keyboard
          mousewheel={{ forceToAxis: true }}
          coverflowEffect={{ rotate: 32, stretch: 0, depth: 140, modifier: 1, slideShadows: false }}
          className="sc-swiper"
        >
          {filtered.map((s, i) => {
            const first = s.messages.find((m) => m.sender === 'user')?.text ?? ''
            return (
              <SwiperSlide key={s.metadata.id} className="sc-slide">
                <button type="button" className="sc-card" style={{ ['--cover' as string]: covers[i % covers.length] }} onClick={() => onOpen(s)} data-cursor-text="Read">
                  <span className="sc-date">{new Date(s.metadata.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="sc-face" aria-hidden="true">{moodFace[s.metadata.mood ?? 0] || '📝'}</span>
                  <span className="sc-text">{first.length > 120 ? `${first.slice(0, 120)}…` : first}</span>
                  {s.metadata.tags.length > 0 && <span className="sc-tags">{s.metadata.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}</span>}
                </button>
              </SwiperSlide>
            )
          })}
        </Swiper>
      ) : (
        <p className="sc-empty" role="status">No reflections match “{query.trim()}”. Try another search or clear it.</p>
      )}
    </section>
  )
}
