import { Component, type ReactNode } from 'react'

/**
 * If a page crashes, show a friendly card with Try again / Go home instead of
 * a blank app. Keyed by page, so switching pages resets it.
 */
export class PageBoundary extends Component<{ children: ReactNode; onHome?: () => void }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error) {
    console.error('Page crashed:', error)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <section className="studio-card page-crash" role="alert">
        <svg viewBox="0 0 120 90" width="120" aria-hidden="true">
          <path d="M60 80 C 30 60, 20 40, 38 26 C 50 18, 60 28, 60 34 C 60 28, 70 18, 82 26 C 100 40, 90 60, 60 80 Z" fill="#ff8a5a" opacity="0.85" />
          <path d="M52 30 L60 46 L54 50 L64 70" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2>This page tripped over a root.</h2>
        <p>Your data is safe. Try again, or head back home.</p>
        <div className="page-crash-actions">
          <button type="button" className="studio-btn" onClick={() => this.setState({ error: null })}>Try again</button>
          {this.props.onHome && <button type="button" className="studio-btn" onClick={this.props.onHome}>Go home</button>}
        </div>
        <details><summary>Details</summary><code>{this.state.error.message}</code></details>
      </section>
    )
  }
}
