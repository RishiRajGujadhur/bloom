import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { hierarchy, pack } from 'd3-hierarchy'
import { ResponsiveCalendar } from '@nivo/calendar'
import { CandlestickSeries, ColorType, HistogramSeries, createChart } from 'lightweight-charts'
import { subOn } from '../subFeatures'
import { isMatrix, matrixPalette } from '../../components/ui/chartTheme'
import { useThemeId } from '../../components/ui/MatrixRain'
import { balanceCandles, byCategory, categories, categoryOf, formatMoney, perDay, spend, toMajor, type MoneyStore } from './moneyModel'

const on = (id: string) => subOn('moneyTracker', id)
const bloomRamp = ['#3b2f9e', '#4b3fd0', '#5b8def', '#35d0a0', '#9ef04a', '#f5c542', '#f58a42']
const matrixRamp = ['#0b2a14', '#0f5a26', '#1f8f3f', '#2fd35a', '#39ff6a', '#9ef04a', '#f5c542']
const rampNow = () => (isMatrix() ? matrixRamp : bloomRamp)
/** Category colour, or the Matrix palette in that theme. */
const catColor = (id: string) => (isMatrix() ? matrixPalette[Math.max(0, categories.findIndex((c) => c.id === id)) % matrixPalette.length] : categoryOf(id).color)

/** The last 64 days as number tiles, coloured by spend (like a sales report grid). */
function DayTiles({ store }: { store: MoneyStore }) {
  const root = useRef<HTMLDivElement>(null)
  const days = perDay(store.txns)
  const list = Array.from({ length: 64 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (63 - i))
    const key = d.toISOString().slice(0, 10)
    return { key, v: days.get(key) ?? 0 }
  })
  const max = Math.max(1, ...list.map((x) => x.v))
  useLayoutEffect(() => {
    if (!root.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const tw = gsap.from(root.current.children, { scale: 0.4, opacity: 0, stagger: { each: 0.01, grid: [8, 8], from: 'start' }, duration: 0.35, ease: 'back.out(2)' })
    return () => void tw.progress(1)
  }, [])
  return (
    <div ref={root} className="mn-tiles" role="img" aria-label="Spending per day, last 64 days">
      {list.map((x) => (
        <span key={x.key} style={{ background: x.v ? rampNow()[Math.min(6, Math.floor((x.v / max) * 6))] : '#2a2a35' }} data-hint={`${x.key}: ${formatMoney(x.v, store.currency)}`}>
          {x.v ? Math.round(toMajor(x.v)) : ''}
        </span>
      ))}
    </div>
  )
}

/** Categories → places as packed circles (d3-hierarchy). */
function CirclePack({ store }: { store: MoneyStore }) {
  const svg = useRef<SVGSVGElement>(null)
  const nodes = useMemo(() => {
    const byCat = new Map<string, Map<string, number>>()
    for (const t of spend(store.txns)) {
      const m = byCat.get(t.category) ?? new Map()
      m.set(t.place || 'Other', (m.get(t.place || 'Other') ?? 0) + t.amount)
      byCat.set(t.category, m)
    }
    const data = { name: 'all', children: [...byCat.entries()].map(([c, m]) => ({ name: c, children: [...m.entries()].map(([p, v]) => ({ name: p, value: v })) })) }
    const root = hierarchy<{ name: string; value?: number; children?: unknown[] }>(data as never).sum((d) => d.value ?? 0)
    return pack<typeof data>().size([320, 320]).padding(4)(root as never).descendants().slice(1)
  }, [store.txns])
  useLayoutEffect(() => {
    if (!svg.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const tw = gsap.from(svg.current.querySelectorAll('circle'), { attr: { r: 0 }, stagger: 0.02, duration: 0.6, ease: 'elastic.out(1, 0.6)' })
    return () => void tw.progress(1)
  }, [nodes.length])
  if (!nodes.length) return <p className="studio-empty">Add spending to see your circles.</p>
  return (
    <svg ref={svg} className="mn-pack" viewBox="0 0 320 320" role="img" aria-label="Spending by category and place">
      {nodes.map((n, i) => {
        const catId = n.depth === 1 ? n.data.name : n.parent!.data.name
        const cat = { ...categoryOf(catId), color: catColor(catId) }
        return (
          <g key={i} data-hint={`${n.depth === 1 ? cat.name : n.data.name}: ${formatMoney(n.value ?? 0, store.currency)}`}>
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.depth === 1 ? `${cat.color}33` : cat.color} stroke={cat.color} strokeWidth={n.depth === 1 ? 1.5 : 0} />
            {n.depth === 2 && n.r > 16 && (
              <g>
                <rect x={n.x - 18} y={n.y - 8} width="36" height="16" rx="8" fill="#0d0d12" />
                <text x={n.x} y={n.y + 4} textAnchor="middle" className="mn-pack-label">{Math.round(toMajor(n.value ?? 0))}</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** Spending shape: this month vs last month per category, glowing radar (SVG + GSAP). */
function SpendRadar({ store }: { store: MoneyStore }) {
  const root = useRef<SVGSVGElement>(null)
  const now = new Date()
  const m = now.toISOString().slice(0, 7)
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().slice(0, 7)
  const cats = categories.filter((c) => c.id !== 'other').slice(0, 8)
  const a = new Map(byCategory(store.txns, m).map((c) => [c.category, c.amount]))
  const b = new Map(byCategory(store.txns, prev).map((c) => [c.category, c.amount]))
  const max = Math.max(1, ...cats.map((c) => Math.max(a.get(c.id) ?? 0, b.get(c.id) ?? 0)))
  const pt = (i: number, v: number) => {
    const ang = (i / cats.length) * Math.PI * 2 - Math.PI / 2
    const r = 18 + (v / max) * 92
    return [130 + Math.cos(ang) * r, 130 + Math.sin(ang) * r]
  }
  const path = (vals: Map<string, number>) => cats.map((c, i) => pt(i, vals.get(c.id) ?? 0).join(',')).join(' ')
  const green = isMatrix() ? '#39ff6a' : '#35d0a0'
  const amber = '#f5c542'
  useLayoutEffect(() => {
    if (!root.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const tw = gsap.from(root.current.querySelectorAll('.mr-shape'), { scale: 0, transformOrigin: '130px 130px', duration: 1.1, stagger: 0.2, ease: 'elastic.out(1, 0.55)' })
    return () => void tw.progress(1)
  }, [store.txns.length])
  return (
    <svg ref={root} className="mn-radar" viewBox="0 0 260 260" role="img" aria-label="Spending shape, this month against last month">
      <defs>
        <filter id="mr-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={cats.map((_, i) => pt(i, max * f).join(',')).join(' ')} fill="none" stroke="#ffffff1a" />
      ))}
      {cats.map((c, i) => {
        const [x, y] = pt(i, max * 1.12)
        return (
          <text key={c.id} x={x} y={y} textAnchor="middle" className="mn-radar-label" data-hint={`${c.name}: ${formatMoney(a.get(c.id) ?? 0, store.currency)} (last month ${formatMoney(b.get(c.id) ?? 0, store.currency)})`}>
            {c.emoji}
          </text>
        )
      })}
      <polygon className="mr-shape" points={path(b)} fill={`${amber}22`} stroke={amber} strokeWidth="2.5" strokeLinejoin="round" filter="url(#mr-glow)" />
      <polygon className="mr-shape" points={path(a)} fill={`${green}2a`} stroke={green} strokeWidth="3" strokeLinejoin="round" filter="url(#mr-glow)" />
      <circle cx="130" cy="130" r="10" fill="none" stroke="#ffffff55" />
    </svg>
  )
}

/** Running balance as daily candles with a spending histogram (TradingView lightweight-charts). */
function BalanceCandles({ store }: { store: MoneyStore }) {
  const theme = useThemeId()
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = host.current
    if (!el) return
    const dark = document.documentElement.dataset.mode === 'dark'
    const chart = createChart(el, {
      height: 240,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: dark ? '#cfe' : '#444', fontFamily: 'inherit' },
      grid: { vertLines: { color: dark ? '#ffffff10' : '#0000000d' }, horzLines: { color: dark ? '#ffffff10' : '#0000000d' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    })
    const up = isMatrix() ? '#39ff6a' : '#35e07a'
    const down = isMatrix() ? '#f5c542' : '#ff4d6d'
    const candles = chart.addSeries(CandlestickSeries, { upColor: up, downColor: down, borderVisible: false, wickUpColor: up, wickDownColor: down })
    candles.setData(balanceCandles(store.txns))
    const vol = chart.addSeries(HistogramSeries, { color: '#8888aa55', priceScaleId: '' })
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } })
    const days = perDay(store.txns)
    vol.setData([...days.entries()].sort().map(([time, v]) => ({ time, value: toMajor(v) })))
    chart.timeScale().fitContent()
    const ro = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth }))
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.remove()
    }
  }, [store.txns, theme])
  return <div ref={host} className="mn-candles" aria-label="Balance candles" />
}

export function MoneyCharts({ store }: { store: MoneyStore }) {
  useThemeId() // re-render the charts when the theme changes
  const year = new Date().getFullYear()
  const days = perDay(store.txns)
  const calendar = [...days.entries()].map(([day, v]) => ({ day, value: Math.round(toMajor(v)) }))
  return (
    <div className="mn-grid" data-matrix-native>
      {on('tiles') && (
        <section className="studio-card mn-dark">
          <h3>Last 64 days</h3>
          <DayTiles store={store} />
        </section>
      )}
      {on('radar') && (
        <section className="studio-card mn-dark">
          <h3>Spending shape <small className="mn-legend"><i style={{ background: isMatrix() ? '#39ff6a' : '#35d0a0' }} /> this month <i style={{ background: '#f5c542' }} /> last month</small></h3>
          <SpendRadar store={store} />
        </section>
      )}
      {on('circles') && (
        <section className="studio-card mn-dark">
          <h3>Categories & places</h3>
          <CirclePack store={store} />
        </section>
      )}
      {on('candles') && (
        <section className="studio-card mn-dark mn-wide">
          <h3>Balance · daily candles</h3>
          {store.txns.length ? <BalanceCandles store={store} /> : <p className="studio-empty">Add money in and out to draw the chart.</p>}
        </section>
      )}
      {on('calendar') && (
        <section className="studio-card mn-wide">
          <h3>{year} at a glance</h3>
          <div className="mn-calendar">
            <ResponsiveCalendar
              data={calendar}
              from={`${year}-01-01`}
              to={`${year}-12-31`}
              emptyColor="#eeeeee22"
              colors={isMatrix() ? ['#0f5a26', '#1f8f3f', '#39ff6a', '#9ef04a', '#f5c542'] : ['#3b2f9e', '#5b8def', '#35d0a0', '#9ef04a', '#f5c542']}
              margin={{ top: 20, right: 10, bottom: 10, left: 24 }}
              monthBorderColor="transparent"
              dayBorderWidth={2}
              dayBorderColor="transparent"
              theme={{ text: { fill: 'currentColor', fontSize: 11 } }}
            />
          </div>
        </section>
      )}
    </div>
  )
}
