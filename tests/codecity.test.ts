import fs from 'fs'
import path from 'path'
import { changedFiles, headFiles, listCommits } from '../src/features/codecity/gitReader'
import { fileStats, local, radar, rhythm, type CommitLite } from '../src/features/codecity/cityModel'

const repo = path.resolve(__dirname, '..')

describe('Code City', () => {
  it('reads this repository’s history with isomorphic-git', async () => {
    const commits = await listCommits(fs as never, repo, 5)
    expect(commits.length).toBe(5)
    expect(commits[0].oid).toMatch(/^[0-9a-f]{40}$/)
    const files = await changedFiles(fs as never, repo, commits[0].oid, commits[0].parent)
    expect(files.length).toBeGreaterThan(0)
  }, 60_000)

  it('lists files at HEAD with sizes', async () => {
    const files = await headFiles(fs as never, repo)
    const pkg = files.find((f) => f.path === 'package.json')
    expect(pkg && pkg.size).toBeGreaterThan(100)
  }, 120_000)

  it('uses the commit’s own timezone for the local hour', () => {
    // 23:30 in UTC+1 (git/JS offset -60) is 22:30 UTC.
    expect(local(Date.parse('2026-09-29T22:30:00Z'), -60).hour).toBe(23)
  })

  it('churn and late-night heat per file; rhythm and radar flag late, weekend, no-break work', () => {
    const day = (d: number, h: number) => Date.parse(`2026-09-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00Z`)
    const commits: CommitLite[] = []
    for (let d = 1; d <= 20; d++) commits.push({ ts: day(d, 23), tz: 0, author: 'a', files: ['src/app.ts'] }, { ts: day(d, 10), tz: 0, author: 'a', files: ['src/util.ts'] })
    const stats = fileStats(commits, new Map([['src/app.ts', 1000], ['src/util.ts', 500], ['README.md', 10]]))
    const app = stats.find((s) => s.path === 'src/app.ts')!
    expect(app.churn).toBe(20)
    expect(app.late).toBe(20)
    expect(stats.find((s) => s.path === 'README.md')!.churn).toBe(0)
    const r = rhythm(commits, Date.parse('2026-09-21T12:00:00Z'))
    expect(r.lateNights).toBeCloseTo(0.5)
    expect(r.noBreak).toBe(1)
    const rd = radar(r, { sleepHours: 5.5, mood: 4, readiness: 40 })
    expect(rd.risk).toBeGreaterThan(55)
    expect(rd.notes.join(' ')).toMatch(/after 10 pm/)
    expect(radar(rhythm([], Date.now()), { sleepHours: 8, mood: 8, readiness: 80 }).risk).toBe(0)
  })
})
