import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useMatch } from 'react-router'
import { APP_NAME } from '../config'
import { findModule } from '../lib/content'
import { placeFor } from '../lib/places'
import { useReducedMotion } from '../state/useAppState'
import { useProgress } from '../state/useProgress'
import { Celebration } from './Celebration'
import { ContentUpdate } from './ContentUpdate'
import { PasswordReminder } from './PasswordReminder'
import { Bolt, Book, Campus, Cards, ChevronLeft, User } from './Icons'
import styles from './Layout.module.css'
import { XpToast } from './XpToast'

function useBackLink(): { label: string; to: string } | null {
  const lesson = useMatch('/research/:moduleId/:pageId')
  const read = useMatch('/communicative/:moduleId/read')
  const place = useMatch('/:trackId/:moduleId')
  const lessonPlace = lesson && placeFor(lesson.params.moduleId ?? '')
  if (lesson?.params.pageId !== 'read' && lessonPlace) return { label: lessonPlace.name, to: `/research/${lesson!.params.moduleId}` }
  const readPlace = read && placeFor(read.params.moduleId ?? '')
  if (readPlace) return { label: readPlace.name, to: `/communicative/${read!.params.moduleId}` }
  if (place && findModule(place.params.moduleId ?? '')) return { label: 'Campus', to: '/' }
  return null
}

export function Layout() {
  useReducedMotion()
  const location = useLocation()
  const back = useBackLink()
  const progress = useProgress()
  const path = location.pathname
  const focusMode = path.startsWith('/play/') || path.startsWith('/mirror/')
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
  }, [path, location.search])

  const items = [
    { to: '/', label: 'Campus', icon: <Campus size={22} />, active: !['/review', '/library', '/me'].includes(path) },
    { to: '/review', label: 'Review', icon: <Cards size={22} />, active: path === '/review', badge: progress.dueCards.length || undefined },
    { to: '/library', label: 'Library', icon: <Book size={22} />, active: path === '/library' },
    { to: '/me', label: 'Me', icon: <User size={22} />, active: path === '/me' },
  ]
  const nav = items.map((i) => (
    <Link key={i.label} to={i.to} className={styles.navItem} aria-current={i.active ? 'page' : undefined}>
      <span className={styles.navIcon}>
        {i.icon}
        {i.badge ? (
          <span className={styles.navBadge}>
            {i.badge}
            <span className="visually-hidden"> due</span>
          </span>
        ) : null}
      </span>
      <span>{i.label}</span>
    </Link>
  ))

  return (
    <div className={styles.app} data-focus={focusMode}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus() }}>
        Skip to content
      </a>
      <header className={styles.topbar}>
        <div className={styles.left}>
          {back && !focusMode ? (
            <Link to={back.to} className={`${styles.back} ${styles.phoneOnly}`}>
              <ChevronLeft />
              {back.label}
            </Link>
          ) : null}
          <Link to="/" className={`${styles.wordmark} ${back && !focusMode ? styles.deskOnly : ''}`} aria-label={`${APP_NAME} home`}>
            {APP_NAME}
          </Link>
        </div>
        <nav aria-label="Main" className={styles.deskNav}>
          {nav}
        </nav>
        <Link to="/me" className={styles.stats} aria-label={`${progress.xp} XP, ${progress.rank.name}. ${progress.thisWeek} of ${progress.weekGoal} practice days this week.`}>
          <span className={styles.statChip} aria-hidden="true">
            <Bolt size={16} />
            {progress.xp}
          </span>
          <span className={styles.statChip} data-tone={progress.thisWeek >= progress.weekGoal ? 'done' : undefined} aria-hidden="true">
            {progress.thisWeek}/{progress.weekGoal} days
          </span>
        </Link>
      </header>

      <PasswordReminder />
      <ContentUpdate />
      <main id="main" ref={mainRef} tabIndex={-1} className={styles.main}>
        <div key={path} className="screen-fade">
          <Outlet />
        </div>
      </main>

      {!focusMode && (
        <nav aria-label="Main" className={styles.bottomNav}>
          {nav}
        </nav>
      )}
      <XpToast />
      <Celebration />
    </div>
  )
}
