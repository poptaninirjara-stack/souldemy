import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { Cards, ChevronRight, Play } from '../components/Icons'
import { Opening, OPENING_FLAG } from '../components/Opening'
import { Page } from '../components/Page'
import { PlaceIcon } from '../components/PlaceIcon'
import { RankCard, WeekCard } from '../components/Stats'
import { findModule, getModule, modulePath, pagePath } from '../lib/content'
import { bundle } from '../lib/games'
import { PLACES, WINGS, type Place } from '../lib/places'
import { sessionFlag } from '../lib/storage'
import { useAppState, useReducedMotion } from '../state/useAppState'
import { useProgress } from '../state/useProgress'
import styles from './HomePage.module.css'

export function HomePage() {
  const reduced = useReducedMotion()
  const [opening] = useState(() => !sessionFlag(OPENING_FLAG) && !reduced)
  const [showPanel, setShowPanel] = useState(opening)
  const done = useCallback(() => setShowPanel(false), [])
  const p = useProgress()
  const firstVisit = p.xp === 0

  return (
    <>
      {showPanel && <Opening onDone={done} />}
      <Page>
        {firstVisit ? (
          <header className={styles.hero}>
            <p className={styles.heroKicker}>Free · No account · Works on your phone</p>
            <h1 className={styles.heroTitle}>
              From fresher to <mark className={styles.mark}>scholar</mark> and <mark className={styles.mark2}>professional</mark>.
            </h1>
            <p className={styles.heroLine}>
              Academic and professional English, one short practice at a time. Explore the campus, play quick games, collect
              phrases you will actually use.
            </p>
            <Link to="/research/r1" className="btn btn-go">
              Start at the Exam Hall <ChevronRight />
            </Link>
          </header>
        ) : (
          <header className={styles.welcome}>
            <h1 className={styles.welcomeTitle}>{p.practisedToday ? 'Nice work today.' : 'Welcome back.'}</h1>
            <p className="meta">Pick up where you left off, or choose any place on campus.</p>
          </header>
        )}

        <div className={styles.top}>
          {!firstVisit && <TodayWalk />}
          <div className={styles.stack}>
            <RankCard compact />
            <WeekCard />
          </div>
        </div>

        {(['study', 'career'] as const).map((wing) => (
          <section key={wing} className={styles.wing} aria-labelledby={`wing-${wing}`}>
            <div className={styles.wingHead}>
              <h2 id={`wing-${wing}`} className={styles.wingTitle}>
                {WINGS[wing].name}
              </h2>
              <p className="caption">{WINGS[wing].line}</p>
            </div>
            <ul className={styles.places}>
              {PLACES.filter((pl) => pl.wing === wing).map((pl) => (
                <PlaceTile key={pl.moduleId} place={pl} />
              ))}
            </ul>
          </section>
        ))}

        <p className={`caption ${styles.foot}`}>Free. No account. Your progress stays on this device.</p>
      </Page>
    </>
  )
}

function PlaceTile({ place }: { place: Place }) {
  const p = useProgress()
  const m = findModule(place.moduleId)
  if (!m) return null
  const pr = p.place(m)
  const status = pr.complete ? 'Cleared' : pr.started ? `${pr.pct}%` : 'New'
  return (
    <li>
      <Link
        to={modulePath(m)}
        className={styles.tile}
        data-tone={place.tone}
        aria-label={`${place.name}: ${m.title}. ${pr.complete ? 'Cleared' : pr.started ? `${pr.pct}% done` : 'Not started'}.`}
      >
        <span className={styles.tileIcon}>
          <PlaceIcon moduleId={place.moduleId} />
        </span>
        <span className={styles.tileBody}>
          <span className={styles.tileName}>{place.name}</span>
          <span className={styles.tileModule}>{m.title}</span>
          <span className={styles.tileMeta}>
            <span className={styles.tileBar} aria-hidden="true">
              <span style={{ width: `${pr.pct}%` }} />
            </span>
            <span className={styles.tileStatus} data-done={pr.complete}>
              {status}
            </span>
          </span>
        </span>
      </Link>
    </li>
  )
}

/** "Today's walk": three short stops that fit a gap between classes. */
function TodayWalk() {
  const { lastLocation, records, deck } = useAppState()
  const p = useProgress()
  const lastMod = lastLocation ? getModule(lastLocation.trackId, lastLocation.moduleId) : undefined
  const lastPage = lastMod?.pages.find((pg) => pg.id === lastLocation?.pageId)
  const nextGame =
    bundle.games.find((g) => g.moduleId === lastMod?.id && !records[g.id]?.plays) ?? bundle.games.find((g) => !records[g.id]?.plays)
  const deckSize = Object.keys(deck).length

  return (
    <section className={`card ${styles.walk}`} aria-labelledby="walk-h">
      <h2 id="walk-h" className={styles.walkTitle}>
        Today's walk
      </h2>
      <ol className={styles.steps}>
        <li>
          <Link to="/review" className={styles.step}>
            <span className={styles.stepIcon} data-tone="lilac">
              <Cards size={20} />
            </span>
            <span className={styles.stepText}>
              <span className={styles.stepName}>Warm-up review</span>
              <span className={styles.stepMeta}>
                {p.dueCards.length
                  ? `${p.dueCards.length} ${p.dueCards.length === 1 ? 'phrase' : 'phrases'} ready to recall`
                  : deckSize
                    ? 'All caught up. Nothing due today'
                    : 'Collect phrases to start your deck'}
              </span>
            </span>
            <ChevronRight />
          </Link>
        </li>
        {lastMod && lastPage && (
          <li>
            <Link to={pagePath(lastMod, lastPage.id)} className={styles.step}>
              <span className={styles.stepIcon} data-tone="sky">
                <ChevronRight size={20} />
              </span>
              <span className={styles.stepText}>
                <span className={styles.stepName}>Continue reading</span>
                <span className={styles.stepMeta}>{lastPage.title}</span>
              </span>
              <ChevronRight />
            </Link>
          </li>
        )}
        {nextGame && (
          <li>
            <Link to={`/play/${nextGame.id}`} className={styles.step}>
              <span className={styles.stepIcon} data-tone="mango">
                <Play size={18} />
              </span>
              <span className={styles.stepText}>
                <span className={styles.stepName}>Play: {nextGame.title}</span>
                <span className={styles.stepMeta}>{findModule(nextGame.moduleId)?.title}</span>
              </span>
              <ChevronRight />
            </Link>
          </li>
        )}
      </ol>
    </section>
  )
}
