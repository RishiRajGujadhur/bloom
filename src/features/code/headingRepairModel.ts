export const HEADING_STARTER = `<main>
  <h1>Our neighborhood garden</h1>
  <p>Find a place to grow with us.</p>
  <h3>Getting started</h3>
  <h5>Choose a plot</h5>
  <p>Pick a space that suits your schedule.</p>
  <h4>Bring your tools</h4>
  <h2>Community events</h2>
  <h4>Weekend planting</h4>
</main>`

export type HeadingCheck = { label: string; pass: boolean; hint: string }

export function checkHeadingHierarchy(source: string): HeadingCheck[] {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  const headings = Array.from(doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6'))
  const levels = headings.map((heading) => Number(heading.tagName.slice(1)))
  const first = levels[0] === 1
  const oneMain = headings.filter((heading) => heading.tagName === 'H1').length === 1
  const noSkips = levels.every((level, index) => index === 0 || level <= levels[index - 1] + 1)
  const named = headings.length >= 4 && headings.every((heading) => !!heading.textContent?.trim())
  const order = headings.map((heading) => heading.textContent?.trim()).join('|') ===
    'Our neighborhood garden|Getting started|Choose a plot|Bring your tools|Community events|Weekend planting'
  return [
    { label: 'Start with a level-one heading', pass: first, hint: 'The page title should be an <h1>.' },
    { label: 'Use one page title', pass: oneMain, hint: 'Keep exactly one <h1> for this page.' },
    { label: 'Move down one level at a time', pass: noSkips, hint: 'A child section can follow at one level deeper. Returning to a higher level is fine.' },
    { label: 'Keep every heading descriptive', pass: named, hint: 'Keep all six original headings and give each visible text.' },
    { label: 'Preserve the story order', pass: order, hint: 'Keep the garden title, getting started steps, and community events in their original order.' },
  ]
}
