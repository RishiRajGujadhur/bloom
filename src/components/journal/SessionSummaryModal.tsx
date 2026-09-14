import type { Session } from '../../model'
import { Modal } from '../Modal'
export function SummaryContent({ session }: { session: Session }) {
  const names = {
    reflection: 'Your check-in',
    win: 'A win to remember',
    obstacle: 'What you worked through',
    action_step: 'Your next small step',
  }
  return (
    <>
      <p className="muted">
        {new Date(session.metadata.date).toLocaleDateString(undefined, {
          dateStyle: 'long',
        })}{' '}
        · Mood {session.metadata.mood ?? '—'}/5 · Energy{' '}
        {session.metadata.energy ?? '—'}/5
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
  return (
    <Modal title="A moment worth keeping" onClose={onClose}>
      <SummaryContent session={session} />
      <button className="primary full" onClick={onClose}>
        Back to my day
      </button>
    </Modal>
  )
}
