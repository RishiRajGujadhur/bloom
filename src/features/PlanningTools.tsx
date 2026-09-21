import { useState, type Dispatch, type SetStateAction } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  FolderTree,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import type { AppData, Perspective, Project, TaskPlanning } from '../model'
import { id } from '../model'
import { Modal } from '../components/Modal'
import {
  deleteProject,
  emptyPerspective,
  moveAction,
  projectChildren,
  projectPath,
  projectTasks,
} from './planning'
import './planning.css'

type Props = { data: AppData; setData: Dispatch<SetStateAction<AppData>> }
export type PlanningFilter = Omit<Perspective, 'id' | 'title'>

export function ProjectOptions({
  projects,
  exclude,
}: {
  projects: Project[]
  exclude?: string
}) {
  return [...projects]
    .sort((a, b) =>
      projectPath(projects, a.id)
        .map((p) => p.title)
        .join('/')
        .localeCompare(
          projectPath(projects, b.id)
            .map((p) => p.title)
            .join('/'),
        ),
    )
    .filter(
      (p) =>
        !projectPath(projects, p.id).some(
          (ancestor) => ancestor.id === exclude,
        ),
    )
    .map((p) => (
      <option key={p.id} value={p.id}>
        {projectPath(projects, p.id)
          .map((ancestor) => ancestor.title)
          .join(' / ')}
      </option>
    ))
}

export function TaskPlanningFields({
  value,
  onChange,
  projects,
  prefix = '',
}: {
  value: TaskPlanning
  onChange: (value: TaskPlanning) => void
  projects: Project[]
  prefix?: string
}) {
  const change = (patch: Partial<TaskPlanning>) =>
    onChange({ ...value, ...patch })
  return (
    <div className="planning-fields">
      <label>
        {prefix}Project
        <select
          value={value.projectId ?? ''}
          onChange={(e) =>
            change({ projectId: e.target.value || null, order: Date.now() })
          }
        >
          <option value="">Inbox</option>
          <ProjectOptions projects={projects} />
        </select>
      </label>
      <label>
        {prefix}Defer until
        <input
          type="date"
          value={value.deferUntil}
          onChange={(e) => change({ deferUntil: e.target.value })}
        />
      </label>
      <label>
        {prefix}Context
        <input
          maxLength={60}
          placeholder="Office, home, errands"
          value={value.context}
          onChange={(e) => change({ context: e.target.value })}
        />
      </label>
      <label>
        {prefix}Energy
        <select
          value={value.energy}
          onChange={(e) =>
            change({ energy: e.target.value as TaskPlanning['energy'] })
          }
        >
          {['any', 'low', 'medium', 'high'].map((v) => (
            <option key={v} value={v}>
              {v === 'any' ? 'Any energy' : v}
            </option>
          ))}
        </select>
      </label>
      <label>
        {prefix}Time of day
        <select
          value={value.timeOfDay}
          onChange={(e) =>
            change({ timeOfDay: e.target.value as TaskPlanning['timeOfDay'] })
          }
        >
          {['any', 'morning', 'afternoon', 'evening', 'night'].map((v) => (
            <option key={v} value={v}>
              {v === 'any' ? 'Any time' : v}
            </option>
          ))}
        </select>
      </label>
      <label>
        {prefix}Estimated minutes
        <input
          type="number"
          min={5}
          max={1440}
          step={5}
          required
          value={value.minutes}
          onChange={(e) => change({ minutes: Number(e.target.value) })}
        />
      </label>
      <label className="planning-check">
        <input
          type="checkbox"
          checked={value.deepWork}
          onChange={(e) => change({ deepWork: e.target.checked })}
        />
        {prefix}Deep work
      </label>
    </div>
  )
}

export function PlanningTools({
  data,
  setData,
  filter,
  setFilter,
}: Props & {
  filter: PlanningFilter
  setFilter: (value: PlanningFilter) => void
}) {
  const [project, setProject] = useState<Project | null>(null)
  const [perspectiveId, setPerspectiveId] = useState('')
  const [perspectiveTitle, setPerspectiveTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const updateFilter = (patch: Partial<PlanningFilter>) =>
    setFilter({ ...filter, ...patch })
  const selectedProject = data.projects.find((p) => p.id === filter.projectId)
  const actions = selectedProject
    ? projectChildren(data, selectedProject.id)
    : []
  const contexts = [
    ...new Set(
      data.todos
        .map((t) => t.planning?.context?.trim())
        .filter((v): v is string => Boolean(v)),
    ),
  ].sort()
  const renderTree = (
    parentId: string | null,
    ancestors: string[] = [],
  ): React.ReactNode => (
    <ul className="project-tree">
      {data.projects
        .filter((p) => p.parentId === parentId && !ancestors.includes(p.id))
        .sort((a, b) => a.order - b.order)
        .map((p) => {
          const tasks = projectTasks(data, p.id)
          return (
            <li key={p.id}>
              <div>
                <button
                  aria-pressed={filter.projectId === p.id}
                  onClick={() => updateFilter({ projectId: p.id })}
                >
                  <FolderTree size={15} />
                  <span>{p.title}</span>
                  <small>
                    {tasks.filter((t) => t.done).length}/{tasks.length}
                  </small>
                </button>
                <button
                  className="icon-button"
                  title={`Edit project ${p.title}`}
                  aria-label={`Edit project ${p.title}`}
                  onClick={() => setProject({ ...p })}
                >
                  <Pencil size={14} />
                </button>
              </div>
              {renderTree(p.id, [...ancestors, p.id])}
            </li>
          )
        })}
    </ul>
  )
  return (
    <div className="planning-tools">
      <div className="planning-toolbar">
        <button
          className="quiet-button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <FolderTree size={17} /> Projects{' '}
          <small>{data.projects.length}</small>
        </button>
        <button
          className="quiet-button"
          onClick={() =>
            setProject({
              id: id(),
              title: '',
              parentId: selectedProject?.id ?? null,
              mode: 'parallel',
              deferUntil: '',
              order: Date.now(),
            })
          }
        >
          <Plus size={16} /> New project
        </button>
        <label className="perspective-picker">
          Perspective
          <select
            aria-label="Perspective"
            value={perspectiveId}
            onChange={(e) => {
              setPerspectiveId(e.target.value)
              const perspective = data.perspectives.find(
                (p) => p.id === e.target.value,
              )
              setFilter(
                perspective
                  ? {
                      projectId: perspective.projectId,
                      context: perspective.context,
                      energy: perspective.energy,
                      timeOfDay: perspective.timeOfDay,
                      availability: perspective.availability,
                    }
                  : { ...emptyPerspective },
              )
            }}
          >
            <option value="">Custom view</option>
            {data.perspectives.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <button
          className="icon-button"
          title="Save perspective"
          aria-label="Save perspective"
          onClick={() => {
            setPerspectiveTitle(
              data.perspectives.find((p) => p.id === perspectiveId)?.title ??
                '',
            )
            setSaving(true)
          }}
        >
          <Save size={17} />
        </button>
        {perspectiveId && (
          <button
            className="icon-button"
            title="Delete perspective"
            aria-label="Delete perspective"
            onClick={() => {
              setData((current) => ({
                ...current,
                perspectives: current.perspectives.filter(
                  (p) => p.id !== perspectiveId,
                ),
              }))
              setPerspectiveId('')
            }}
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>
      {expanded && (
        <div className="project-browser">
          <div>
            <button
              className="quiet-button"
              onClick={() => updateFilter({ projectId: 'all' })}
            >
              All projects
            </button>
            <button
              className="quiet-button"
              onClick={() => updateFilter({ projectId: 'inbox' })}
            >
              Inbox
            </button>
            {renderTree(null)}
            {!data.projects.length && (
              <p className="empty-message">No projects yet.</p>
            )}
          </div>
          {selectedProject && (
            <div className="project-actions">
              <h3>{selectedProject.title}</h3>
              <small>
                {selectedProject.mode === 'sequential'
                  ? 'Sequential actions'
                  : 'Parallel actions'}
                {selectedProject.deferUntil &&
                  ` / Deferred until ${selectedProject.deferUntil}`}
              </small>
              <ol>
                {actions.map((action, index) => (
                  <li key={action.id}>
                    <span>
                      {action.kind === 'project' ? (
                        <FolderTree size={14} />
                      ) : action.done ? (
                        <Check size={14} />
                      ) : (
                        index + 1
                      )}{' '}
                      {action.kind === 'project'
                        ? data.projects.find((p) => p.id === action.id)?.title
                        : data.todos.find((t) => t.id === action.id)?.title}
                    </span>
                    <button
                      className="icon-button"
                      title="Move action up"
                      aria-label={`Move action ${index + 1} up`}
                      disabled={!index}
                      onClick={() =>
                        setData((current) =>
                          moveAction(
                            current,
                            selectedProject.id,
                            action.id,
                            -1,
                          ),
                        )
                      }
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="icon-button"
                      title="Move action down"
                      aria-label={`Move action ${index + 1} down`}
                      disabled={index === actions.length - 1}
                      onClick={() =>
                        setData((current) =>
                          moveAction(current, selectedProject.id, action.id, 1),
                        )
                      }
                    >
                      <ArrowDown size={14} />
                    </button>
                  </li>
                ))}
              </ol>
              {!actions.length && <p>No actions yet.</p>}
            </div>
          )}
        </div>
      )}
      <div className="planning-fields perspective-filters">
        <label>
          Filter project
          <select
            value={filter.projectId}
            onChange={(e) => updateFilter({ projectId: e.target.value })}
          >
            <option value="all">All projects</option>
            <option value="inbox">Inbox</option>
            <ProjectOptions projects={data.projects} />
          </select>
        </label>
        <label>
          Filter context
          <select
            value={filter.context}
            onChange={(e) => updateFilter({ context: e.target.value })}
          >
            <option value="">All contexts</option>
            {[
              ...new Set([
                ...contexts,
                ...(filter.context ? [filter.context] : []),
              ]),
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Filter energy
          <select
            value={filter.energy}
            onChange={(e) =>
              updateFilter({
                energy: e.target.value as PlanningFilter['energy'],
              })
            }
          >
            {['any', 'low', 'medium', 'high'].map((v) => (
              <option key={v} value={v}>
                {v === 'any' ? 'All energy levels' : v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Filter time of day
          <select
            value={filter.timeOfDay}
            onChange={(e) =>
              updateFilter({
                timeOfDay: e.target.value as PlanningFilter['timeOfDay'],
              })
            }
          >
            {['any', 'morning', 'afternoon', 'evening', 'night'].map((v) => (
              <option key={v} value={v}>
                {v === 'any' ? 'Any time' : v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Availability
          <select
            value={filter.availability}
            onChange={(e) =>
              updateFilter({
                availability: e.target.value as PlanningFilter['availability'],
              })
            }
          >
            {['all', 'available', 'deferred', 'blocked'].map((v) => (
              <option key={v} value={v}>
                {v === 'all' ? 'All actions' : v}
              </option>
            ))}
          </select>
        </label>
      </div>
      {project && (
        <Modal
          title={
            data.projects.some((p) => p.id === project.id)
              ? 'Edit project'
              : 'New project'
          }
          onClose={() => setProject(null)}
        >
          <form
            className="planning-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (!project.title.trim()) return
              setData((current) => ({
                ...current,
                projects: [
                  ...current.projects.filter((p) => p.id !== project.id),
                  { ...project, title: project.title.trim() },
                ],
              }))
              setProject(null)
              setExpanded(true)
            }}
          >
            <label>
              Project name
              <input
                autoFocus
                required
                maxLength={120}
                value={project.title}
                onChange={(e) =>
                  setProject({ ...project, title: e.target.value })
                }
              />
            </label>
            <label>
              Parent project
              <select
                value={project.parentId ?? ''}
                onChange={(e) =>
                  setProject({
                    ...project,
                    parentId: e.target.value || null,
                    order: Date.now(),
                  })
                }
              >
                <option value="">No parent</option>
                <ProjectOptions projects={data.projects} exclude={project.id} />
              </select>
            </label>
            <label>
              Action order
              <select
                value={project.mode}
                onChange={(e) =>
                  setProject({
                    ...project,
                    mode: e.target.value as Project['mode'],
                  })
                }
              >
                <option value="parallel">Parallel</option>
                <option value="sequential">Sequential</option>
              </select>
            </label>
            <label>
              Defer project until
              <input
                type="date"
                value={project.deferUntil}
                onChange={(e) =>
                  setProject({ ...project, deferUntil: e.target.value })
                }
              />
            </label>
            <div className="planning-toolbar">
              <button className="primary" type="submit">
                <Check size={16} /> Save project
              </button>
              {data.projects.some((p) => p.id === project.id) && (
                <button
                  type="button"
                  className="quiet-button"
                  onClick={() => {
                    setData((current) => deleteProject(current, project.id))
                    if (filter.projectId === project.id)
                      updateFilter({ projectId: 'all' })
                    setProject(null)
                  }}
                >
                  <Trash2 size={16} /> Delete project, keep actions
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
      {saving && (
        <Modal title="Save perspective" onClose={() => setSaving(false)}>
          <form
            className="planning-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (!perspectiveTitle.trim()) return
              const savedId = perspectiveId || id()
              setData((current) => ({
                ...current,
                perspectives: [
                  ...current.perspectives.filter((p) => p.id !== savedId),
                  { ...filter, id: savedId, title: perspectiveTitle.trim() },
                ],
              }))
              setPerspectiveId(savedId)
              setSaving(false)
            }}
          >
            <label>
              Perspective name
              <input
                required
                maxLength={80}
                value={perspectiveTitle}
                onChange={(e) => setPerspectiveTitle(e.target.value)}
              />
            </label>
            <div className="planning-toolbar">
              <button className="primary">
                <Save size={16} />
                {perspectiveId ? 'Update perspective' : 'Save perspective'}
              </button>
              {perspectiveId && (
                <button
                  type="button"
                  className="quiet-button"
                  onClick={() => {
                    if (!perspectiveTitle.trim()) return
                    const savedId = id()
                    setData((current) => ({
                      ...current,
                      perspectives: [
                        ...current.perspectives,
                        {
                          ...filter,
                          id: savedId,
                          title: perspectiveTitle.trim(),
                        },
                      ],
                    }))
                    setPerspectiveId(savedId)
                    setSaving(false)
                  }}
                >
                  Save as new
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
