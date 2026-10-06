import '@testing-library/jest-dom'

// The browser Lottie runtime needs a canvas implementation that JSDOM does not provide.
jest.mock('@lottiefiles/react-lottie-player', () => ({
  Player: ({ className }: { className?: string }) =>
    require('react').createElement('div', {
      className,
      'data-testid': 'lottie-player',
    }),
}))

/* --------------------------------------------------------------------------
   Controllable viewport for media-query driven UI.

   `max-width` queries report false by default, which keeps every pre-existing
   test on the wide-screen layout. Tests that need the drawer call
   setNarrowScreen(true), which re-fires change listeners like a real resize.
   -------------------------------------------------------------------------- */

type MediaListener = (event: MediaQueryListEvent) => void

const WIDE_WIDTH = 1440

let viewportWidth = WIDE_WIDTH
let listeners: { query: string; fn: MediaListener }[] = []

const evaluate = (query: string) => {
  const max = /max-width:\s*(\d+)px/.exec(query)
  const min = /min-width:\s*(\d+)px/.exec(query)
  let matches = true
  if (max) matches = matches && viewportWidth <= Number(max[1])
  if (min) matches = matches && viewportWidth >= Number(min[1])
  return matches
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: evaluate(query),
    media: query,
    onchange: null,
    addListener: (fn: MediaListener) => listeners.push({ query, fn }),
    removeListener: (fn: MediaListener) => {
      listeners = listeners.filter((entry) => entry.fn !== fn)
    },
    addEventListener: (_type: string, fn: MediaListener) =>
      listeners.push({ query, fn }),
    removeEventListener: (_type: string, fn: MediaListener) => {
      listeners = listeners.filter((entry) => entry.fn !== fn)
    },
    dispatchEvent: () => true,
  }),
})

/** Pretend the window was resized; notifies every registered listener. */
export const setViewportWidth = (width: number) => {
  viewportWidth = width
  for (const { query, fn } of [...listeners]) {
    fn({ matches: evaluate(query), media: query } as MediaQueryListEvent)
  }
}

export const setNarrowScreen = (narrow: boolean) =>
  setViewportWidth(narrow ? 600 : WIDE_WIDTH)

/** Clear theme/sidebar attributes so cases cannot leak into one another. */
export const resetThemeAttributes = () => {
  for (const attribute of [
    'data-theme',
    'data-font',
    'data-mode',
    'data-sidebar',
  ]) {
    document.documentElement.removeAttribute(attribute)
  }
  document.documentElement.style.removeProperty('--accent-color')
}

export const resetMatchMedia = () => {
  viewportWidth = WIDE_WIDTH
  listeners = []
}

HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open')
}
Element.prototype.scrollTo = jest.fn()
Element.prototype.scrollIntoView = jest.fn()

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})
window.scrollTo = jest.fn()

// jsdom lacks the observers Embla (carousel) and Radix (menus) rely on.
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
for (const name of ['IntersectionObserver', 'ResizeObserver'] as const)
  if (!(name in globalThis))
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: ObserverStub,
    })

// Existing tests start past the welcome onboarding (it has its own tests).
jest.mock('../src/features/welcome/welcomeModel', () => ({
  ...jest.requireActual('../src/features/welcome/welcomeModel'),
  welcomeDone: () => true,
}))

// chatscope uses selectors jsdom's engine cannot parse; render plain markup in tests.
jest.mock('@chatscope/chat-ui-kit-react', () => {
  const React = require('react')
  const Box = ({ children }: { children?: unknown }) => React.createElement('div', null, children)
  return {
    MainContainer: Box,
    ChatContainer: Box,
    MessageList: ({ children, typingIndicator }: { children?: unknown; typingIndicator?: unknown }) => React.createElement('div', { role: 'log' }, children, typingIndicator),
    Message: ({ model }: { model: { message: string } }) => React.createElement('p', null, model.message),
    TypingIndicator: ({ content }: { content: string }) => React.createElement('span', null, content),
  }
})

// Tests were written for the side-column navigation; the hamburger default
// is off here unless a test sets it.
const realGetItem = Storage.prototype.getItem
Storage.prototype.getItem = function (key: string) {
  const v = realGetItem.call(this, key)
  if (v === null && key === 'bloom-nav-hamburger') return '0'
  // Sidebar groups start expanded in tests so every destination is reachable.
  if (v === null && key === 'bloom-nav-groups') return '[0,1,2,3,4,5,6]'
  return v
}

// Radix Select scrolls its highlighted item into view.
Element.prototype.scrollIntoView = jest.fn()

// JSDOM has no fullscreen support. Its selector engine otherwise recurses while
// evaluating the fullscreen rules in its default stylesheet for Radix portals.
const nativeMatches = Element.prototype.matches
Element.prototype.matches = function (selector: string) {
  if (selector === ':fullscreen') return false
  return nativeMatches.call(this, selector)
}
