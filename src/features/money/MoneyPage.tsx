import { prefersReducedMotion } from '../../utils/motion'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowDownRight, ArrowUpRight, BarChart3, PiggyBank, Plus, Receipt, ScanLine, Sparkles, Mail, Trash2, Upload, Wallet } from 'lucide-react'
import { Rail, Slider, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { ShowMore } from '../../components/ui/Flow'
import { usePageActions } from '../../components/ui/PageMenu'
import { burst } from '../../components/ui/celebrate'
import { dayKey } from '../../dates'
import { subOn } from '../subFeatures'
import {
  MONEY_KEY,
  budgetUse,
  byCategory,
  categories,
  categoryOf,
  currencies,
  detectSubscriptions,
  forecast,
  insights,
  monthsToDebtFree,
  noSpendDays,
  upcomingBills,
  emptyMoney,
  formatMoney,
  guessCategory,
  netWorth,
  parseCsv,
  toMinor,
  topPlaces,
  totals,
  catchUpRecurring,
  type MoneyStore,
  type Txn,
} from './moneyModel'
import './money.css'
import { download } from '../lab/exportSuite'

import './receipts.css'
import { capturePlace } from '../places/placesStore'
import { loadSettings } from '../../SettingsPage'

/** Pins a spend to where you are (only when Places is on) for the Life Map's money layer. */
const pinSpend = (t: Txn) => { if (!t.income && loadSettings().features.placesMap && subOn('placesMap', 'spendCapture')) capturePlace('spend', null, { ref: t.id, label: t.place, amount: t.amount, category: t.category }) }

const BillsInbox = lazy(() => import('./BillsInbox').then((m) => ({ default: m.BillsInbox })))
const ReceiptLens = lazy(() => import('./ReceiptLens').then((m) => ({ default: m.ReceiptLens })))
const MoneyCharts = lazy(() => import('./MoneyCharts').then((m) => ({ default: m.MoneyCharts })))
const on = (id: string) => subOn('moneyTracker', id)

/** A big number that counts up with GSAP. */
function Count({ minor, code }: { minor: number; code: string }) {
  const el = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const node = el.current
    if (!node) return
    const o = { v: 0 }
    const tw = gsap.to(o, { v: minor, duration: prefersReducedMotion() ? 0 : 1, ease: 'power2.out', onUpdate: () => void (node.textContent = formatMoney(Math.round(o.v), code)) })
    // Always land on the real value, even if animation frames are paused.
    const done = window.setTimeout(() => void (node.textContent = formatMoney(minor, code)), 1200)
    return () => {
      tw.progress(1)
      window.clearTimeout(done)
    }
  }, [minor, code])
  return <span ref={el} className="mn-big">{formatMoney(minor, code)}</span>
}

function Change({ pct }: { pct: number | null }) {
  if (pct === null) return <small className="mn-change">no earlier data</small>
  const up = pct > 0
  return (
    <small className={`mn-change ${up ? 'up' : 'down'}`} data-hint={up ? 'More than last period' : 'Less than last period'}>
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {Math.abs(pct).toFixed(1)}%
    </small>
  )
}

/** Budget ring (SVG) that fills with GSAP; turns red past 100%. */
function Ring({ share }: { share: number }) {
  const arc = useRef<SVGCircleElement>(null)
  const C = 2 * Math.PI * 22
  useLayoutEffect(() => {
    const tw = gsap.fromTo(arc.current, { strokeDashoffset: C }, { strokeDashoffset: C * (1 - Math.min(1, share)), duration: 0.9, ease: 'power2.out' })
    return () => void tw.progress(1)
  }, [share, C])
  return (
    <svg className="mn-ring" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r="22" className="track" />
      <circle ref={arc} cx="28" cy="28" r="22" className={share > 1 ? 'arc over' : 'arc'} strokeDasharray={C} />
      <text x="28" y="32" textAnchor="middle">{Math.round(share * 100)}%</text>
    </svg>
  )
}

export function MoneyPage() {
  const [store, setStoreState] = useState<MoneyStore>(() => ({ ...emptyMoney, ...readStore(MONEY_KEY, emptyMoney) }))
  const [sentenceMsg, setSentenceMsg] = useState('')
  // Expenses added from Bloom's chat show up straight away.
  useEffect(() => {
    const reload = () => setStoreState({ ...emptyMoney, ...readStore(MONEY_KEY, emptyMoney) })
    window.addEventListener('bloom:money', reload)
    return () => window.removeEventListener('bloom:money', reload)
  }, [])
  const save = (fn: (s: MoneyStore) => MoneyStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(MONEY_KEY, n)
      return n
    })
  const [tab, setTab] = useState('spend')
  const [txnQuery, setTxnQuery] = useState('')
  const [budgetNote, setBudgetNote] = useState('')
  // Hide amounts (e.g. on a shared screen); remembered.
  const [blurAmounts, setBlurAmounts] = useState(() => localStorage.getItem('bloom-money-blur') === '1')
  useEffect(() => {
    document.documentElement.toggleAttribute('data-money-blur', blurAmounts)
    try {
      localStorage.setItem('bloom-money-blur', blurAmounts ? '1' : '0')
    } catch {
      /* this visit only */
    }
    return () => document.documentElement.removeAttribute('data-money-blur')
  }, [blurAmounts])
  const [amount, setAmount] = useState('')
  const [place, setPlace] = useState('')
  // The last category you used is picked again next time.
  const [category, setCategoryState] = useState(() => localStorage.getItem('bloom-money-last-cat') || 'groceries')
  const setCategory = (c: string) => {
    setCategoryState(c)
    try {
      localStorage.setItem('bloom-money-last-cat', c)
    } catch {
      /* this visit only */
    }
  }
  const [income, setIncome] = useState(false)
  const [monthly, setMonthly] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => dayKey().slice(0, 7))
  const shiftMonth = (m: string, by: number) => {
    const d = new Date(`${m}-15T12:00:00`)
    d.setMonth(d.getMonth() + by)
    return d.toISOString().slice(0, 7)
  }
  // Monthly repeats that came due since your last visit are added now.
  useEffect(() => {
    if (!store.txns.some((t) => t.repeat === 'monthly')) return
    save((s) => {
      const added = catchUpRecurring(s.txns, dayKey())
      return added.length ? { ...s, txns: [...added, ...s.txns].sort((a, b) => b.date.localeCompare(a.date)) } : s
    })
    // Once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const addBtn = useRef<HTMLButtonElement>(null)
  const today = dayKey()
  const month = today.slice(0, 7)
  const code = store.currency
  const t = totals(store.txns, today)
  const fmt = (minor: number, compact = false) => formatMoney(minor, code, { compact })

  const add = () => {
    const n = Number(amount)
    if (!n || n <= 0) return
    const id = crypto.randomUUID()
    const txn: Txn = { id, date: today, amount: toMinor(n), category: income ? 'other' : category, place: place.trim(), income, ...(monthly ? { repeat: 'monthly' as const, series: id } : {}) }
    save((s) => ({ ...s, txns: [txn, ...s.txns] }))
    pinSpend(txn)
    // Budget alert: say so when this purchase takes a budget past 80% or over.
    const b = store.budgets.find((x) => x.category === txn.category)
    if (b && !txn.income && b.limit) {
      const before = budgetUse(store, month).find((x) => x.category === txn.category)?.spent ?? 0
      const after = before + txn.amount
      if (after > b.limit && before <= b.limit) setBudgetNote(`You're now ${fmt(after - b.limit)} over your ${categoryOf(b.category).name} budget.`)
      else if (after >= b.limit * 0.8 && before < b.limit * 0.8) setBudgetNote(`Heads up: ${Math.round((after / b.limit) * 100)}% of your ${categoryOf(b.category).name} budget used.`)
    }
    setAmount('')
    setPlace('')
    burst(addBtn.current, 'coins')
    logActivity('money', { amount: n })
  }
  usePageActions([
    { id: 'mn-add', label: 'Log a purchase', icon: '💸', run: () => setTab('spend') },
    { id: 'mn-charts', label: 'See spending charts', icon: '📊', run: () => setTab('charts') },
    { id: 'mn-receipts', label: 'Scan receipts', icon: '🧾', run: () => setTab('receipts') },
  ])

  const spendTab = () => (
    <div className="mn-grid">
      {budgetNote && (
        <p className="mn-budget-note" role="status">
          ⚠️ {budgetNote} <button type="button" aria-label="Dismiss" onClick={() => setBudgetNote('')}>✕</button>
        </p>
      )}
      <section className="studio-card mn-report">
        <div className="mn-stats">
          <div>
            <span className="mn-label">✦ This month</span>
            <Count minor={t.month} code={code} />
            <Change pct={t.monthChange} />
          </div>
          <div>
            <span className="mn-label">◎ This year</span>
            <Count minor={t.year} code={code} />
            <Change pct={t.yearChange} />
          </div>
        </div>
        {on('places') && topPlaces(store.txns).length > 0 && (
          <ul className="mn-places">
            {topPlaces(store.txns).map(([p, v]) => (
              <li key={p}>
                <span>{p}</span>
                <strong>{fmt(v)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="studio-card mn-add">
        <h3>Add</h3>
        <form className="mn-sentence" onSubmit={async (e) => {
          e.preventDefault()
          const input = e.currentTarget.elements.namedItem('sentence') as HTMLInputElement
          const { runCommand } = await import('../../companion/chatCommands')
          const res = runCommand(input.value.startsWith('spent') ? input.value : `spent ${input.value}`, { navigate: () => {}, clear: () => {} })
          setSentenceMsg(res?.reply ?? 'Try “12.50 on lunch”.')
          if (res?.mood === 'cheer') { burst(input, 'coins'); input.value = '' }
        }}>
          <input name="sentence" className="studio-input" placeholder="Quick: “12.50 on lunch at Nando’s”" aria-label="Describe a purchase" />
          {sentenceMsg && <small className="quick-note">{sentenceMsg}</small>}
        </form>
        <div className="studio-chip-row" role="group" aria-label="Type">
          <button type="button" className="studio-chip" aria-pressed={!income} onClick={() => setIncome(false)}>Spent</button>
          <button type="button" className="studio-chip" aria-pressed={income} onClick={() => setIncome(true)}>Received</button>
          <button type="button" className="studio-chip" aria-pressed={monthly} title="Add it again automatically on this day each month" onClick={() => setMonthly((v) => !v)}>🔁 Monthly</button>
        </div>
        <input className="studio-input" inputMode="decimal" placeholder={`Amount (${code})`} aria-label="Amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <input className="studio-input" placeholder="Where? (e.g. Tesco, Netflix)" aria-label="Place" value={place} onChange={(e) => { setPlace(e.target.value); if (on('autoCategory')) setCategory(guessCategory(e.target.value) === 'other' ? category : guessCategory(e.target.value)) }} onKeyDown={(e) => e.key === 'Enter' && add()} />
        {!income && (
          <div className="mn-cats" role="radiogroup" aria-label="Category">
            {categories.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={category === c.id} className="mn-cat" style={{ ['--c' as string]: c.color }} onClick={() => setCategory(c.id)} data-hint={c.name}>
                {c.emoji}
              </button>
            ))}
          </div>
        )}
        <button ref={addBtn} type="button" className="studio-btn primary" onClick={add} disabled={!Number(amount)}>
          <Plus size={16} /> Add {amount ? formatMoney(toMinor(Number(amount) || 0), code) : ''}
        </button>
      </section>
      <section className="studio-card mn-split">
        <h3 className="mn-month-head">
          <button type="button" aria-label="Previous month" onClick={() => setViewMonth((m) => shiftMonth(m, -1))}>‹</button>
          Where it goes · {new Date(`${viewMonth}-15T12:00:00`).toLocaleDateString([], { month: 'long', ...(viewMonth.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}) })}
          <button type="button" aria-label="Next month" disabled={viewMonth >= month} onClick={() => setViewMonth((m) => shiftMonth(m, 1))}>›</button>
        </h3>
        {(() => {
          const big = store.txns.filter((x) => !x.income && x.date.startsWith(month)).sort((a, b) => b.amount - a.amount)[0]
          // Pace: this month so far vs the same days of last month.
          const dayN = today.slice(8)
          const prevD = new Date(`${today}T12:00:00`)
          prevD.setMonth(prevD.getMonth() - 1)
          const prevMonth = prevD.toISOString().slice(0, 7)
          const spent = (m: string) => store.txns.filter((x) => !x.income && x.date.startsWith(m) && x.date.slice(8) <= dayN).reduce((a, x) => a + x.amount, 0)
          const now = spent(month)
          const before = spent(prevMonth)
          const pace = before > 0 ? Math.round(((now - before) / before) * 100) : null
          return big ? (
            <>
            {pace !== null && (
              <p className="studio-empty">
                By day {Number(dayN)} you’ve spent {fmt(now)} — {Math.abs(pace) < 3 ? 'about the same as' : `${Math.abs(pace)}% ${pace > 0 ? 'more' : 'less'} than`} last month.
              </p>
            )}
            <p className="studio-empty">
              Biggest spend: <strong>{fmt(big.amount)}</strong> {big.place ? `at ${big.place}` : `on ${categoryOf(big.category).name}`} ({big.date.slice(8)}/{big.date.slice(5, 7)})
            </p>
            </>
          ) : null
        })()}
        {byCategory(store.txns, viewMonth).length ? (
          <div className="mn-bars">
            {byCategory(store.txns, viewMonth).map((c) => {
              const cat = categoryOf(c.category)
              return (
                <div key={c.category} className="mn-bar" data-hint={`${cat.name}: ${fmt(c.amount)}`}>
                  <span>{cat.emoji} {cat.name}</span>
                  <i style={{ width: `${Math.max(4, (c.amount / Math.max(1, byCategory(store.txns, viewMonth).reduce((a, x) => a + x.amount, 0))) * 100)}%`, background: cat.color }} />
                  <strong>{fmt(c.amount, true)}</strong>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="studio-empty">{viewMonth === month ? 'Nothing yet this month.' : 'Nothing logged that month.'}</p>
        )}
      </section>
      <section className="studio-card mn-list">
        <h3>
          Recent
          <button
            type="button"
            className="mn-csv"
            title="Download this month's transactions as CSV"
            onClick={() => {
              const rows = store.txns.filter((x) => x.date.startsWith(month))
              const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
              const csv = ['date,place,category,amount,type,note', ...rows.map((x) => [x.date, esc(x.place), esc(categoryOf(x.category).name), (x.amount / 100).toFixed(2), x.income ? 'income' : 'expense', esc(x.note ?? '')].join(','))].join('\n')
              download(new Blob([csv + '\n'], { type: 'text/csv' }), `bloom-money-${month}.csv`)
            }}
          >
            ⬇ CSV
          </button>
        </h3>
        {store.txns.length > 5 && (
          <input type="search" className="studio-input mn-search" aria-label="Search transactions" placeholder="Search place, category or amount…" value={txnQuery} onChange={(e) => setTxnQuery(e.target.value)} />
        )}
        <ShowMore as="ul" className="mn-txns" initial={6} label="more">
          {store.txns.filter((x) => { const q = txnQuery.trim().toLowerCase(); return !q || `${x.place} ${categoryOf(x.category).name} ${(x.amount / 100).toFixed(2)} ${x.date}`.toLowerCase().includes(q) }).map((x) => (
            <li key={x.id}>
              {x.income ? (
                <span className="mn-emoji">💰</span>
              ) : (
                <label className="mn-emoji mn-cat-pick" title="Change category">
                  {categoryOf(x.category).emoji}
                  <select aria-label="Category" value={x.category} onChange={(e) => save((s) => ({ ...s, txns: s.txns.map((y) => (y.id === x.id ? { ...y, category: e.target.value } : y)) }))}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </select>
                </label>
              )}
              <span className="mn-txn-main">
                <strong>
                  {x.place || categoryOf(x.category).name}
                  {x.repeat === 'monthly' && (
                    <button
                      type="button"
                      className="mn-repeat"
                      title="Repeats monthly — click to stop repeating"
                      onClick={() => {
                        if (window.confirm('Stop adding this every month?')) save((s) => ({ ...s, txns: s.txns.map((y) => (y.series === x.series ? { ...y, repeat: undefined } : y)) }))
                      }}
                    >
                      🔁
                    </button>
                  )}
                </strong>
                <small>{x.date}</small>
              </span>
              <button
                type="button"
                className={`mn-amount-edit ${x.income ? 'mn-in' : ''}`}
                title="Change amount"
                onClick={() => {
                  const v = window.prompt(`Amount for ${x.place || categoryOf(x.category).name}`, (x.amount / 100).toFixed(2))
                  const n = v === null ? NaN : Number(v.replace(',', '.'))
                  if (Number.isFinite(n) && n > 0) save((s) => ({ ...s, txns: s.txns.map((y) => (y.id === x.id ? { ...y, amount: toMinor(n) } : y)) }))
                }}
              >
                {x.income ? '+' : '−'}{fmt(x.amount)}
              </button>
              {x.receipt && (
                <button
                  type="button"
                  className="mn-del"
                  aria-label="Show receipt"
                  title="Show the scanned receipt"
                  onClick={async () => {
                    const { opfsRead } = await import('../../platform/opfs')
                    const blob = await opfsRead(x.receipt!)
                    if (blob) window.open(URL.createObjectURL(blob), '_blank', 'noopener')
                  }}
                >
                  🧾
                </button>
              )}
              {!x.income && (
                <button
                  type="button"
                  className="mn-del"
                  aria-label="Split"
                  title="Split off part of this into another category"
                  onClick={() => {
                    const v = window.prompt(`Split how much off ${fmt(x.amount)}? (then pick its category)`, '')
                    const part = v === null ? NaN : toMinor(Number(v.replace(',', '.')))
                    if (!Number.isFinite(part) || part <= 0 || part >= x.amount) return
                    save((s) => ({ ...s, txns: s.txns.flatMap((y) => (y.id === x.id ? [{ ...y, amount: y.amount - part }, { ...y, id: crypto.randomUUID(), amount: part, repeat: undefined, series: undefined, note: 'Split' }] : [y])) }))
                  }}
                >
                  ✂
                </button>
              )}
              <button type="button" className="mn-del" aria-label="Delete" onClick={() => save((s) => ({ ...s, txns: s.txns.filter((y) => y.id !== x.id) }))}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ShowMore>
      </section>
    </div>
  )

  const budgetsTab = () => {
    const use = budgetUse(store, month)
    return (
      <div className="mn-grid">
        <section className="studio-card">
          <h3>Monthly budgets</h3>
          <Rail label="Budgets">
            {use.map((b) => (
              <div key={b.category} className="mn-budget" role="listitem" data-hint={`${fmt(b.spent)} of ${fmt(b.limit)}`}>
                <Ring share={b.share} />
                <strong>{categoryOf(b.category).emoji} {categoryOf(b.category).name}</strong>
                <small>{b.share > 1 ? `${fmt(b.spent - b.limit)} over` : `${fmt(b.limit - b.spent)} left`}</small>
              </div>
            ))}
          </Rail>
          {!use.length && <p className="studio-empty">Set a limit for a category below.</p>}
        </section>
        <section className="studio-card">
          <h3>Set a budget</h3>
          <div className="mn-cats" role="radiogroup" aria-label="Budget category">
            {categories.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={category === c.id} className="mn-cat" style={{ ['--c' as string]: c.color }} onClick={() => setCategory(c.id)} data-hint={c.name}>
                {c.emoji}
              </button>
            ))}
          </div>
          <Slider
            label={`${categoryOf(category).name} limit`}
            value={Math.round((store.budgets.find((b) => b.category === category)?.limit ?? 0) / 100)}
            min={0}
            max={2000}
            step={10}
            format={(v) => formatMoney(v * 100, code)}
            onChange={(v) => save((s) => ({ ...s, budgets: [...s.budgets.filter((b) => b.category !== category), ...(v ? [{ category, limit: v * 100 }] : [])] }))}
          />
          {on('flexBuckets') && (
            <div className="mn-buckets">
              {(['fixed', 'flexible', 'non-monthly'] as const).map((bk) => {
                const total = byCategory(store.txns, month).filter((c) => categoryOf(c.category).bucket === bk).reduce((a, c) => a + c.amount, 0)
                return (
                  <div key={bk} data-hint={bk === 'fixed' ? 'Rent, bills, subscriptions' : bk === 'flexible' ? 'Day-to-day spending' : 'Gifts, holidays, yearly costs'}>
                    <small>{bk}</small>
                    <strong>{fmt(total, true)}</strong>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    )
  }

  const [debtPay, setDebtPay] = useState(200)
  const premiumTab = () => {
    const fc = forecast(store.txns, today)
    const ns = noSpendDays(store.txns, today)
    const bills = upcomingBills(store.txns, today)
    const tips = insights(store.txns, today, code)
    const debtMonths = monthsToDebtFree(store.holdings, toMinor(debtPay))
    const hasDebt = store.holdings.some((h) => h.kind === 'debt')
    const subs = detectSubscriptions(store.txns).filter((s) => !store.subscriptionsOff.includes(s.place))
    const worth = netWorth(store.holdings)
    return (
      <div className="mn-grid mn-premium">
        {on('insights') && tips.length > 0 && (
          <section className="studio-card">
            <h3>💡 Insights</h3>
            <ul className="mn-tips">{tips.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
        )}
        {on('forecast') && (
          <section className="studio-card mn-forecast">
            <h3>📈 Month-end forecast</h3>
            <Count minor={fc.projected} code={code} />
            <small>{fmt(fc.soFar)} so far · about {fmt(fc.perDay)} a day · {fc.daysLeft} days to go</small>
            {on('noSpend') && <p className="quick-note">🌿 {ns.count} no-spend day{ns.count === 1 ? '' : 's'} this month{ns.streak > 1 ? ` · ${ns.streak}-day streak` : ''}</p>}
          </section>
        )}
        {on('bills') && (
          <section className="studio-card">
            <h3>🗓️ Upcoming bills</h3>
            {bills.length ? (
              <ul className="mn-txns">
                {bills.map((b) => (
                  <li key={b.place}>
                    <span className="mn-emoji">📅</span>
                    <span className="mn-txn-main"><strong>{b.place}</strong><small>due {new Date(`${b.due}T12:00:00`).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</small></span>
                    <strong>{fmt(b.amount)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="studio-empty">No bills due in the next 30 days.</p>
            )}
          </section>
        )}
        {on('debtPlanner') && hasDebt && (
          <section className="studio-card">
            <h3>🧗 Debt payoff planner</h3>
            <Slider label="Monthly payment" value={debtPay} min={10} max={3000} step={10} format={(v) => formatMoney(v * 100, code)} onChange={setDebtPay} />
            <p><strong>{Number.isFinite(debtMonths) ? `${debtMonths} month${debtMonths === 1 ? '' : 's'}` : '—'}</strong> to be debt-free.</p>
            <p className="quick-note">Pay the smallest balance first for quick wins (snowball) or the highest interest first to save the most (avalanche).</p>
          </section>
        )}
        {on('subscriptions') && (
          <section className="studio-card">
            <h3>🔁 Subscriptions found</h3>
            <p className="quick-note">Payments to the same place in several months at a similar price.</p>
            {subs.length ? (
              <ul className="mn-txns">
                {subs.map((sb) => (
                  <li key={sb.place}>
                    <span className="mn-emoji">🔁</span>
                    <span className="mn-txn-main">
                      <strong>{sb.place}</strong>
                      <small>{fmt(sb.amount)}/mo · {fmt(sb.yearly)}/yr · seen {sb.months} months</small>
                    </span>
                    <button type="button" className="quiet-button" onClick={() => save((s) => ({ ...s, subscriptionsOff: [...s.subscriptionsOff, sb.place] }))}>Not a sub</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="studio-empty">None detected yet.</p>
            )}
            {subs.length > 0 && <strong className="mn-total">≈ {fmt(subs.reduce((a, s) => a + s.yearly, 0))} a year</strong>}
          </section>
        )}
        {on('netWorth') && (
          <section className="studio-card">
            <h3>🏦 Net worth</h3>
            <Count minor={worth} code={code} />
            <ul className="mn-txns">
              {store.holdings.map((h) => (
                <li key={h.id}>
                  <span className="mn-emoji">{h.kind === 'asset' ? '🏦' : '💳'}</span>
                  <span className="mn-txn-main"><strong>{h.name}</strong><small>{h.kind}</small></span>
                  <strong className={h.kind === 'asset' ? 'mn-in' : ''}>{fmt(h.value)}</strong>
                  <button type="button" className="mn-del" aria-label="Remove" onClick={() => save((s) => ({ ...s, holdings: s.holdings.filter((x) => x.id !== h.id) }))}><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
            <form className="mn-inline" onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              const value = toMinor(Number(f.get('value')) || 0)
              if (!f.get('name') || !value) return
              save((s) => {
                const holdings = [...s.holdings, { id: crypto.randomUUID(), name: String(f.get('name')), kind: f.get('kind') as 'asset' | 'debt', value }]
                return { ...s, holdings, worthLog: [...s.worthLog.filter((w) => w.date !== today), { date: today, value: netWorth(holdings) }] }
              })
              e.currentTarget.reset()
            }}>
              <input name="name" className="studio-input" placeholder="Account or debt" aria-label="Name" />
              <input name="value" className="studio-input" inputMode="decimal" placeholder="Value" aria-label="Value" />
              <select name="kind" className="studio-input" aria-label="Kind"><option value="asset">Asset</option><option value="debt">Debt</option></select>
              <button type="submit" className="studio-btn">Add</button>
            </form>
          </section>
        )}
        {on('goals') && (
          <section className="studio-card">
            <h3>🎯 Savings goals</h3>
            {store.goals.map((g) => (
              <div key={g.id} className="mn-goal">
                <span>{g.emoji} {g.name}</span>
                <div className="mn-goal-bar"><i style={{ width: `${Math.min(100, (g.saved / g.target) * 100)}%` }} /></div>
                <small>{fmt(g.saved)} of {fmt(g.target)}</small>
                <button type="button" className="quiet-button" onClick={() => save((s) => ({ ...s, goals: s.goals.map((x) => (x.id === g.id ? { ...x, saved: x.saved + toMinor(10) } : x)) }))}>+{fmt(1000)}</button>
              </div>
            ))}
            <form className="mn-inline" onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              const target = toMinor(Number(f.get('target')) || 0)
              if (!f.get('name') || !target) return
              save((s) => ({ ...s, goals: [...s.goals, { id: crypto.randomUUID(), name: String(f.get('name')), target, saved: 0, emoji: '🎯' }] }))
              e.currentTarget.reset()
            }}>
              <input name="name" className="studio-input" placeholder="Goal (e.g. Holiday)" aria-label="Goal name" />
              <input name="target" className="studio-input" inputMode="decimal" placeholder="Target" aria-label="Target" />
              <button type="submit" className="studio-btn">Add goal</button>
            </form>
          </section>
        )}
        {on('csvImport') && (
          <section className="studio-card">
            <h3><Upload size={15} /> Import a bank CSV</h3>
            <p className="quick-note">Columns like Date, Description and Amount are recognised; categories are guessed. Nothing leaves your device.</p>
            <input type="file" accept=".csv,text/csv" aria-label="CSV file" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const rows = parseCsv(await file.text())
              save((s) => ({ ...s, txns: [...rows, ...s.txns] }))
              e.target.value = ''
            }} />
          </section>
        )}
      </div>
    )
  }

  return (
    <Studio
      name="money"
      accent="#6d5cf5"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#6d5cf5', '#9ef04a', '#35d0a0']} line="pulse" />}
      aside={
        <>
        <button type="button" className="mn-blur-btn" aria-pressed={blurAmounts} title="Hide amounts (hover to peek)" onClick={() => setBlurAmounts((v) => !v)}>
          {blurAmounts ? '🙈' : '👁️'}
        </button>
        {on('currency') ? (
          <label className="mn-currency" data-hint="Currency">
            <Wallet size={15} aria-hidden="true" />
            <select aria-label="Currency" value={code} onChange={(e) => save((s) => ({ ...s, currency: e.target.value }))}>
              {currencies.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        ) : null}
        </>
      }
      tabs={[
        { id: 'spend', label: 'Spend', icon: <Receipt size={15} />, render: spendTab },
        ...(on('receipts') ? [{ id: 'receipts', label: 'Receipts', icon: <ScanLine size={15} />, render: () => <Suspense fallback={<p role="status">Loading Receipt Lens…</p>}><ReceiptLens code={code} onAdd={(txns) => { save((s) => ({ ...s, txns: [...txns, ...s.txns] })); txns.forEach(pinSpend); txns.forEach((x) => logActivity('money', { amount: x.amount / 100 })) }} /></Suspense> }] : []),
        ...(on('billsInbox') ? [{ id: 'bills', label: 'Bills', icon: <Mail size={15} />, render: () => <Suspense fallback={<p role="status">Loading Bills Inbox…</p>}><BillsInbox code={code} bills={store.bills ?? []} onBills={(f) => save((s) => ({ ...s, bills: f(s.bills ?? []) }))} onPaid={(t) => { save((s) => ({ ...s, txns: [t, ...s.txns] })); pinSpend(t) }} /></Suspense> }] : []),
        ...(on('budgets') ? [{ id: 'budgets', label: 'Budgets', icon: <PiggyBank size={15} />, render: budgetsTab }] : []),
        ...(on('charts') ? [{ id: 'charts', label: 'Charts', icon: <BarChart3 size={15} />, render: () => <Suspense fallback={<p role="status">Loading charts…</p>}><MoneyCharts store={store} /></Suspense> }] : []),
        ...(on('premium') ? [{ id: 'plan', label: 'Plan', icon: <Sparkles size={15} />, render: premiumTab }] : []),
      ]}
    />
  )
}
