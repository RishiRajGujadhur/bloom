import { fireEvent, screen } from '@testing-library/react'

/** Expand every "Show more" list (Settings shows a few features at a time). */
export function showAll() {
  for (let i = 0; i < 50; i++) {
    const more = screen.queryAllByRole('button', { name: /^Show all \d+$|^Show \d+ / })
    if (!more.length) return
    more.forEach((b) => fireEvent.click(b))
  }
}
