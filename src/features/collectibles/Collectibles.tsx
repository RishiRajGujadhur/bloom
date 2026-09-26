import { subOn } from '../subFeatures'
import { fountain } from '../../components/ui/celebrate'
import { CardRail } from '../../components/BloomExperience'
import { GaragePanel } from './GaragePanel'
import { loadSettings } from '../../SettingsPage'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  CarFront,
  Check,
  Gift,
  LockKeyhole,
  Sparkles,
} from 'lucide-react'
import { dayKey } from '../../dates'
import { cars, findCar } from './catalog'
import { CarSprite } from './CarSprite'
import { canSpin, selectCar, spinDaily, useCollection } from './store'
import './collectibles.css'

const saveError =
  'Could not save your collection. Check that browser storage is available, then try again.'

export function DailySpin({ onCollection }: { onCollection?: () => void }) {
  const { collection, error } = useCollection()
  const [today, setToday] = useState(dayKey)
  const [spinning, setSpinning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState('')
  const busy = useRef(false)
  const reduced = useReducedMotion()
  useEffect(() => {
    const refresh = () => setToday(dayKey())
    const interval = window.setInterval(refresh, 1000)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  useEffect(() => {
    if (!spinning || saving) return
    const timeout = window.setTimeout(
      () => {
        setSpinning(false)
        busy.current = false
      },
      reduced ? 0 : 2200,
    )
    return () => clearTimeout(timeout)
  }, [spinning, saving, reduced])

  const complete = collection.owned.length === cars.length
  const result = collection.lastSpin?.day === today ? collection.lastSpin : null
  const reward = findCar(result?.reward ?? null)
  useEffect(() => {
    if (reward && subOn('dailySpin', 'jackpotFountain')) fountain()
  }, [reward])
  const eligible = canSpin(collection) && !error && !spinning
  const spin = async () => {
    if (busy.current || !eligible) return
    busy.current = true
    setFailure('')
    setSaving(true)
    setSpinning(true)
    try {
      await spinDaily()
    } catch {
      setFailure(saveError)
      setSpinning(false)
      busy.current = false
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className={`daily-spin${spinning ? ' is-spinning' : ''}`}
      aria-labelledby="daily-spin-title"
    >
      <div className="spin-copy">
        <span className="collectible-eyebrow">
          <Gift size={15} /> DAILY REWARD
        </span>
        <h2 id="daily-spin-title">A little luck for your day.</h2>
        <p>One free spin. A new ride waiting around the corner.</p>
        <small>
          1 in 3 jackpot chance · No purchases · Resets at local midnight
        </small>
        {onCollection && (
          <button className="text-button" onClick={onCollection}>
            My Collectibles <ArrowRight size={15} />
          </button>
        )}
      </div>
      <div className="spin-machine">
        <div
          className="spin-reels"
          aria-label={
            spinning
              ? 'Reels spinning'
              : `Reels: ${(result?.reels ?? [7, 7, 7]).join(', ')}`
          }
        >
          {[0, 1, 2].map((index) => (
            <div className="spin-reel" key={index} aria-hidden="true">
              {spinning ? (
                <div className={`reel-strip reel-${index}`}>
                  <span>7</span>
                  <span>3</span>
                  <span>5</span>
                  <span>1</span>
                  <span>7</span>
                </div>
              ) : (
                <span>{result?.reels[index] ?? 7}</span>
              )}
            </div>
          ))}
        </div>
        <button
          className="primary spin-button"
          onClick={spin}
          disabled={!eligible}
        >
          <Sparkles size={18} />{' '}
          {spinning
            ? 'Spinning...'
            : complete
              ? 'Collection complete'
              : eligible
                ? 'Daily 7-7-7 Spin'
                : 'Come back tomorrow'}
        </button>
      </div>
      <div className="spin-outcome" role="status" aria-live="polite">
        {spinning ? (
          'A little suspense...'
        ) : result ? (
          reward ? (
            <>
              <CarSprite car={reward} />
              <div>
                <strong>Jackpot! {reward.name} is yours.</strong>
                <p>Added to your collection. Your next spin is tomorrow.</p>
              </div>
            </>
          ) : (
            <p>No match today. A fresh chance awaits tomorrow.</p>
          )
        ) : complete ? (
          <p>Every car is home. Enjoy your collection!</p>
        ) : null}
      </div>
      {(error || failure) && (
        <p className="error-text" role="alert">
          {error || failure}
        </p>
      )}
    </section>
  )
}

export function CollectiblesPage() {
  const { collection, error } = useCollection()
  const [filter, setFilter] = useState<'all' | 'owned' | 'garage'>('all')
  const garageOn = loadSettings().features.garage
  const [failure, setFailure] = useState('')
  const [pending, setPending] = useState(false)
  const choose = async (id: string | null) => {
    setPending(true)
    setFailure('')
    try {
      await selectCar(id)
    } catch {
      setFailure(saveError)
    } finally {
      setPending(false)
    }
  }
  return (
    <div className="collection-page">
      <div className="collection-toolbar">
        <div>
          <span className="collectible-eyebrow">
            <CarFront size={16} /> THE BLOOM GARAGE
          </span>
          <h2>Your small fleet.</h2>
          <p>
            {collection.owned.length} of {cars.length} cars collected
          </p>
        </div>
        <div className="segmented" aria-label="Collection filter">
          <button
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All cars
          </button>
          <button
            aria-pressed={filter === 'owned'}
            onClick={() => setFilter('owned')}
          >
            Unlocked
          </button>
          {garageOn && (
            <button
              aria-pressed={filter === 'garage'}
              onClick={() => setFilter('garage')}
            >
              Garage
            </button>
          )}
        </div>
      </div>
      {(error || failure) && (
        <p role="alert" className="error-text">
          {error || failure}
        </p>
      )}
      {collection.owned.length === 0 && (
        <p className="collection-empty">
          Your garage is waiting for its first arrival. A daily 7-7-7 jackpot
          unlocks a car.
        </p>
      )}
      {filter === 'garage' && garageOn ? (
        <GaragePanel
          owned={collection.owned}
          onShop={() => {
            window.location.hash = 'shop'
          }}
        />
      ) : (
      <CardRail label="Your collection">
        {cars
          .filter(
            (car) =>
              (filter === 'all' && subOn('collectibles', 'lockedCars')) ||
              collection.owned.includes(car.id),
          )
          .map((car, index) => {
            const owned = collection.owned.includes(car.id)
            const selected = collection.selected === car.id
            return (
              <article
                className={`collectible-card${owned ? ' is-owned' : ''}${selected ? ' is-selected' : ''}`}
                key={car.id}
              >
                <div className="collectible-number">
                  <span>
                    {String(cars.indexOf(car) + 1).padStart(2, '0')} / 06
                  </span>
                  {owned ? (
                    <span>
                      <Check size={14} /> Unlocked
                    </span>
                  ) : (
                    <span>
                      <LockKeyhole size={14} /> Locked
                    </span>
                  )}
                </div>
                <CarSprite car={car} locked={!owned} />
                <div className="collectible-caption">
                  <span className="collectible-eyebrow">{car.kind}</span>
                  <h3>{car.name}</h3>
                </div>
                <button
                  className={selected ? 'primary' : 'quiet-button'}
                  disabled={!owned || pending || !!error}
                  aria-pressed={selected}
                  onClick={() => choose(selected ? null : car.id)}
                >
                  {selected ? (
                    <Check size={16} />
                  ) : owned ? (
                    <CarFront size={16} />
                  ) : (
                    <LockKeyhole size={16} />
                  )}
                  {selected
                    ? 'Focus companion'
                    : owned
                      ? 'Take to focus'
                      : 'Awaiting discovery'}
                </button>
                <span className="sr-only">Car {index + 1}</span>
              </article>
            )
          })}
      </CardRail>
      )}
    </div>
  )
}

export function FocusCompanion({
  active,
  fallback,
}: {
  active: boolean
  fallback?: ReactNode
}) {
  const { collection, error } = useCollection()
  const [failure, setFailure] = useState('')
  const selected = findCar(collection.selected)
  return (
    <div className="focus-companion">
      {selected ? <CarSprite car={selected} moving={active} /> : fallback}
      <label htmlFor="focus-companion">Focus companion</label>
      <select
        id="focus-companion"
        value={collection.selected ?? ''}
        disabled={!!error}
        onChange={async (event) => {
          setFailure('')
          try {
            await selectCar(event.target.value || null)
          } catch {
            setFailure(saveError)
          }
        }}
      >
        <option value="">None</option>
        {cars
          .filter((car) => collection.owned.includes(car.id))
          .map((car) => (
            <option key={car.id} value={car.id}>
              {car.name}
            </option>
          ))}
      </select>
      {!collection.owned.length && !error && (
        <small>No cars unlocked yet.</small>
      )}
      {(error || failure) && (
        <p role="alert" className="error-text">
          {error || failure}
        </p>
      )}
    </div>
  )
}
