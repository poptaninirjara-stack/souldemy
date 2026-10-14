import { Link } from 'react-router'
import { getModule, pagePath } from '../lib/content'
import { currentModule, moduleProgress } from '../lib/progress'
import { useAppState } from '../state/useAppState'
import type { Track } from '../types/content'
import styles from './Panels.module.css'

/** One primary action: continue where the student left off in this track, or start module 1. */
export function ContinuePanel({ track }: { track: Track }) {
  const { lastLocation, visited } = useAppState()
  const last = lastLocation?.trackId === track.id ? lastLocation : null
  const lastMod = last ? getModule(track.id, last.moduleId) : undefined
  const lastPage = lastMod?.pages.find((p) => p.id === last?.pageId)

  if (lastMod && lastPage) {
    const p = moduleProgress(lastMod, visited)
    const unit = track.id === 'research' ? 'lessons' : 'sections'
    const where = track.id === 'research' ? `Lesson ${lastPage.number}: ${lastPage.title}.` : `${lastPage.title}.`
    return (
      <section className={styles.panel} aria-labelledby="continue-h">
        <h2 id="continue-h" className={styles.panelTitle}>
          {lastMod.title}
        </h2>
        <p className={styles.line}>
          Module {lastMod.number} of {track.modules.length}. {where} {p.visited} of {p.total} {unit} read.
        </p>
        <div className="progress-line" data-size="4" aria-hidden="true">
          <span style={{ width: `${p.pct}%` }} />
        </div>
        <Link to={pagePath(lastMod, lastPage.id)} className="btn btn-primary btn-block">
          Continue
        </Link>
      </section>
    )
  }

  const first = currentModule(track, visited)
  return (
    <section className={styles.panel} aria-labelledby="continue-h">
      <h2 id="continue-h" className={styles.panelTitle}>
        Start here
      </h2>
      <p className={styles.line}>
        Begin with Module {first.number}: {first.title}.
      </p>
      <Link to={pagePath(first, first.pages[0].id)} className="btn btn-primary btn-block">
        Start module
      </Link>
    </section>
  )
}
