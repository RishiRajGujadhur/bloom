import { subOn } from '../subFeatures'
import { useState } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import { cars, findCar } from './catalog'
import { CarSprite } from './CarSprite'
import { GARAGE_KEY, PADS, emptyGarage, parkCar, sanitizeGarage, type GarageLayout } from './garage'
import { useStoredValue } from '../sleep/useStoredValue'
import { useShop } from '../rewards/shop'
import './garage.css'

/**
 * Isometric garage: pick an unlocked car, then a pad to park it. Upgrades
 * bought in the Petal shop (Garage tab) appear around the floor.
 */
export function GaragePanel({ owned, onShop }: { owned: string[]; onShop?: () => void }) {
  const [stored, setLayout] = useStoredValue<GarageLayout>(GARAGE_KEY, emptyGarage)
  const layout = sanitizeGarage(stored, owned)
  const [picked, setPicked] = useState<string | null>(null)
  const { shop } = useShop()
  const has = (id: string) =>
    shop.owned.includes(id) &&
    subOn('garage', 'upgrades') &&
    (id !== 'garage-turntable' || subOn('garage', 'turntable')) &&
    (id !== 'garage-neon' || subOn('garage', 'neon')) &&
    (id !== 'garage-spotlights' || subOn('garage', 'spotlights')) &&
    (id !== 'garage-plants' || subOn('garage', 'plants')) &&
    (id !== 'garage-charger' || subOn('garage', 'chargers'))
  const ownedCars = cars.filter((car) => owned.includes(car.id))
  const parked = new Set(layout.pads.filter(Boolean))

  return (
    <section className="garage bloom-stack" aria-label="Your garage">
      <div className={`garage-scene${has('garage-spotlights') ? ' has-spotlights' : ''}`}>
        {has('garage-neon') && (
          <div className="garage-neon" aria-hidden="true">
            BLOOM MOTORS
          </div>
        )}
        <div className="garage-floor">
          {Array.from({ length: PADS }, (_, pad) => {
            const car = findCar(layout.pads[pad] ?? null)
            const turntable = has('garage-turntable') && pad === 0
            return (
              <button
                key={pad}
                type="button"
                className={`garage-pad${turntable ? ' is-turntable' : ''}${picked ? ' is-target' : ''}`}
                aria-label={
                  car
                    ? `Pad ${pad + 1}: ${car.name}${picked ? `. Swap for the selected car` : '. Select to remove'}`
                    : picked
                      ? `Park the selected car on pad ${pad + 1}`
                      : `Empty pad ${pad + 1}`
                }
                onClick={() => {
                  if (picked) {
                    setLayout(parkCar(layout, pad, picked))
                    setPicked(null)
                  } else if (car) setLayout(parkCar(layout, pad, null))
                }}
              >
                {car ? (
                  <span className="garage-car">
                    <CarSprite car={car} />
                  </span>
                ) : (
                  <span className="garage-pad-label">P{pad + 1}</span>
                )}
                {has('garage-charger') && pad % 2 === 1 && (
                  <span className="garage-charger" aria-hidden="true">
                    🔌
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {has('garage-plants') && (
          <div className="garage-plants" aria-hidden="true">
            <span>🌵</span>
            <span>🌿</span>
          </div>
        )}
      </div>
      <div className="garage-strip bloom-controls">
        <strong>{picked ? `Choose a pad for ${findCar(picked)?.name}` : 'Pick a car to park'}</strong>
        {picked && (
          <button className="icon-button" aria-label="Cancel" onClick={() => setPicked(null)}>
            <X size={16} />
          </button>
        )}
        <div className="garage-cars" role="listbox" aria-label="Your cars">
          {ownedCars.length === 0 && <span className="wb-muted">Win cars with the daily spin.</span>}
          {ownedCars.map((car) => (
            <button
              key={car.id}
              role="option"
              aria-selected={picked === car.id}
              className="garage-car-chip"
              data-parked={parked.has(car.id)}
              onClick={() => setPicked(picked === car.id ? null : car.id)}
            >
              <span className="garage-chip-sprite" aria-hidden="true">
                <CarSprite car={car} />
              </span>
              {car.name}
            </button>
          ))}
        </div>
        {onShop && (
          <button className="ov-secondary" onClick={onShop}>
            <ShoppingBag size={16} aria-hidden="true" /> Upgrade garage
          </button>
        )}
      </div>
    </section>
  )
}
