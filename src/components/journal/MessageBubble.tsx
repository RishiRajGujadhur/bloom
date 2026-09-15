import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { JournalMessage } from '../../model'
export function MessageBubble({ message }: { message: JournalMessage }) {
  const { t } = useTranslation(undefined, { i18n })
  return (
    <div className={`bubble ${message.sender}`}>
      <small>
        {message.sender === 'bot' ? t('journal.guideName') : t('journal.youName')}
      </small>
      <p>{message.text}</p>
    </div>
  )
}