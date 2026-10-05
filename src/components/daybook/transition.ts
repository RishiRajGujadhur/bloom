import { flushSync } from 'react-dom'
import { prefersReducedMotion } from '../../utils/motion'

export function changeDaybookView(update: () => void) {
  if (prefersReducedMotion() || !document.startViewTransition) {
    update()
    return
  }
  document.startViewTransition(() => flushSync(update))
}
