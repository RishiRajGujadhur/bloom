import '@testing-library/jest-dom'

/**
 * Controllable media-query stub.
 *
 * jsdom has no layout engine, so media queries must be driven explicitly.
 * `matches: false` (the default) means "wide screen": the sidebar renders as a
 * column and the drawer stays disabled.
 */
let mediaMatches: (query: string) => boolean = () => false

export const setMediaMatches = (matcher: (query: string) => boolean) => {
  mediaMatches = matcher
}

/** True only for the sidebar's drawer breakpoint. */
export const setNarrowScreen = (narrow: boolean) => {
  mediaMatches = (query) => (query.includes('900px') ? narrow : false)
}

export const resetMediaMatches = () => {
  mediaMatches = () => false
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    get matches() {
      return mediaMatches(query)
    },
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
})

HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open')
}
Element.prototype.scrollTo = jest.fn()
Element.prototype.scrollIntoView = jest.fn()

/** Theme attributes leak between tests through the shared jsdom document. */
export const resetThemeAttributes = () => {
  const root = document.documentElement
  for (const attribute of [
    'data-theme',
    'data-font',
    'data-mode',
    'data-sidebar',
    'data-motion',
    'data-density',
  ]) {
    root.removeAttribute(attribute)
  }
  root.removeAttribute('style')
}
