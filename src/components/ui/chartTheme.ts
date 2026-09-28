import { Chart } from 'chart.js'
import { useThemeId } from './MatrixRain'

/**
 * Chart colours that follow the theme. In Matrix, charts glow in phosphor
 * green with amber and violet accents (like a trading terminal).
 */
export const matrixPalette = ['#39ff6a', '#f5c542', '#8b5cf6', '#35d0a0', '#9ef04a', '#ff4d6d']
export const isMatrix = () => typeof document !== 'undefined' && document.documentElement.dataset.theme === 'matrix'
export function useChartColors(fallback: string[]) {
  return useThemeId() === 'matrix' ? matrixPalette : fallback
}

/** Chart.js: recolour datasets and add a soft glow while the Matrix theme is on. */
let registered = false
export function registerChartTheme() {
  if (registered) return
  registered = true
  Chart.register({
    id: 'bloomMatrix',
    beforeUpdate(chart) {
      if (!isMatrix()) return
      chart.data.datasets.forEach((ds, i) => {
        const c = matrixPalette[i % matrixPalette.length]
        const d = ds as unknown as Record<string, unknown>
        d.borderColor = c
        d.backgroundColor = Array.isArray(d.backgroundColor) ? (d.backgroundColor as unknown[]).map((_, k) => `${matrixPalette[k % matrixPalette.length]}cc`) : `${c}33`
        d.pointBackgroundColor = c
      })
      // Edit the raw config (chart.options is a resolver proxy: spreading it corrupts Chart.js).
      const scales = (chart.config.options as { scales?: Record<string, { grid?: { color?: string }; ticks?: { color?: string } }> } | undefined)?.scales
      for (const sc of Object.values(scales ?? {})) {
        sc.grid ??= {}
        sc.grid.color = '#1d5a2e66'
        sc.ticks ??= {}
        sc.ticks.color = '#6fdc8c'
      }
    },
    beforeDatasetsDraw(chart) {
      if (!isMatrix()) return
      chart.ctx.save()
      chart.ctx.shadowColor = '#39ff6a'
      chart.ctx.shadowBlur = 12
    },
    afterDatasetsDraw(chart) {
      if (!isMatrix()) return
      chart.ctx.restore()
    },
  })
}
