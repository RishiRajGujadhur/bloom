import type { JournalMessage } from '../../model'
export function MessageBubble({ message }: { message: JournalMessage }) {
  return (
    <div className={`bubble ${message.sender}`}>
      <small>
        {message.sender === 'bot' ? 'YOUR REFLECTION GUIDE' : 'YOU'}
      </small>
      <p>{message.text}</p>
    </div>
  )
}
