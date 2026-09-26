import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import gsap from 'gsap'
import { ChefHat, Minus, Plus, Save, Trash2, Utensils } from 'lucide-react'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { db } from '../../search/db'
import { searchFoods } from './foodStore'
import type { FoodRow } from './nutrients'
import { foodById, kcalPer100, parseQuantity, perServing, recipeTotals, type Ingredient, type Recipe } from './recipeModel'
import { kindFor, type DietState, type Meal } from './dietModel'

type Row = Ingredient & { key: string; text: string }

/** The kitchen scale: its needle springs to the total weight. */
function KitchenScale({ grams, items }: { grams: number; items: string[] }) {
  const needle = useRef<SVGGElement>(null)
  const angle = Math.min(260, (grams / 2000) * 260) - 130
  useLayoutEffect(() => {
    if (needle.current) gsap.to(needle.current, { rotation: angle, svgOrigin: '100 118', duration: 1, ease: 'elastic.out(1, 0.45)' })
  }, [angle])
  return (
    <svg className="rb-scale" viewBox="0 0 200 190" aria-hidden="true">
      <ellipse cx="100" cy="46" rx="78" ry="16" className="rb-bowl-rim" />
      <path d="M22 46 Q100 110 178 46" className="rb-bowl" />
      <g className="rb-bowl-items">
        {items.slice(-9).map((e, i) => (
          <text key={i} x={60 + (i % 5) * 20} y={50 - Math.floor(i / 5) * 12} textAnchor="middle" fontSize="16">
            {e}
          </text>
        ))}
      </g>
      <rect x="30" y="82" width="140" height="100" rx="22" className="rb-body" />
      <circle cx="100" cy="128" r="36" className="rb-dial" />
      {Array.from({ length: 11 }, (_, i) => {
        const a = ((-130 + i * 26) * Math.PI) / 180
        return <line key={i} x1={100 + Math.sin(a) * 30} y1={128 - Math.cos(a) * 30} x2={100 + Math.sin(a) * 34} y2={128 - Math.cos(a) * 34} className="rb-tick" />
      })}
      <g ref={needle}>
        <line x1="100" y1="128" x2="100" y2="98" className="rb-needle" />
      </g>
      <circle cx="100" cy="128" r="4" className="rb-hub" />
      <text x="100" y="176" textAnchor="middle" className="rb-weight">
        {Math.round(grams)} g
      </text>
    </svg>
  )
}

export function RecipeBuilder({ today, onLog }: { today: string; onLog: (meal: Meal) => void; state: DietState }) {
  const [query, setQuery] = useState('')
  const [pantry, setPantry] = useState<FoodRow[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [name, setName] = useState('')
  const [servings, setServings] = useState(2)
  const [cooked, setCooked] = useState(true)
  const [measured, setMeasured] = useState('')
  const [saved, setSaved] = useState<Recipe[]>([])
  const saveBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let live = true
    void searchFoods(query).then((f) => live && setPantry(f))
    return () => {
      live = false
    }
  }, [query])
  useEffect(() => {
    db.recipes.orderBy('createdAt').reverse().toArray().then(setSaved).catch(() => setSaved([]))
  }, [])

  const add = (food: FoodRow, at?: number) => {
    const grams = food.piece ?? 100
    const row: Row = { key: crypto.randomUUID(), foodId: food.id, grams, text: food.piece ? '1' : '100 g' }
    setRows((r) => {
      const next = [...r]
      next.splice(at ?? next.length, 0, row)
      return next
    })
  }
  const onDragEnd = (r: DropResult) => {
    if (!r.destination) return
    if (r.source.droppableId === 'pantry' && r.destination.droppableId === 'scale') {
      const food = pantry.find((f) => f.id === r.draggableId.replace(/^p-/, ''))
      if (food) add(food, r.destination.index)
    } else if (r.source.droppableId === 'scale' && r.destination.droppableId === 'scale') {
      setRows((list) => {
        const next = [...list]
        const [m] = next.splice(r.source.index, 1)
        next.splice(r.destination!.index, 0, m)
        return next
      })
    }
  }
  const setText = (key: string, text: string) =>
    setRows((list) =>
      list.map((row) => {
        if (row.key !== key) return row
        const food = foodById(row.foodId)
        const g = food ? parseQuantity(text, food) : null
        return { ...row, text, grams: g ?? row.grams }
      }),
    )

  const recipe = { ingredients: rows, cooked: cooked && subOn('recipeBuilder', 'cookLoss'), cookedWeight: Number(measured) || undefined }
  const totals = recipeTotals(recipe)
  const serving = perServing(totals, servings)
  const macroKcal = serving.protein * 4 + serving.carbs * 4 + serving.fat * 9 || 1

  const save = async () => {
    if (!rows.length) return
    const r: Recipe = { id: crypto.randomUUID(), name: name.trim() || 'My recipe', servings, ingredients: rows.map(({ foodId, grams }) => ({ foodId, grams })), cooked: recipe.cooked, cookedWeight: recipe.cookedWeight, createdAt: Date.now() }
    await db.recipes.put(r).catch(() => undefined)
    setSaved((s) => [r, ...s])
    burst(saveBtn.current, 'stars')
  }
  const log = (r: Pick<Recipe, 'name' | 'servings' | 'ingredients' | 'cooked' | 'cookedWeight'>) => {
    const t = perServing(recipeTotals(r), r.servings)
    onLog({
      id: crypto.randomUUID(),
      at: Date.now(),
      date: today,
      name: `${r.name} (1 serving)`,
      kind: kindFor(new Date().getHours()),
      kcal: Math.round(t.kcal),
      protein: Math.round(t.protein),
      carbs: Math.round(t.carbs),
      fat: Math.round(t.fat),
      ingredients: r.ingredients.map((i) => ({ foodId: i.foodId, grams: i.grams / Math.max(1, r.servings) })),
    })
  }

  return (
    <div className="rb">
      <DragDropContext onDragEnd={onDragEnd}>
        <section className="diet-card rb-pantry">
          <h3>Pantry</h3>
          <input className="rb-search" placeholder="Search ingredients…" aria-label="Search ingredients" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Droppable droppableId="pantry" isDropDisabled>
            {(p) => (
              <ul ref={p.innerRef} {...p.droppableProps} className="rb-foods">
                {pantry.map((f, i) => (
                  <Draggable key={f.id} draggableId={`p-${f.id}`} index={i}>
                    {(d, snap) => (
                      <li ref={d.innerRef} {...d.draggableProps} {...d.dragHandleProps} data-dragging={snap.isDragging}>
                        <span aria-hidden="true">{f.emoji}</span> {f.name}
                        <small>{f.kcal} kcal/100 g</small>
                        <button type="button" className="icon-button" aria-label={`Add ${f.name}`} onClick={() => add(f)}>
                          <Plus size={14} />
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {p.placeholder}
              </ul>
            )}
          </Droppable>
        </section>

        <section className="diet-card rb-bench">
          <div className="rb-head">
            <ChefHat size={20} aria-hidden="true" />
            <input className="rb-name" aria-label="Recipe name" placeholder="Name your recipe" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="rb-scale-row">
            <KitchenScale grams={totals.rawWeight} items={rows.map((r) => foodById(r.foodId)?.emoji ?? '•')} />
            <Droppable droppableId="scale">
              {(p, snap) => (
                <ul ref={p.innerRef} {...p.droppableProps} className="rb-rows" data-over={snap.isDraggingOver}>
                  {rows.length === 0 && <li className="rb-drop-hint">Drag ingredients onto the scale</li>}
                  {rows.map((row, i) => {
                    const food = foodById(row.foodId)
                    const valid = food ? parseQuantity(row.text, food) != null : false
                    return (
                      <Draggable key={row.key} draggableId={row.key} index={i}>
                        {(d) => (
                          <li ref={d.innerRef} {...d.draggableProps} {...d.dragHandleProps}>
                            <span aria-hidden="true">{food?.emoji}</span>
                            <span className="rb-row-name">{food?.name}</span>
                            <input
                              aria-label={`Amount of ${food?.name}`}
                              value={row.text}
                              data-valid={valid}
                              title="Try 150 g, 1 1/2 tbsp, 2 cups, 4 oz or a count"
                              onChange={(e) => setText(row.key, e.target.value)}
                            />
                            <small>{Math.round(row.grams)} g</small>
                            <button type="button" className="icon-button" aria-label={`Remove ${food?.name}`} onClick={() => setRows((l) => l.filter((x) => x.key !== row.key))}>
                              <Trash2 size={14} />
                            </button>
                          </li>
                        )}
                      </Draggable>
                    )
                  })}
                  {p.placeholder}
                </ul>
              )}
            </Droppable>
          </div>

          <div className="rb-controls">
            <label className="rb-servings">
              Servings
              <span>
                <button type="button" aria-label="Fewer servings" onClick={() => setServings((s) => Math.max(1, s - 1))}>
                  <Minus size={14} />
                </button>
                <strong>{servings}</strong>
                <button type="button" aria-label="More servings" onClick={() => setServings((s) => Math.min(24, s + 1))}>
                  <Plus size={14} />
                </button>
              </span>
            </label>
            {subOn('recipeBuilder', 'cookLoss') && (
              <>
                <label className="rb-toggle">
                  <input type="checkbox" checked={cooked} onChange={(e) => setCooked(e.target.checked)} /> Cooked (apply yield)
                </label>
                {cooked && (
                  <label className="rb-measured">
                    Weighed after cooking
                    <input type="number" min="0" placeholder={`${Math.round(totals.cookedWeight)} g est.`} value={measured} onChange={(e) => setMeasured(e.target.value)} />
                  </label>
                )}
              </>
            )}
          </div>

          {rows.length > 0 && (
            <div className="rb-results">
              <div>
                <strong>{Math.round(serving.kcal)}</strong>
                <small>kcal / serving</small>
              </div>
              <div>
                <strong>{Math.round(totals.cookedWeight / servings)} g</strong>
                <small>per serving{recipe.cooked ? ' cooked' : ''}</small>
              </div>
              <div>
                <strong>{Math.round(kcalPer100(totals))}</strong>
                <small>kcal / 100 g {recipe.cooked ? `(raw ${Math.round((totals.kcal / Math.max(1, totals.rawWeight)) * 100)})` : ''}</small>
              </div>
              {subOn('recipeBuilder', 'macroBar') && (
                <div className="rb-macro-bar" aria-label="Macro split">
                  <span style={{ flex: serving.protein * 4, background: '#e27396' }}>P {Math.round(((serving.protein * 4) / macroKcal) * 100)}%</span>
                  <span style={{ flex: serving.carbs * 4, background: '#f2a65a' }}>C {Math.round(((serving.carbs * 4) / macroKcal) * 100)}%</span>
                  <span style={{ flex: serving.fat * 9, background: '#6bbf7a' }}>F {Math.round(((serving.fat * 9) / macroKcal) * 100)}%</span>
                </div>
              )}
            </div>
          )}
          <div className="rb-actions">
            {subOn('recipeBuilder', 'saveRecipes') && (
              <button ref={saveBtn} type="button" className="lab-secondary" onClick={save} disabled={!rows.length}>
                <Save size={15} /> Save recipe
              </button>
            )}
            <button type="button" className="ov-primary" disabled={!rows.length} onClick={() => log({ name: name.trim() || 'My recipe', servings, ingredients: rows, cooked: recipe.cooked, cookedWeight: recipe.cookedWeight })}>
              <Utensils size={15} /> Log one serving
            </button>
          </div>
        </section>
      </DragDropContext>

      {subOn('recipeBuilder', 'saveRecipes') && saved.length > 0 && (
        <section className="diet-card rb-saved">
          <h3>Your recipes</h3>
          <ul>
            {saved.map((r) => {
              const t = perServing(recipeTotals(r), r.servings)
              return (
                <li key={r.id}>
                  <span>
                    <strong>{r.name}</strong>
                    <small>
                      {r.servings} servings · {Math.round(t.kcal)} kcal each · {r.ingredients.map((i) => foodById(i.foodId)?.emoji).join('')}
                    </small>
                  </span>
                  <button type="button" className="lab-secondary" onClick={() => log(r)}>
                    Log serving
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Delete ${r.name}`}
                    onClick={() => {
                      setSaved((s) => s.filter((x) => x.id !== r.id))
                      void db.recipes.delete(r.id)
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
