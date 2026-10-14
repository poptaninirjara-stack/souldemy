import { useEffect, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { FurtherReadingButton } from '../components/FurtherReading'
import { Html } from '../components/Html'
import { LoadError, Loading } from '../components/Loading'
import { Rail } from '../components/Rail'
import { ReaderLayout } from '../components/ReaderLayout'
import s from '../components/ReaderLayout.module.css'
import { SHOW_UNREVIEWED_BADGE } from '../config'
import { getModule, getTrack } from '../lib/content'
import { moduleProgress } from '../lib/progress'
import { useModuleContent } from '../lib/useModuleContent'
import { useAppState } from '../state/useAppState'
import styles from './CommModulePage.module.css'
import { NotFound } from './NotFound'

export function CommModulePage() {
  const { moduleId } = useParams()
  const [params] = useSearchParams()
  const target = params.get('s')
  const track = getTrack('communicative')
  const mod = getModule('communicative', moduleId)
  const { data, error, retry } = useModuleContent(mod ? moduleId : undefined)
  const { visited, markVisited, setLastLocation } = useAppState()
  const sentinels = useRef<Map<string, HTMLElement>>(new Map())

  // Remember where the student is.
  useEffect(() => {
    if (!mod) return
    setLastLocation({ trackId: 'communicative', moduleId: mod.id, pageId: target ?? mod.pages[0].id })
  }, [mod, target, setLastLocation])

  // A section counts as read once its end has been on screen.
  useEffect(() => {
    if (!mod || !data) return
    if (typeof IntersectionObserver === 'undefined') {
      // No way to tell what was read: count the sections as read once the page is open.
      mod.pages.forEach((p) => markVisited(mod.id, p.id))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) markVisited(mod.id, (e.target as HTMLElement).dataset.section!)
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    sentinels.current.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [mod, data, markVisited])

  // Index links (?s=core) scroll to and focus their section.
  useEffect(() => {
    if (!target || !data) return
    const h = document.getElementById(`section-${target}`)
    if (!h) return
    h.scrollIntoView({ block: 'start' })
    h.focus({ preventScroll: true })
  }, [target, data])

  if (!track || !mod) return <NotFound />
  const progress = moduleProgress(mod, visited)

  const index = (
    <ol className={styles.index}>
      {mod.pages.map((p) => (
        <li key={p.id}>
          <Link to={`?s=${p.id}`} replace className={styles.chip} aria-current={target === p.id ? 'location' : undefined}>
            {p.title}
          </Link>
        </li>
      ))}
    </ol>
  )

  const margin = (
    <div className={s.marginNote}>
      <p className={s.marginTitle}>
        Module {mod.number} of {track.modules.length}
      </p>
      <div className="progress-line" data-size="4" aria-hidden="true">
        <span style={{ width: `${progress.pct}%` }} />
      </div>
      <p className="caption">
        {progress.visited} of {progress.total} sections read.
      </p>
      <FurtherReadingButton reading={mod.furtherReading} moduleTitle={mod.title} block />
    </div>
  )

  return (
    <ReaderLayout rail={<Rail track={track} current={mod} activePage={target ?? undefined} />} margin={margin}>
      <header className={s.head}>
        <h1>{mod.title}</h1>
        <p className="meta">
          Module {mod.number} of {track.modules.length} in {track.title}.
        </p>
        <div
          className="progress-line"
          data-size="4"
          role="img"
          aria-label={`${progress.visited} of ${progress.total} sections read`}
        >
          <span style={{ width: `${progress.pct}%` }} />
        </div>
        <div className={s.toolbar}>
          <FurtherReadingButton reading={mod.furtherReading} moduleTitle={mod.title} />
        </div>
        <nav aria-label="In this module" className={styles.indexNav}>
          {index}
        </nav>
      </header>

      {error ? (
        <LoadError what="This module" onRetry={retry} />
      ) : !data?.sections ? (
        <Loading thing={mod.title} />
      ) : (
        data.sections.map((sec) => (
          <section key={sec.id} className={s.section} aria-labelledby={`section-${sec.id}`} data-kind={sec.id}>
            <div className={styles.headRow}>
              <h2 id={`section-${sec.id}`} tabIndex={-1} className={styles.sectionTitle}>
                {sec.title}
              </h2>
              {sec.id === 'marathi' && SHOW_UNREVIEWED_BADGE && (
                <span className={styles.badge}>Pending faculty review</span>
              )}
            </div>
            {sec.id === 'marathi' && SHOW_UNREVIEWED_BADGE && (
              <p className="caption">These notes are the author's observations of common patterns. A Marathi-speaking faculty member has not reviewed them yet.</p>
            )}
            <Html className={`prose ${sec.id === 'try' ? styles.tasks : ''}`} html={sec.html} />
            <span
              className={styles.sentinel}
              data-section={sec.id}
              ref={(el) => {
                if (el) sentinels.current.set(sec.id, el)
                else sentinels.current.delete(sec.id)
              }}
              aria-hidden="true"
            />
          </section>
        ))
      )}

      <nav className={s.pager} aria-label="Modules">
        {mod.number > 1 && (
          <Link to={`/communicative/${track.modules[mod.number - 2].id}`} className={s.pagerLink} data-dir="prev" rel="prev">
            <span className={s.pagerDir}>Previous module</span>
            <span className={s.pagerTitle}>{track.modules[mod.number - 2].title}</span>
          </Link>
        )}
        {mod.number < track.modules.length ? (
          <Link to={`/communicative/${track.modules[mod.number].id}`} className={s.pagerLink} data-dir="next" rel="next">
            <span className={s.pagerDir}>Next module</span>
            <span className={s.pagerTitle}>{track.modules[mod.number].title}</span>
          </Link>
        ) : (
          <Link to="/communicative" className={s.pagerLink} data-dir="next">
            <span className={s.pagerDir}>End of track</span>
            <span className={s.pagerTitle}>Back to contents</span>
          </Link>
        )}
      </nav>
    </ReaderLayout>
  )
}
