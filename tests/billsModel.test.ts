import { answer, parseBill, type Bill } from '../src/features/money/billsModel'

const ref = new Date('2026-09-30T12:00:00')
const money = (n: number) => `£${n.toFixed(2)}`

describe('Bills Inbox parsing', () => {
  it('reads an energy bill: sender, amount due, due date and account', () => {
    const b = parseBill(`BRIGHTWATT ENERGY
Account number: BW-4471902
Statement date 22 September 2026
Your electricity bill
Amount due £84.37
Please pay by 14 October 2026`, ref)
    expect(b.biller).toBe('BRIGHTWATT ENERGY')
    expect(b.amount).toBe(84.37)
    expect(b.due).toBe('2026-10-14')
    expect(b.reference).toBe('BW-4471902')
    expect(b.kind).toBe('bill')
  })

  it('reads a renewal notice', () => {
    const b = parseBill(`Harbour Motor Insurance
Policy number HMI-88213
Your policy renews on 3 November 2026
Your new annual premium is £612.40`, ref)
    expect(b.renews).toBe('2026-11-03')
    expect(b.amount).toBe(612.4)
  })

  it('answers when and how much from the matched bill', () => {
    const b = { ...parseBill(`Harbour Motor Insurance
Policy number HMI-88213
Your policy renews on 3 November 2026
Your new annual premium is £612.40`, ref), id: 'x', scannedAt: 0, image: '' } as Bill
    const a = answer('When does my car insurance renew and how much?', b, money)
    expect(a).toMatch(/renews on 3 November 2026/)
    expect(a).toMatch(/£612\.40/)
  })
})
