import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts (bundled; no runtime CDN calls). Anek Latin for display and interface,
// Mukta for body text in Latin and Devanagari. unicode-range subsets load only what a page uses.
import '@fontsource-variable/anek-latin/wdth.css'
import '@fontsource/mukta/400.css'
import '@fontsource/mukta/600.css'
import '@fontsource/mukta/700.css'

import './styles/tokens.css'
import './styles/global.css'
import { App } from './App'
import { OPENING_FLAG } from './components/Opening'
import { APP_NAME } from './config'
import { setSessionFlag } from './lib/storage'

document.title = APP_NAME

// The opening plays only when a session starts on the welcome page, never over a deep link.
if (!['', '#', '#/'].includes(window.location.hash)) setSessionFlag(OPENING_FLAG)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline support after the first visit (production builds only; see public/sw.js).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline caching is a bonus; the app works without it.
    })
  })
}
