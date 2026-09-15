import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
export function PromptChips({
  chips,
  disabled,
  onChoose,
}: {
  chips: readonly string[]
  disabled: boolean
  onChoose: (text: string) => void
}) {
  const { t } = useTranslation(undefined, { i18n })
  return (
    <div className="chips" aria-label={t('journal.suggestedReplies')}>
      {chips.map((chip) => (
        <button disabled={disabled} key={chip} onClick={() => onChoose(chip)}>
          {chip}
        </button>
      ))}
    </div>
  )
}