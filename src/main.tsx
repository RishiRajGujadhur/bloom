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
import { applyCompactTitles } from './components/ui/Flow'
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
document.documentElement.toggleAttribute('data-pixel-icons', pixelIconsOn())
registerChartTheme()
installCardGlow()
installTitleReveal()
installCardEntrance()
installFunLayer()
installAppHealth()
