import { Link } from 'react-router'
import { dayLetter, dayName, weekDays, weekLine, weekStart } from '../lib/weekly'
import { useProgress } from '../state/useProgress'
import { Bolt } from './Icons'
import styles from './Stats.module.css'

/** Rank, XP and distance to the next rank. */
export function RankCard({ compact }: { compact?: boolean }) {
  const p = useProgress()
  return (
    <section className={`card ${styles.rank}`} aria-labelledby="rank-h">
      <div className={styles.rankTop}>
        <span className={styles.level} aria-hidden="true">
          {p.rank.level}
        </span>
        <div className={styles.rankText}>
          <p className={styles.kicker}>Rank {p.rank.level} of 6</p>
          <h2 id="rank-h" className={styles.rankName}>
            {p.rank.name}
          </h2>
        </div>
        <span className={styles.xp}>
          <Bolt size={16} />
          {p.xp} XP
        </span>
      </div>
      <div
        className={styles.bar}
        role="progressbar"
        aria-label={p.next ? `Progress to ${p.next.name}` : 'Top rank reached'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={p.pct}
      >
        <span style={{ width: `${p.pct}%` }} />
      </div>
      <p className={styles.line}>{p.next ? `${p.toNext} XP to ${p.next.name}` : 'Top rank. Keep your phrases fresh with Review.'}</p>
      {!compact && <p className={styles.can}>{p.rank.can}</p>}
    </section>
  )
}

/** This week: N of goal days, as seven dots (Monday first). Forgiving and quiet. */
export function WeekCard({ link = true }: { link?: boolean }) {
  const p = useProgress()
  const days = weekDays(weekStart(p.today))
  return (
    <section className={`card ${styles.week}`} aria-labelledby="week-h">
      <div className={styles.weekTop}>
        <h2 id="week-h" className={styles.weekTitle}>
          This week
        </h2>
        <span className={styles.weekCount} data-done={p.thisWeek >= p.weekGoal}>
          {p.thisWeek} of {p.weekGoal} days
        </span>
      </div>
      <ol className={styles.dots}>
        {days.map((d, i) => {
          const on = p.days.has(d)
          const today = d === p.today
          return (
            <li key={d} aria-label={`${dayName(i)}${today ? ' (today)' : ''}: ${on ? 'practised' : 'no practice'}`}>
              <span className={styles.dot} data-on={on} data-today={today} aria-hidden="true">
                {on ? '✓' : ''}
              </span>
              <span className={styles.dayLetter} data-today={today} aria-hidden="true">
                {dayLetter(i)}
              </span>
            </li>
          )
        })}
      </ol>
      <p className={styles.line}>{weekLine(p.thisWeek, p.weekGoal, p.weeksMet)}</p>
      {link && (
        <Link to="/me" className="link-button">
          Change weekly goal
        </Link>
      )}
    </section>
  )
}
