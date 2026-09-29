import { PROFILE_REVIEW, PROFILE_START, profileChecklist, projectBriefMarkdown } from '../src/features/code/profileProjectModel'

test('requires a complete brief and verified launch checks', () => {
  expect(profileChecklist(PROFILE_START).every((item) => item.pass)).toBe(false)
  const complete = { name: 'Ada', tagline: 'I build tools for shared gardens.', project: 'Garden map', outcome: 'Neighbors can find gardens and upcoming events.', email: 'ada@example.com', url: 'https://example.com/profile', verified: Object.fromEntries(PROFILE_REVIEW.map((item) => [item.id, true])) }
  expect(profileChecklist(complete).every((item) => item.pass)).toBe(true)
  expect(profileChecklist({ ...complete, url: 'http://example.com' }).find((item) => item.id === 'deployed')?.pass).toBe(false)
  expect(projectBriefMarkdown(complete)).toContain('- [x] Every link works with Tab and Enter')
})
