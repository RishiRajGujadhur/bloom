import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { shopItems, type ShopItem } from '../rewards/shop'
import { usePageActions } from '../../components/ui/PageMenu'
import { subOn } from '../subFeatures'
import './showcase.css'

const shelves: { kind: ShopItem['kind']; label: string }[] = [
  { kind: 'decor', label: 'World decor' },
  { kind: 'hat', label: 'Hats' },
  { kind: 'outfit', label: 'Outfits' },
  { kind: 'pet', label: 'Pets' },
]

/**
 * Petal shop window: a storybook shop front with an awning, a shopkeeper who
 * waves, and wooden shelves where items bob and their price tags swing.
 */
export function ShopWindow({ owned, balance, onBuy }: { owned: string[]; balance: number; onBuy: (item: ShopItem) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const cheapest = shopItems.filter((i) => !owned.includes(i.id) && i.price <= balance).sort((a, b) => b.price - a.price)[0]
  usePageActions(cheapest ? [{ id: 'shop-best', label: `Buy ${cheapest.name} (${cheapest.price} 🌸)`, icon: cheapest.emoji, run: () => onBuy(cheapest) }] : [])
  useLayoutEffect(() => {
    const el = root.current
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.from('.sw-item', { y: -30, opacity: 0, stagger: 0.04, duration: 0.5, ease: 'bounce.out' })
      gsap.to('.sw-tag', { rotate: 8, transformOrigin: '50% 0%', yoyo: true, repeat: -1, duration: 1.4, ease: 'sine.inOut', stagger: 0.2 })
      gsap.to('.sw-keeper-arm', { rotate: -35, transformOrigin: '10% 90%', yoyo: true, repeat: -1, duration: 0.5, repeatDelay: 2 })
      gsap.to('.sw-owned', { y: -4, yoyo: true, repeat: -1, duration: 1.8, ease: 'sine.inOut', stagger: 0.3 })
    }, el)
    const items = [...el.querySelectorAll<HTMLElement>('.sw-item')]
    const enter = (e: Event) => gsap.to(e.currentTarget as HTMLElement, { y: -10, scale: 1.12, duration: 0.25, ease: 'back.out(3)' })
    const leave = (e: Event) => gsap.to(e.currentTarget as HTMLElement, { y: 0, scale: 1, duration: 0.3 })
    items.forEach((i) => {
      i.addEventListener('pointerenter', enter)
      i.addEventListener('pointerleave', leave)
    })
    return () => {
      ctx.revert()
      items.forEach((i) => {
        i.removeEventListener('pointerenter', enter)
        i.removeEventListener('pointerleave', leave)
      })
    }
  }, [owned.length])
  if (!subOn('petalShop', 'shopWindow')) return null
  return (
    <section ref={root} className="sw-front" aria-label="Shop window">
      <div className="sw-awning" aria-hidden="true" />
      <div className="sw-sign">🌸 Petal Shop</div>
      <div className="sw-inside">
        <svg className="sw-keeper" viewBox="0 0 90 120" aria-hidden="true">
          <ellipse cx="45" cy="112" rx="30" ry="6" fill="#0002" />
          <rect x="22" y="60" width="46" height="50" rx="18" fill="#f48fb1" />
          <circle cx="45" cy="42" r="26" fill="#ffd6a5" stroke="#8d6e63" strokeWidth="2" />
          <path d="M20 34 q25 -30 50 0 q-25 -12 -50 0" fill="#8d6e63" />
          <circle cx="36" cy="44" r="3.5" fill="#222" />
          <circle cx="54" cy="44" r="3.5" fill="#222" />
          <path d="M39 54 q6 5 12 0" stroke="#222" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <rect className="sw-keeper-arm" x="64" y="66" width="10" height="30" rx="5" fill="#f48fb1" />
          <text x="45" y="98" textAnchor="middle" fontSize="12">🌸</text>
        </svg>
        <div className="sw-shelves">
          {shelves.map((s) => (
            <div key={s.kind} className="sw-shelf">
              <span className="sw-shelf-label">{s.label}</span>
              <div className="sw-row">
                {shopItems
                  .filter((i) => i.kind === s.kind)
                  .map((i) => {
                    const mine = owned.includes(i.id)
                    const can = !mine && balance >= i.price
                    return (
                      <button
                        key={i.id}
                        type="button"
                        className={`sw-item ${mine ? 'sw-owned' : ''}`}
                        disabled={!can}
                        onClick={() => onBuy(i)}
                        aria-label={`${i.name}, ${mine ? 'owned' : `${i.price} petals`}`}
                        data-cursor-text={can ? 'Buy' : undefined}
                      >
                        <span className="sw-emoji">{i.emoji}</span>
                        <span className="sw-tag">{mine ? '✓' : `${i.price}`}</span>
                      </button>
                    )
                  })}
              </div>
              <span className="sw-plank" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
