import { useEffect, useLayoutEffect, useRef } from 'react'
import { ResponsiveRadar } from '@nivo/radar'
import gsap from 'gsap'
import { Droplets, Leaf, ShieldPlus } from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { PLANT_GOAL, dayNutrients, plantDiversity, type DietState } from './dietModel'
import { useChartColors } from '../../components/ui/chartTheme'
import { electrolytesMet, foods, nutrientIds, nutrientInfo, pct, radarData } from './nutrients'

const endOfDay = (today: string) => new Date(`${today}T23:59:59`).getTime()

/** True when today's Hydrated buff has already been granted. */
export const hydratedToday = (data: FeaturePageProps['data'], today: string) =>
  data.rpg.buffs.some((b) => b.kind === 'hydrated' && b.expiresAt === endOfDay(today))

function DiversityRing({ count }: { count: number }) {
  const arc = useRef<SVGCircleElement>(null)
  const C = 2 * Math.PI * 52
  useLayoutEffect(() => {
    if (arc.current) gsap.to(arc.current, { strokeDashoffset: C * (1 - Math.min(1, count / PLANT_GOAL)), duration: 1.2, ease: 'power3.out' })
  }, [count, C])
  return (
    <svg className="nut-ring" viewBox="0 0 130 130" role="img" aria-label={`${count} of ${PLANT_GOAL} plants this week`}>
      <circle cx="65" cy="65" r="52" className="nut-ring-track" />
      <circle ref={arc} cx="65" cy="65" r="52" className="nut-ring-arc" strokeDasharray={C} strokeDashoffset={C} transform="rotate(-90 65 65)" />
      <text x="65" y="64" textAnchor="middle" className="nut-ring-value">
        {count}
      </text>
      <text x="65" y="82" textAnchor="middle" className="nut-ring-label">
        of {PLANT_GOAL} plants
      </text>
    </svg>
  )
}

export function NutrientsPanel({ state, today, data, setData }: { state: DietState; today: string } & Pick<FeaturePageProps, 'data' | 'setData'>) {
  const radarColors = useChartColors(['#d8c7bb', '#6bbf7a'])
  const totals = dayNutrients(state.meals, today)
  const radar = radarData(totals)
  const diversity = plantDiversity(state.meals, today)
  const water = (state.water[today] ?? 0) >= state.targets.water
  const hydrated = electrolytesMet(totals) && water
  const granted = hydratedToday(data, today)
  const badge = useRef<HTMLDivElement>(null)

  // Meeting electrolytes and water grants the Hydrated stamina buff (+5 HP) once a day.
  useEffect(() => {
    if (!hydrated || granted || !subOn('microNutrients', 'hydratedBuff')) return
    setData((d) =>
      hydratedToday(d, today)
        ? d
        : {
            ...d,
            rpg: {
              ...d.rpg,
              buffs: [...d.rpg.buffs, { kind: 'hydrated', expiresAt: endOfDay(today), quantity: 1 }],
              posture: [...d.rpg.posture, { at: Date.now(), kind: 'stamina', amount: 5 }],
            },
          },
    )
    burst(badge.current, 'stars')
  }, [hydrated, granted, today, setData])

  const logged = state.meals.some((m) => m.date === today && m.ingredients?.length)

  return (
    <div className="nut-panel">
      {subOn('microNutrients', 'radar') && (
        <section className="diet-card nut-radar-card">
          <h3>Micronutrients today</h3>
          {!logged && <p className="diet-empty">Quick-add a meal or build a recipe; meals made from ingredients fill this in.</p>}
          <div className="nut-radar" data-matrix-native role="img" aria-label={radar.map((r) => `${r.axis} ${r.consumed}%`).join(', ')}>
            <ResponsiveRadar
              data={radar}
              keys={['target', 'consumed']}
              indexBy="axis"
              maxValue={150}
              margin={{ top: 30, right: 70, bottom: 30, left: 70 }}
              curve="linearClosed"
              gridShape="circular"
              gridLevels={3}
              colors={radarColors}
              fillOpacity={0.35}
              borderWidth={2}
              dotSize={7}
              dotBorderWidth={2}
              blendMode="normal"
              motionConfig="wobbly"
              valueFormat={(v) => `${v}%`}
              theme={{ text: { fill: 'var(--text-secondary)', fontSize: 12 }, grid: { line: { stroke: 'var(--border-color)' } }, tooltip: { container: { background: 'var(--bg-surface)', color: 'var(--text-primary)', borderRadius: 12 } } }}
            />
          </div>
        </section>
      )}
      <div className="nut-side bloom-start-stack">
        {subOn('microNutrients', 'diversity') && (
          <section className="diet-card nut-diversity">
            <h3>
              <Leaf size={17} aria-hidden="true" /> Gut diversity
            </h3>
            <DiversityRing count={diversity.count} />
            <p className="diet-sub">
              {diversity.count >= PLANT_GOAL
                ? 'Thirty plants this week. Your microbiome is throwing a party.'
                : `${PLANT_GOAL - diversity.count} more different plants this week. Herbs, nuts and spices count.`}
            </p>
            <div className="nut-plants">
              {diversity.ids.map((id) => {
                const f = foods.find((x) => x.id === id)!
                return (
                  <span key={id} title={f.name}>
                    {f.emoji}
                  </span>
                )
              })}
            </div>
          </section>
        )}
        {subOn('microNutrients', 'hydratedBuff') && (
          <div ref={badge} className="nut-buff" data-on={granted || hydrated}>
            <ShieldPlus size={22} aria-hidden="true" />
            <span>
              <strong>Hydrated</strong>
              <small>
                {granted ? 'Active today · +5 HP stamina' : `Hit potassium, magnesium and sodium plus your water goal${water ? '' : ' (water still to go)'}`}
              </small>
            </span>
            <Droplets size={18} aria-hidden="true" className="nut-buff-drop" />
          </div>
        )}
      </div>
      {subOn('microNutrients', 'table') && (
        <section className="diet-card nut-table">
          <h3>All nutrients</h3>
          <ul>
            {nutrientIds.map((id) => {
              const p = pct(id, totals[id])
              const info = nutrientInfo[id]
              return (
                <li key={id}>
                  <span>{info.label}</span>
                  <span className="nut-bar">
                    <span style={{ width: `${Math.min(100, p)}%` }} data-level={id === 'sodium' ? (p > 150 ? 'high' : 'ok') : p >= 100 ? 'met' : p >= 50 ? 'mid' : 'low'} />
                  </span>
                  <small>
                    {totals[id] < 10 ? totals[id].toFixed(1) : Math.round(totals[id])}
                    {info.unit} · {p}%
                  </small>
                </li>
              )
            })}
          </ul>
          <p className="lab-note">Per-100 g values from USDA FoodData Central (public domain). Targets are general adult references, not medical advice.</p>
        </section>
      )}
    </div>
  )
}
