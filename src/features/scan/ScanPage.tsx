import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { AlertTriangle, Camera, CameraOff, GitCompare, History, Loader2, ScanBarcode, Search, Utensils } from 'lucide-react'
import type { IScannerControls } from '@zxing/browser'
import { Rail, Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { dayKey } from '../../dates'
import { kindFor, readDiet, saveDiet } from '../diet/dietModel'
import { SCAN_KEY, allergenHits, allergenList, allergenName, apiUrl, forPortion, light, parseProduct, sugarCubes, validCode, type Product, type ScanStore } from './scanModel'
import './scan.css'

const on = (id: string) => subOn('foodScanner', id)
const gradeColor: Record<string, string> = { a: '#038141', b: '#85bb2f', c: '#fecb02', d: '#ee8100', e: '#e63e11' }
const samples = [
  { code: '3017620422003', label: 'Hazelnut spread' },
  { code: '5449000000996', label: 'Cola' },
  { code: '3175680011480', label: 'Oat biscuits' },
]

function Grade({ label, value, scale }: { label: string; value?: string | number; scale: 'letter' | 'nova' }) {
  if (value == null) return null
  const color = scale === 'letter' ? gradeColor[String(value)] : ['#038141', '#85bb2f', '#ee8100', '#e63e11'][Number(value) - 1]
  return (
    <span className="sc-grade" style={{ ['--g' as string]: color }}>
      <small>{label}</small>
      <strong>{String(value).toUpperCase()}</strong>
    </span>
  )
}

/** Sugar cubes drop in one by one. */
function Cubes({ n }: { n: number }) {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return
    const t = gsap.from(root.current.children, { y: -60, opacity: 0, rotation: () => gsap.utils.random(-40, 40), duration: 0.6, stagger: 0.06, ease: 'bounce.out' })
    return () => void t.progress(1).kill()
  }, [n])
  const whole = Math.floor(n)
  return (
    <div className="sc-cubes" ref={root} aria-label={`${n} sugar cubes`}>
      {Array.from({ length: Math.min(40, whole) }, (_, i) => (
        <i key={i} />
      ))}
      {n - whole > 0 && <i className="half" />}
    </div>
  )
}

function ProductCard({ p, mine, grams }: { p: Product; mine: string[]; grams: number }) {
  const hits = allergenHits(p, mine)
  const portion = forPortion(p, grams)
  return (
    <div className="sc-product">
      <div className="sc-head bloom-inline">
        {on('productPhoto') && p.image && <img src={p.image} alt="" />}
        <div>
          <h3>{p.name}</h3>
          <small>{p.brand}</small>
        </div>
      </div>
      {on('grades') && (
        <div className="sc-grades bloom-wrap">
          <Grade label="Nutri-Score" value={p.nutriscore} scale="letter" />
          <Grade label="NOVA" value={p.nova} scale="nova" />
          <Grade label="Eco-Score" value={p.ecoscore} scale="letter" />
        </div>
      )}
      {on('allergens') && hits.length > 0 && (
        <p className="sc-alert" role="alert">
          <AlertTriangle size={16} /> Contains {hits.map(allergenName).join(', ')}
        </p>
      )}
      <div className="studio-stats">
        <Stat value={portion.kcal} label={`kcal in ${grams} g`} />
        <Stat value={`${portion.protein} g`} label="protein" />
        <Stat value={`${portion.carbs} g`} label="carbs" />
        <Stat value={`${portion.fat} g`} label="fat" />
      </div>
      <div className="sc-lights bloom-wrap">
        {(['sugars', 'fat', 'satFat', 'salt'] as const).map((k) => (
          <span key={k} data-level={light(k, p.per100[k])}>
            {k === 'satFat' ? 'Saturates' : k[0].toUpperCase() + k.slice(1)} {Math.round(p.per100[k] * 10) / 10}g
          </span>
        ))}
      </div>
      {on('additives') && p.additives.length > 0 && <p className="sc-additives">Additives: {p.additives.join(' · ')}</p>}
    </div>
  )
}

export function ScanPage() {
  const [store, setStoreState] = useState<ScanStore>(() => readStore(SCAN_KEY, { history: [], allergens: [], compare: [null, null] }))
  const setStore = (fn: (s: ScanStore) => ScanStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(SCAN_KEY, n)
      return n
    })
  const [tab, setTab] = useState('scan')
  const [code, setCode] = useState('')
  const [product, setProduct] = useState<Product | null>(store.history[store.history.length - 1] ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [camera, setCamera] = useState(false)
  const [grams, setGrams] = useState(30)
  const video = useRef<HTMLVideoElement>(null)
  const controls = useRef<IScannerControls | null>(null)
  const addBtn = useRef<HTMLButtonElement>(null)

  const lookup = async (raw: string) => {
    const c = raw.trim()
    if (!validCode(c)) return setError('Barcodes are 8 to 14 digits.')
    setError('')
    const cached = store.history.find((h) => h.code === c)
    if (cached) {
      setProduct(cached)
      return
    }
    setBusy(true)
    try {
      const res = await fetch(apiUrl(c))
      const p = parseProduct(c, await res.json())
      if (!p) setError('Not in Open Food Facts yet. You can add it at openfoodfacts.org.')
      else {
        setProduct(p)
        if (on('history')) setStore((s) => ({ ...s, history: [...s.history.filter((h) => h.code !== c), p].slice(-60) }))
      }
    } catch {
      setError('Couldn’t reach Open Food Facts. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  const stopCamera = () => {
    controls.current?.stop()
    controls.current = null
    setCamera(false)
  }
  const startCamera = async () => {
    setError('')
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      setCamera(true)
      controls.current = await reader.decodeFromVideoDevice(undefined, video.current!, (result) => {
        if (result) {
          navigator.vibrate?.(40)
          stopCamera()
          setCode(result.getText())
          void lookup(result.getText())
        }
      })
    } catch {
      setCamera(false)
      setError('Camera unavailable. Type the barcode instead.')
    }
  }
  useEffect(() => () => controls.current?.stop(), [])

  const addToMeal = () => {
    if (!product) return
    const p = forPortion(product, grams)
    const diet = readDiet()
    saveDiet({ ...diet, meals: [...diet.meals, { id: crypto.randomUUID(), at: Date.now(), date: dayKey(), name: `${product.name}${product.brand ? ` (${product.brand})` : ''}`, kind: kindFor(new Date().getHours()), kcal: p.kcal, protein: p.protein, carbs: p.carbs, fat: p.fat }] })
    logActivity('meal')
    burst(addBtn.current, 'stars')
    window.dispatchEvent(new CustomEvent('bloom:toast', { detail: `Added ${grams} g · ${Math.round(p.kcal)} kcal to today` }))
  }

  const scan = () => (
    <div className="studio-split">
      <div className="studio-card sc-scanner bloom-start-stack">
        {on('camera') && (
          <div className="sc-video" data-on={camera}>
            <video ref={video} muted playsInline />
            {camera && <span className="sc-laser" aria-hidden="true" />}
            {!camera && (
              <button type="button" className="studio-go" onClick={startCamera}>
                <Camera size={18} /> Scan with camera
              </button>
            )}
          </div>
        )}
        {camera && (
          <button type="button" className="studio-chip" onClick={stopCamera}>
            <CameraOff size={13} /> Stop camera
          </button>
        )}
        {on('manual') && (
          <form
            className="sc-manual"
            onSubmit={(e) => {
              e.preventDefault()
              void lookup(code)
            }}
          >
            <input className="studio-input" inputMode="numeric" placeholder="Type a barcode" aria-label="Barcode" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            <button type="submit" className="studio-go" disabled={busy}>
              {busy ? <Loader2 size={16} className="voice-spin" /> : <Search size={16} />} Look up
            </button>
          </form>
        )}
        <div className="sc-samples bloom-controls">
          <span className="studio-empty">Try:</span>
          {samples.map((s) => (
            <button key={s.code} type="button" className="studio-chip" onClick={() => (setCode(s.code), void lookup(s.code))}>
              {s.label}
            </button>
          ))}
        </div>
        {error && <p className="voice-error">{error}</p>}
      </div>
      <div className="studio-card sc-result bloom-start-stack">
        {product ? (
          <>
            <ProductCard p={product} mine={store.allergens} grams={grams} />
            <Slider label="Portion" value={grams} min={5} max={500} step={5} unit="g" onChange={setGrams} />
            <div className="studio-chip-row" role="group" aria-label="Quick portions">
              {[30, 50, 100, 250].map((g) => (
                <button key={g} type="button" className="studio-chip" aria-pressed={grams === g} onClick={() => setGrams(g)}>
                  {g} g
                </button>
              ))}
            </div>
            {on('sugarCubes') && (
              <div className="sc-sugar">
                <strong>{sugarCubes(product.per100.sugars, grams)}</strong> sugar cubes
                <Cubes n={sugarCubes(product.per100.sugars, grams)} />
              </div>
            )}
            {on('addToMeal') && (
              <button ref={addBtn} type="button" className="studio-go" onClick={addToMeal}>
                <Utensils size={16} /> Add {grams} g to today
              </button>
            )}
          </>
        ) : (
          <div className="studio-center">
            <ScanBarcode size={48} aria-hidden="true" />
            <p className="studio-empty">Scan or type a barcode to see what’s inside.</p>
          </div>
        )}
      </div>
    </div>
  )

  const allergensTab = () => (
    <div className="studio-center">
      <h3>What should Bloom warn you about?</h3>
      <div className="yg-pose-chips sc-allergens">
        {allergenList.map((a) => (
          <button key={a} type="button" className="studio-chip" aria-pressed={store.allergens.includes(a)} onClick={() => setStore((s) => ({ ...s, allergens: s.allergens.includes(a) ? s.allergens.filter((x) => x !== a) : [...s.allergens, a] }))}>
            {allergenName(a)}
          </button>
        ))}
      </div>
    </div>
  )

  const historyTab = () =>
    store.history.length ? (
      <Rail label="Scanned products">
        {[...store.history].reverse().map((p) => (
          <div key={p.code} role="listitem">
            <button type="button" className="sc-item" onClick={() => (setProduct(p), setTab('scan'))}>
              {p.image ? <img src={p.image} alt="" /> : <ScanBarcode size={30} />}
              <strong>{p.name}</strong>
              <small>{p.brand}</small>
              {p.nutriscore && (
                <span className="sc-mini" style={{ background: gradeColor[p.nutriscore] }}>
                  {p.nutriscore.toUpperCase()}
                </span>
              )}
            </button>
          </div>
        ))}
      </Rail>
    ) : (
      <p className="studio-empty">Scanned products appear here, and work offline next time.</p>
    )

  const [ca, cb] = store.compare
  const A = store.history.find((p) => p.code === ca) ?? store.history[store.history.length - 2]
  const B = store.history.find((p) => p.code === cb) ?? store.history[store.history.length - 1]
  const compare = () =>
    store.history.length < 2 || !A || !B ? (
      <p className="studio-empty">Scan two products to compare them.</p>
    ) : (
      <div className="sc-compare">
        {[A, B].map((p, side) => (
          <div key={side} className="studio-card">
            <select
              className="studio-input"
              aria-label={side ? 'Second product' : 'First product'}
              value={p.code}
              onChange={(e) => setStore((s) => ({ ...s, compare: side ? [s.compare[0], e.target.value] : [e.target.value, s.compare[1]] }))}
            >
              {store.history.map((h) => (
                <option key={h.code} value={h.code}>
                  {h.name}
                </option>
              ))}
            </select>
            <ProductCard p={p} mine={store.allergens} grams={100} />
          </div>
        ))}
      </div>
    )

  return (
    <Studio
      name="scan"
      accent="#2f8f5b"
      tab={tab}
      onTab={(t) => {
        if (t !== 'scan') stopCamera()
        setTab(t)
      }}
      scene={<StudioScene colors={['#b8e6c8', '#ffe29a', '#ffc2b0']} line="none" />}
      tabs={[
        { id: 'scan', label: 'Scan', icon: <ScanBarcode size={15} />, render: scan },
        ...(on('allergens') ? [{ id: 'allergens', label: 'Allergens', icon: <AlertTriangle size={15} />, render: allergensTab }] : []),
        ...(on('history') ? [{ id: 'history', label: 'History', icon: <History size={15} />, render: historyTab }] : []),
        ...(on('compare') ? [{ id: 'compare', label: 'Compare', icon: <GitCompare size={15} />, render: compare }] : []),
      ]}
    />
  )
}
