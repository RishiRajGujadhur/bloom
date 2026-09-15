import { useTranslation } from 'react-i18next'
import type { JournalMessage } from '../../model'
export function MessageBubble({ message }: { message: JournalMessage }) {
  const { t } = useTranslation()
  return (
    <div className={`bubble ${message.sender}`}>
      <small>
        {message.sender === 'bot' ? t('journal.guideName') : t('journal.youName')}
      </small>
      <p>{message.text}</p>
    </div>
  )
}