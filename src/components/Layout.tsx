import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useMatch } from 'react-router'
import { APP_NAME } from '../config'
import { findModule, getTrack } from '../lib/content'
import { useAppState, useReducedMotion } from '../state/AppState'
import { ChevronLeft } from './Icons'
import styles from './Layout.module.css'

function useBackLink(): { label: string; to: string } | null {
  const lesson = useMatch('/research/:moduleId/:pageId')
  const module = useMatch('/:trackId/:moduleId')
  if (lesson) return { label: 'Contents', to: `/research/${lesson.params.moduleId}` }
  if (module && getTrack(module.params.trackId) && findModule(module.params.moduleId ?? ''))
    return { label: 'All modules', to: `/${module.params.trackId}` }
  return null
}

export function Layout() {
  const { track } = useAppState()
  useReducedMotion()
  const location = useLocation()
  const back = useBackLink()
  const isWelcome = location.pathname === '/'
  const learnTo = track ? `/${track}` : '/'
  const onLearn = !['/library', '/progress'].includes(location.pathname)
  const mainRef = useRef<HTMLElement>(null)
  const first = useRef(true)

  // On every screen change: scroll to top and move focus to the new page's heading.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (location.search.startsWith('?s=')) return // section links scroll themselves
    window.scrollTo(0, 0)
    const h1 = mainRef.current?.querySelector('h1')
    if (h1) {
      h1.setAttribute('tabindex', '-1')
      h1.focus({ preventScroll: true })
    }
  }, [location.pathname, location.search])

  const items = [
    { to: learnTo, label: 'Learn', active: onLearn },
    { to: '/library', label: 'Library', active: location.pathname === '/library' },
    { to: '/progress', label: 'Progress', active: location.pathname === '/progress' },
  ]
  const nav = items.map((i) => (
    <Link key={i.label} to={i.to} className={styles.navItem} aria-current={i.active ? 'page' : undefined}>
      {i.label}
    </Link>
  ))

  return (
    <div className={styles.app} data-welcome={isWelcome}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus() }}>
        Skip to content
      </a>
      <header className={styles.topbar}>
        {back ? (
          <Link to={back.to} className={`${styles.back} ${styles.phoneOnly}`}>
            <ChevronLeft />
            {back.label}
          </Link>
        ) : null}
        <Link to="/" className={`${styles.wordmark} ${back ? styles.deskOnly : ''}`}>
          {APP_NAME}
        </Link>
        <nav aria-label="Main" className={styles.deskNav}>
          {nav}
        </nav>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className={styles.main}>
        <div key={location.pathname} className="screen-fade">
          <Outlet />
        </div>
      </main>

      {!isWelcome && (
        <nav aria-label="Main" className={styles.bottomNav}>
          {nav}
        </nav>
      )}
    </div>
  )
}
