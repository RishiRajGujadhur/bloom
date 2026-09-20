import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { Session } from '../../model'
import { Modal } from '../Modal'
import { JournalMediaGrid } from './JournalMediaGrid'
export function SummaryContent({ session }: { session: Session }) {
  const { t } = useTranslation(undefined, { i18n })
  const names: Record<string, string> = {
    reflection: t('journal.summaryReflection'),
    win: t('journal.summaryWin'),
    obstacle: t('journal.summaryObstacle'),
    action_step: t('journal.summaryActionStep'),
  }
  return (
    <>
      <p className="muted">
        {new Date(session.metadata.date).toLocaleDateString(i18n.language, {
          dateStyle: 'long',
        })}{' '}
        ·{' '}
        {t('journal.summaryMeta', {
          mood: session.metadata.mood ?? '—',
          energy: session.metadata.energy ?? '—',
        })}
      </p>
      {session.messages
        .filter((m) => m.sender === 'user')
        .map((m) => (
          <div className="summary-answer" key={m.id}>
            <h3>{names[m.category]}</h3>
            <p>{m.text}</p>
          </div>
        ))}
      {session.metadata.tags.length > 0 && (
        <p className="muted">{session.metadata.tags.join(' · ')}</p>
      )}
      <JournalMediaGrid attachments={session.metadata.attachments} />
    </>
  )
}
export function SessionSummaryModal({
  session,
  onClose,
}: {
  session: Session
  onClose: () => void
}) {
  const { t } = useTranslation(undefined, { i18n })
  return (
    <Modal title={t('journal.summaryTitle')} onClose={onClose}>
      <SummaryContent session={session} />
      <button className="primary full" onClick={onClose}>
        {t('journal.summaryBack')}
      </button>
    </Modal>
  )
}
