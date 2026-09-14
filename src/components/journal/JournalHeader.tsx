import type { Session } from '../../model'
export function JournalHeader({
  session,
  onRate,
}: {
  session: Session
  onRate: (field: 'mood' | 'energy', value: number) => void
}) {
  return (
    <div className="ratings">
      {(['mood', 'energy'] as const).map((field) => (
        <fieldset key={field}>
          <legend>
            {field === 'mood' ? 'How’s your mood?' : 'Your energy level'}
          </legend>
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={`${field} ${n} of 5`}
                aria-pressed={session.metadata[field] === n}
                onClick={() => onRate(field, n)}
              >
                {field === 'mood' ? ['😔', '🙁', '😐', '🙂', '😊'][n - 1] : n}
              </button>
            ))}
          </div>
          <small>
            {field === 'mood' ? 'Low → Great' : 'Drained → Energized'}
          </small>
        </fieldset>
      ))}
    </div>
  )
}
