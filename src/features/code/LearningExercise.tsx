import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import './learningExercise.css'

type LearningExerciseProps = Omit<ComponentPropsWithoutRef<'section'>, 'title'> & {
  title: ReactNode
  description: ReactNode
  onClose: () => void
  backSizing?: 'fixed' | 'minimum' | 'feature'
}

/** Shared frame for learning activities; drafts and grading stay in each activity. */
export function LearningExercise({
  title,
  description,
  onClose,
  backSizing = 'fixed',
  className,
  children,
  ...props
}: LearningExerciseProps) {
  const classes = ['bloom-surface', 'learning-exercise', className]
  if (backSizing !== 'feature') classes.push('learning-exercise--shared-back')
  if (backSizing === 'minimum') classes.push('learning-exercise--minimum-back')

  return (
    <section {...props} className={classes.filter(Boolean).join(' ')}>
      <header>
        <button type="button" onClick={onClose} aria-label="Back to learning path">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </section>
  )
}
