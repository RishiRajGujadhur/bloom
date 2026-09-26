import { Component, type ReactNode } from 'react'

let cached: boolean | null = null
/** True when the browser can create a WebGL context. */
export function hasWebGL() {
  if (cached !== null) return cached
  try {
    if (typeof window === 'undefined' || /jsdom/i.test(navigator.userAgent)) return (cached = false)
    const canvas = document.createElement('canvas')
    cached = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    cached = false
  }
  return cached
}

/**
 * Wraps a 3D scene: renders a friendly fallback when WebGL is missing or the
 * scene throws, so a 3D extra never breaks the page around it.
 */
export class Scene3D extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: !hasWebGL() }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        this.props.fallback ?? (
          <div className="scene-fallback" role="status">
            This view needs 3D graphics (WebGL), which isn’t available here.
          </div>
        )
      )
    return this.props.children
  }
}
