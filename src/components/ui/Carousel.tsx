import { Children, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './ui.css'

/**
 * Horizontal slider for secondary content, so a page shows a few cards at a
 * time instead of a long scroll. Arrows, dots, swipe and keyboard all work.
 */
export function Carousel({
  title,
  description,
  children,
  label,
}: {
  title?: string
  description?: string
  children: ReactNode
  label: string
}) {
  const slides = Children.toArray(children).filter(Boolean)
  const [viewport, embla] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
  })
  const [index, setIndex] = useState(0)
  const [snaps, setSnaps] = useState<number[]>([])
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const sync = useCallback(() => {
    if (!embla) return
    setIndex(embla.selectedScrollSnap())
    setSnaps(embla.scrollSnapList())
    setCanPrev(embla.canScrollPrev())
    setCanNext(embla.canScrollNext())
  }, [embla])
  useEffect(() => {
    if (!embla) return
    sync()
    embla.on('select', sync).on('reInit', sync)
    return () => {
      embla.off('select', sync).off('reInit', sync)
    }
  }, [embla, sync])
  return (
    <section
      className="ui-carousel"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'ArrowRight') embla?.scrollNext()
        if (event.key === 'ArrowLeft') embla?.scrollPrev()
      }}
    >
      <div className="ui-carousel-head">
        {title && (
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
        )}
        {snaps.length > 1 && (
          <div className="ui-carousel-nav">
            <button
              type="button"
              aria-label="Previous"
              disabled={!canPrev}
              onClick={() => embla?.scrollPrev()}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next"
              disabled={!canNext}
              onClick={() => embla?.scrollNext()}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
      <div className="ui-carousel-viewport" ref={viewport}>
        <div className="ui-carousel-track">
          {slides.map((slide, i) => (
            <div
              className="ui-carousel-slide"
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
      {snaps.length > 1 && (
        <div className="ui-carousel-dots">
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => embla?.scrollTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
