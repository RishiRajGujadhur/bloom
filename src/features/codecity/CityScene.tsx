import { useEffect, useRef, useState } from 'react'
import { mountScene } from '../../platform/offscreen'
import type { FileStat } from './cityModel'
import CityRenderWorker from './cityRenderWorker?worker'

/**
 * The code city, rendered on its own thread (OffscreenCanvas + three.js
 * WebGPURenderer in a worker). Drag to orbit, hover a tower to read it.
 */
export function CityScene({ files }: { files: FileStat[] }) {
  const host = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ f: FileStat; x: number; y: number } | null>(null)
  const [info, setInfo] = useState<{ backend: string; offscreen: boolean } | null>(null)
  useEffect(() => {
    const el = host.current
    if (!el || !files.length) return
    const m = mountScene<FileStat[]>(el, {
      data: files,
      makeWorker: () => new CityRenderWorker(),
      loadFactory: () => import('./cityRender').then((x) => x.createCityScene),
      onEvent: (e) => {
        if (e.type === 'ready') setInfo(e.payload as { backend: string; offscreen: boolean })
        if (e.type === 'hover') setHover(e.payload as { f: FileStat; x: number; y: number } | null)
      },
    })
    return () => m.dispose()
  }, [files])
  return (
    <div className="cc-scene" role="img" aria-label={`3D code city of ${files.length} files`}>
      <div ref={host} className="cc-canvas" />
      {info ? <span className="cc-backend">{info.backend}{info.offscreen ? ' · render thread' : ''}</span> : null}
      {hover ? (
        <div className="cc-tip" style={{ left: hover.x + 14, top: hover.y + 10 }}>
          <b>{hover.f.path}</b>
          <span>{hover.f.churn} changes · {hover.f.churn ? Math.round((hover.f.late / hover.f.churn) * 100) : 0}% late-night · {(hover.f.size / 1024).toFixed(1)} KB</span>
        </div>
      ) : null}
    </div>
  )
}
