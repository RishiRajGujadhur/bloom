/**
 * Garage layout: six parking pads. A car can only be parked once; parking it
 * elsewhere moves it. Upgrades are bought in the petal shop (kind "garage").
 */
export const GARAGE_KEY = 'bloom-garage-v1'
export const PADS = 6
export type GarageLayout = { pads: (string | null)[] }
export const emptyGarage: GarageLayout = { pads: Array(PADS).fill(null) }

export function parkCar(layout: GarageLayout, pad: number, carId: string | null): GarageLayout {
  const pads = layout.pads.map((id) => (id === carId ? null : id))
  while (pads.length < PADS) pads.push(null)
  if (pad >= 0 && pad < PADS) pads[pad] = carId
  return { pads }
}

/** Drops cars that are no longer owned (e.g. after restoring a backup). */
export function sanitizeGarage(layout: GarageLayout, owned: string[]): GarageLayout {
  const pads = Array.from({ length: PADS }, (_, i) => {
    const id = layout.pads[i] ?? null
    return id && owned.includes(id) ? id : null
  })
  return { pads }
}
