import { useEffect, useRef, useState } from 'react'
import { mountScene, type MountedScene } from '../../platform/offscreen'
import SpectroWorker from './spectroWorker?worker'
import type { SpectroData } from './spectroScene'

/**
 * The 3D spectral mountain: time runs away from you, pitch runs left to right,
 * loudness is height. It renders on its own thread (OffscreenCanvas in a
 * worker, three.js WebGPURenderer) so the page stays smooth while audio is
 * processed; switching A/B morphs the terrain and a laser playhead rides along.
 */
export function Spectro3D({ before, after, showAfter, progress }: { before: Uint8Array; after: Uint8Array | null; showAfter: boolean; progress: number }) {
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<MountedScene | null>(null)
  const [info, setInfo] = useState<{ backend: string; offscreen: boolean } | null>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const data: SpectroData = { before: before.slice(), after: after?.slice() ?? null }
    const m = mountScene<SpectroData>(el, {
      data,
      makeWorker: () => new SpectroWorker(),
      loadFactory: () => import('./spectroScene').then((x) => x.createSpectroScene),
      onEvent: (e) => { if (e.type === 'ready') setInfo(e.payload as { backend: string; offscreen: boolean }) },
    })
    scene.current = m
    return () => { m.dispose(); scene.current = null }
  }, [before, after])

  useEffect(() => { scene.current?.send('morph', showAfter && after ? 1 : 0) }, [showAfter, after])
  useEffect(() => { scene.current?.send('play', progress) }, [progress])

  return (
    <div className="sl-mountain" role="img" aria-label={`3D spectrogram of the ${showAfter && after ? 'cleaned' : 'original'} recording`}>
      <div ref={host} className="sl-canvas-host" />
      {info ? <span className="sl-backend">{info.backend}{info.offscreen ? ' · render thread' : ''}</span> : null}
    </div>
  )
}
