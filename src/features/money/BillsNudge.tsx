import { useEffect, useState } from 'react'
import { MONEY_KEY } from './moneyModel'
import type { Bill } from './billsModel'
import '../sleep/bedtimeNudge.css'

const SEEN_KEY = 'bloom-bills-nudged'

/** Three days before an unpaid bill (or renewal) is due, say so once — wherever you are in Bloom. */
export function BillsNudge() {
  const [due, setDue] = useState<{ biller: string; days: number } | null>(null)
  useEffect(() => {
    const check = () => {
      let bills: Bill[]
      try {
        bills = JSON.parse(localStorage.getItem(MONEY_KEY) ?? '{}')?.bills ?? []
      } catch {
        return
      }
      let seen: string[] = []
      try {
        seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')
      } catch {
        /* start fresh */
      }
      const today = new Date(new Date().toDateString()).getTime()
      for (const b of bills) {
        const when = b.due ?? b.renews
        if (b.paid || !when) continue
        const days = Math.round((new Date(`${when}T00:00:00`).getTime() - today) / 864e5)
        const key = `${b.id}:${when}`
        if (days < 0 || days > 3 || seen.includes(key)) continue
        try {
          localStorage.setItem(SEEN_KEY, JSON.stringify([key, ...seen].slice(0, 100)))
        } catch {
          /* may repeat */
        }
        setDue({ biller: b.biller, days })
        return
      }
    }
    check()
    const t = setInterval(check, 30 * 60000)
    return () => clearInterval(t)
  }, [])
  if (!due) return null
  return (
    <div className="bedtime-nudge" role="status">
      <span aria-hidden="true">🧾</span>
      <span>
        {due.biller} is due {due.days === 0 ? 'today' : due.days === 1 ? 'tomorrow' : `in ${due.days} days`}.
      </span>
      <a href="#money/bills" onClick={() => setDue(null)}>
        Open bills
      </a>
      <button type="button" aria-label="Dismiss" onClick={() => setDue(null)}>
        ✕
      </button>
    </div>
  )
}
