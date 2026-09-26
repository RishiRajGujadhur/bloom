export type Field = {
  key: string
  label: string
  kind?: 'text' | 'area' | 'number' | 'date' | 'time' | 'select'
  options?: string[]
  hint?: string
  initial?: string
  min?: number
  max?: number
}
export type LifeRecord = {
  id: string
  tool: string
  title: string
  values: Record<string, string>
  created: number
  updated: number
  done: boolean
  next: string
}
export type Analysis = {
  title: string
  lines: string[]
  bars?: { label: string; value: number }[]
  image?: string
  imports?: { title: string; values: Record<string, string> }[]
  download?: { name: string; text: string; mime: string; save?: () => void }
}
export type Tool = {
  id: string
  name: string
  description: string
  category: string
  color: string
  library: string
  fields: Field[]
  links: string[]
  analyze: (
    values: Record<string, string>,
    records: LifeRecord[],
  ) => Analysis | Promise<Analysis>
}
export const lines = (text = '') =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
export const number = (s = '') => (Number.isFinite(Number(s)) ? Number(s) : 0)
