import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Page } from '../components/Page'
import { PlaceIcon } from '../components/PlaceIcon'
import { RankCard, WeekCard } from '../components/Stats'
import { catalog, findModule, modulePath } from '../lib/content'
import { bundle } from '../lib/games'
import { possibleBadgeCount, RANKS } from '../lib/gamify'
import { PLACES } from '../lib/places'
import { isPersistent } from '../lib/storage'
import { useAppState } from '../state/useAppState'
import { useProgress } from '../state/useProgress'
import styles from './MePage.module.css'

/** How many badges exist; their titles stay a surprise. */
const BADGE_COUNT = possibleBadgeCount(catalog)

export function MePage() {
  const p = useProgress()
  const { deck } = useAppState()
  const collected = Object.keys(deck).length

  return (
    <Page>
      <h1>Me</h1>
      <div className={styles.grid}>
        <div className={styles.col}>
          <RankCard />
          <WeekCard link={false} />
          <Goal />
          <section className={styles.section} aria-labelledby="ranks-h">
            <h2 id="ranks-h" className={styles.h2}>
              The path
            </h2>
            <ol className={styles.ranks}>
              {RANKS.map((r) => (
                <li key={r.level} data-state={r.level < p.rank.level ? 'done' : r.level === p.rank.level ? 'now' : 'next'}>
                  <span className={styles.rankNum} aria-hidden="true">
                    {r.level}
                  </span>
                  <span>
                    <span className={styles.rankName}>
                      {r.name} <span className={styles.rankXp}>{r.min} XP</span>
                    </span>
                    <span className={styles.rankCan}>{r.can}</span>
                  </span>
                  <span className="visually-hidden">
                    {r.level < p.rank.level ? '(reached)' : r.level === p.rank.level ? '(current rank)' : ''}
                  </span>
                </li>
              ))}
            </ol>
            <p className="caption">XP comes only from effort: reading, attempting, recalling and playing. There is nothing to buy and no leaderboard.</p>
          </section>
        </div>

        <div className={styles.col}>
          <section className={styles.section} aria-labelledby="badges-h">
            <h2 id="badges-h" className={styles.h2}>
              Badges <span className={styles.count}>{p.badges.length}</span>
            </h2>
            {p.badges.length === 0 ? (
              <p className="meta">Badges are surprises. Read, play and rehearse, and they will find you.</p>
            ) : (
              <ul className={styles.badges}>
                {p.badges.map((b) => (
                  <li key={b.id} className={styles.badge}>
                    <span className={styles.medal} aria-hidden="true">
                      {b.icon}
                    </span>
                    <span>
                      <span className={styles.badgeTitle}>{b.title}</span>
                      <span className={styles.badgeCan}>{b.can}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {p.badges.length < BADGE_COUNT && <p className="caption">{BADGE_COUNT - p.badges.length} more to discover.</p>}
          </section>

          <section className={styles.section} aria-labelledby="places-h">
            <h2 id="places-h" className={styles.h2}>
              Campus
            </h2>
            <ul className={styles.places}>
              {PLACES.map((pl) => {
                const m = findModule(pl.moduleId)
                if (!m) return null
                const pr = p.place(m)
                return (
                  <li key={pl.moduleId}>
                    <Link to={modulePath(m)} className={styles.place}>
                      <PlaceIcon moduleId={pl.moduleId} size={36} />
                      <span className={styles.placeName}>{pl.name}</span>
                      <span className={styles.placeBar} aria-hidden="true">
                        <span style={{ width: `${pr.pct}%` }} />
                      </span>
                      <span className={styles.placePct}>{pr.complete ? 'Cleared' : `${pr.pct}%`}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className={styles.section} aria-labelledby="deck-h">
            <h2 id="deck-h" className={styles.h2}>
              Phrase deck
            </h2>
            <p className="meta">
              {collected} of {bundle.phrases.length} cards collected · {p.dueCards.length} due now
            </p>
            <Link to="/review" className="btn btn-secondary">
              Open Review
            </Link>
          </section>

          <Notes />
          <Settings />
          <Reset />
        </div>
      </div>
      <p className={`caption ${styles.footer}`}>
        {isPersistent()
          ? 'Progress is saved on this device only. Clearing your browser data removes it.'
          : 'This browser is blocking storage, so progress lasts only until you close this tab.'}
      </p>
    </Page>
  )
}

function Goal() {
  const { weekGoal, setWeekGoal } = useAppState()
  return (
    <section className={styles.section} aria-labelledby="goal-h">
      <h2 id="goal-h" className={styles.h2}>
        Weekly goal
      </h2>
      <p className="meta" id="goal-help">
        How many days a week can you practise, even for five minutes? Pick what fits a busy week; you can change it any time.
      </p>
      <div role="radiogroup" aria-labelledby="goal-h" aria-describedby="goal-help" className={styles.segments}>
        {[3, 4, 5].map((n) => (
          <label key={n} className={styles.segment}>
            <input type="radio" name="week-goal" value={n} checked={weekGoal === n} onChange={() => setWeekGoal(n)} />
            <span>{n} days</span>
          </label>
        ))}
      </div>
    </section>
  )
}

function Notes() {
  const { attempts, clearNotes } = useAppState()
  const [confirm, setConfirm] = useState(false)
  const n = Object.values(attempts).filter((a) => a.text.trim()).length
  return (
    <section className={styles.section} aria-labelledby="notes-h">
      <h2 id="notes-h" className={styles.h2}>
        My notes
      </h2>
      <p className="meta">
        {n === 0 ? 'Your exercise answers and notes are saved on this device.' : `${n} ${n === 1 ? 'answer or note' : 'answers and notes'} saved on this device.`}
      </p>
      {!confirm ? (
        <button type="button" className="btn btn-secondary" onClick={() => setConfirm(true)}>
          Clear my notes
        </button>
      ) : (
        <Confirm
          text="Clear all your answers, notes and quiz answers? Your XP and badges stay. This cannot be undone."
          yes="Clear my notes"
          onYes={() => {
            clearNotes()
            setConfirm(false)
          }}
          onNo={() => setConfirm(false)}
        />
      )}
    </section>
  )
}

function Settings() {
  const { motion, setMotion } = useAppState()
  const uid = useId()
  return (
    <section className={styles.section} aria-labelledby="settings-h">
      <h2 id="settings-h" className={styles.h2}>
        Settings
      </h2>
      <label className={styles.check} htmlFor={uid}>
        <input id={uid} type="checkbox" checked={motion === 'reduce'} onChange={(e) => setMotion(e.target.checked ? 'reduce' : 'system')} />
        <span>Reduce motion</span>
      </label>
      <p className="caption">Turns off movement and confetti. Your device setting is always respected too.</p>
    </section>
  )
}

function Reset() {
  const { resetAll } = useAppState()
  const [confirm, setConfirm] = useState(false)
  return (
    <section className={styles.section} aria-labelledby="reset-h">
      <h2 id="reset-h" className={styles.h2}>
        Reset my data
      </h2>
      <p className="meta">Removes your XP, badges, phrase deck, reading progress, notes and settings from this device.</p>
      {!confirm ? (
        <button type="button" className="btn btn-secondary" onClick={() => setConfirm(true)}>
          Reset my data
        </button>
      ) : (
        <Confirm text="Remove all your data from this device? This cannot be undone." yes="Reset my data" onYes={resetAll} onNo={() => setConfirm(false)} />
      )}
    </section>
  )
}

function Confirm({ text, yes, onYes, onNo }: { text: string; yes: string; onYes: () => void; onNo: () => void }) {
  return (
    <div className={styles.confirm} role="group" aria-label="Confirm">
      <p className={styles.confirmText} role="alert">
        {text}
      </p>
      <div className={styles.confirmRow}>
        <button type="button" className="btn btn-primary" onClick={onYes}>
          {yes}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onNo} autoFocus>
          Cancel
        </button>
      </div>
    </div>
  )
}
