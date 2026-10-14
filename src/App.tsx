import { HashRouter, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { CommModulePage } from './pages/CommModulePage'
import { LessonPage } from './pages/LessonPage'
import { LibraryPage } from './pages/LibraryPage'
import { ModulePage } from './pages/ModulePage'
import { NotFound } from './pages/NotFound'
import { ProgressPage } from './pages/ProgressPage'
import { TrackPage } from './pages/TrackPage'
import { WelcomePage } from './pages/WelcomePage'
import { AppStateProvider } from './state/AppState'

export function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<WelcomePage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path=":trackId" element={<TrackPage />} />
            <Route path="research/:moduleId" element={<ModulePage />} />
            <Route path="research/:moduleId/:pageId" element={<LessonPage />} />
            <Route path="communicative/:moduleId" element={<CommModulePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppStateProvider>
  )
}
