import { Buffer } from 'buffer'
import git, { type PromiseFsClient } from 'isomorphic-git'

// isomorphic-git expects Node's Buffer as a global; browsers and workers don't have one.
const g = globalThis as { Buffer?: unknown }
g.Buffer ??= Buffer

/**
 * Reads commit history (who changed which files, when) with isomorphic-git.
 * The `fs` is either Node's (tests) or the File System Access adapter below
 * (the browser, read-only over a folder the user picked).
 */
export type Commit = { oid: string; ts: number; tz: number; author: string; message: string; files: string[] }
type PFs = PromiseFsClient

export async function listCommits(fs: PFs, dir: string, max = 400) {
  const log = await git.log({ fs, dir, depth: max })
  return log.map((c) => ({ oid: c.oid, parent: c.commit.parent[0] ?? null, ts: c.commit.author.timestamp * 1000, tz: c.commit.author.timezoneOffset, author: c.commit.author.name, message: c.commit.message.split('\n')[0] }))
}

/** Paths that differ between a commit and its parent (a tree walk, no content diff). */
export async function changedFiles(fs: PFs, dir: string, oid: string, parent: string | null): Promise<string[]> {
  const trees = parent ? [git.TREE({ ref: oid }), git.TREE({ ref: parent })] : [git.TREE({ ref: oid })]
  const out: string[] = []
  await git.walk({
    fs,
    dir,
    trees,
    map: async (path, entries) => {
      if (path === '.') return true
      const [a, b] = entries
      const ta = a ? await a.type() : null
      const tb = b ? await b.type() : null
      if (ta === 'tree' || tb === 'tree') {
        // Identical subtrees can be skipped entirely.
        if (a && b && (await a.oid()) === (await b.oid())) return null
        return true
      }
      if (!parent) { out.push(path); return true }
      if (!a || !b || (await a.oid()) !== (await b.oid())) out.push(path)
      return true
    },
  })
  return out
}

/** Current files and sizes at HEAD. */
export async function headFiles(fs: PFs, dir: string): Promise<{ path: string; size: number }[]> {
  const out: { path: string; size: number }[] = []
  await git.walk({
    fs,
    dir,
    trees: [git.TREE({ ref: 'HEAD' })],
    map: async (path, [e]) => {
      if (!e || path === '.') return true
      if ((await e.type()) === 'blob') {
        const content = await e.content()
        out.push({ path, size: content?.length ?? 0 })
      }
      return true
    },
  })
  return out
}

/**
 * A minimal, read-only `fs.promises` over a FileSystemDirectoryHandle — just
 * what isomorphic-git needs to read `.git` (readFile, readdir, stat, lstat).
 */
export function fsaFs(root: FileSystemDirectoryHandle): PFs {
  const walk = async (path: string) => {
    const parts = path.split('/').filter(Boolean)
    let dir = root
    for (let i = 0; i < parts.length - 1; i++) dir = await dir.getDirectoryHandle(parts[i])
    const name = parts[parts.length - 1]
    if (!name) return { kind: 'directory' as const, handle: root }
    try { return { kind: 'file' as const, handle: await dir.getFileHandle(name) } } catch { /* not a file */ }
    return { kind: 'directory' as const, handle: await dir.getDirectoryHandle(name) }
  }
  const enoent = (p: string) => Object.assign(new Error(`ENOENT: ${p}`), { code: 'ENOENT' })
  const stat = async (p: string) => {
    try {
      const e = await walk(p)
      if (e.kind === 'file') {
        const f = await (e.handle as FileSystemFileHandle).getFile()
        return { type: 'file', mode: 0o100644, size: f.size, ino: 0, mtimeMs: f.lastModified, ctimeMs: f.lastModified, uid: 1, gid: 1, dev: 1, isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false }
      }
      return { type: 'dir', mode: 0o40000, size: 0, ino: 0, mtimeMs: 0, ctimeMs: 0, uid: 1, gid: 1, dev: 1, isFile: () => false, isDirectory: () => true, isSymbolicLink: () => false }
    } catch { throw enoent(p) }
  }
  const promises = {
    readFile: async (p: string, opts?: { encoding?: string } | string) => {
      let e
      try { e = await walk(p) } catch { throw enoent(p) }
      if (e.kind !== 'file') throw enoent(p)
      const buf = new Uint8Array(await (await (e.handle as FileSystemFileHandle).getFile()).arrayBuffer())
      const enc = typeof opts === 'string' ? opts : opts?.encoding
      return enc === 'utf8' ? new TextDecoder().decode(buf) : buf
    },
    readdir: async (p: string) => {
      let e
      try { e = await walk(p) } catch { throw enoent(p) }
      if (e.kind !== 'directory') throw enoent(p)
      const names: string[] = []
      for await (const k of (e.handle as FileSystemDirectoryHandle & { keys: () => AsyncIterable<string> }).keys()) names.push(k)
      return names
    },
    stat,
    lstat: stat,
    readlink: async (p: string) => { throw enoent(p) },
    writeFile: async () => { throw new Error('Read-only') },
    mkdir: async () => { throw new Error('Read-only') },
    rmdir: async () => { throw new Error('Read-only') },
    unlink: async () => { throw new Error('Read-only') },
    symlink: async () => { throw new Error('Read-only') },
    chmod: async () => { throw new Error('Read-only') },
  }
  return { promises } as unknown as PFs
}
