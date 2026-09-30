import { useEffect, useMemo, useState } from 'react'
import { readStore } from '../../components/studio/Studio'
import { prefersReducedMotion } from '../../utils/motion'
import { AFFIRM_KEY, cardsFor, dailyCard, type AffirmStore } from './affirmModel'

/**
 * A widget-style line on the home card that slowly rotates through your saved
 * and own affirmations (or today's mix when you haven't saved any).
 */
export function AffirmTicker({ onOpen }: { onOpen: () => void }) {
  const pool = useMemo(() => {
    const s = readStore<Pick<AffirmStore, 'favourites' | 'custom'>>(AFFIRM_KEY, { favourites: [], custom: [] })
    const mine = [...s.favourites, ...s.custom]
    return mine.length ? mine : [dailyCard(), ...cardsFor('mix', s).slice(0, 5)]
  }, [])
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(true)
  useEffect(() => {
    if (pool.length < 2 || prefersReducedMotion()) return
    const t = setInterval(() => {
      setShown(false)
      setTimeout(() => {
        setI((n) => (n + 1) % pool.length)
        setShown(true)
      }, 400)
    }, 12000)
    return () => clearInterval(t)
  }, [pool.length])
  if (!pool.length) return null
  return (
    <button type="button" className="affirm-ticker" data-shown={shown} onClick={onOpen} title="Open affirmations">
      <span aria-hidden="true">✦</span> <span aria-live="off">{pool[i]}</span>
    </button>
  )
}
