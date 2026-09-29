import { addTask, parseTaskList, removeTask, toggleTask, visibleTasks } from '../src/features/code/taskListModel'

describe('task list capstone', () => {
  it('adds, toggles, filters, and removes without mutating earlier state', () => {
    const initial: ReturnType<typeof addTask> = []
    const added = addTask(initial, '  Read docs  ', 'one')
    expect(added).toEqual([{ id: 'one', title: 'Read docs', done: false }])
    const completed = toggleTask(added, 'one')
    expect(added[0].done).toBe(false)
    expect(visibleTasks(completed, 'done')).toHaveLength(1)
    expect(visibleTasks(completed, 'active')).toHaveLength(0)
    expect(removeTask(completed, 'one')).toEqual([])
  })
  it('rejects invalid titles and corrupted saved data', () => {
    expect(addTask([], ' ', 'one')).toEqual([])
    expect(parseTaskList('{bad')).toEqual([])
    expect(parseTaskList('[{"id":"a","title":"Task","done":false},{"bad":1}]')).toHaveLength(1)
  })
})
