import gsap from 'gsap'

/** Pause global GSAP work while Bloom is hidden, then restore its prior state. */
export function pauseGsapWhenHidden(): () => void {
  let pausedByBloom = false
  const sync = () => {
    if (document.hidden) {
      if (!gsap.globalTimeline.paused()) {
        gsap.globalTimeline.pause()
        pausedByBloom = true
      }
    } else if (pausedByBloom) {
      gsap.globalTimeline.resume()
      pausedByBloom = false
    }
  }
  document.addEventListener('visibilitychange', sync)
  sync()
  return () => {
    document.removeEventListener('visibilitychange', sync)
    if (pausedByBloom) gsap.globalTimeline.resume()
  }
}
