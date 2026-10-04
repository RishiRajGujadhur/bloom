export const COACH_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
export const COACH_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
export const COACH_HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
export const trackingAssets = [COACH_MODEL, COACH_HAND_MODEL, ...['vision_wasm_internal', 'vision_wasm_module_internal', 'vision_wasm_nosimd_internal'].flatMap(name => [`${COACH_WASM}/${name}.js`, `${COACH_WASM}/${name}.wasm`])]
export async function prepareCoachOffline(progress: (message: string) => void) {
  if (!navigator.serviceWorker?.controller) throw new Error('Offline setup requires the installed or production Bloom app. Reload once after its service worker activates; development preview may not support offline loading.')
  await Promise.all([import('@mediapipe/tasks-vision'), import('three')])
  // The first visit can load modules before the service worker takes control.
  // Explicitly retain those already-loaded page dependencies before going offline.
  const pageCache = await caches.open('bloom-lazy-assets')
  const pageAssets = [...new Set(performance.getEntriesByType('resource').map(entry => entry.name))]
    .filter(name => { const url = new URL(name); return url.origin === location.origin && url.pathname.startsWith('/assets/') })
  for (const url of pageAssets) {
    if (await caches.match(url)) continue
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Page file download failed (${response.status}). Retry while online.`)
    await pageCache.put(url, response)
  }
  const cache = await caches.open('bloom-coach-tracking-v1')
  for (let i = 0; i < trackingAssets.length; i++) {
    const url = trackingAssets[i]; progress(`Caching tracking files ${i + 1} / ${trackingAssets.length}…`)
    if (await cache.match(url)) continue
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) throw new Error(`Tracking file download failed (${response.status}). Retry while online.`)
    await cache.put(url, response)
  }
  progress('Tracking files cached. This visited Form Coach page can run offline in this browser; storage must be retained.')
}
