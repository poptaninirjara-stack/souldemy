import { Link } from 'react-router'
import { formatHours, hoursInWeek, streakLine, todayISO, weekStart, weeksGoalMet } from '../lib/weekly'
import { useAppState } from '../state/useAppState'
import { WeekStrip } from './WeekStrip'
import styles from './Panels.module.css'

/** "This week" panel for the dashboard and home. Practice is logged by hand on the Progress page. */
export function WeeklyPanel() {
  const { weekly } = useAppState()
  const done = hoursInWeek(weekly.logs, weekStart(todayISO()))
  const goal = weekly.targetHours
  const met = weeksGoalMet(weekly)
  return (
    <section className={styles.panel} aria-labelledby="this-week-h">
      <div className={styles.panelHead}>
        <h2 id="this-week-h" className={styles.panelTitle}>
          This week
        </h2>
        <span className={styles.panelValue}>{goal ? `${formatHours(done)} of ${goal} h` : formatHours(done)}</span>
      </div>
      <WeekStrip logs={weekly.logs} label="Practice this week, Monday to Sunday" />
      <p className={styles.line}>{streakLine(met, !!goal)}</p>
      <Link to="/progress" className="link-button">
        {goal ? 'Log practice or change goal' : 'Set a weekly goal'}
      </Link>
    </section>
  )
}
