import { RULES, type Exercise } from './formModel'
export type CoachSession = {
  id: string; exercise: Exercise; at: number; seconds: number; reps: number; score: number;
  joules: number; kcal: number; power: number; peak: number; leftWork: number; rightWork: number;
  leftAngle: number; rightAngle: number; range: { low: number; down: number; up: number } | null;
  compensation: number; xp?: number; damage?: number
}
const KEY = 'bloom-coach-history-v1'
export function readCoachHistory(): CoachSession[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.filter(row => row && typeof row.id === 'string' && typeof row.exercise === 'string' && Object.hasOwn(RULES, row.exercise) && ['at', 'seconds', 'reps', 'score', 'joules', 'kcal', 'power', 'peak', 'leftWork', 'rightWork', 'leftAngle', 'rightAngle', 'compensation'].every(key => typeof row[key] === 'number' && Number.isFinite(row[key]) && row[key] >= 0)).slice(-100)
  } catch { return [] }
}
export function saveCoachSession(session: CoachSession) {
  const history = [...readCoachHistory().filter(row => row.id !== session.id), session].slice(-100)
  localStorage.setItem(KEY, JSON.stringify(history)); return history
}
export function recoverySuggestion(history: CoachSession[], now = Date.now()) {
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  const rows = history.filter(row => new Date(row.at).toDateString() === yesterday.toDateString())
  const work = rows.reduce((sum, row) => sum + row.joules, 0)
  const minutes = rows.reduce((sum, row) => sum + row.seconds, 0) / 60
  return work >= 1500 || minutes >= 30 ? { work, minutes, exercise: 'taiChi' as const } : null
}
export function coachMarkdown(rows: CoachSession[]) {
  return '# Bloom Form Coach\n\nCamera-derived estimates; not clinical or calibrated mechanical measurements.\n\n' + rows.map(row => `## ${RULES[row.exercise].name} — ${new Date(row.at).toLocaleString()}\n\n- Reps: ${row.reps}; active time: ${row.seconds.toFixed(1)} s\n- Form score: ${row.exercise === 'observe' ? 'not graded (observation)' : `${row.score.toFixed(0)}%`}\n- Estimated work: ${row.joules.toFixed(2)} J\n- Estimated kcal: ${row.kcal.toFixed(3)}\n- Average estimated power: ${row.power.toFixed(2)} W\n- Peak estimated hand velocity: ${row.peak.toFixed(2)} m/s\n- Left/right limb work: ${row.leftWork.toFixed(2)} / ${row.rightWork.toFixed(2)} J\n- Last projected elbow angles: ${row.leftAngle}° / ${row.rightAngle}°\n- Personal range: ${row.range ? `${row.range.low.toFixed(1)}° minimum; rep triggers ${row.range.down.toFixed(1)}° / ${row.range.up.toFixed(1)}°` : 'default'}\n- Alignment-change frames: ${(row.compensation * 100).toFixed(0)}%\n- XP: ${row.xp ?? 0}; RPG damage: ${row.damage ?? 0}\n`).join('\n')
}
