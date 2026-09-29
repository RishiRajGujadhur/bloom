/// <reference lib="webworker" />
/**
 * Code City worker: each core walks a slice of commit/parent tree pairs from
 * the picked repository (read-only, via the File System Access handle, which
 * workers can receive) and reports which files each commit touched.
 */
import { servePool } from '../../platform/workerPool'
import { changedFiles, fsaFs } from './gitReader'

export type CityTask = { handle: FileSystemDirectoryHandle; pairs: [string, string | null][] }
export type CityResult = Record<string, string[]>

servePool<CityTask, CityResult>(async ({ handle, pairs }) => {
  const fs = fsaFs(handle)
  const out: CityResult = {}
  for (const [oid, parent] of pairs) {
    try { out[oid] = await changedFiles(fs, '/', oid, parent) } catch { out[oid] = [] }
  }
  return out
})
