import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { AudioMixerProvider } from './contexts/AudioMixerContext'
import { AudioMixer } from './components/AudioMixer'
import { installInteractions } from './components/ui/interactions'
import './components/ui/interactions.css'

installInteractions()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudioMixerProvider>
      <App />
      <AudioMixer />
    </AudioMixerProvider>
  </StrictMode>,
)
