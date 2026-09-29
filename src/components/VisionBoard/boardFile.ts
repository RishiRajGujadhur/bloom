import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { BoardEdge, BoardNode } from '../../search/db'

/**
 * The .bloomboard file: a zip (fflate) holding board.json plus every image as
 * its own JPEG, so a board can be saved to disk, shared with a friend and
 * opened straight into Bloom (the installed app is a handler for .bloomboard).
 */
export const BOARD_EXT = '.bloomboard'
export const BOARD_MIME = 'application/vnd.bloom.board+zip'
export type BoardFile = { version: 1; name: string; savedAt: string; nodes: BoardNode[]; edges: BoardEdge[] }

const dataUrlToBytes = (u: string) => {
  const b64 = u.slice(u.indexOf(',') + 1)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
const bytesToDataUrl = (b: Uint8Array, mime = 'image/jpeg') => {
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000))
  return `data:${mime};base64,${btoa(s)}`
}

export function packBoard(name: string, nodes: BoardNode[], edges: BoardEdge[]): Uint8Array {
  const files: Record<string, Uint8Array> = {}
  const slim = nodes.map((n) => {
    const src = n.data?.src
    if (n.type === 'image' && typeof src === 'string' && src.startsWith('data:')) {
      const path = `images/${n.id}.jpg`
      files[path] = dataUrlToBytes(src)
      return { ...n, data: { ...n.data, src: `bloomboard:${path}` } }
    }
    return n
  })
  const doc: BoardFile = { version: 1, name, savedAt: new Date().toISOString(), nodes: slim, edges }
  files['board.json'] = strToU8(JSON.stringify(doc, null, 2))
  // Images are already JPEG: store them; compress the JSON.
  return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: k.endsWith('.json') ? 6 : 0 }]])))
}

export function unpackBoard(bytes: Uint8Array): BoardFile {
  const files = unzipSync(bytes)
  const raw = files['board.json']
  if (!raw) throw new Error('This isn’t a Bloom board file.')
  const doc = JSON.parse(strFromU8(raw)) as BoardFile
  if (doc.version !== 1 || !Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) throw new Error('This board file is from a newer version of Bloom.')
  doc.nodes = doc.nodes.map((n) => {
    const src = n.data?.src
    if (typeof src === 'string' && src.startsWith('bloomboard:')) {
      const img = files[src.slice('bloomboard:'.length)]
      return { ...n, data: { ...n.data, src: img ? bytesToDataUrl(img) : '' } }
    }
    return n
  })
  return doc
}
