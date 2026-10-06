import { act, renderHook } from '@testing-library/react'
import { useToday } from '../src/utils/useToday'
import { useFocusLifecycle } from '../src/features/useFocusLifecycle'
import { defaults } from '../src/model'
import { dayKey } from '../src/dates'

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(2026, 8, 1, 23, 59, 55))
})
afterEach(() => jest.useRealTimers())

test('day changes once at midnight with one timer and cleans up', () => {
  const hook = renderHook(useToday)
  expect(hook.result.current).toBe(dayKey())
  expect(jest.getTimerCount()).toBe(1)
  act(() => {
    jest.advanceTimersByTime(5001)
  })
  expect(hook.result.current).toBe(dayKey())
  expect(hook.result.current).toBe('2026-09-02')
  expect(jest.getTimerCount()).toBe(1)
  hook.unmount()
  expect(jest.getTimerCount()).toBe(0)
})

test('focus completion uses one deadline instead of polling every second', () => {
  const data = defaults()
  data.rpg.focusQuest = {
    ...data.rpg.focusQuest,
    startedAt: Date.now(),
    pausedAt: null,
    completedAt: null,
    failedAt: null,
    durationMinutes: 1,
  }
  const setData = jest.fn()
  const hook = renderHook(() => useFocusLifecycle(data, setData))
  expect(jest.getTimerCount()).toBe(1)
  act(() => {
    jest.advanceTimersByTime(59000)
  })
  expect(setData).not.toHaveBeenCalled()
  act(() => {
    jest.advanceTimersByTime(1000)
  })
  expect(setData).toHaveBeenCalledTimes(1)
  hook.unmount()
  expect(jest.getTimerCount()).toBe(0)
})
