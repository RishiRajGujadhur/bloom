import { parseReceipt, toAmount } from '../src/features/money/receiptModel'

const lines = (s: string) => s.trim().split('\n').map((text) => ({ text }))
const today = new Date('2026-09-30T12:00:00')

describe('Receipt Lens parsing', () => {
  it('reads a supermarket receipt: shop, date, items and total (not subtotal or cash)', () => {
    const r = parseReceipt(lines(`
GREENLEAF MARKET
12 High Street, Bristol BS1 4DJ
Tel 0117 496 0000
28/09/2026 18:42
Oat milk 1L          1.85
Sourdough loaf       3.20
Bananas 1.2kg        1.14
Free range eggs x12  3.95
SUBTOTAL            10.14
VAT                  0.00
TOTAL               10.14
CASH                20.00
CHANGE               9.86
Thank you!`), today)
    expect(r.place).toBe('GREENLEAF MARKET')
    expect(r.date).toBe('2026-09-28')
    expect(r.total).toBe(10.14)
    expect(r.items.map((i) => i.name)).toEqual(['Oat milk 1L', 'Sourdough loaf', 'Bananas 1.2kg', 'Free range eggs x12'])
  })

  it('handles decimal commas and symbols', () => {
    expect(toAmount('€3,50')).toBe(3.5)
    expect(toAmount('1,234.56')).toBe(1234.56)
    const r = parseReceipt(lines(`
Café Lumière
Paris, 12 sept. 2026
2 x Croissant      4,80 €
Café crème         3,90 €
Total à payer      8,70 €`), today)
    expect(r.total).toBe(8.7)
    expect(r.place).toBe('Café Lumière')
  })

  it('falls back to the largest amount when there is no total line', () => {
    const r = parseReceipt(lines(`
Corner Kiosk
Water 0.99
Crisps 1.49
Paid 2.48`), today)
    expect(r.total).toBe(2.48)
  })
})
