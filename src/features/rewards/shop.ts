import { useEffect, useState } from 'react'
import { readLogin } from './loginRewards'

/**
 * Petal shop: spend daily-visit petals on Bloom World decorations and avatar
 * items. Purchases are stored separately from the login log, so the petal
 * balance is always `earned − spent`.
 */
export type ShopItem = {
  id: string
  kind: 'decor' | 'hat' | 'outfit' | 'pet' | 'garage'
  name: string
  emoji: string
  price: number
  /** Colour used for outfits and avatar previews. */
  color?: string
}

export const shopItems: ShopItem[] = [
  { id: 'cherry-tree', kind: 'decor', name: 'Cherry blossom tree', emoji: '🌸', price: 120 },
  { id: 'lamp-posts', kind: 'decor', name: 'Lamp posts', emoji: '🏮', price: 80 },
  { id: 'bench', kind: 'decor', name: 'Garden bench', emoji: '🪑', price: 60 },
  { id: 'campfire', kind: 'decor', name: 'Campfire', emoji: '🔥', price: 150 },
  { id: 'well', kind: 'decor', name: 'Wishing well', emoji: '💧', price: 180 },
  { id: 'statue', kind: 'decor', name: 'Hero statue', emoji: '🗿', price: 300 },
  { id: 'arch', kind: 'decor', name: 'Flower arch', emoji: '💐', price: 220 },
  { id: 'lighthouse', kind: 'decor', name: 'Tiny lighthouse', emoji: '🗼', price: 500 },
  { id: 'hat-straw', kind: 'hat', name: 'Straw hat', emoji: '👒', price: 40, color: '#e8c872' },
  { id: 'hat-beanie', kind: 'hat', name: 'Cosy beanie', emoji: '🧢', price: 50, color: '#d9574a' },
  { id: 'hat-wizard', kind: 'hat', name: 'Wizard hat', emoji: '🧙', price: 160, color: '#6a5acd' },
  { id: 'hat-crown', kind: 'hat', name: 'Little crown', emoji: '👑', price: 400, color: '#ffcf40' },
  { id: 'outfit-sage', kind: 'outfit', name: 'Sage jumper', emoji: '🟢', price: 30, color: '#7fb77e' },
  { id: 'outfit-sky', kind: 'outfit', name: 'Sky hoodie', emoji: '🔵', price: 30, color: '#6ab0e6' },
  { id: 'outfit-rose', kind: 'outfit', name: 'Rose cardigan', emoji: '🌹', price: 60, color: '#e27396' },
  { id: 'outfit-night', kind: 'outfit', name: 'Midnight robe', emoji: '🌌', price: 120, color: '#3b3f8f' },
  { id: 'pet-cat', kind: 'pet', name: 'Garden cat', emoji: '🐈', price: 250 },
  { id: 'pet-fox', kind: 'pet', name: 'Friendly fox', emoji: '🦊', price: 350 },
  { id: 'garage-charger', kind: 'garage', name: 'Eco charging station', emoji: '🔌', price: 90 },
  { id: 'garage-turntable', kind: 'garage', name: 'Display turntable', emoji: '💿', price: 160 },
  { id: 'garage-neon', kind: 'garage', name: 'Neon sign', emoji: '💡', price: 120 },
  { id: 'garage-plants', kind: 'garage', name: 'Garage plants', emoji: '🌵', price: 50 },
  { id: 'garage-spotlights', kind: 'garage', name: 'Spotlights', emoji: '🔦', price: 140 },
]

export type ShopState = {
  owned: string[]
  spent: number
  equipped: { hat: string | null; outfit: string | null; pet: string | null }
}
export const SHOP_KEY = 'bloom-shop-v1'
export const emptyShop: ShopState = {
  owned: [],
  spent: 0,
  equipped: { hat: null, outfit: null, pet: null },
}
export const SHOP_EVENT = 'bloom:shop-changed'

export function readShop(): ShopState {
  try {
    const value = JSON.parse(localStorage.getItem(SHOP_KEY) ?? 'null') as Partial<ShopState> | null
    return value ? { ...emptyShop, ...value, equipped: { ...emptyShop.equipped, ...value.equipped } } : emptyShop
  } catch {
    return emptyShop
  }
}

export function saveShop(state: ShopState) {
  try {
    localStorage.setItem(SHOP_KEY, JSON.stringify(state))
  } catch {
    /* Purchase applies for this visit. */
  }
  window.dispatchEvent(new Event(SHOP_EVENT))
}

export const petalBalance = (earned: number, shop: ShopState) =>
  Math.max(0, earned - shop.spent)

/** Buys an item if affordable and not owned; wearables are equipped at once. */
export function buy(shop: ShopState, earned: number, itemId: string): ShopState | null {
  const item = shopItems.find((i) => i.id === itemId)
  if (!item || shop.owned.includes(itemId)) return null
  if (petalBalance(earned, shop) < item.price) return null
  const next: ShopState = {
    ...shop,
    owned: [...shop.owned, itemId],
    spent: shop.spent + item.price,
  }
  if (item.kind !== 'decor' && item.kind !== 'garage') next.equipped = { ...shop.equipped, [item.kind]: itemId }
  return next
}

/** Wears an owned item, or takes it off when already worn. */
export function toggleEquip(shop: ShopState, itemId: string): ShopState {
  const item = shopItems.find((i) => i.id === itemId)
  if (!item || item.kind === 'decor' || item.kind === 'garage' || !shop.owned.includes(itemId))
    return shop
  const current = shop.equipped[item.kind]
  return {
    ...shop,
    equipped: { ...shop.equipped, [item.kind]: current === itemId ? null : itemId },
  }
}

/** Live shop + balance, refreshed when any part of the app changes them. */
export function useShop() {
  const [shop, setShop] = useState(readShop)
  const [earned, setEarned] = useState(() => readLogin().petals)
  useEffect(() => {
    const sync = () => {
      setShop(readShop())
      setEarned(readLogin().petals)
    }
    window.addEventListener(SHOP_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(SHOP_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  const update = (next: ShopState) => {
    saveShop(next)
    setShop(next)
  }
  return { shop, earned, balance: petalBalance(earned, shop), update }
}
