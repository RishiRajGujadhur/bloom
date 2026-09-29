import { useEffect, useRef, useState } from 'react'
import { mountScene } from '../../platform/offscreen'
import { watchPressure, type Pressure } from '../../platform/pressure'
import { mixer } from './mixerEngine'
import AuroraWorker from './auroraWorker?worker'

/**
 * The live spectrum of the mix as an aurora, rendered in a worker. The
 * analyser is read on the main thread and posted ~30 times a second; under
 * CPU pressure the render thread drops to fewer ribbons at 20 fps.
 */
export function Aurora({ playing }: { playing: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const [pressure, setPressure] = useState<{ state: Pressure; source: string }>({ state: 'nominal', source: '' })
  const [offscreen, setOffscreen] = useState(false)
  useEffect(() => {
    const el = host.current
    if (!el) return
    const scene = mountScene<null>(el, {
      data: null,
      makeWorker: () => new AuroraWorker(),
      loadFactory: () => import('./auroraScene').then((m) => m.createAuroraScene),
      onEvent: (e) => { if (e.type === 'ready') setOffscreen((e.payload as { offscreen: boolean }).offscreen) },
    })
    const stopWatch = watchPressure((state, source) => {
      setPressure({ state, source })
      scene.send('quality', state === 'serious' || state === 'critical' ? 'low' : 'high')
    })
    const buf = new Uint8Array(256)
    const id = setInterval(() => {
      const a = mixer.analyser
      if (!a || !mixer.playing) { scene.send('spectrum', new Uint8Array(64)); return }
      a.getByteFrequencyData(buf)
      scene.send('spectrum', buf.slice(0, 128))
    }, 33)
    return () => { clearInterval(id); stopWatch(); scene.dispose() }
  }, [])
  return (
    <div className="mx-aurora" data-matrix-native>
      <div ref={host} className="mx-aurora-host" aria-hidden="true" />
      <span className="mx-aurora-tag">
        {mixer.engine === 'simd' ? 'Live noise · Wasm SIMD, 4 voices' : mixer.engine === 'js' ? 'Live noise · audio thread' : playing ? 'Buffered noise' : 'Press play'}
        {offscreen ? ' · render thread' : ''}
        {pressure.state !== 'nominal' ? ` · CPU ${pressure.state}` : ''}
      </span>
    </div>
  )
}
