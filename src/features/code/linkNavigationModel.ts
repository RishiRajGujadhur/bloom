export const LINK_STARTER = `<nav aria-label="Studio pages">
  <a href="#home">Home</a>
  <a href="#gallery">See gallery</a>
  <a href="#contact">Click here</a>
</nav>
<main>
  <section id="home"><h1>Moonlight Studio</h1><p>Welcome to our creative space.</p></section>
  <section id="work"><h2>Gallery</h2><p>Browse our work.</p></section>
  <section id="contact"><h2>Contact</h2><p>Let's make something together.</p></section>
</main>`

export type LinkCheck = { label: string; pass: boolean; hint: string }

export function checkLinkNavigation(source: string): LinkCheck[] {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  const nav = doc.querySelector('nav')
  const anchors = Array.from(nav?.querySelectorAll('a') ?? [])
  const targets = new Map<string, Element>()
  for (const element of Array.from(doc.querySelectorAll('[id]'))) {
    if (!targets.has(element.id)) targets.set(element.id, element)
  }
  const sections = ['home', 'work', 'contact']
  return [
    { label: 'A named navigation landmark', pass: !!nav?.getAttribute('aria-label')?.trim(), hint: 'Give <nav> an aria-label that describes this set of links.' },
    { label: 'Three studio destinations', pass: sections.every((id) => !!doc.querySelector(`main section#${id}`)), hint: 'Keep sections with ids home, work, and contact inside <main>.' },
    { label: 'Every link reaches a unique section', pass: anchors.length === 3 && new Set(anchors.map((a) => a.getAttribute('href'))).size === 3 && anchors.every((a) => {
      const href = a.getAttribute('href') ?? ''
      return /^#[A-Za-z][\w-]*$/.test(href) && targets.get(href.slice(1))?.tagName === 'SECTION'
    }), hint: 'Use three distinct #id links that match real section ids. The Gallery section is #work.' },
    { label: 'Links describe where they go', pass: anchors.length === 3 && anchors.every((a) => {
      const text = a.textContent?.trim() ?? ''
      return text.length >= 4 && !/^(click here|here|more|link|read more)$/i.test(text)
    }), hint: 'Replace vague text like “Click here” with the destination name.' },
    { label: 'Main content has a page heading', pass: !!doc.querySelector('main h1')?.textContent?.trim(), hint: 'Keep one meaningful <h1> inside <main>.' },
  ]
}

export function navigationNodes(source: string) {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  const links = Array.from(doc.querySelectorAll('nav a'))
  return links.map((link) => {
    const href = link.getAttribute('href') ?? ''
    const target = href.startsWith('#') ? doc.getElementById(href.slice(1)) : null
    return { text: link.textContent?.trim() || 'Unnamed link', href, target: target?.querySelector('h1,h2,h3')?.textContent?.trim() || 'Missing destination', valid: target?.tagName === 'SECTION' }
  })
}
