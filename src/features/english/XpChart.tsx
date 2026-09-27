import { Bar } from 'react-chartjs-2'
import { BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js'
import { useChartColors } from '../../components/ui/chartTheme'
import { xpSeries, type EnglishStore } from './englishModel'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip)

/** XP earned per day over the last two weeks. */
export function XpChart({ store, today }: { store: EnglishStore; today: string }) {
  const series = xpSeries(store, today)
  const colors = useChartColors(['#58cc02'])
  return (
    <div className="en-chart">
      <Bar
        data={{
          labels: series.map((d) => new Date(`${d.date}T12:00:00`).toLocaleDateString([], { weekday: 'narrow' })),
          datasets: [{ label: 'XP', data: series.map((d) => d.xp), backgroundColor: colors[0], borderRadius: 6 }],
        }}
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }}
      />
    </div>
  )
}
