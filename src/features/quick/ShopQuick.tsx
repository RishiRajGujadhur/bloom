import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import FlipNumbersModule from 'react-flip-numbers'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { QuickPanel } from '../../components/ui/QuickPanel'
import { readStore, writeStore } from '../../components/studio/Studio'
import { readLogin } from '../rewards/loginRewards'
import { shopItems, type ShopItem } from '../rewards/shop'
import { subOn } from '../subFeatures'

// The package ships CJS; unwrap the default export like TimeSinceCard does.
const FlipNumbers = ((FlipNumbersModule as unknown as { default?: typeof FlipNumbersModule }).default ??
  FlipNumbersModule) as typeof FlipNumbersModule
const on = (id: string) => subOn('petalShop', id)
const WISH_KEY = 'bloom-shop-wishlist-v1'
type Wish = { wished: string[]; passed: string[] }

/** Average petals per active day, used to estimate when a wish is affordable. */
export function petalsPerDay() {
  const login = readLogin()
  const days = Math.max(1, login.days.length)
  return Math.max(1, login.petals / days)
}

function Ring({ item, balance }: { item: ShopItem; balance: number }) {
  const arc = useRef<SVGCircleElement>(null)
  const pct = Math.min(1, balance / item.price)
  useLayoutEffect(() => {
    if (!arc.current) return
    const tw = gsap.fromTo(arc.current, { strokeDashoffset: 138 }, { strokeDashoffset: 138 * (1 - pct), duration: 1, ease: 'power2.out' })
    return () => void tw.revert()
  }, [pct])
  const eta = Math.ceil((item.price - balance) / petalsPerDay())
  return (
    <div className="wish-ring">
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="22" className="track" />
        <circle ref={arc} cx="26" cy="26" r="22" className="arc" strokeDasharray="138" style={{ strokeDashoffset: 138 * (1 - pct) }} />
        <text x="26" y="31">{item.emoji}</text>
      </svg>
      <span>
        {item.name}
        <small>{pct >= 1 ? 'Ready to buy!' : on('affordEta') ? `${item.price - balance} petals to go · ~${eta} day${eta === 1 ? '' : 's'}` : `${Math.round(pct * 100)}%`}</small>
      </span>
    </div>
  )
}

export function ShopQuick({ owned, balance, onBuy }: { owned: string[]; balance: number; onBuy: (item: ShopItem) => void }) {
  const [wish, setWish] = useState<Wish>(() => readStore(WISH_KEY, { wished: [], passed: [] }))
  const save = (w: Wish) => { setWish(w); writeStore(WISH_KEY, w) }
  const unseen = shopItems.filter((i) => !owned.includes(i.id) && !wish.wished.includes(i.id) && !wish.passed.includes(i.id))
  const wished = shopItems.filter((i) => wish.wished.includes(i.id) && !owned.includes(i.id))
  return (
    <QuickPanel id="shop" title="Wishlist">
      {on('flipBalance') && (
        <div className="shop-flip" aria-label={`${balance} petals`}>
          🌸 <FlipNumbers height={26} width={18} color="currentColor" play perspective={200} numbers={String(balance)} /> petals
        </div>
      )}
      {on('wishSwipe') && (
        <SwipeDeck
          label="Swipe right to wish for it"
          yes="Want"
          no="Pass"
          cards={unseen.map((i) => ({ id: i.id, emoji: i.emoji, title: i.name, detail: `${i.price} petals` }))}
          empty={
            <span>
              Seen everything.{' '}
              {wish.passed.length > 0 && (
                <button type="button" className="quiet-button" onClick={() => save({ ...wish, passed: [] })}>Show passed again</button>
              )}
            </span>
          }
          onSwipe={(card, yes) => save(yes ? { ...wish, wished: [...wish.wished, card.id] } : { ...wish, passed: [...wish.passed, card.id] })}
          onUndo={(card) => save({ wished: wish.wished.filter((x) => x !== card.id), passed: wish.passed.filter((x) => x !== card.id) })}
        />
      )}
      {on('wishRings') && wished.length > 0 && (
        <div className="wish-rings">
          {wished.map((i) => (
            <div key={i.id} className="wish-row">
              <Ring item={i} balance={balance} />
              {balance >= i.price && <button type="button" className="primary" onClick={() => onBuy(i)}>Buy</button>}
              <button type="button" className="quiet-button" aria-label={`Remove ${i.name}`} onClick={() => save({ ...wish, wished: wish.wished.filter((x) => x !== i.id) })}>✕</button>
            </div>
          ))}
        </div>
      )}
    </QuickPanel>
  )
}
