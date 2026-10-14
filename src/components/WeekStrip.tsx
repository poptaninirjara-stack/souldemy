import { dayLetter, dayName, formatHours, hoursOn, todayISO, weekDays, weekStart, type PracticeLog } from '../lib/weekly'
import styles from './WeekStrip.module.css'

/** Seven days, Monday first. Practised = 6px turmeric bar; not practised = 1px line (thickness, not just colour). */
export function WeekStrip({ logs, showMinutes, label }: { logs: PracticeLog[]; showMinutes?: boolean; label: string }) {
  const today = todayISO()
  const days = weekDays(weekStart(today))
  return (
    <ul className={styles.strip} aria-label={label}>
      {days.map((d, i) => {
        const h = hoursOn(logs, d)
        const isToday = d === today
        return (
          <li
            key={d}
            className={styles.day}
            aria-label={`${dayName(i)}${isToday ? ' (today)' : ''}: ${h > 0 ? `${formatHours(h)} practised` : 'no practice'}`}
          >
            <span className={styles.bar} data-practised={h > 0} aria-hidden="true" />
            <span className={styles.letter} data-today={isToday} aria-hidden="true">
              {dayLetter(i)}
            </span>
            {showMinutes && (
              <span className={styles.mins} aria-hidden="true">
                {h > 0 ? Math.round(h * 60) : '–'}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
