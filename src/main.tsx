import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n/i18n'
import './index.css'
import App from './App.tsx'
import { applyTheme, getStoredTheme } from './utils/themeEngine'
import { applyFeatureFlags, getFeatureFlags } from './utils/featureFlags'

// Applied before the first render so the stored palette/font is on <html>
// immediately: no flash of the fallback theme, and no chance of the CSS
// variables being read before they exist.
applyTheme(getStoredTheme())
applyFeatureFlags(getFeatureFlags())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
)
