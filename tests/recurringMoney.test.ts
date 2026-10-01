import { catchUpRecurring, type Txn } from '../src/features/money/moneyModel'

const rent: Txn = { id: 'a', date: '2026-07-15', amount: 90000, category: 'home', place: 'Rent', repeat: 'monthly', series: 'a' }

test('adds each missed month up to today, once', () => {
  const added = catchUpRecurring([rent], '2026-09-30')
  expect(added.map((t) => t.date)).toEqual(['2026-08-15', '2026-09-15'])
  expect(catchUpRecurring([rent, ...added], '2026-09-30')).toEqual([])
})

test('ignores one-off transactions and clamps short months', () => {
  const gym: Txn = { id: 'g', date: '2026-01-31', amount: 3000, category: 'fun', place: 'Gym', repeat: 'monthly', series: 'g' }
  const once: Txn = { id: 'o', date: '2026-01-01', amount: 100, category: 'fun', place: 'Once' }
  expect(catchUpRecurring([gym, once], '2026-03-05').map((t) => t.date)).toEqual(['2026-02-28'])
})
