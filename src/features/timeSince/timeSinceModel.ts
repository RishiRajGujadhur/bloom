import { differenceInSeconds } from 'date-fns'

export type Counter = {
  id: string
  label: string
  emoji: string
  /** Epoch ms of the start (count up) or the event (count down). */
  at: number
  kind: 'since' | 'until'
}
export const TIME_SINCE_KEY = 'bloom-timesince-v1'

/** Days / hours / minutes / seconds between now and the counter's moment. */
export function counterParts(counter: Pick<Counter, 'at' | 'kind'>, now: number) {
  const raw =
    counter.kind === 'since' ? differenceInSeconds(now, counter.at) : differenceInSeconds(counter.at, now)
  const total = Math.max(0, raw)
  return {
    done: counter.kind === 'until' && raw <= 0,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

/** "DDD:HH:MM:SS" (days padded to at least two digits) for the flip board. */
export function flapString(parts: ReturnType<typeof counterParts>, seconds = true) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const base = `${pad(parts.days)}:${pad(parts.hours)}:${pad(parts.minutes)}`
  return seconds ? `${base}:${pad(parts.seconds)}` : base
}
