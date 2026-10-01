import { parseIcs } from '../src/features/planning/icsImport'

test('reads summary, start and end of each event', () => {
  const ics = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'SUMMARY:Dentist\\, check-up', 'DTSTART:20261002T090000Z', 'DTEND:20261002T093000Z', 'END:VEVENT', 'BEGIN:VEVENT', 'SUMMARY:Lunch', 'DTSTART;TZID=Europe/London:20261003T120000', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  const events = parseIcs(ics)
  expect(events).toHaveLength(2)
  expect(events[0].title).toBe('Dentist, check-up')
  expect(events[0].start.toISOString()).toBe('2026-10-02T09:00:00.000Z')
  expect(+events[0].end - +events[0].start).toBe(30 * 60000)
  expect(events[1].start.getHours()).toBe(12)
  expect(+events[1].end - +events[1].start).toBe(60 * 60000)
})
