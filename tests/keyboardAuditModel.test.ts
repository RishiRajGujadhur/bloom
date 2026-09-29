import { auditKiosk, KIOSK_FIXED, KIOSK_START, kioskTabOrder } from '../src/features/code/keyboardAuditModel'

describe('ticket kiosk keyboard audit', () => {
  it('exposes the confusing starter route and four specific failures', () => {
    expect(kioskTabOrder(KIOSK_START)).toEqual(['tickets', 'search', 'help'])
    expect(auditKiosk(KIOSK_START).map((item) => item.pass)).toEqual([false, false, false, false])
  })

  it('restores a natural route and visible focus cue', () => {
    expect(kioskTabOrder(KIOSK_FIXED)).toEqual(['menu', 'tickets', 'search'])
    expect(auditKiosk(KIOSK_FIXED).every((item) => item.pass)).toBe(true)
  })

  it('keeps positive tabindex ahead of otherwise normal controls', () => {
    expect(kioskTabOrder({ ...KIOSK_FIXED, ticketsTabIndex: 2 })).toEqual(['tickets', 'menu', 'search'])
  })
})
