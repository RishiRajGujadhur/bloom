import { useCallback, useEffect, useRef, useState } from 'react'
import { initialBreath, pacer, stepBreath } from './breathSignal'

/**
 * Live breath value (0–1) in a ref, updated every animation frame so WebGL
 * can read it without re-rendering React. Uses Meyda on the microphone when
 * enabled, otherwise a gentle 4-in / 6-out pacer.
 */
export function useBreath() {
  const value = useRef(0.3)
  const [mic, setMic] = useState<'off' | 'starting' | 'on' | 'blocked'>('off')
  const [breaths, setBreaths] = useState(0)
  const stop = useRef<() => void>(() => {})

  const start = useCallback(async () => {
    setMic('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      const { default: Meyda } = await import('meyda')
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      let state = initialBreath()
      let last = performance.now()
      const analyzer = Meyda.createMeydaAnalyzer({
        audioContext: ctx,
        source,
        bufferSize: 1024,
        featureExtractors: ['rms', 'spectralFlatness'],
        callback: (f: { rms: number; spectralFlatness: number }) => {
          const now = performance.now()
          state = stepBreath(state, { rms: f.rms, flatness: f.spectralFlatness ?? 0, dt: Math.min(0.1, (now - last) / 1000) })
          last = now
          value.current = state.value
          setBreaths((b) => (b === state.breaths ? b : state.breaths))
        },
      })
      analyzer.start()
      stop.current = () => {
        analyzer.stop()
        stream.getTracks().forEach((t) => t.stop())
        void ctx.close()
      }
      setMic('on')
    } catch {
      setMic('blocked')
    }
  }, [])

  const end = useCallback(() => {
    stop.current()
    stop.current = () => {}
    setMic('off')
  }, [])

  // Pacer drives the value whenever the mic isn't listening.
  useEffect(() => {
    if (mic === 'on') return
    let raf = 0
    const t0 = performance.now()
    const tick = () => {
      value.current = pacer((performance.now() - t0) / 1000)
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [mic])
  useEffect(() => () => stop.current(), [])

  return { value, mic, breaths, start, end }
}
