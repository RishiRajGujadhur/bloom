import { useTranslation } from 'react-i18next'
import type { Session } from '../../model'
export function JournalHeader({
  session,
  onRate,
}: {
  session: Session
  onRate: (field: 'mood' | 'energy', value: number) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="ratings">
      {(['mood', 'energy'] as const).map((field) => (
        <fieldset key={field}>
          <legend>
            {field === 'mood' ? t('checkin.moodLegend') : t('checkin.energyLegend')}
          </legend>
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={t('checkin.ratingAria', {
                  field:
                    field === 'mood'
                      ? t('checkin.moodField')
                      : t('checkin.energyField'),
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
            {field === 'mood' ? t('checkin.moodRange') : t('checkin.energyRange')}
          </small>
        </fieldset>
      ))}
    </div>
  )
}