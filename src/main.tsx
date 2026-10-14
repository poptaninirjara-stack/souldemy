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
import { APP_NAME } from './config'

document.title = APP_NAME

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
