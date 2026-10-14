import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { displaySkill } from '../lib/omissions'
import { currentModule, moduleProgress, statusText } from '../lib/progress'
import { useAppState } from '../state/useAppState'
import type { ModuleSummary, Track } from '../types/content'
import { Html } from './Html'
import styles from './ModuleList.module.css'

/** Contents list for a track, with the bookmark ribbon on the current module. */
export function ModuleList({ track }: { track: Track }) {
  const { visited } = useAppState()
  const current = currentModule(track, visited)
  const listRef = useRef<HTMLOListElement>(null)
  const [ribbon, setRibbon] = useState<{ top: number; height: number } | null>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    const row = list?.querySelector<HTMLElement>(`[data-row="${current.id}"]`)
    if (!list || !row) return
    const measure = () => setRibbon({ top: row.offsetTop, height: row.offsetHeight })
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [current.id])

  return (
    <div className={styles.wrap}>
      {ribbon && <span className={styles.ribbon} style={{ top: ribbon.top, height: ribbon.height }} aria-hidden="true" />}
      <ol ref={listRef} className={styles.list}>
        {track.modules.map((m) => (
          <ModuleRow key={m.id} m={m} isCurrent={m.id === current.id} />
        ))}
      </ol>
    </div>
  )
}

function ModuleRow({ m, isCurrent }: { m: ModuleSummary; isCurrent: boolean }) {
  const { visited } = useAppState()
  const p = moduleProgress(m, visited)
  const status = statusText(m, p)
  const count = m.trackId === 'research' ? `${m.pages.length} lessons` : `${m.pages.length} sections`
  return (
    <li data-row={m.id} className={styles.item}>
      <Link
        to={`/${m.trackId}/${m.id}`}
        className={styles.row}
        data-current={isCurrent}
        aria-current={isCurrent ? 'step' : undefined}
        aria-label={`${m.number}. ${m.title}, ${status}`}
      >
        <span className={styles.num}>{m.number}</span>
        <span className={styles.body}>
          <span className={styles.title}>{m.title}</span>
          <span className={styles.outcome}>{count}</span>
          <span className={styles.progressRow}>
            <span className={`progress-line ${styles.line}`}>
              <span style={{ width: `${p.pct}%` }} />
            </span>
            <span className={styles.status}>{status}</span>
          </span>
        </span>
      </Link>

      {m.trackId === 'research' && (
        <details className={styles.details}>
          <summary className={styles.summary}>Outcomes and lesson map</summary>
          <div className={styles.detailBody}>
            {m.outcomesIntro && <p className={styles.small}>{m.outcomesIntro}</p>}
            <ol className={styles.outcomes}>
              {m.outcomesHtml.map((o, i) => (
                <Html key={i} as="li" html={o} />
              ))}
            </ol>
            <LessonMap m={m} />
          </div>
        </details>
      )}
    </li>
  )
}

export function LessonMap({ m }: { m: ModuleSummary }) {
  return (
    <div className="table-scroll" role="region" tabIndex={0} aria-label={`Lesson map for ${m.title}`}>
      <table className={styles.map}>
        <caption className="visually-hidden">Lesson map</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Lesson</th>
            <th scope="col">Core skill</th>
          </tr>
        </thead>
        <tbody>
          {m.lessonMap.map((r) => (
            <tr key={r.number}>
              <td className={styles.mapNum}>{r.number}</td>
              <td>
                <Link to={`/research/${m.id}/l${r.number}`}>{r.lesson}</Link>
              </td>
              <td>{displaySkill(m.id, r)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
