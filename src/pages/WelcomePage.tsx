import { useCallback, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronRight } from '../components/Icons'
import { Opening, OPENING_FLAG, OPENING_SWEEP_DELAY } from '../components/Opening'
import { Page } from '../components/Page'
import { WeeklyPanel } from '../components/WeeklyPanel'
import { TRACK_BLURBS } from '../config'
import { catalog, getModule, pagePath } from '../lib/content'
import { sessionFlag } from '../lib/storage'
import { useAppState, useReducedMotion } from '../state/useAppState'
import type { TrackId } from '../types/content'
import panels from '../components/Panels.module.css'
import styles from './WelcomePage.module.css'

export function WelcomePage() {
  const reduced = useReducedMotion()
  const [opening] = useState(() => !sessionFlag(OPENING_FLAG) && !reduced)
  const [showPanel, setShowPanel] = useState(opening)
  const done = useCallback(() => setShowPanel(false), [])
  const { setTrack } = useAppState()
  const navigate = useNavigate()

  const choose = (id: TrackId) => {
    setTrack(id)
    navigate(`/${id}`)
  }

  // The sweep is part of the page: it runs after the panel lifts, or at once on later visits.
  const sweepStyle = { '--sweep-delay': `${opening ? OPENING_SWEEP_DELAY : 0}ms` } as CSSProperties

  return (
    <>
      {showPanel && <Opening onDone={done} />}
      <Page>
        <h1 className={styles.h1}>Learn to write and speak the way scholars do.</h1>

        <div className={styles.demo} style={sweepStyle}>
          <blockquote className={styles.sentence}>
            <p>
              Early findings <mark className={styles.phrase}>suggest</mark> a link between sleep and memory.
            </p>
          </blockquote>
          <aside className={`${styles.note}`} aria-label="Margin note">
            <p>
              <strong className={styles.noteTerm}>Hedging.</strong> 'Suggest' signals caution; 'prove' would claim too much.
            </p>
          </aside>
        </div>

        <Continue />

        <section aria-labelledby="choose-h" className={styles.choose}>
          <h2 id="choose-h" className={styles.h3}>
            Choose a track
          </h2>
          <div className={styles.cards}>
            {catalog.tracks.map((t) => (
              <button key={t.id} type="button" className={styles.card} onClick={() => choose(t.id)}>
                <span className={styles.cardHead}>
                  <span className={styles.cardTitle}>{t.title}</span>
                  <ChevronRight size={20} />
                </span>
                <span className={styles.blurb}>{TRACK_BLURBS[t.id]}</span>
                <span className="caption">{t.modules.length} modules</span>
              </button>
            ))}
          </div>
        </section>

        <div className={styles.week}>
          <WeeklyPanel />
        </div>

        <p className="caption">Free. No account. Progress stays on this device.</p>
      </Page>
    </>
  )
}

/** "Continue where you left off", shown only when there is somewhere to continue. */
function Continue() {
  const { lastLocation } = useAppState()
  const mod = lastLocation ? getModule(lastLocation.trackId, lastLocation.moduleId) : undefined
  const page = mod?.pages.find((p) => p.id === lastLocation?.pageId)
  if (!mod || !page) return null
  const where = mod.trackId === 'research' ? `Lesson ${page.number}: ${page.title}` : page.title
  return (
    <section className={panels.panel} aria-labelledby="resume-h">
      <h2 id="resume-h" className={panels.panelTitle}>
        Continue where you left off
      </h2>
      <p className={panels.line}>
        {mod.title}. {where}.
      </p>
      <Link to={pagePath(mod, page.id)} className="btn btn-primary">
        Continue
      </Link>
    </section>
  )
}
