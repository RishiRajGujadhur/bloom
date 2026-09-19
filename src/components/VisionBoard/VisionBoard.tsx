import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { db, type BoardNode } from '../../search/db'
import type { JournalEntry } from '../daybook/types'
import { BoardContext, type CanvasNode } from './BoardContext'
import { StickyNode } from './nodes/StickyNode'
import { JournalNode } from './nodes/JournalNode'
import { BadgeNode } from './nodes/BadgeNode'
import styles from './VisionBoard.module.css'

const nodeTypes = { sticky: StickyNode, journal: JournalNode, badge: BadgeNode }
const mime = 'application/bloom-board'
const journalKey = 'mindfulness-dashboard-daybook-v1'

function Canvas({ badges }: { badges: string[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([])
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(0)
  const [library, setLibrary] = useState<'journal' | 'badge' | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const queue = useRef(Promise.resolve())
  const { screenToFlowPosition, fitView } = useReactFlow<CanvasNode>()

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
  }, [setNodes])

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
      save(() => db.vision_board_nodes.delete(id))
    },
    [save, setNodes],
  )

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
  const add = (
    type: BoardNode['type'],
    referenceId?: string,
    point?: { x: number; y: number },
  ) => {
    if (!ready) return
    const rect = area.current!.getBoundingClientRect()
    const position = screenToFlowPosition(
      point ?? {
        x: rect.left + rect.width / 2 - 100 + Math.random() * 60,
        y: rect.top + rect.height / 2 - 100 + Math.random() * 60,
      },
    )
    const row: BoardNode = {
      id: crypto.randomUUID(),
      type,
      position,
      data:
        type === 'sticky'
          ? { text: '', color: 'gold' }
          : referenceId
            ? { referenceId }
            : { title: 'My next milestone' },
      ...(type === 'sticky' ? { width: 260, height: 240 } : {}),
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
    <BoardContext.Provider value={{ journals, update, remove }}>
      <section className={styles.page} aria-label="Vision Board">
        <header className={styles.heading}>
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
            nodes={nodes}
            edges={[]}
            nodeTypes={nodeTypes}
            onNodesChange={changeNodes}
            nodesConnectable={false}
            minZoom={0.15}
            maxZoom={2.5}
            fitView
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
            <MiniMap
              pannable
              zoomable
              nodeColor="var(--accent-color)"
              maskColor="var(--bg-primary)"
            />
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
            <button
              onClick={() => void fitView({ padding: 0.25, duration: 300 })}
            >
              Fit board
            </button>
          </div>
          {library && (
            <aside
              className={styles.library}
              aria-label={
                library === 'journal' ? 'Journal library' : 'Badge library'
              }
            >
              <header>
                <h2>
                  {library === 'journal'
                    ? 'Your reflections'
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
              {library === 'journal' ? (
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
          <span className={styles.hint}>
            Drag to explore · Scroll to zoom · Select a note to resize
          </span>
        </div>
      </section>
    </BoardContext.Provider>
  )
}

export default function VisionBoard(props: { badges: string[] }) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  )
}
