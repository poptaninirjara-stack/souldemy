import { Link, Navigate, useParams } from 'react-router'
import { FurtherReadingButton } from '../components/FurtherReading'
import { Html } from '../components/Html'
import { Check, ChevronRight, Mic, Play } from '../components/Icons'
import { Page } from '../components/Page'
import { PlaceIcon } from '../components/PlaceIcon'
import { getModule, getTrack, pageKey } from '../lib/content'
import { gamesFor, KIND_LABEL, mirrorFor, phrasesFor } from '../lib/games'
import { displaySkill } from '../lib/omissions'
import { placeFor } from '../lib/places'
import { useAppState } from '../state/useAppState'
import { useProgress } from '../state/useProgress'
import { NotFound } from './NotFound'
import styles from './PlacePage.module.css'

/** A campus place: one module's lessons, games, phrases and rehearsal in one hub. */
export function PlacePage() {
  const { trackId, moduleId } = useParams()
  const track = getTrack(trackId)
  const mod = getModule(trackId, moduleId)
  const place = mod && placeFor(mod.id)
  const { visited, records, deck, collectPhrases } = useAppState()
  const p = useProgress()

  if (!track) return <Navigate to="/" replace />
  if (!mod || !place) return <NotFound />

  const pr = p.place(mod)
  const games = gamesFor(mod.id)
  const mirror = mirrorFor(mod.id)
  const phrases = phrasesFor(mod.id)
  const collected = phrases.filter((ph) => deck[ph.id]).length
  const research = mod.trackId === 'research'
  const nextPage = mod.pages.find((pg) => !visited.has(pageKey(mod.id, pg.id))) ?? mod.pages[0]
  const startTo = research ? `/research/${mod.id}/${nextPage.id}` : `/communicative/${mod.id}/read${pr.read ? `?s=${nextPage.id}` : ''}`

  return (
    <Page>
      <header className={styles.band} data-tone={place.tone}>
        <span className={styles.icon}>
          <PlaceIcon moduleId={mod.id} size={64} />
        </span>
        <div className={styles.bandText}>
          <p className={styles.kicker}>
            {track.title.split(' for ')[0]} · Module {mod.number}
          </p>
          <h1 className={styles.name}>{place.name}</h1>
          <p className={styles.module}>{mod.title}</p>
        </div>
        <div className={styles.bandStats}>
          <div className={styles.bar} role="progressbar" aria-label={`${place.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pr.pct}>
            <span style={{ width: `${pr.pct}%` }} />
          </div>
          <p className={styles.statLine}>
            {pr.read} of {pr.pages} {research ? 'lessons' : 'sections'} read · {pr.played} of {pr.games} games played
          </p>
        </div>
        <div className={styles.bandActions}>
          <Link to={startTo} className="btn btn-primary">
            {pr.read === 0 ? 'Start reading' : pr.read === pr.pages ? 'Read again' : 'Continue reading'}
          </Link>
          <FurtherReadingButton reading={mod.furtherReading} moduleTitle={mod.title} />
        </div>
      </header>

      {research && mod.outcomesHtml.length > 0 && (
        <details className={styles.outcomes}>
          <summary>What you will be able to do</summary>
          {mod.outcomesIntro && <p className="meta">{mod.outcomesIntro}</p>}
          <ol>
            {mod.outcomesHtml.map((o, i) => (
              <Html key={i} as="li" html={o} />
            ))}
          </ol>
        </details>
      )}

      <section className={styles.section} aria-labelledby="learn-h">
        <h2 id="learn-h" className={styles.h2}>
          Learn
        </h2>
        <ol className={styles.lessons}>
          {mod.pages.map((pg, i) => {
            const read = visited.has(pageKey(mod.id, pg.id))
            const row = research ? mod.lessonMap.find((r) => r.number === String(pg.number)) : undefined
            const to = research ? `/research/${mod.id}/${pg.id}` : `/communicative/${mod.id}/read?s=${pg.id}`
            const unlocks = games.filter((g) => g.after === pg.id)
            return (
              <li key={pg.id}>
                <Link to={to} className={styles.lesson} data-read={read}>
                  <span className={styles.num} aria-hidden="true">
                    {read ? <Check size={18} /> : research ? pg.number : i + 1}
                  </span>
                  <span className={styles.lessonBody}>
                    <span className={styles.lessonTitle}>{pg.title}</span>
                    {row && <span className={styles.skill}>{displaySkill(mod.id, row)}</span>}
                    {unlocks.length > 0 && (
                      <span className={styles.unlocks}>
                        {unlocks.map((g) => (
                          <span key={g.id} className="chip">
                            <Play size={12} /> {g.title}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="visually-hidden">{read ? ', read' : ''}</span>
                  <ChevronRight />
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="play-h">
        <h2 id="play-h" className={styles.h2}>
          Play
        </h2>
        <p className="meta">Short rounds, about two minutes each. No timer. Mistakes are how you learn here.</p>
        <ul className={styles.games}>
          {games.map((g) => {
            const r = records[g.id]
            return (
              <li key={g.id}>
                <Link to={`/play/${g.id}`} className={styles.game}>
                  <span className={styles.gameTop}>
                    <span className="chip">{KIND_LABEL[g.kind]}</span>
                    <span className={styles.best} data-perfect={!!r && r.best === r.total}>
                      {r ? `Best ${r.best}/${r.total}` : 'New'}
                    </span>
                  </span>
                  <span className={styles.gameTitle}>{g.title}</span>
                  <span className={styles.gameIntro}>{g.intro}</span>
                  <span className={styles.gamePlay} aria-hidden="true">
                    <Play size={16} /> Play
                  </span>
                </Link>
              </li>
            )
          })}
          {mirror && (
            <li>
              <Link to={`/mirror/${mod.id}`} className={styles.game} data-tone="mirror">
                <span className={styles.gameTop}>
                  <span className="chip">Rehearse</span>
                  <span className={styles.best}>Private</span>
                </span>
                <span className={styles.gameTitle}>Mirror mode</span>
                <span className={styles.gameIntro}>Record yourself on this phone, play it back, check it. Nothing is uploaded or saved.</span>
                <span className={styles.gamePlay} aria-hidden="true">
                  <Mic size={16} /> Rehearse
                </span>
              </Link>
            </li>
          )}
        </ul>
      </section>

      {phrases.length > 0 && (
        <section className={`card ${styles.deck}`} aria-labelledby="deck-h">
          <div>
            <h2 id="deck-h" className={styles.deckTitle}>
              Phrase cards
            </h2>
            <p className={styles.deckLine}>
              {collected} of {phrases.length} collected from this place. Collected cards come back in Review just before you would
              forget them.
            </p>
          </div>
          {collected < phrases.length ? (
            <button type="button" className="btn btn-go" onClick={() => collectPhrases(phrases.map((ph) => ph.id))}>
              Collect {phrases.length - collected} {phrases.length - collected === 1 ? 'card' : 'cards'}
            </button>
          ) : (
            <Link to="/review" className="btn btn-secondary">
              Go to Review
            </Link>
          )}
        </section>
      )}
    </Page>
  )
}
