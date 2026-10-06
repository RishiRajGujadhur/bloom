import { subOn } from '../subFeatures'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Lock, ShoppingBag } from 'lucide-react'
import { buy, shopItems, toggleEquip, useShop, type ShopItem, type ShopState } from './shop'
import './shop.css'
import { ShopQuick } from '../quick/ShopQuick'
import { ShopWindow } from '../showcase/ShopWindow'
import { burst } from '../../components/ui/celebrate'

const kinds = [
  { id: 'all', label: 'All' },
  { id: 'decor', label: 'World decor' },
  { id: 'hat', label: 'Hats' },
  { id: 'outfit', label: 'Outfits' },
  { id: 'pet', label: 'Pets' },
  { id: 'garage', label: 'Garage' },
] as const

/** A small pixel avatar that wears whatever is equipped. */
export function AvatarPreview({ equipped, size = 120 }: { equipped: ShopState['equipped']; size?: number }) {
  const outfit = shopItems.find((i) => i.id === equipped.outfit)?.color ?? '#d0643f'
  const hat = equipped.hat
  const pet = equipped.pet
  return (
    <svg className="avatar-preview" width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="6" y="21" width="12" height="1" fill="#0002" />
      {/* legs + body */}
      <rect x="9" y="17" width="2" height="4" fill="#4a3a2e" />
      <rect x="13" y="17" width="2" height="4" fill="#4a3a2e" />
      <rect x="8" y="11" width="8" height="7" fill={outfit} />
      <rect x="6" y="12" width="2" height="4" fill={outfit} />
      <rect x="16" y="12" width="2" height="4" fill={outfit} />
      {/* head */}
      <rect x="8" y="5" width="8" height="6" fill="#f6c9a6" />
      <rect x="10" y="7" width="1" height="1" fill="#2b2230" />
      <rect x="13" y="7" width="1" height="1" fill="#2b2230" />
      <rect x="11" y="9" width="2" height="1" fill="#c2615a" />
      {!hat && <rect x="8" y="4" width="8" height="2" fill="#6b4226" />}
      {hat === 'hat-straw' && (
        <>
          <rect x="6" y="4" width="12" height="1" fill="#e8c872" />
          <rect x="9" y="2" width="6" height="2" fill="#e8c872" />
          <rect x="9" y="3" width="6" height="1" fill="#d9574a" />
        </>
      )}
      {hat === 'hat-beanie' && (
        <>
          <rect x="8" y="2" width="8" height="3" fill="#d9574a" />
          <rect x="11" y="1" width="2" height="1" fill="#fff" />
        </>
      )}
      {hat === 'hat-wizard' && (
        <>
          <rect x="7" y="4" width="10" height="1" fill="#6a5acd" />
          <rect x="9" y="2" width="6" height="2" fill="#6a5acd" />
          <rect x="11" y="0" width="3" height="2" fill="#6a5acd" />
          <rect x="11" y="2" width="1" height="1" fill="#ffd166" />
        </>
      )}
      {hat === 'hat-crown' && (
        <>
          <rect x="8" y="3" width="8" height="2" fill="#ffcf40" />
          <rect x="8" y="2" width="1" height="1" fill="#ffcf40" />
          <rect x="11" y="1" width="2" height="2" fill="#ffcf40" />
          <rect x="15" y="2" width="1" height="1" fill="#ffcf40" />
          <rect x="11" y="3" width="2" height="1" fill="#e27396" />
        </>
      )}
      {pet === 'pet-cat' && (
        <>
          <rect x="18" y="18" width="4" height="3" fill="#6b6b6b" />
          <rect x="18" y="17" width="1" height="1" fill="#6b6b6b" />
          <rect x="21" y="17" width="1" height="1" fill="#6b6b6b" />
          <rect x="22" y="19" width="1" height="1" fill="#6b6b6b" />
        </>
      )}
      {pet === 'pet-fox' && (
        <>
          <rect x="18" y="18" width="4" height="3" fill="#e8743b" />
          <rect x="18" y="17" width="1" height="1" fill="#e8743b" />
          <rect x="21" y="17" width="1" height="1" fill="#e8743b" />
          <rect x="18" y="20" width="4" height="1" fill="#fff" />
          <rect x="22" y="19" width="1" height="2" fill="#e8743b" />
        </>
      )}
    </svg>
  )
}

export function ShopPage({ onVisitWorld }: { onVisitWorld?: () => void }) {
  const { shop, balance, update } = useShop()
  const [kind, setKindState] = useState<(typeof kinds)[number]['id']>(() => {
    try {
      const saved = localStorage.getItem('bloom-shop-kind')
      return (kinds.find((k) => k.id === saved)?.id ?? 'all') as (typeof kinds)[number]['id']
    } catch {
      return 'all'
    }
  })
  const setKind = (k: (typeof kinds)[number]['id']) => {
    setKindState(k)
    try { localStorage.setItem('bloom-shop-kind', k) } catch { /* optional */ }
  }
  const [canBuy, setCanBuy] = useState(false)
  const [flash, setFlash] = useState<ShopItem | null>(null)
  const allowed = (item: ShopItem) =>
    (item.kind === 'garage' && subOn('petalShop', 'garageItems')) ||
    (item.kind === 'decor' ? subOn('petalShop', 'decor') : subOn('petalShop', 'wearables'))
  const shown = shopItems.filter((i) => allowed(i) && (kind === 'all' || i.kind === kind) && (!canBuy || (!shop.owned.includes(i.id) && i.price <= balance)))
  const purchase = (item: ShopItem) => {
    const next = buy(shop, shop.spent + balance, item.id)
    if (!next) return
    update(next)
    burst(null, 'stars', 'shop')
    setFlash(item)
    setTimeout(() => setFlash(null), 2200)
  }
  return (
    <section className="shop-page" aria-label="Petal shop">
      <ShopQuick owned={shop.owned} balance={balance} onBuy={(item) => purchase(item)} />
      <ShopWindow owned={shop.owned} balance={balance} onBuy={(item) => purchase(item)} />
      <div className="shop-hero">
        <AvatarPreview equipped={shop.equipped} />
        <div>
          <p className="shop-balance">
            <span aria-hidden="true">🌸</span>
            <strong>{balance}</strong> petals
          </p>
          <p className="wb-muted">Earn petals by visiting daily. Decor appears in Bloom World.</p>
          {onVisitWorld && (
            <button className="ov-secondary" onClick={onVisitWorld}>
              See your world
            </button>
          )}
        </div>
      </div>
      <div className="filter-chips" role="group" aria-label="Shop category">
        {kinds.map((k) => (
          <button key={k.id} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
        <button type="button" aria-pressed={canBuy} onClick={() => setCanBuy((v) => !v)} title="Only items you can buy now">
          🌸 Affordable
        </button>
      </div>
      {canBuy && shown.length === 0 && <p className="wb-muted">Nothing new within {balance} petals yet — keep going!</p>}
      <ul className="shop-grid">
        {shown.map((item) => {
          const owned = shop.owned.includes(item.id)
          const wearable = item.kind === 'hat' || item.kind === 'outfit' || item.kind === 'pet'
          const worn = wearable && shop.equipped[item.kind as 'hat' | 'outfit' | 'pet'] === item.id
          const affordable = balance >= item.price
          return (
            <li key={item.id} className="shop-card" data-owned={owned}>
              <span className="shop-emoji" aria-hidden="true" style={{ ['--tint' as string]: item.color ?? 'var(--accent-color)' }}>
                {item.emoji}
              </span>
              <strong>{item.name}</strong>
              <span className="shop-price">
                {owned ? (worn ? 'Wearing' : 'Owned') : `🌸 ${item.price}`}
              </span>
              {!owned ? (
                <button
                  className="ov-primary"
                  disabled={!affordable}
                  onClick={() => purchase(item)}
                  aria-label={`Buy ${item.name} for ${item.price} petals`}
                >
                  {affordable ? <ShoppingBag size={16} /> : <Lock size={16} />}
                  {affordable ? 'Buy' : `${item.price - balance} more`}
                </button>
              ) : wearable ? (
                <button className="ov-secondary" aria-pressed={worn} onClick={() => update(toggleEquip(shop, item.id))}>
                  {worn ? 'Take off' : 'Wear'}
                </button>
              ) : (
                <span className="shop-owned">
                  <Check size={15} aria-hidden="true" />{' '}
                  {item.kind === 'garage' ? 'In your garage' : 'In your world'}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <AnimatePresence>
        {flash && (
          <motion.div
            className="shop-flash"
            aria-live="polite"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span aria-hidden="true">{flash.emoji}</span> {flash.name} is yours!
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
