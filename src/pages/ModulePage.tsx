import { Link, useParams } from 'react-router'
import { FurtherReadingButton } from '../components/FurtherReading'
import { Html } from '../components/Html'
import { ChevronRight } from '../components/Icons'
import { Rail } from '../components/Rail'
import { ReaderLayout } from '../components/ReaderLayout'
import s from '../components/ReaderLayout.module.css'
import { getModule, getTrack, pageKey } from '../lib/content'
import { displaySkill } from '../lib/omissions'
import { moduleProgress } from '../lib/progress'
import { useAppState } from '../state/useAppState'
import { NotFound } from './NotFound'
import styles from './ModulePage.module.css'

/** Research module overview: outcomes and the lesson list with "Read" marks (no scores). */
export function ModulePage() {
  const { moduleId } = useParams()
  const track = getTrack('research')
  const mod = getModule('research', moduleId)
  const { visited } = useAppState()
  if (!track || !mod) return <NotFound />

  const p = moduleProgress(mod, visited)
  const nextPage = mod.pages.find((pg) => !visited.has(pageKey(mod.id, pg.id))) ?? mod.pages[0]

  const margin = (
    <div className={s.marginNote}>
      <p className={s.marginTitle}>
        {p.visited} of {p.total} lessons read
      </p>
      <div className="progress-line" data-size="4" aria-hidden="true">
        <span style={{ width: `${p.pct}%` }} />
      </div>
      <FurtherReadingButton reading={mod.furtherReading} moduleTitle={mod.title} block />
    </div>
  )

  return (
    <ReaderLayout rail={<Rail track={track} current={mod} />} margin={margin}>
      <header className={s.head}>
        <h1>{mod.title}</h1>
        <p className="meta">
          Module {mod.number} of {track.modules.length} in {track.title}.
        </p>
        <div className={styles.meta}>
          {mod.metaHtml.map((h, i) => (
            <Html key={i} as="p" html={h} />
          ))}
        </div>
        <div className={styles.actions}>
          <Link to={`/research/${mod.id}/${nextPage.id}`} className="btn btn-primary">
            {p.started ? (p.complete ? 'Read again from lesson 1' : 'Continue') : 'Start module'}
          </Link>
          <span className={s.toolbar}>
            <FurtherReadingButton reading={mod.furtherReading} moduleTitle={mod.title} />
          </span>
        </div>
      </header>

      <section className={s.section} aria-labelledby="outcomes-h">
        <h2 id="outcomes-h">Module outcomes</h2>
        {mod.outcomesIntro && <p className="meta">{mod.outcomesIntro}</p>}
        <ol className={`prose ${styles.outcomes}`}>
          {mod.outcomesHtml.map((o, i) => (
            <Html key={i} as="li" html={o} />
          ))}
        </ol>
      </section>

      <section className={s.section} aria-labelledby="lessons-h">
        <h2 id="lessons-h">Lessons</h2>
        <ol className={styles.lessons}>
          {mod.pages.map((pg) => {
            const read = visited.has(pageKey(mod.id, pg.id))
            const row = mod.lessonMap.find((r) => r.number === String(pg.number))
            return (
              <li key={pg.id}>
                <Link to={`/research/${mod.id}/${pg.id}`} className={styles.lesson}>
                  <span className={styles.num}>{pg.number}</span>
                  <span className={styles.lessonBody}>
                    <span className={styles.lessonTitle}>{pg.title}</span>
                    {row && <span className={styles.skill}>{displaySkill(mod.id, row)}</span>}
                  </span>
                  <span className={styles.read}>{read ? 'Read' : ''}</span>
                  <ChevronRight size={18} />
                </Link>
              </li>
            )
          })}
        </ol>
      </section>
    </ReaderLayout>
  )
}
