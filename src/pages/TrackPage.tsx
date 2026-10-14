import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { ContinuePanel } from '../components/ContinuePanel'
import { Html } from '../components/Html'
import { ModuleList } from '../components/ModuleList'
import { Page } from '../components/Page'
import { WeeklyPanel } from '../components/WeeklyPanel'
import { getTrack } from '../lib/content'
import { trackProgress } from '../lib/progress'
import { useAppState } from '../state/useAppState'
import { NotFound } from './NotFound'
import styles from './TrackPage.module.css'

/** Module dashboard: the contents page for one track. */
export function TrackPage() {
  const { trackId } = useParams()
  const track = getTrack(trackId)
  const { visited, track: chosen, setTrack } = useAppState()

  useEffect(() => {
    if (track && chosen !== track.id) setTrack(track.id)
  }, [track, chosen, setTrack])

  if (!track) return <NotFound />
  const { done, total } = trackProgress(track, visited)

  return (
    <Page>
      <div className={styles.grid}>
        <div className={styles.side}>
          <ContinuePanel track={track} />
          <WeeklyPanel />
        </div>
        <div className={styles.mainCol}>
          <header className={styles.head}>
            <h1>{track.title}</h1>
            <p className={styles.summary}>
              <span>
                {total} modules, {done} completed
              </span>
              <Link to="/" className="link-button">
                Change track
              </Link>
            </p>
            {track.introHtml.length > 0 && (
              <div className={styles.intro}>
                {track.introHtml.map((h, i) => (
                  <Html key={i} as="p" html={h} />
                ))}
              </div>
            )}
          </header>
          <ModuleList track={track} />
        </div>
      </div>
    </Page>
  )
}
