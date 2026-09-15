import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { Session } from '../../model'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
export function MessageFeed({ session }: { session: Session }) {
  const { t } = useTranslation(undefined, { i18n })
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    ref.current?.scrollTo?.({
      top: ref.current.scrollHeight,
      behavior: reduced ? 'instant' : 'smooth',
    })
  }, [session.messages.length, session.flow.typing, reduced])
  return (
    <div
      ref={ref}
      className="message-feed"
      role="log"
      aria-label={t('journal.journalConversation')}
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {session.messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MessageBubble message={message} />
          </motion.div>
        ))}
      </AnimatePresence>
      {session.flow.typing && <TypingIndicator />}
    </div>
  )
}