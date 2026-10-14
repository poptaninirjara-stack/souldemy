import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts (bundled; no runtime CDN calls). Each file carries unicode-range
// subsets, so browsers download only the scripts a page uses.
import '@fontsource-variable/literata/opsz.css'
import '@fontsource-variable/literata/opsz-italic.css'
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/500.css'
import '@fontsource/public-sans/600.css'
import '@fontsource/noto-serif-devanagari/400.css'
import '@fontsource/noto-serif-devanagari/600.css'
import '@fontsource/noto-sans-devanagari/400.css'
import '@fontsource/noto-sans-devanagari/600.css'

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
