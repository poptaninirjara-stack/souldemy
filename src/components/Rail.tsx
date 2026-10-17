import { Link } from 'react-router'
import { pageKey, pagePath } from '../lib/content'
import { moduleProgress } from '../lib/progress'
import { useAppState } from '../state/useAppState'
import type { ModuleSummary, Track } from '../types/content'
import { ChevronLeft } from './Icons'
import styles from './Rail.module.css'

/** Desktop contents rail (handoff §6): fixed while the main column changes. */
export function Rail({ track, current, activePage }: { track: Track; current: ModuleSummary; activePage?: string }) {
  const { visited } = useAppState()
  return (
    <nav className={styles.rail} aria-label="Modules in this track">
      <Link to="/" className={styles.back}>
        <ChevronLeft size={16} />
        Campus
      </Link>
      <p className={styles.track}>{track.title}</p>
      <ul className={styles.list}>
        {track.modules.map((m) => {
          const p = moduleProgress(m, visited)
          const isCurrent = m.id === current.id
          return (
            <li key={m.id} className={styles.row}>
              <Link
                to={`/${m.trackId}/${m.id}`}
                className={styles.modLink}
                data-current={isCurrent}
                aria-current={isCurrent && !activePage ? 'page' : undefined}
              >
                {m.number}. {m.title}
              </Link>
              <div className="progress-line" data-size={isCurrent ? '4' : undefined} aria-hidden="true">
                <span style={{ width: `${p.pct}%` }} />
              </div>
              {isCurrent && (
                <ul className={styles.subs}>
                  {m.pages.map((pg) => {
                    const active = pg.id === activePage
                    const read = visited.has(pageKey(m.id, pg.id))
                    return (
                      <li key={pg.id}>
                        <Link
                          to={pagePath(m, pg.id)}
                          className={styles.sub}
                          aria-current={active ? 'page' : undefined}
                        >
                          <span>
                            {pg.number ? `${pg.number}. ` : ''}
                            {pg.title}
                          </span>
                          <span className={styles.note}>{read ? 'Read' : ''}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
