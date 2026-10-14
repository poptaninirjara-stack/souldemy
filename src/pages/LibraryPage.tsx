import { useRef, useState, type KeyboardEvent } from 'react'
import { ReadingList } from '../components/FurtherReading'
import { Page } from '../components/Page'
import { APP_NAME } from '../config'
import { catalog, TRACK_SHORT } from '../lib/content'
import type { TrackId } from '../types/content'
import styles from './LibraryPage.module.css'

type Filter = 'all' | TrackId
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'research', label: TRACK_SHORT.research },
  { id: 'communicative', label: TRACK_SHORT.communicative },
]

/** Library and About: every source from every module, attributed and linked. */
export function LibraryPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const modules = catalog.tracks.filter((t) => filter === 'all' || t.id === filter).flatMap((t) => t.modules)
  const count = modules.reduce((n, m) => n + m.furtherReading.items.length, 0)

  const onKey = (e: KeyboardEvent, i: number) => {
    const n = FILTERS.length
    const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n : -1
    if (next < 0) return
    e.preventDefault()
    setFilter(FILTERS[next].id)
    refs.current[next]?.focus()
  }

  return (
    <Page width="library">
      <header className={styles.head}>
        <h1>Library</h1>
        <p className="meta">Every source used in the course, by module. Links open the original site.</p>
      </header>

      <div role="radiogroup" aria-label="Filter by track" className={styles.filters}>
        {FILTERS.map((f, i) => (
          <button
            key={f.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={filter === f.id}
            tabIndex={filter === f.id ? 0 : -1}
            className={styles.chip}
            onClick={() => setFilter(f.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="visually-hidden" role="status">
        {count} sources
      </p>

      {modules.map((m) => (
        <section key={m.id} className={styles.group} aria-labelledby={`lib-${m.id}`}>
          <h2 id={`lib-${m.id}`} className={styles.groupTitle}>
            <span className={styles.groupTrack}>{TRACK_SHORT[m.trackId]}, Module {m.number}</span>
            {m.title}
          </h2>
          <ReadingList reading={m.furtherReading} />
        </section>
      ))}

      <section className={styles.about} aria-labelledby="about-h">
        <h2 id="about-h" className={styles.groupTitle}>
          About {APP_NAME}
        </h2>
        <p>
          {APP_NAME} is free and non-commercial. It has no adverts, no payments, no accounts and no tracking. Your
          progress and notes are saved on this device only.
        </p>
        <p>
          All explanations and exercises are newly written for this course. The sources above are listed so you can read
          the originals; their text is not copied into the app, and each belongs to its publisher.
        </p>
        <p>
          The UNC Writing Center page on essay exams is published under a CC BY-NC-ND licence. It is linked here and has
          not been adapted.
        </p>
        <p>
          The Marathi to English notes in the communicative track are the author's observations. They are waiting for
          review by a Marathi-speaking faculty member.
        </p>
      </section>
    </Page>
  )
}
