import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Droplet, Plus, Trash2, Utensils } from 'lucide-react'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { NextStep } from '../dailyFlow/DailyFlow'
import {
  DIET_EVENT,
  dayTotals,
  dietInsights,
  foodLibrary,
  kindFor,
  lastDays,
  readDiet,
  saveDiet,
  type DietState,
  type Food,
  type Meal,
  type MealKind,
  usualFoods,
  exerciseMinutesToday,
  exerciseWaterBonus,
} from './dietModel'
import { NutrientsPanel } from './NutrientsPanel'
import { RecipeBuilder } from './RecipeBuilder'
import { loadSettings } from '../../settings/appSettings'
import type { FeaturePageProps } from '../shared/pageProps'
import { DietQuick } from '../quick/DietQuick'
import './diet.css'

const reduced = () => prefersReducedMotion()

function useDiet() {
  const [state, setState] = useState<DietState>(readDiet)
  useEffect(() => {
    const sync = () => setState(readDiet())
    window.addEventListener(DIET_EVENT, sync)
    return () => window.removeEventListener(DIET_EVENT, sync)
  }, [])
  const update = (fn: (s: DietState) => DietState) => {
    const next = fn(readDiet())
    saveDiet(next)
    setState(next)
  }
  return [state, update] as const
}

/** Calorie ring: a plate seen from above that fills clockwise. */
function PlateRing({ value, target }: { value: number; target: number }) {
  const arc = useRef<SVGCircleElement>(null)
  const pct = Math.min(1.25, value / Math.max(1, target))
  const C = 2 * Math.PI * 70
  useLayoutEffect(() => {
    if (!arc.current) return
    const to = C * (1 - Math.min(1, pct))
    if (reduced()) gsap.set(arc.current, { strokeDashoffset: to })
    else gsap.to(arc.current, { strokeDashoffset: to, duration: 1.1, ease: 'power3.out' })
  }, [pct, C])
  const over = pct > 1
  return (
    <svg className="diet-plate" viewBox="0 0 180 180" role="img" aria-label={`${value} of ${target} kcal`}>
      <circle cx="90" cy="90" r="84" className="diet-plate-rim" />
      <circle cx="90" cy="90" r="58" className="diet-plate-inner" />
      <circle cx="90" cy="90" r="70" className="diet-plate-track" />
      <circle
        ref={arc}
        cx="90"
        cy="90"
        r="70"
        className="diet-plate-arc"
        data-over={over}
        strokeDasharray={C}
        strokeDashoffset={C}
        transform="rotate(-90 90 90)"
      />
      <text x="90" y="86" textAnchor="middle" className="diet-plate-value">
        {value}
      </text>
      <text x="90" y="106" textAnchor="middle" className="diet-plate-label">
        of {target} kcal
      </text>
    </svg>
  )
}

function Macro({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const bar = useRef<HTMLSpanElement>(null)
  const pct = Math.min(100, (value / Math.max(1, target)) * 100)
  useLayoutEffect(() => {
    if (bar.current) gsap.to(bar.current, { width: `${pct}%`, duration: reduced() ? 0 : 0.9, ease: 'power3.out' })
  }, [pct])
  return (
    <div className="diet-macro">
      <span>
        {label} <strong>{value}g</strong> <small>/ {target}g</small>
      </span>
      <div className="diet-macro-track">
        <span ref={bar} style={{ background: color }} />
      </div>
    </div>
  )
}

/** Tap a glass to fill it; the water wobbles in. */
function WaterGlasses({ count, target, onSet }: { count: number; target: number; onSet: (n: number) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const prev = useRef(count)
  useLayoutEffect(() => {
    if (count > prev.current && root.current && !reduced()) {
      const water = root.current.querySelectorAll('.diet-water')[count - 1]
      if (water) gsap.fromTo(water, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)' })
    }
    prev.current = count
  }, [count])
  return (
    <div className="diet-glasses bloom-wrap" ref={root} role="group" aria-label={`${count} of ${target} glasses of water`}>
      {Array.from({ length: Math.max(target, count) }, (_, i) => (
        <button key={i} type="button" aria-pressed={i < count} aria-label={`Glass ${i + 1}`} onClick={() => onSet(i < count ? i : i + 1)}>
          <svg viewBox="0 0 30 40" aria-hidden="true">
            <clipPath id={`glass-${i}`}>
              <path d="M4 4 L26 4 L23 37 L7 37 Z" />
            </clipPath>
            <g clipPath={`url(#glass-${i})`}>
              {i < count && <rect className="diet-water" x="0" y="12" width="30" height="30" />}
            </g>
            <path d="M4 4 L26 4 L23 37 L7 37 Z" className="diet-glass" />
          </svg>
        </button>
      ))}
    </div>
  )
}

function WeekChart({ state, today }: { state: DietState; today: string }) {
  const days = lastDays(today)
  const totals = days.map((d) => dayTotals(state.meals, d).kcal)
  const max = Math.max(state.targets.kcal * 1.2, ...totals)
  const root = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    if (!root.current || reduced()) return
    const bars = root.current.querySelectorAll('.diet-week-bar')
    const t = gsap.from(bars, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.7, stagger: 0.05, ease: 'back.out(1.6)' })
    return () => void t.progress(1).kill()
  }, [])
  const goalY = 150 - (state.targets.kcal / max) * 140
  return (
    <svg ref={root} className="diet-week" viewBox="0 0 350 170" role="img" aria-label="Calories over the last 7 days">
      <line x1="0" x2="350" y1={goalY} y2={goalY} className="diet-week-goal" />
      {totals.map((v, i) => {
        const h = (v / max) * 140
        return (
          <g key={days[i]}>
            <rect className="diet-week-bar" data-over={v > state.targets.kcal} x={i * 50 + 12} y={150 - h} width="26" height={Math.max(0, h)} rx="8" />
            <text x={i * 50 + 25} y="166" textAnchor="middle">
              {new Date(`${days[i]}T12:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const kinds: { id: MealKind; label: string; emoji: string }[] = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { id: 'lunch', label: 'Lunch', emoji: '☀️' },
  { id: 'dinner', label: 'Dinner', emoji: '🌙' },
  { id: 'snack', label: 'Snack', emoji: '🍪' },
]
const blank = { name: '', kcal: '', protein: '', carbs: '', fat: '' }

export function DietPage({ today, data, setData }: FeaturePageProps) {
  const [state, update] = useDiet()
  const flags = loadSettings().features
  const [tab, setTab] = useState<'today' | 'nutrients' | 'recipes'>('today')
  const [form, setForm] = useState(blank)
  const [kind, setKind] = useState<MealKind>(() => kindFor(new Date().getHours()))
  const [hunger, setHunger] = useState(3)
  const [fullness, setFullness] = useState(3)
  const [feeling, setFeeling] = useState<Meal['feeling']>()
  const [justAdded, setJustAdded] = useState(false)
  const addBtn = useRef<HTMLButtonElement>(null)
  const totals = dayTotals(state.meals, today)
  const water = state.water[today] ?? 0
  // Drink a little more on days you train.
  const exerciseMin = useMemo(() => exerciseMinutesToday(), [])
  const waterBonus = exerciseWaterBonus(exerciseMin)
  const waterTarget = state.targets.water + waterBonus
  const todayMeals = state.meals.filter((m) => m.date === today).sort((a, b) => a.at - b.at)
  // Tab title shows what's left today once you've logged something.
  const kcalLeft = state.targets.kcal - totals.kcal
  useEffect(() => {
    if (!totals.meals) return
    const before = document.title
    document.title = `${kcalLeft >= 0 ? `${kcalLeft} kcal left` : `${-kcalLeft} kcal over`} · Nourish`
    return () => {
      document.title = before
    }
  }, [kcalLeft, totals.meals])
  const yesterdayMeals = (() => {
    const d = new Date(`${today}T12:00:00`)
    d.setDate(d.getDate() - 1)
    const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return state.meals.filter((m) => m.date === y).sort((a, b) => a.at - b.at)
  })()
  const mindful = subOn('dietTracker', 'mindful')
  const usuals = useMemo(() => usualFoods(state.meals.filter((m) => !foodLibrary.some((f) => f.name === m.name))), [state.meals])

  const addMeal = (food: Omit<Food, 'emoji'>) => {
    const meal: Meal = {
      id: crypto.randomUUID(),
      at: Date.now(),
      date: today,
      kind,
      ...food,
      ...(mindful ? { hunger, fullness, feeling } : {}),
    }
    update((s) => ({ ...s, meals: [...s.meals, meal] }))
    burst(addBtn.current, 'stars')
    setJustAdded(true)
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const n = (v: string) => Math.max(0, Math.round(Number(v) || 0))
    addMeal({ name: form.name.trim(), kcal: n(form.kcal), protein: n(form.protein), carbs: n(form.carbs), fat: n(form.fat) })
    setForm(blank)
    setFeeling(undefined)
  }
  const setWater = (n: number) => update((s) => ({ ...s, water: { ...s.water, [today]: n } }))
  const insights = dietInsights(state, today)

  const tabs = [
    { id: 'today' as const, label: 'Today' },
    ...(flags.microNutrients ? [{ id: 'nutrients' as const, label: 'Nutrients' }] : []),
    ...(flags.recipeBuilder ? [{ id: 'recipes' as const, label: 'Recipes' }] : []),
  ]
  const logMeal = (meal: Meal) => {
    update((s) => ({ ...s, meals: [...s.meals, meal] }))
    setTab('today')
  }
  return (
    <div className="diet-page">
      {tabs.length > 1 && (
        <div className="diet-tabs" role="tablist" aria-label="Nourish">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      {tab === 'nutrients' && <NutrientsPanel state={state} today={today} data={data} setData={setData} />}
      {tab === 'recipes' && <RecipeBuilder state={state} today={today} onLog={logMeal} />}
      {tab === 'today' && (<>
        <DietQuick
          kind={kind}
          water={water}
          target={waterTarget}
          hasMeal={todayMeals.length > 0}
          onAdd={(f) => addMeal({ name: f.name, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat, ...(f.ingredients ? { ingredients: f.ingredients } : {}) })}
          onWater={setWater}
          onFeeling={(feeling) => {
            const last = todayMeals.at(-1)
            if (last) update((s) => ({ ...s, meals: s.meals.map((m) => (m.id === last.id ? { ...m, feeling } : m)) }))
          }}
        />
      <section className="diet-hero">
        <PlateRing value={totals.kcal} target={state.targets.kcal} />
        <div className="diet-hero-side">
          <h3>
            <Utensils size={18} aria-hidden="true" /> Today’s nourishment
          </h3>
          <p className="diet-sub">
            {totals.meals} {totals.meals === 1 ? 'meal' : 'meals'} ·{' '}
            {totals.kcal <= state.targets.kcal ? `${state.targets.kcal - totals.kcal} kcal left` : `${totals.kcal - state.targets.kcal} kcal over, and that’s okay`}
            {(() => {
              const days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(`${today}T12:00:00`)
                d.setDate(d.getDate() - i - 1)
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              }).map((d) => state.meals.filter((m) => m.date === d).reduce((a, m) => a + m.kcal, 0)).filter((k) => k > 0)
              return days.length >= 3 ? ` · last week avg ${Math.round(days.reduce((a, b) => a + b, 0) / days.length)} kcal/day` : ''
            })()}
            {state.targets.protein > totals.protein ? ` · ${state.targets.protein - totals.protein} g protein to go` : state.targets.protein ? ' · protein goal met 💪' : ''}
          </p>
          {subOn('dietTracker', 'macros') && (
            <div className="diet-macros">
              <Macro label="Protein" value={totals.protein} target={state.targets.protein} color="#e27396" />
              <Macro label="Carbs" value={totals.carbs} target={state.targets.carbs} color="#f2a65a" />
              <Macro label="Fat" value={totals.fat} target={state.targets.fat} color="#6bbf7a" />
            </div>
          )}
          {subOn('dietTracker', 'water') && (
            <div className="diet-water-row bloom-stack">
              <span>
                <Droplet size={16} aria-hidden="true" /> Water {water}/{waterTarget}
                {(() => {
                  const d = new Date(`${today}T12:00:00`)
                  const key = () => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                  if ((state.water[key()] ?? 0) < state.targets.water) d.setDate(d.getDate() - 1)
                  let n = 0
                  while ((state.water[key()] ?? 0) >= state.targets.water && n < 365) {
                    n++
                    d.setDate(d.getDate() - 1)
                  }
                  return n > 1 ? <small className="diet-water-bonus"> · 💧 {n}-day streak</small> : null
                })()}
                {waterBonus > 0 && <small className="diet-water-bonus" title={`${exerciseMin} active minutes today`}> +{waterBonus} for today’s exercise</small>}
              </span>
              <WaterGlasses count={water} target={waterTarget} onSet={setWater} />
            </div>
          )}
        </div>
      </section>

      <section className="diet-card">
        <div className="diet-kinds" role="radiogroup" aria-label="Meal">
          {kinds.map((k) => (
            <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)}>
              {k.emoji} {k.label}
            </button>
          ))}
        </div>
        {todayMeals.length === 0 && yesterdayMeals.length > 0 && (
          <button
            type="button"
            className="diet-copy-yesterday"
            onClick={() => update((s) => ({ ...s, meals: [...s.meals, ...yesterdayMeals.map((m) => ({ ...m, id: crypto.randomUUID(), date: today, at: Date.now() - (yesterdayMeals.length - yesterdayMeals.indexOf(m)) * 1000, feeling: undefined }))] }))}
          >
            ↻ Same as yesterday ({yesterdayMeals.length} {yesterdayMeals.length === 1 ? 'meal' : 'meals'}, {yesterdayMeals.reduce((a, m) => a + m.kcal, 0)} kcal)
          </button>
        )}
        {usuals.length > 0 && (
          <div className="diet-library diet-usuals" aria-label="Your usuals">
            <span className="diet-usuals-label">Your usuals</span>
            {usuals.map((f) => (
              <button key={f.name} type="button" onClick={() => addMeal({ name: f.name, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat })} title={`Logged ${f.count}× · ${f.kcal} kcal`}>
                ↻ {f.name}
                <small>{f.kcal}</small>
              </button>
            ))}
          </div>
        )}
        {subOn('dietTracker', 'library') && (
          <div className="diet-library" aria-label="Quick add">
            {foodLibrary.map((f) => (
              <button key={f.name} type="button" onClick={() => addMeal(f)} title={`${f.kcal} kcal`}>
                <span aria-hidden="true">{f.emoji}</span> {f.name}
                <small>{f.kcal}</small>
              </button>
            ))}
          </div>
        )}
        <form className="diet-form" onSubmit={submit}>
          <input
            aria-label="What did you eat?"
            placeholder="What did you eat?"
            list="diet-known-foods"
            value={form.name}
            onChange={(e) => {
              const name = e.target.value
              // Picking a known food fills in its numbers.
              const known = [...usuals, ...foodLibrary].find((f) => f.name.toLowerCase() === name.trim().toLowerCase())
              setForm(known && !form.kcal ? { name, kcal: String(known.kcal), protein: String(known.protein), carbs: String(known.carbs), fat: String(known.fat) } : { ...form, name })
            }}
          />
          <datalist id="diet-known-foods">
            {[...new Set([...usuals.map((f) => f.name), ...foodLibrary.map((f) => f.name)])].map((n) => <option key={n} value={n} />)}
          </datalist>
          {(['kcal', 'protein', 'carbs', 'fat'] as const)
            .filter((k) => k === 'kcal' || subOn('dietTracker', 'macros'))
            .map((k) => (
              <input
                key={k}
                type="number"
                min="0"
                inputMode="numeric"
                aria-label={k === 'kcal' ? 'Calories' : `${k} grams`}
                placeholder={k === 'kcal' ? 'kcal' : `${k} g`}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            ))}
          <button ref={addBtn} className="ov-primary" type="submit">
            <Plus size={16} aria-hidden="true" /> Log meal
          </button>
        </form>
        {mindful && (
          <div className="diet-mindful">
            <label>
              Hunger before <strong>{['', 'Starving', 'Hungry', 'Peckish', 'Satisfied', 'Not hungry'][hunger]}</strong>
              <input type="range" min="1" max="5" value={hunger} onChange={(e) => setHunger(Number(e.target.value))} />
            </label>
            <label>
              Fullness after <strong>{['', 'Still hungry', 'Light', 'Comfortable', 'Full', 'Stuffed'][fullness]}</strong>
              <input type="range" min="1" max="5" value={fullness} onChange={(e) => setFullness(Number(e.target.value))} />
            </label>
            <div className="diet-feel" role="radiogroup" aria-label="How do you feel after?">
              {(['energised', 'steady', 'sluggish'] as const).map((f) => (
                <button key={f} type="button" role="radio" aria-checked={feeling === f} onClick={() => setFeeling(feeling === f ? undefined : f)}>
                  {{ energised: '⚡', steady: '🙂', sluggish: '😴' }[f]} {f}
                </button>
              ))}
            </div>
          </div>
        )}
        {justAdded && (
          <NextStep icon="🧘" text="Eat slowly. A few breaths before the next bite." action="Breathe" page="breathe" />
        )}
      </section>

      <div className="diet-grid">
        <section className="diet-card">
          <h3>Today</h3>
          {todayMeals.length === 0 ? (
            <p className="diet-empty">Nothing logged yet. Every bite counts, including the small ones.</p>
          ) : (
            <ul className="diet-meals bloom-list">
              {todayMeals.map((m) => (
                <li key={m.id}>
                  <span className="diet-meal-kind">{kinds.find((k) => k.id === m.kind)?.emoji}</span>
                  <span>
                    <strong>{m.name}</strong>
                    <small>
                      {new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                      <button
                        type="button"
                        className="diet-kcal-edit"
                        title="Change calories"
                        onClick={() => {
                          const v = window.prompt(`Calories for ${m.name}`, String(m.kcal))
                          const n = v === null ? NaN : Math.round(Number(v))
                          if (Number.isFinite(n) && n >= 0) update((s) => ({ ...s, meals: s.meals.map((x) => (x.id === m.id ? { ...x, kcal: n } : x)) }))
                        }}
                      >
                        {m.kcal} kcal ✎
                      </button>
                      {m.protein ? ` · P${m.protein} C${m.carbs} F${m.fat}` : ''}
                      {m.feeling ? ` · ${m.feeling}` : ''}
                    </small>
                  </span>
                  <button className="icon-button" aria-label={`Delete ${m.name}`} onClick={() => update((s) => ({ ...s, meals: s.meals.filter((x) => x.id !== m.id) }))}>
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="diet-card">
          <h3>This week</h3>
          <WeekChart state={state} today={today} />
          {subOn('dietTracker', 'insights') && insights.length > 0 && (
            <ul className="diet-insights bloom-list">
              {insights.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <details className="diet-targets">
            <summary>Daily targets</summary>
            {(['kcal', 'protein', 'carbs', 'fat', 'water'] as const).map((k) => (
              <label key={k}>
                {k}
                <input
                  type="number"
                  min="0"
                  value={state.targets[k]}
                  onChange={(e) => update((s) => ({ ...s, targets: { ...s.targets, [k]: Math.max(0, Number(e.target.value) || 0) } }))}
                />
              </label>
            ))}
          </details>
        </section>
      </div>
      </>)}
    </div>
  )
}
