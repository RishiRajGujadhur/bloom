import { subOn } from '../subFeatures'
import type { CSSProperties } from 'react'
import type { Car } from './catalog'

// Original, grid-aligned sprite library. Each body has its own silhouette and trim.
export function CarSprite({
  car,
  locked = false,
  moving = false,
}: {
  car: Car
  locked?: boolean
  moving?: boolean
}) {
  const tall = car.body === 'van'
  const wagon = car.body === 'wagon'
  const hover = car.body === 'hover'
  const racer = car.body === 'racer'
  const hatch = car.body === 'hatch'
  return (
    <div
      className={`car-stage ${subOn('collectibles', 'carEffects') ? `effect-${car.effect}` : 'no-effect'}${locked ? ' is-locked' : ''}${moving ? ' is-moving' : ''}`}
      style={{ '--car-accent': car.accent } as CSSProperties}
    >
      <svg
        className="car-sprite"
        viewBox="0 0 128 72"
        role="img"
        aria-label={locked ? 'Locked car silhouette' : car.name}
        shapeRendering="crispEdges"
      >
        <path
          className="car-shadow"
          fill="#17282e"
          opacity=".15"
          d="M15 61h100v3H15z"
        />
        <g className="car-body">
          <path
            fill="#263540"
            d={
              tall
                ? 'M18 13h76v4h9v8h7v13h10v17H10V32h8z'
                : wagon
                  ? 'M22 23h65v4h8v9h19v5h8v14H8V38h9V27h5z'
                  : hatch
                    ? 'M29 22h46v4h9v10h24v4h11v15H10V37h12V27h7z'
                    : 'M36 25h43v4h10v7h23v5h9v14H9V40h12v-7h9v-4h6z'
            }
          />
          <path
            fill={car.color}
            d={
              tall
                ? 'M21 16h71v4h9v8h6v13h10v11H13V35h8z'
                : wagon
                  ? 'M25 26h60v4h8v9h20v5h6v8H11V41h9V30h5z'
                  : hatch
                    ? 'M32 25h41v4h9v10h25v4h9v9H13V40h12V30h7z'
                    : 'M38 28h39v4h10v7h24v5h7v8H12v-9h12v-7h9v-4h5z'
            }
          />
          <path
            fill={car.light}
            d={
              tall
                ? 'M22 16h70v3H22zM14 39h94v3H14z'
                : 'M34 27h43v3H34zM24 39h85v3H24z'
            }
          />
          <path
            fill="#273c4b"
            d={
              tall
                ? 'M25 22h19v13H25zM49 22h18v13H49zM73 22h19v13H73zM97 29h7v8h-7z'
                : wagon
                  ? 'M27 30h16v8H27zM48 30h16v8H48zM69 30h14v3h5v5H69z'
                  : hatch
                    ? 'M34 29h17v9H28v-5h6zM56 29h14v4h8v5H56z'
                    : 'M40 32h14v7H31v-3h9zM59 32h17v4h7v3H59z'
            }
          />
          <path
            fill="#9fd3df"
            d={
              tall
                ? 'M26 23h15v3H26zM50 23h14v3H50zM74 23h15v3H74z'
                : 'M40 32h11v2H37v3h-5v-2h8zM60 32h12v2H60z'
            }
          />
          <path
            fill={car.accent}
            d={tall ? 'M14 44h101v3H14z' : 'M25 44h76v3H25z'}
          />
          <path
            fill="#263540"
            opacity=".5"
            d="M53 40h1v12h-1zM79 41h1v11h-1zM14 50h99v3H14z"
          />
          <path
            fill="#e2edf0"
            d="M56 42h6v2h-6zM83 42h5v2h-5zM10 52h13v3H10zM103 52h18v3h-18z"
          />
          <path fill="#fff0ae" d="M109 43h8v5h-8z" />
          <path fill="#ed7979" d="M12 43h5v5h-5z" />
          <path fill="#263540" d="M99 48h19v3H99z" />
          {car.body === 'coupe' && (
            <>
              <path fill="#263540" d="M11 33h14v3H11zM16 36h3v5h-3z" />
              <path fill={car.accent} d="M61 39h8v12h-8z" />
              <path fill="#263540" d="M64 42h2v6h-2z" />
            </>
          )}
          {wagon && (
            <>
              <path fill="#263540" d="M29 20h3v4h-3zM76 20h3v4h-3z" />
              <path fill={car.accent} d="M20 17h70v3H20zM26 14h58v3H26z" />
              <path fill="#e47e72" d="M45 14h9v6h-9z" />
            </>
          )}
          {tall && (
            <>
              <path fill={car.accent} d="M30 11h47v3H30zM29 38h12v14H29z" />
              <path fill="#273c4b" d="M32 40h6v5h-6z" />
            </>
          )}
          {racer && (
            <>
              <path
                fill="#263540"
                d="M8 29h23v4H8zM17 33h4v7h-4zM91 36h15v3H91z"
              />
              <path
                fill={car.accent}
                d="M90 34h12v3H90zM48 42h4v8h-4zM54 42h4v8h-4z"
              />
            </>
          )}
          {hover ? (
            <>
              <path
                fill="#273c4b"
                d="M22 51h23v7H22zM87 51h23v7H87zM7 37h9v13H7z"
              />
              <path fill="#a2b7c4" d="M25 52h16v3H25zM90 52h16v3H90z" />
              <path
                className="car-exhaust"
                fill={car.accent}
                d="M26 58h14v5H26zM91 58h14v5H91zM3 39h4v8H3z"
              />
              <path fill={car.accent} d="M57 23h12v4H57z" />
            </>
          ) : (
            [30, 98].map((x) => (
              <g key={x}>
                <path
                  fill="#20303a"
                  d={`M${x - 7} 49h14v3h3v8h-3v3h-14v-3h-3v-8h3z`}
                />
                <path fill="#8a9daa" d={`M${x - 4} 52h8v8h-8z`} />
                <path fill="#dce7ed" d={`M${x - 2} 54h4v4h-4z`} />
              </g>
            ))
          )}
        </g>
        <g className="car-sparks" fill={car.accent}>
          <path d="M10 19h3v3h-3zM111 24h3v3h-3zM95 10h3v3h-3zM7 49h3v3H7z" />
        </g>
      </svg>
    </div>
  )
}
