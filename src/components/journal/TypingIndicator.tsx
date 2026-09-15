import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
export function TypingIndicator() {
  const { t } = useTranslation()
  const reduced = useReducedMotion()
  return (
    <div
      className="typing"
      role="status"
      aria-label={t('journal.typing')}
    >
      <svg width="42" height="20" aria-hidden="true">
        {[0, 1, 2].map((n) => (
          <motion.circle
            key={n}
            cx={8 + n * 13}
            cy={10}
            r={3}
            fill="currentColor"
            animate={reduced ? {} : { opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1, delay: n * 0.15 }}
          />
        ))}
      </svg>
    </div>
  )
}