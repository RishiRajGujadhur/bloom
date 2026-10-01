import { subOn } from './subFeatures'
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import {
  CalendarDays,
  Check,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import type { AppData, CalendarBlock, Todo } from '../model'
import { id, dayKey } from '../model'
import { Modal } from '../components/Modal'
import {
  blockError,
  dayCapacity,
  planningOf,
  taskAvailability,
} from './planning'
import { toggleTodo } from './productivity'
import './planning.css'
import { CapacityRing } from './showcase/CapacityRing'
import { usePageActions } from '../components/ui/PageMenu'

type Props = { data: AppData; setData: Dispatch<SetStateAction<AppData>> }
const localInput = (value: string) => {
  const date = new Date(value)
  return `${dayKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
const hours = (minutes: number) => `${Math.round(minutes / 6) / 10}h`

export function CalendarPage({ data, setData }: Props) {
  const calendar = useRef<FullCalendar>(null)
  // Full screen: the browser Fullscreen API when available, otherwise a
  // fixed overlay. Esc (or the button) returns to the normal layout.
  const workspace = useRef<HTMLElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const sync = () => {
      if (!document.fullscreenElement) setFullscreen(false)
    }
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement)
        setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])
  useEffect(() => {
    // Let FullCalendar re-measure after the layout changes.
    const timer = setTimeout(() => calendar.current?.getApi().updateSize(), 60)
    return () => clearTimeout(timer)
  }, [fullscreen])
  const toggleFullscreen = () => {
    const node = workspace.current
    if (!fullscreen) {
      setFullscreen(true)
      node?.requestFullscreen?.().catch(() => {
        /* Overlay fallback stays active. */
      })
    } else {
      setFullscreen(false)
      if (document.fullscreenElement) void document.exitFullscreen()
    }
  }
  const tray = useRef<HTMLDivElement>(null)
  const [selectedDay, setSelectedDay] = useState(dayKey)
  const narrow = typeof window !== 'undefined' && window.innerWidth < 700
  const [trayOpen, setTrayOpen] = useState(false)
  const [view, setView] = useState(() =>
    window.innerWidth < 700 ? 'timeGridDay' : 'timeGridWeek',
  )
  const [heading, setHeading] = useState('')
  const [draft, setDraft] = useState<CalendarBlock | null>(null)
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [includeScheduled, setIncludeScheduled] = useState(false)
  const capacity = dayCapacity(data, selectedDay)
  const selectedDate = new Date(`${selectedDay}T12:00:00`)
  const tasks = data.todos.filter(
    (task) =>
      !task.done &&
      task.title.toLowerCase().includes(search.toLowerCase()) &&
      (includeScheduled ||
        !data.calendarBlocks.some((block) => block.taskId === task.id)),
  )
  const dailyBlocks = data.calendarBlocks
    .filter(
      (b) =>
        Date.parse(b.start) < +new Date(`${selectedDay}T23:59:59`) &&
        Date.parse(b.end) > +new Date(`${selectedDay}T00:00:00`),
    )
    .sort((a, b) => a.start.localeCompare(b.start))

  useEffect(() => {
    if (!tray.current) return
    const draggable = new Draggable(tray.current, {
      itemSelector: '.calendar-draggable',
      eventData: (element) => ({
        title: element.dataset.title,
        duration: { minutes: Number(element.dataset.minutes) },
        extendedProps: { taskId: element.dataset.taskId },
      }),
    })
    return () => draggable.destroy()
  }, [])

  const newBlock = (start: Date, task?: Todo, end?: Date) => {
    setNotice('')
    setDraft({
      id: id(),
      title: task?.title ?? '',
      taskId: task?.id ?? null,
      start: start.toISOString(),
      end: (
        end ?? new Date(+start + (task ? planningOf(task).minutes : 60) * 60000)
      ).toISOString(),
      deepWork: task ? planningOf(task).deepWork : false,
    })
  }
  const save = (block: CalendarBlock) => {
    const error = blockError(data, block)
    if (error) {
      setNotice(error)
      return false
    }
    setData((current) =>
      blockError(current, block)
        ? current
        : {
            ...current,
            calendarBlocks: [
              ...current.calendarBlocks.filter((item) => item.id !== block.id),
              block,
            ],
          },
    )
    setNotice('Time block saved.')
    return true
  }
  const edit = (block: CalendarBlock) => {
    setNotice('')
    setDraft({
      ...block,
      title:
        data.todos.find((t) => t.id === block.taskId)?.title ?? block.title,
    })
  }
  const scheduleTask = (task: Todo) => {
    const start = new Date(`${selectedDay}T00:00:00`)
    start.setHours(data.calendarHours.start)
    // Start in the first free interval long enough for the estimate.
    for (const block of [...dailyBlocks]) {
      if (+start + planningOf(task).minutes * 60000 <= Date.parse(block.start))
        break
      if (+start < Date.parse(block.end)) start.setTime(Date.parse(block.end))
    }
    newBlock(start, task)
  }

  usePageActions([
    { id: 'cal-new', label: 'New block now', icon: '➕', run: () => newBlock(new Date(Math.ceil(Date.now() / 1800000) * 1800000)) },
    { id: 'cal-today', label: 'Jump to today', icon: '📍', run: () => { calendar.current?.getApi().today(); setSelectedDay(dayKey()) } },
    { id: 'cal-week', label: view === 'timeGridWeek' ? 'Show one day' : 'Show the week', icon: '🗓️', run: () => { const v = view === 'timeGridWeek' ? 'timeGridDay' : 'timeGridWeek'; setView(v); calendar.current?.getApi().changeView(v, selectedDay) } },
  ])
  return (
    <section
      ref={workspace}
      className={`calendar-workspace${fullscreen ? ' is-fullscreen' : ''}`}
      id="calendar-page"
    >
      <div className="calendar-toolbar">
        <div className="planning-toolbar">
          <button
            className="icon-button"
            title="Previous period"
            aria-label="Previous period"
            onClick={() => calendar.current?.getApi().prev()}
          >
            <ChevronLeft size={19} />
          </button>
          <button
            className="icon-button"
            title="Next period"
            aria-label="Next period"
            onClick={() => calendar.current?.getApi().next()}
          >
            <ChevronRight size={19} />
          </button>
          <button
            className="quiet-button"
            onClick={() => {
              calendar.current?.getApi().today()
              setSelectedDay(dayKey())
            }}
          >
            Today
          </button>
          <h2>{heading}</h2>
        </div>
        <div className="planning-toolbar">
          <button
            className="quiet-button"
            title="Download your time blocks as an .ics file (Google, Apple or Outlook calendar)"
            disabled={!data.calendarBlocks.length}
            onClick={async () => {
              const { createEvents } = await import('ics')
              const parts = (iso: string) => {
                const d = new Date(iso)
                return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()] as [number, number, number, number, number]
              }
              const { value } = createEvents(
                data.calendarBlocks.map((b) => ({
                  title: data.todos.find((t) => t.id === b.taskId)?.title ?? b.title ?? 'Bloom block',
                  start: parts(b.start),
                  end: parts(b.end),
                  startInputType: 'local' as const,
                  startOutputType: 'local' as const,
                })),
              )
              if (!value) return
              const a = document.createElement('a')
              a.href = URL.createObjectURL(new Blob([value], { type: 'text/calendar' }))
              a.download = 'bloom-calendar.ics'
              a.click()
              setTimeout(() => URL.revokeObjectURL(a.href), 1000)
            }}
          >
            ⬇ .ics
          </button>
          <label className="quiet-button" title="Add events from an .ics file as time blocks">
            ⬆ .ics
            <input
              type="file"
              accept=".ics,text/calendar"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                const { parseIcs } = await import('./planning/icsImport')
                const events = parseIcs(await file.text()).filter((ev) => +ev.start > Date.now() - 30 * 864e5)
                if (!events.length) return setNotice('No upcoming events found in that file.')
                setData((d) => ({
                  ...d,
                  calendarBlocks: [...d.calendarBlocks, ...events.map((ev) => ({ id: id(), title: ev.title, taskId: null, start: ev.start.toISOString(), end: ev.end.toISOString(), deepWork: false }))],
                }))
                setNotice(`Imported ${events.length} event${events.length === 1 ? '' : 's'} from ${file.name}.`)
              }}
            />
          </label>
          <select
            aria-label="Calendar view"
            value={view}
            onChange={(e) => {
              setView(e.target.value)
              calendar.current?.getApi().changeView(e.target.value, selectedDay)
            }}
          >
            <option value="timeGridDay">Day</option>
            <option value="timeGridWeek">Week</option>
            <option value="dayGridMonth">Month</option>
            {subOn('fullCalendar', 'agenda') && <option value="listWeek">Agenda</option>}
          </select>
          <button
            className="primary"
            onClick={() => {
              const start = new Date(`${selectedDay}T00:00:00`)
              start.setHours(data.calendarHours.start)
              newBlock(start)
            }}
          >
            <Plus size={16} /> New block
          </button>
          {subOn('fullCalendar', 'fullscreen') && (
          <button
            className="icon-button calendar-fullscreen"
            aria-pressed={fullscreen}
            aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
            onClick={toggleFullscreen}
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          )}
        </div>
      </div>
      <div className="calendar-capacity" hidden={!subOn('fullCalendar', 'capacity')}>
        <label>
          Day
          <input
            aria-label="Capacity date"
            type="date"
            required
            value={selectedDay}
            onChange={(e) => {
              if (!e.target.value) return
              setSelectedDay(e.target.value)
              calendar.current?.getApi().gotoDate(e.target.value)
            }}
          />
        </label>
        <CapacityRing capacity={capacity.capacity} booked={capacity.booked} deep={capacity.deep} label={hours} />
      </div>
      <div className="calendar-layout">
        {narrow && subOn('fullCalendar', 'taskTray') && (
          <button type="button" className="quiet-button calendar-tray-toggle" aria-expanded={trayOpen} onClick={() => setTrayOpen(!trayOpen)} data-hint="Drag tasks onto the calendar">
            {trayOpen ? 'Hide task list' : `Show task list (${tasks.length})`}
          </button>
        )}
        <aside className="calendar-tray" hidden={!subOn('fullCalendar', 'taskTray') || (narrow && !trayOpen)}>
          <h3>
            Task list <small>{tasks.length}</small>
          </h3>
          <input
            aria-label="Search calendar tasks"
            placeholder="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="planning-check">
            <input
              type="checkbox"
              checked={includeScheduled}
              onChange={(e) => setIncludeScheduled(e.target.checked)}
            />
            Include scheduled tasks
          </label>
          <div ref={tray} className="calendar-task-list">
            {tasks.map((task) => {
              const planning = planningOf(task)
              const state = taskAvailability(data, task, selectedDate)
              return (
                <article
                  key={task.id}
                  className={`calendar-task ${state === 'available' ? 'calendar-draggable' : ''}`}
                  data-task-id={task.id}
                  data-title={task.title}
                  data-minutes={planning.minutes}
                >
                  <GripVertical size={15} aria-hidden="true" />
                  <div>
                    <strong>{task.title}</strong>
                    <small>
                      {planning.minutes} min
                      {planning.deepWork ? ' / Deep work' : ''}
                      {state !== 'available' ? ` / ${state}` : ''}
                    </small>
                  </div>
                  <button
                    className="icon-button"
                    disabled={state !== 'available'}
                    aria-label={`Schedule ${task.title}`}
                    title={`Schedule ${task.title}`}
                    onClick={() => scheduleTask(task)}
                  >
                    <CalendarDays size={16} />
                  </button>
                </article>
              )
            })}
            {!tasks.length && (
              <p className="empty-message">No unscheduled tasks.</p>
            )}
          </div>
          <details className="calendar-hours">
            <summary>Daily availability</summary>
            <div className="planning-fields">
              <label>
                Start hour
                <select
                  value={data.calendarHours.start}
                  onChange={(e) =>
                    setData((current) => ({
                      ...current,
                      calendarHours: {
                        ...current.calendarHours,
                        start: Number(e.target.value),
                      },
                    }))
                  }
                >
                  {Array.from({ length: data.calendarHours.end }, (_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </label>
              <label>
                End hour
                <select
                  value={data.calendarHours.end}
                  onChange={(e) =>
                    setData((current) => ({
                      ...current,
                      calendarHours: {
                        ...current.calendarHours,
                        end: Number(e.target.value),
                      },
                    }))
                  }
                >
                  {Array.from(
                    { length: 24 - data.calendarHours.start },
                    (_, i) => data.calendarHours.start + i + 1,
                  ).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </details>
        </aside>
        <div className="calendar-surface">
          <FullCalendar
            ref={calendar}
            weekNumbers
            weekText="W"
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            initialView={view}
            initialDate={selectedDay}
            headerToolbar={false}
            height={fullscreen ? 'calc(100dvh - 190px)' : 680}
            nowIndicator={subOn('fullCalendar', 'nowLine')}
            weekends={subOn('fullCalendar', 'weekends')}
            firstDay={1}
            allDaySlot={false}
            editable
            selectable
            droppable
            eventOverlap={false}
            selectOverlap={false}
            slotDuration="00:15:00"
            scrollTime="08:00:00"
            businessHours={{
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              startTime: `${String(data.calendarHours.start).padStart(2, '0')}:00`,
              endTime: `${String(data.calendarHours.end).padStart(2, '0')}:00`,
            }}
            datesSet={(info) => {
              setHeading(info.view.title)
              const current = calendar.current?.getApi().getDate()
              if (current) setSelectedDay(dayKey(current))
            }}
            events={data.calendarBlocks.map((block) => {
              const task = data.todos.find((t) => t.id === block.taskId)
              return {
                ...block,
                title: task?.title ?? block.title,
                backgroundColor: task?.done
                  ? '#526b60'
                  : block.deepWork
                    ? '#365e97'
                    : '#267c70',
                borderColor: 'transparent',
                extendedProps: { taskId: block.taskId },
                classNames: task?.done ? ['completed-block'] : [],
              }
            })}
            dateClick={(info) => {
              if (info.view.type === 'dayGridMonth') {
                setSelectedDay(dayKey(info.date))
                setView('timeGridDay')
                calendar.current?.getApi().changeView('timeGridDay', info.date)
              }
            }}
            select={(info) => {
              const start = new Date(info.start)
              if (info.allDay) {
                start.setHours(data.calendarHours.start)
                newBlock(start)
              } else newBlock(start, undefined, info.end)
              calendar.current?.getApi().unselect()
            }}
            eventClick={(info) => {
              const block = data.calendarBlocks.find(
                (b) => b.id === info.event.id,
              )
              if (block) edit(block)
            }}
            eventContent={(info) => (
              <span className="calendar-event-label">
                {info.timeText} <strong>{info.event.title}</strong>
              </span>
            )}
            eventDidMount={(info) => {
              info.el.tabIndex = 0
              const s = info.event.start
              const e = info.event.end
              if (s && e) info.el.dataset.hint = `${info.event.title} · ${Math.round((e.getTime() - s.getTime()) / 60000)} min · click to edit`
              info.el.setAttribute('role', 'button')
              info.el.setAttribute(
                'aria-label',
                `Edit block ${info.event.title}`,
              )
              info.el.onkeydown = (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  info.el.click()
                }
              }
            }}
            eventReceive={(info) => {
              const task = data.todos.find(
                (t) => t.id === info.event.extendedProps.taskId,
              )
              const start = info.event.start
              info.revert()
              if (!task || !start) return
              if (info.event.allDay) start.setHours(data.calendarHours.start)
              save({
                id: id(),
                title: task.title,
                taskId: task.id,
                start: start.toISOString(),
                end: new Date(
                  +start + planningOf(task).minutes * 60000,
                ).toISOString(),
                deepWork: planningOf(task).deepWork,
              })
            }}
            eventChange={(info) => {
              const block = data.calendarBlocks.find(
                (b) => b.id === info.event.id,
              )
              if (!block || !info.event.start || !info.event.end) {
                info.revert()
                return
              }
              if (
                !save({
                  ...block,
                  start: info.event.start.toISOString(),
                  end: info.event.end.toISOString(),
                })
              )
                info.revert()
            }}
          />
        </div>
      </div>
      <p role="status">{notice}</p>
      <section className="calendar-day-list">
        <h3>Schedule for {selectedDay}</h3>
        {dailyBlocks.map((block) => {
          const task = data.todos.find((t) => t.id === block.taskId)
          return (
            <div key={block.id}>
              <time>
                {new Date(block.start).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(block.end).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
              <button className="quiet-button" onClick={() => edit(block)}>
                {task?.title ?? block.title}
              </button>
              <span>{block.deepWork ? 'Deep work' : 'Time block'}</span>
              {task && (
                <button
                  className="icon-button"
                  title={task.done ? 'Completed' : 'Complete task'}
                  aria-label={`Complete scheduled ${task.title}`}
                  disabled={
                    task.done || taskAvailability(data, task) !== 'available'
                  }
                  onClick={() =>
                    setData((current) => toggleTodo(current, task.id))
                  }
                >
                  <Check size={17} />
                </button>
              )}
            </div>
          )
        })}
        {!dailyBlocks.length && (
          <p className="empty-message">No time blocks for this day.</p>
        )}
      </section>
      {draft && (
        <Modal
          title={
            data.calendarBlocks.some((b) => b.id === draft.id)
              ? 'Edit time block'
              : 'New time block'
          }
          onClose={() => setDraft(null)}
        >
          <form
            className="planning-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (save({ ...draft, title: draft.title.trim() })) setDraft(null)
            }}
          >
            <label>
              Linked task
              <select
                value={draft.taskId ?? ''}
                onChange={(e) => {
                  const task = data.todos.find((t) => t.id === e.target.value)
                  setDraft({
                    ...draft,
                    taskId: task?.id ?? null,
                    title: task?.title ?? draft.title,
                    deepWork: task ? planningOf(task).deepWork : draft.deepWork,
                  })
                }}
              >
                <option value="">Standalone event</option>
                {data.todos
                  .filter((t) => !t.done || t.id === draft.taskId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Block title
              <input
                required
                maxLength={150}
                readOnly={Boolean(draft.taskId)}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label>
              Starts
              <input
                required
                type="datetime-local"
                value={localInput(draft.start)}
                onChange={(e) => {
                  const date = new Date(e.target.value)
                  if (Number.isFinite(+date))
                    setDraft({ ...draft, start: date.toISOString() })
                }}
              />
            </label>
            <label>
              Ends
              <input
                required
                type="datetime-local"
                value={localInput(draft.end)}
                onChange={(e) => {
                  const date = new Date(e.target.value)
                  if (Number.isFinite(+date))
                    setDraft({ ...draft, end: date.toISOString() })
                }}
              />
            </label>
            <label className="planning-check">
              <input
                type="checkbox"
                checked={draft.deepWork}
                onChange={(e) =>
                  setDraft({ ...draft, deepWork: e.target.checked })
                }
              />
              Deep work
            </label>
            {notice && <p role="alert">{notice}</p>}
            <div className="planning-toolbar">
              <button className="primary">
                <Check size={16} /> Save block
              </button>
              {data.calendarBlocks.some((b) => b.id === draft.id) && (
                <button
                  type="button"
                  className="quiet-button"
                  onClick={() => {
                    setData((current) => ({
                      ...current,
                      calendarBlocks: current.calendarBlocks.filter(
                        (b) => b.id !== draft.id,
                      ),
                    }))
                    setDraft(null)
                    setNotice('Time block removed. Your task is unchanged.')
                  }}
                >
                  <Trash2 size={16} />
                  {draft.taskId ? 'Unschedule' : 'Delete event'}
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}
