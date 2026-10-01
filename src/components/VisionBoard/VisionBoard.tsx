import { loadHandle, regrant, saveHandle } from '../../platform/handleStore'
import { prefersReducedMotion } from '../../utils/motion'
import { subOn } from '../../features/subFeatures'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  MarkerType,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { db, type BoardNode } from '../../search/db'
import type { JournalEntry } from '../daybook/types'
import { BoardContext, type CanvasNode } from './BoardContext'
import { StickyNode } from './nodes/StickyNode'
import { JournalNode } from './nodes/JournalNode'
import { BadgeNode } from './nodes/BadgeNode'
import { GoalNode, HabitNode, ImageNode } from './nodes/WhiteboardNodes'
import gsap from 'gsap'
import { usePageActions } from '../ui/PageMenu'
import styles from './VisionBoard.module.css'
import DrawingPractice from './DrawingPractice'

import { BOARD_EXT, BOARD_MIME, packBoard, unpackBoard, type BoardFile } from './boardFile'
import { onLaunchFiles, openFiles } from '../../platform/fsa'
import { opfsRead, opfsWrite } from '../../platform/opfs'

const nodeTypes = { sticky: StickyNode, journal: JournalNode, badge: BadgeNode, image: ImageNode, goal: GoalNode, habit: HabitNode }
type Habit = { id: string; title: string; dates: string[] }
const edgeStyle = (row: { id: string; source: string; target: string; label?: string; sourceHandle?: string | null; targetHandle?: string | null }): Edge => ({
  ...row,
  type: 'smoothstep',
  animated: subOn('visionBoard', 'flowingArrows'),
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
  className: 'board-edge',
})
/** New cards fan out on a golden-angle spiral instead of stacking. */
const spiral = (rect: DOMRect, n: number) => {
  const angle = n * 2.39996
  const r = 190 * Math.sqrt(n)
  return { x: rect.left + rect.width / 2 - 120 + Math.cos(angle) * r * 1.6, y: rect.top + rect.height / 2 - 110 + Math.sin(angle) * r }
}
/** Downscale an uploaded image so boards stay light in IndexedDB. */
function readImage(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Not an image'))
    }
    img.src = url
  })
}
const mime = 'application/bloom-board'
type SaveHandle = FileSystemFileHandle & { createWritable: () => Promise<FileSystemWritableFileStream> }
type Picker = { showSaveFilePicker?: (o: unknown) => Promise<SaveHandle> }
const journalKey = 'mindfulness-dashboard-daybook-v1'

function Canvas({ badges, habits = [] }: { badges: string[]; habits?: Habit[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [labelEdit, setLabelEdit] = useState<{ id: string; x: number; y: number; text: string } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(0)
  const [library, setLibrary] = useState<'journal' | 'badge' | 'habit' | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const queue = useRef(Promise.resolve())
  const { screenToFlowPosition, fitView } = useReactFlow<CanvasNode>()
  // .bloomboard files: the disk file this board was last saved to / opened from.
  const [fileHandle, setFileHandle] = useState<SaveHandle | null>(null)
  const [boardName, setBoardName] = useState('My vision board')
  const [fileMsg, setFileMsg] = useState('')
  const [backups, setBackups] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState<{ doc: BoardFile; handle: SaveHandle | null } | null>(null)
  const listBackups = useCallback(async () => {
    try {
      const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('boards', { create: true })
      const names: string[] = []
      for await (const k of (dir as FileSystemDirectoryHandle & { keys: () => AsyncIterable<string> }).keys()) names.push(k)
      setBackups(names.sort().reverse().slice(0, 5))
    } catch { setBackups([]) }
  }, [])
  useEffect(() => { void listBackups() }, [listBackups])
  const packCurrent = async () => packBoard(boardName, await db.vision_board_nodes.toArray(), await db.board_edges.toArray())
  const saveToDisk = async (saveAs = false) => {
    try {
      const bytes = await packCurrent()
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: BOARD_MIME })
      const pick = (window as unknown as Picker).showSaveFilePicker
      let h = saveAs ? null : fileHandle
      if (!h && pick) h = await pick({ suggestedName: `${boardName}${BOARD_EXT}`, types: [{ description: 'Bloom board', accept: { [BOARD_MIME]: [BOARD_EXT] } }] })
      if (h) {
        const w = await h.createWritable()
        await w.write(blob)
        await w.close()
        setFileHandle(h)
        setFileMsg(`Saved to ${h.name}`)
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${boardName}${BOARD_EXT}`
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
        setFileMsg('Downloaded.')
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setFileMsg('The board could not be saved.')
    }
  }
  /** Before replacing the board, keep a copy in the Origin Private File System. */
  const backupCurrent = async () => {
    const rows = await db.vision_board_nodes.count()
    if (!rows) return
    await opfsWrite(`boards/${new Date().toISOString().replace(/[:.]/g, '-')}${BOARD_EXT}`, new Blob([(await packCurrent()) as Uint8Array<ArrayBuffer>]))
    await listBackups()
  }
  const loadDoc = async (doc: BoardFile) => {
    await backupCurrent()
    await db.transaction('rw', db.vision_board_nodes, db.board_edges, async () => {
      await db.vision_board_nodes.clear()
      await db.board_edges.clear()
      await db.vision_board_nodes.bulkAdd(doc.nodes)
      await db.board_edges.bulkAdd(doc.edges)
    })
    setNodes(doc.nodes.map((row) => ({ ...row, style: row.width ? { width: row.width, height: row.height } : undefined })) as CanvasNode[])
    setEdges(doc.edges.map(edgeStyle))
    setBoardName(doc.name)
    setTimeout(() => void fitView({ padding: 0.25, duration: 500, maxZoom: 1.2 }), 60)
  }
  const openFile = async (file: File, handle: SaveHandle | null) => {
    try {
      const doc = unpackBoard(new Uint8Array(await file.arrayBuffer()))
      if (handle) {
        void saveHandle('board-last', handle as unknown as FileSystemHandle)
        setLastBoard(handle as unknown as FileSystemFileHandle)
      }
      if (nodes.length) setConfirmOpen({ doc, handle })
      else { await loadDoc(doc); setFileHandle(handle); setFileMsg(`Opened ${file.name}`) }
    } catch (e) {
      setFileMsg((e as Error).message)
    }
  }
  const [lastBoard, setLastBoard] = useState<FileSystemFileHandle | null>(null)
  useEffect(() => {
    void loadHandle<FileSystemFileHandle>('board-last').then(setLastBoard)
  }, [])
  const pickAndOpen = async () => {
    const [f] = await openFiles('Bloom board', { [BOARD_MIME]: [BOARD_EXT] })
    if (f) await openFile(f.file, f.handle as SaveHandle | null)
  }
  const share = async () => {
    const file = new File([(await packCurrent()) as Uint8Array<ArrayBuffer>], `${boardName}${BOARD_EXT}`, { type: BOARD_MIME })
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: boardName }).catch(() => {})
    else await saveToDisk(true)
  }
  const restoreBackup = async (name: string) => {
    const blob = await opfsRead(`boards/${name}`)
    if (blob) await loadDoc(unpackBoard(new Uint8Array(await blob.arrayBuffer())))
  }
  // "Open with Bloom" from the OS (manifest file handler for .bloomboard).
  useEffect(() => onLaunchFiles((fs) => { if (fs[0]) void openFile(fs[0].file, fs[0].handle as SaveHandle | null) }), []) // eslint-disable-line react-hooks/exhaustive-deps
  // Ctrl/Cmd+D duplicates the selected cards, nudged down and right.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'd') return
      if ((e.target as HTMLElement | null)?.closest?.('input, textarea, [contenteditable="true"]')) return
      const picked = nodes.filter((n) => n.selected)
      if (!picked.length) return
      e.preventDefault()
      const copies = picked.map((n) => {
        const w = (n.style?.width as number | undefined) ?? undefined
        const h = (n.style?.height as number | undefined) ?? undefined
        return { id: crypto.randomUUID(), type: n.type, position: { x: n.position.x + 32, y: n.position.y + 32 }, data: { ...n.data }, ...(w ? { width: w, height: h } : {}) }
      })
      setNodes((current) => [...current.map((n) => ({ ...n, selected: false })), ...copies.map((row) => ({ ...row, selected: true, style: row.width ? { width: row.width, height: row.height } : undefined }))] as typeof current)
      for (const row of copies) save(() => db.vision_board_nodes.add(row as never))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  // Ctrl/Cmd+S saves the board to its file.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void saveToDisk(e.shiftKey) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    let cancelled = false
    db.vision_board_nodes
      .toArray()
      .then((rows) => {
        if (cancelled) return
        setNodes(
          rows.map((row) => ({
            ...row,
            style: row.width
              ? { width: row.width, height: row.height }
              : undefined,
          })),
        )
        setReady(true)
      })
      .then(() => db.board_edges.toArray())
      .then((rows) => {
        if (!cancelled && rows) setEdges(rows.map(edgeStyle))
      })
      .catch(() => {
        if (!cancelled)
          setError(
            'Your board could not be loaded. Reload this page to try again; saved items have not been changed.',
          )
      })
    const readJournals = () => {
      try {
        const entries: unknown = JSON.parse(
          localStorage.getItem(journalKey) ?? '[]',
        )
        if (!Array.isArray(entries)) throw new Error('Invalid journal library')
        setJournals(
          entries.filter((entry): entry is JournalEntry =>
            Boolean(
              entry &&
              typeof entry.id === 'string' &&
              typeof entry.modeTitle === 'string' &&
              typeof entry.updatedAt === 'string' &&
              entry.content &&
              typeof entry.content === 'object',
            ),
          ),
        )
      } catch {
        setError(
          'Your journal library could not be read. Your board is still available.',
        )
      }
    }
    readJournals()
    window.addEventListener('storage', readJournals)
    return () => {
      cancelled = true
      window.removeEventListener('storage', readJournals)
    }
  }, [setNodes, setEdges])

  // Serialize writes, including edits followed immediately by deletion.
  const save = useCallback((operation: () => Promise<unknown>) => {
    setPending((value) => value + 1)
    queue.current = queue.current
      .then(operation)
      .then(
        () => {},
        () => {
          setError(
            'A change could not be saved. Keep this page open and export your board before reloading.',
          )
        },
      )
      .finally(() => setPending((value) => value - 1))
  }, [])

  const update = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...patch } } : node,
        ),
      )
      save(() =>
        db.vision_board_nodes
          .where('id')
          .equals(id)
          .modify((row) => {
            row.data = { ...row.data, ...patch }
          }),
      )
    },
    [save, setNodes],
  )
  const remove = useCallback(
    (id: string) => {
      setNodes((current) => current.filter((node) => node.id !== id))
      setEdges((current) => current.filter((e) => e.source !== id && e.target !== id))
      save(() => db.vision_board_nodes.delete(id))
      save(() => db.board_edges.where('source').equals(id).or('target').equals(id).delete())
    },
    [save, setNodes, setEdges],
  )
  const connect = (c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return
    const row = { id: crypto.randomUUID(), source: c.source, target: c.target, sourceHandle: c.sourceHandle, targetHandle: c.targetHandle, label: '' }
    setEdges((list) => addEdge(edgeStyle(row), list))
    save(() => db.board_edges.put(row as never))
  }
  const changeEdges = (changes: EdgeChange<Edge>[]) => {
    onEdgesChange(changes)
    for (const c of changes) if (c.type === 'remove') save(() => db.board_edges.delete(c.id))
  }
  const saveLabel = () => {
    if (!labelEdit) return
    const { id, text } = labelEdit
    setEdges((list) => list.map((e) => (e.id === id ? { ...e, label: text } : e)))
    save(() => db.board_edges.update(id, { label: text }))
    setLabelEdit(null)
  }

  const changeNodes = (changes: NodeChange<CanvasNode>[]) => {
    onNodesChange(changes)
    for (const change of changes) {
      if (change.type === 'position' && change.position && !change.dragging) {
        save(() =>
          db.vision_board_nodes.update(change.id, {
            position: change.position,
          }),
        )
      }
      if (
        change.type === 'dimensions' &&
        change.dimensions &&
        change.resizing === false
      ) {
        save(() =>
          db.vision_board_nodes.update(change.id, {
            width: change.dimensions?.width,
            height: change.dimensions?.height,
          }),
        )
      }
      if (change.type === 'remove')
        save(() => db.vision_board_nodes.delete(change.id))
    }
  }
  // Pin the board together when it opens: notes pop in one by one (GSAP).
  const popped = useRef(false)
  useEffect(() => {
    if (!ready || popped.current || !area.current || !subOn('visionBoard', 'popIn') || prefersReducedMotion()) return
    popped.current = true
    const t = window.setTimeout(() => {
      const els = area.current?.querySelectorAll('.react-flow__node > *')
      if (els?.length) gsap.from(els, { scale: 0.3, opacity: 0, rotate: () => gsap.utils.random(-12, 12), stagger: 0.05, duration: 0.5, ease: 'back.out(2)' })
    }, 120)
    return () => window.clearTimeout(t)
  }, [ready])
  usePageActions(
    ready
      ? [
          { id: 'vb-sticky', label: 'Add a sticky note', icon: '🗒️', run: () => add('sticky') },
          { id: 'vb-goal', label: 'Add a goal', icon: '🎯', run: () => add('goal') },
          { id: 'vb-fit', label: 'Fit everything on screen', icon: '🔭', run: () => void fitView({ padding: 0.25, duration: 300, maxZoom: 1.2 }) },
        ]
      : [],
  )
  const add = (
    type: BoardNode['type'],
    referenceId?: string,
    point?: { x: number; y: number },
  ) => {
    if (!ready) return
    const rect = area.current!.getBoundingClientRect()
    const position = screenToFlowPosition(
      point ?? spiral(rect, nodes.length),
    )
    const row: BoardNode = {
      id: crypto.randomUUID(),
      type,
      position,
      data:
        type === 'sticky'
          ? { text: '', color: 'gold' }
          : type === 'image'
            ? { src: referenceId, caption: '' }
            : type === 'goal'
              ? { title: '', progress: 0, due: '' }
              : referenceId
                ? { referenceId }
                : { title: 'My next milestone' },
      ...(type === 'sticky' ? { width: 260, height: 240 } : type === 'image' ? { width: 260, height: 240 } : {}),
    }
    setNodes((current) => [
      ...current,
      {
        ...row,
        selected: true,
        style: row.width ? { width: row.width, height: row.height } : undefined,
      },
    ])
    save(() => db.vision_board_nodes.add(row))
  }
  const exportBoard = () => {
    const rows = nodes.map(({ id, type, position, data, width, height }) => ({
      id,
      type,
      position,
      data,
      width,
      height,
    }))
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'bloom-vision-board.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <BoardContext.Provider value={{ journals, update, remove, habits }}>
      <section
        className={`${styles.page} mx-auto w-full max-w-[1600px]`}
        aria-label="Vision Board"
      >
        <header className={`${styles.heading} flex flex-wrap items-start justify-between gap-4`}>
          <div>
            <span>YOUR WORLD, TAKING SHAPE</span>
            <h1>
              Vision Board<span>✧</span>
            </h1>
            <p>A little space for your bigger picture.</p>
          </div>
          <div className={styles.saveState} role="status">
            {!ready
              ? 'Opening board…'
              : error
                ? 'Saving needs attention'
                : pending
                  ? 'Saving…'
                  : 'Saved on this device'}
            <button onClick={exportBoard} disabled={!ready}>
              Export board
            </button>
          </div>
        </header>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.workspace} ref={area}>
          <ReactFlow<CanvasNode>
            snapToGrid={subOn('visionBoard', 'snap')}
            snapGrid={[20, 20]}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={changeNodes}
            onEdgesChange={changeEdges}
            onConnect={connect}
            nodesConnectable={subOn('visionBoard', 'connect')}
            connectionLineStyle={{ stroke: 'var(--accent-color)', strokeWidth: 2 }}
            onEdgeDoubleClick={(event, edge) => setLabelEdit({ id: edge.id, x: event.clientX, y: event.clientY, text: String(edge.label ?? '') })}
            deleteKeyCode={['Backspace', 'Delete']}
            minZoom={0.15}
            maxZoom={2.5}
            fitView
            fitViewOptions={{ maxZoom: 1, padding: 0.3 }}
            onNodeDragStop={(_event, _node, moved) => {
              for (const node of moved)
                save(() =>
                  db.vision_board_nodes.update(node.id, {
                    position: node.position,
                  }),
                )
            }}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'copy'
            }}
            onDrop={(event) => {
              event.preventDefault()
              try {
                const item = JSON.parse(event.dataTransfer.getData(mime)) as {
                  type: string
                  referenceId: string
                }
                if (
                  item.type === 'journal' &&
                  journals.some((entry) => entry.id === item.referenceId)
                )
                  add('journal', item.referenceId, {
                    x: event.clientX,
                    y: event.clientY,
                  })
                if (item.type === 'habit' && habits.some((h) => h.id === item.referenceId))
                  add('habit', item.referenceId, { x: event.clientX, y: event.clientY })
                if (item.type === 'badge' && badges.includes(item.referenceId))
                  add('badge', item.referenceId, {
                    x: event.clientX,
                    y: event.clientY,
                  })
              } catch {
                /* Ignore unrelated drops. */
              }
            }}
          >
            <Background color="var(--border-color)" gap={20} size={1} />
            <Controls showInteractive={false} />
            {subOn('visionBoard', 'minimap') && (
            <MiniMap
              pannable
              zoomable
              nodeColor="var(--accent-color)"
              maskColor="var(--bg-primary)"
            />
            )}
          </ReactFlow>
          {ready && nodes.length === 0 && (
            <div className={styles.empty}>
              <span>✦</span>
              <h2>Every big picture starts small.</h2>
              <p>
                Add an intention, pin a reflection, celebrate a win.
                <br />
                This space grows with you.
              </p>
            </div>
          )}
          <div
            className={styles.toolbar}
            role="toolbar"
            aria-label="Board tools"
          >
            <button disabled={!ready} onClick={() => add('sticky')}>
              ＋ Add Sticky
            </button>
            <button
              disabled={!ready}
              aria-pressed={library === 'journal'}
              onClick={() =>
                setLibrary(library === 'journal' ? null : 'journal')
              }
            >
              ↗ Add Journal
            </button>
            <button
              disabled={!ready}
              aria-pressed={library === 'badge'}
              onClick={() => setLibrary(library === 'badge' ? null : 'badge')}
            >
              ✧ Add Badge
            </button>
            {subOn('visionBoard', 'whiteboardCards') && (
              <>
                <button disabled={!ready} onClick={() => add('goal')}>
                  ◎ Add Goal
                </button>
                <button disabled={!ready} aria-pressed={library === 'habit'} onClick={() => setLibrary(library === 'habit' ? null : 'habit')}>
                  ✓ Add Habit
                </button>
                <button disabled={!ready} onClick={() => fileInput.current?.click()}>
                  ▣ Add Image
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (!file) return
                    try {
                      add('image', await readImage(file))
                    } catch {
                      setError('That file could not be read as an image.')
                    }
                  }}
                />
              </>
            )}
            <button
              onClick={() => void fitView({ padding: 0.25, duration: 300, maxZoom: 1.2 })}
            >
              Fit board
            </button>
            {subOn('visionBoard', 'boardFiles') && (
              <>
                <button disabled={!ready} onClick={() => void saveToDisk()} title="Save to a .bloomboard file (Ctrl+S)">💾 {fileHandle ? 'Save' : 'Save file'}</button>
                <button disabled={!ready} onClick={() => void pickAndOpen()}>📂 Open file</button>
          {lastBoard && (
            <button
              disabled={!ready}
              title={`Reopen ${lastBoard.name}`}
              onClick={() =>
                void regrant(lastBoard).then(async (ok) => {
                  if (ok) await openFile(await lastBoard.getFile(), lastBoard as unknown as SaveHandle)
                })
              }
            >
              ↻ {lastBoard.name.replace(/\.[^.]+$/, '')}
            </button>
          )}
                <button disabled={!ready || !nodes.length} onClick={() => void share()}>⤴ Share</button>
              </>
            )}
          </div>
          {(fileMsg || backups.length > 0) && subOn('visionBoard', 'boardFiles') && (
            <div className={styles.fileBar} role="status">
              <input aria-label="Board name" value={boardName} onChange={(e) => setBoardName(e.target.value)} />
              {fileMsg && <span>{fileMsg}</span>}
              {backups.length > 0 && (
                <select aria-label="Restore a backup" value="" onChange={(e) => e.target.value && void restoreBackup(e.target.value)}>
                  <option value="">↺ Restore a backup…</option>
                  {backups.map((b) => <option key={b} value={b}>{b.replace(BOARD_EXT, '').replace(/T(\d\d)-(\d\d).*/, ' $1:$2')}</option>)}
                </select>
              )}
            </div>
          )}
          {confirmOpen && (
            <div className={styles.confirm} role="alertdialog" aria-label="Replace this board?">
              <p>Open “{confirmOpen.doc.name}” ({confirmOpen.doc.nodes.length} cards)? Your current board is backed up first.</p>
              <button onClick={() => { void loadDoc(confirmOpen.doc).then(() => { setFileHandle(confirmOpen.handle); setFileMsg(`Opened ${confirmOpen.doc.name}`); setConfirmOpen(null) }) }}>Open it</button>
              <button onClick={() => setConfirmOpen(null)}>Cancel</button>
            </div>
          )}
          {library && (
            <aside
              className={styles.library}
              aria-label={
                library === 'journal' ? 'Journal library' : library === 'habit' ? 'Habit library' : 'Badge library'
              }
            >
              <header>
                <h2>
                  {library === 'journal'
                    ? 'Your reflections'
                    : library === 'habit'
                      ? 'Your habits'
                      : 'Your milestones'}
                </h2>
                <button
                  aria-label="Close library"
                  onClick={() => setLibrary(null)}
                >
                  ×
                </button>
              </header>
              <p>Drag onto your board, or click to add.</p>
              {library === 'habit' ? (
                habits.map((h) => (
                  <button
                    key={h.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData(mime, JSON.stringify({ type: 'habit', referenceId: h.id }))}
                    onClick={() => add('habit', h.id)}
                  >
                    ✓ {h.title}
                  </button>
                ))
              ) : library === 'journal' ? (
                journals.length ? (
                  journals.map((entry) => (
                    <button
                      key={entry.id}
                      draggable
                      onDragStart={(event) =>
                        event.dataTransfer.setData(
                          mime,
                          JSON.stringify({
                            type: 'journal',
                            referenceId: entry.id,
                          }),
                        )
                      }
                      onClick={() => add('journal', entry.id)}
                    >
                      {entry.modeTitle}
                      <small>
                        {new Date(entry.updatedAt).toLocaleDateString()}
                      </small>
                    </button>
                  ))
                ) : (
                  <p>
                    No saved entries yet. Write a page in Daybook modes, then
                    pin it here.
                  </p>
                )
              ) : (
                <>
                  <button onClick={() => add('badge')}>
                    ＋ Personal milestone
                  </button>
                  {badges.length === 0 && (
                    <p>Earned boss badges will appear here as you progress.</p>
                  )}
                  {badges.map((badge) => (
                    <button
                      key={badge}
                      draggable
                      onDragStart={(event) =>
                        event.dataTransfer.setData(
                          mime,
                          JSON.stringify({ type: 'badge', referenceId: badge }),
                        )
                      }
                      onClick={() => add('badge', badge)}
                    >
                      ✧ {badge}
                    </button>
                  ))}
                </>
              )}
            </aside>
          )}
          {labelEdit && (
            <input
              className={styles.edgeLabel}
              style={{ left: labelEdit.x, top: labelEdit.y }}
              aria-label="Arrow label"
              placeholder="leads to…"
              autoFocus
              value={labelEdit.text}
              onChange={(e) => setLabelEdit({ ...labelEdit, text: e.target.value })}
              onBlur={saveLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveLabel()
                if (e.key === 'Escape') setLabelEdit(null)
              }}
            />
          )}
          <span className={styles.hint}>
            Drag to explore · Scroll to zoom · {subOn('visionBoard', 'connect') ? 'Drag from a card edge to draw an arrow · Double-click an arrow to label it' : 'Select a note to resize'}
          </span>
        </div>
      </section>
    </BoardContext.Provider>
  )
}

export default function VisionBoard(props: { badges: string[]; habits?: Habit[] }) {
  const [practice, setPractice] = useState(false)
  return (
    practice ? <DrawingPractice onBack={() => setPractice(false)} /> : <>
      <button className={styles.practiceLaunch} onClick={() => setPractice(true)} title="Open drawing practice" aria-label="Open drawing practice">✎ <span>Drawing practice</span></button>
      <ReactFlowProvider><Canvas {...props} /></ReactFlowProvider>
    </>
  )
}
