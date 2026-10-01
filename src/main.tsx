import { StrictMode } from 'react'
import { applyComfort } from './settings/comfort'

// Sizes and motion preferences apply before the first paint.
applyComfort()
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { AudioMixerProvider } from './contexts/AudioMixerContext'
import { AudioMixer } from './components/AudioMixer'
import { installInteractions } from './components/ui/interactions'
import './components/ui/interactions.css'
import { applyCompactTitles, applyCustomCss, applyDisplayToggles, applyPageBanner } from './components/ui/Flow'
import { pixelIconsOn } from './icons/pixelated'
import { registerChartTheme } from './components/ui/chartTheme'
import { installCardEntrance, installCardGlow, installTitleReveal } from './components/ui/cardGlow'
import { installFunLayer } from './components/ui/funLayer'
import { installAppHealth } from './components/ui/appHealth'
import { installSafeFrom } from './utils/gsapSafeFrom'
import { migrateLifeTools } from './components/daybook/storage'

installSafeFrom()

installInteractions()
try {
  migrateLifeTools()
} catch {
  /* storage unavailable */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudioMixerProvider>
      <App />
      <AudioMixer />
    </AudioMixerProvider>
  </StrictMode>,
)

applyCompactTitles()
applyPageBanner()
applyCustomCss()
applyDisplayToggles()
try {
  document.documentElement.toggleAttribute('data-nav-dense', localStorage.getItem('bloom-nav-dense') === '1')
  document.documentElement.toggleAttribute('data-high-contrast', localStorage.getItem('bloom-high-contrast') === '1')
  document.documentElement.toggleAttribute('data-bloom-right', localStorage.getItem('bloom-chat-right') === '1')
  const round = localStorage.getItem('bloom-round')
  if (round) document.documentElement.dataset.round = round
} catch {
  /* default density */
}
document.documentElement.toggleAttribute('data-pixel-icons', pixelIconsOn())
registerChartTheme()
installCardGlow()
installTitleReveal()
installCardEntrance()
installFunLayer()
installAppHealth()

// Dev only: log Largest Contentful Paint and layout shifts to spot slow or jumpy pages.
if (import.meta.env.DEV && typeof PerformanceObserver !== 'undefined') {
  try {
    new PerformanceObserver((list) => {
      const last = list.getEntries().at(-1)
      if (last) console.debug(`[vitals] LCP ${Math.round(last.startTime)} ms`)
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    let cls = 0
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) cls += e.value
      if (cls > 0.1) console.debug(`[vitals] CLS ${cls.toFixed(3)} on ${location.hash || '#overview'}`)
    }).observe({ type: 'layout-shift', buffered: true })
  } catch {
    /* unsupported entry types */
  }
}
