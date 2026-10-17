import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { Loading } from './components/Loading'
import { Page } from './components/Page'
import { HomePage } from './pages/HomePage'
import { NotFound } from './pages/NotFound'
import { PlacePage } from './pages/PlacePage'
import { AppStateProvider } from './state/AppState'

// Screens loaded on demand, so the first visit on a budget phone downloads less.
const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))
const GamePage = named(() => import('./pages/GamePage'), 'GamePage')
const ReviewPage = named(() => import('./pages/ReviewPage'), 'ReviewPage')
const MirrorPage = named(() => import('./pages/MirrorPage'), 'MirrorPage')
const LibraryPage = named(() => import('./pages/LibraryPage'), 'LibraryPage')
const MePage = named(() => import('./pages/MePage'), 'MePage')
const LessonPage = named(() => import('./pages/LessonPage'), 'LessonPage')
const CommModulePage = named(() => import('./pages/CommModulePage'), 'CommModulePage')

const wait = (el: React.ReactNode, thing: string) => (
  <Suspense
    fallback={
      <Page width="reading">
        <Loading thing={thing} />
      </Page>
    }
  >
    {el}
  </Suspense>
)

export function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="review" element={wait(<ReviewPage />, 'your review deck')} />
            <Route path="library" element={wait(<LibraryPage />, 'the library')} />
            <Route path="me" element={wait(<MePage />, 'your progress')} />
            <Route path="progress" element={<Navigate to="/me" replace />} />
            <Route path="play/:gameId" element={wait(<GamePage />, 'the game')} />
            <Route path="mirror/:moduleId" element={wait(<MirrorPage />, 'Mirror mode')} />
            <Route path=":trackId" element={<Navigate to="/" replace />} />
            <Route path=":trackId/:moduleId" element={<PlacePage />} />
            <Route path="research/:moduleId/:pageId" element={wait(<LessonPage />, 'the lesson')} />
            <Route path="communicative/:moduleId/read" element={wait(<CommModulePage />, 'the module')} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppStateProvider>
  )
}
