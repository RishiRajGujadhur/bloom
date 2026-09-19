import '@testing-library/jest-dom'

// The browser Lottie runtime needs a canvas implementation that JSDOM does not provide.
jest.mock('@lottiefiles/react-lottie-player', () => ({
  Player: ({ className }: { className?: string }) => require('react').createElement('div', { className, 'data-testid': 'lottie-player' }),
}))
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
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
