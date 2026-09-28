import { prefersReducedMotion } from '../../utils/motion'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowDownRight, ArrowUpRight, BarChart3, PiggyBank, Plus, Receipt, Sparkles, Trash2, Upload, Wallet } from 'lucide-react'
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
  type MoneyStore,
  type Txn,
} from './moneyModel'
import './money.css'

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
  const [amount, setAmount] = useState('')
  const [place, setPlace] = useState('')
  const [category, setCategory] = useState('groceries')
  const [income, setIncome] = useState(false)
  const addBtn = useRef<HTMLButtonElement>(null)
  const today = dayKey()
  const month = today.slice(0, 7)
  const code = store.currency
  const t = totals(store.txns, today)
  const fmt = (minor: number, compact = false) => formatMoney(minor, code, { compact })

  const add = () => {
    const n = Number(amount)
    if (!n || n <= 0) return
    const txn: Txn = { id: crypto.randomUUID(), date: today, amount: toMinor(n), category: income ? 'other' : category, place: place.trim(), income }
    save((s) => ({ ...s, txns: [txn, ...s.txns] }))
    setAmount('')
    setPlace('')
    burst(addBtn.current, 'coins')
    logActivity('money', { amount: n })
  }
  usePageActions([
    { id: 'mn-add', label: 'Log a purchase', icon: '💸', run: () => setTab('spend') },
    { id: 'mn-charts', label: 'See spending charts', icon: '📊', run: () => setTab('charts') },
  ])

  const spendTab = () => (
    <div className="mn-grid">
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
        <h3>Where it goes · {new Date(`${today}T12:00:00`).toLocaleDateString([], { month: 'long' })}</h3>
        {byCategory(store.txns, month).length ? (
          <div className="mn-bars">
            {byCategory(store.txns, month).map((c) => {
              const cat = categoryOf(c.category)
              return (
                <div key={c.category} className="mn-bar" data-hint={`${cat.name}: ${fmt(c.amount)}`}>
                  <span>{cat.emoji} {cat.name}</span>
                  <i style={{ width: `${Math.max(4, (c.amount / Math.max(1, t.month)) * 100)}%`, background: cat.color }} />
                  <strong>{fmt(c.amount, true)}</strong>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="studio-empty">Nothing yet this month.</p>
        )}
      </section>
      <section className="studio-card mn-list">
        <h3>Recent</h3>
        <ShowMore as="ul" className="mn-txns" initial={6} label="more">
          {store.txns.map((x) => (
            <li key={x.id}>
              <span className="mn-emoji">{x.income ? '💰' : categoryOf(x.category).emoji}</span>
              <span className="mn-txn-main">
                <strong>{x.place || categoryOf(x.category).name}</strong>
                <small>{x.date}</small>
              </span>
              <strong className={x.income ? 'mn-in' : ''}>{x.income ? '+' : '−'}{fmt(x.amount)}</strong>
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
        on('currency') ? (
          <label className="mn-currency" data-hint="Currency">
            <Wallet size={15} aria-hidden="true" />
            <select aria-label="Currency" value={code} onChange={(e) => save((s) => ({ ...s, currency: e.target.value }))}>
              {currencies.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        ) : undefined
      }
      tabs={[
        { id: 'spend', label: 'Spend', icon: <Receipt size={15} />, render: spendTab },
        ...(on('budgets') ? [{ id: 'budgets', label: 'Budgets', icon: <PiggyBank size={15} />, render: budgetsTab }] : []),
        ...(on('charts') ? [{ id: 'charts', label: 'Charts', icon: <BarChart3 size={15} />, render: () => <Suspense fallback={<p role="status">Loading charts…</p>}><MoneyCharts store={store} /></Suspense> }] : []),
        ...(on('premium') ? [{ id: 'plan', label: 'Plan', icon: <Sparkles size={15} />, render: premiumTab }] : []),
      ]}
    />
  )
}
