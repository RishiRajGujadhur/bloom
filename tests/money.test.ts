import { balanceCandles, budgetUse, detectSubscriptions, emptyMoney, formatMoney, netWorth, parseCsv, sumMinor, toMinor, totals, type Txn } from '../src/features/money/moneyModel'

const t = (date: string, amount: number, place: string, category = 'other', income = false): Txn => ({ id: `${date}${place}${amount}`, date, amount: toMinor(amount), place, category, income })

test('money math stays exact and formats in the chosen currency', () => {
  expect(sumMinor([toMinor(0.1), toMinor(0.2)])).toBe(30)
  expect(formatMoney(123456, 'USD')).toContain('1,234.56')
  expect(formatMoney(123456, 'EUR')).toMatch(/1.234|1,234/)
})

test('totals compare month and year with the previous period', () => {
  const txns = [t('2026-09-02', 100, 'A'), t('2026-08-02', 80, 'A'), t('2025-06-01', 50, 'B')]
  const r = totals(txns, '2026-09-27')
  expect(r.month).toBe(10000)
  expect(Math.round(r.monthChange!)).toBe(25)
  expect(r.year).toBe(18000)
})

test('subscriptions, budgets, candles, net worth and CSV import', () => {
  const txns = [t('2026-07-05', 9.99, 'Netflix'), t('2026-08-05', 9.99, 'Netflix'), t('2026-09-05', 10.49, 'Netflix'), t('2026-09-06', 40, 'Tesco', 'groceries')]
  expect(detectSubscriptions(txns)[0].place).toBe('Netflix')
  const store = { ...emptyMoney, txns, budgets: [{ category: 'groceries', limit: toMinor(50) }] }
  expect(budgetUse(store, '2026-09')[0].share).toBeCloseTo(0.8)
  expect(balanceCandles([t('2026-09-01', 100, 'Pay', 'other', true), t('2026-09-01', 30, 'Shop')], 0)[0]).toMatchObject({ open: 0, high: 100, close: 70 })
  expect(netWorth([{ id: 'a', name: 'Bank', kind: 'asset', value: 5000 }, { id: 'd', name: 'Card', kind: 'debt', value: 1500 }])).toBe(3500)
  const csv = parseCsv('Date,Description,Amount\n2026-09-01,Spotify,-9.99\n2026-09-02,Salary,2000')
  expect(csv[0]).toMatchObject({ place: 'Spotify', category: 'subscriptions', amount: 999 })
  expect(csv[1].income).toBe(true)
})
