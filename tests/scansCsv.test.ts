import { scansToCsv } from '../src/features/readiness/readinessModel'

test('exports scans oldest first with a header', () => {
  const base = { source: 'simulated' as const, hr: 60, rmssd: 50, sdnn: 55, lnRmssd: Math.log(50), lfhf: null, beats: 60, score: 72 }
  const csv = scansToCsv([{ ...base, date: '2026-09-30', at: new Date(2026, 8, 30, 7, 5).getTime() }, { ...base, date: '2026-09-29', at: new Date(2026, 8, 29, 7, 0).getTime(), score: null }])
  const lines = csv.trim().split('\n')
  expect(lines[0]).toBe('date,time,source,heart_rate_bpm,rmssd_ms,sdnn_ms,ln_rmssd,lf_hf,beats,readiness')
  expect(lines[1]).toBe('2026-09-29,07:00,simulated,60,50,55,3.912,,60,')
  expect(lines[2].endsWith(',72')).toBe(true)
})
