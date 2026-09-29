export type KioskRepair = {
  menuElement: 'div' | 'button'
  ticketsTabIndex: 0 | 2
  helpTabIndex: -1 | 0
  focusRing: boolean
}

export const KIOSK_START: KioskRepair = { menuElement: 'div', ticketsTabIndex: 2, helpTabIndex: 0, focusRing: false }
export const KIOSK_FIXED: KioskRepair = { menuElement: 'button', ticketsTabIndex: 0, helpTabIndex: -1, focusRing: true }

export const KIOSK_ITEMS = [
  { id: 'menu', label: 'Menu', x: 65 },
  { id: 'tickets', label: 'Tickets', x: 175 },
  { id: 'search', label: 'Search', x: 285 },
  { id: 'help', label: 'Hidden help', x: 395 },
] as const

export function kioskTabOrder(repair: KioskRepair): string[] {
  const normal = [repair.menuElement === 'button' ? 'menu' : '', repair.ticketsTabIndex === 0 ? 'tickets' : '', 'search', repair.helpTabIndex === 0 ? 'help' : ''].filter(Boolean)
  return repair.ticketsTabIndex > 0 ? ['tickets', ...normal] : normal
}

export function auditKiosk(repair: KioskRepair) {
  return [
    { label: 'Menu is a keyboard-operable button', pass: repair.menuElement === 'button', hint: 'A clickable div is not in the normal Tab sequence. Use a native button.' },
    { label: 'Tickets follows Menu in document order', pass: repair.ticketsTabIndex === 0, hint: 'Positive tabindex moves Tickets ahead of earlier controls. Use 0 for natural order.' },
    { label: 'Offscreen Help is skipped', pass: repair.helpTabIndex === -1, hint: 'An offscreen control should not receive Tab focus. Set its tabindex to -1 until shown.' },
    { label: 'Focused control has a visible ring', pass: repair.focusRing, hint: 'Enable a visible focus indicator so keyboard users can see where they are.' },
  ]
}
