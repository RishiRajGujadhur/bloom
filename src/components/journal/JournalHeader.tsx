import type { Session } from '../../model'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
export function JournalHeader({
  session,
  onRate,
}: {
  session: Session
  onRate: (field: 'mood' | 'energy', value: number) => void
}) {
  const { t } = useTranslation(undefined, { i18n })
  return (
    <div className="ratings">
      {(['mood', 'energy'] as const).map((field) => (
        <fieldset key={field}>
          <legend>
            {field === 'mood' ? t('journal.mood') : t('journal.energy')}
          </legend>
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={t('journal.ratingAria', {
                  field:
                    field === 'mood'
                      ? t('journal.moodField')
                      : t('journal.energyField'),
                  n,
                })}
                aria-pressed={session.metadata[field] === n}
                onClick={() => onRate(field, n)}
              >
                {field === 'mood' ? ['😔', '🙁', '😐', '🙂', '😊'][n - 1] : n}
              </button>
            ))}
          </div>
          <small>
            {field === 'mood' ? t('journal.lowGreat') : t('journal.drainedEnergized')}
          </small>
        </fieldset>
      ))}
    </div>
  )
}