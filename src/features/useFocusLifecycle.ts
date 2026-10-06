import { useEffect, type Dispatch, type SetStateAction } from 'react'
import type { AppData } from '../model'
import { completeFocusQuest, failFocusQuest } from '../rpg/engine'

export function useFocusLifecycle(
  data: AppData,
  setData: Dispatch<SetStateAction<AppData>>,
) {
  const quest = data.rpg.focusQuest
  useEffect(() => {
    if (
      !quest.startedAt ||
      quest.pausedAt !== null ||
      quest.completedAt ||
      quest.failedAt
    )
      return
    const tick = () => {
      if (Date.now() - quest.startedAt! >= quest.durationMinutes * 60000)
        setData((current) => completeFocusQuest(current))
    }
    const visibility = () => {
      if (document.visibilityState === 'hidden' && quest.strict)
        setData((current) => {
          const completed = completeFocusQuest(current)
          return completed === current ? failFocusQuest(current) : completed
        })
      else tick()
    }
    let timer = 0
    const schedule = () => {
      const remaining =
        quest.startedAt! + quest.durationMinutes * 60000 - Date.now()
      if (remaining <= 0) {
        tick()
        return
      }
      timer = window.setTimeout(schedule, Math.min(remaining, 2_147_483_647))
    }
    schedule()
    document.addEventListener('visibilitychange', visibility)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [
    quest.startedAt,
    quest.pausedAt,
    quest.completedAt,
    quest.failedAt,
    quest.strict,
    quest.durationMinutes,
    setData,
  ])
}
