import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Check } from '../components/Icons'
import { Page } from '../components/Page'
import { WeekStrip } from '../components/WeekStrip'
import { WEEKLY_GOAL_OPTIONS } from '../config'
import { catalog, modulePath } from '../lib/content'
import { moduleProgress, trackProgress } from '../lib/progress'
import { isPersistent } from '../lib/storage'
import { dayName, formatHours, hoursInWeek, streakLine, todayISO, weekDays, weekStart, weeksGoalMet } from '../lib/weekly'
import { useAppState } from '../state/useAppState'
import styles from './ProgressPage.module.css'

export function ProgressPage() {
  const { visited } = useAppState()
  const badges = catalog.tracks.flatMap((t) => t.modules.filter((m) => moduleProgress(m, visited).complete).map((m) => ({ m, t })))

  return (
    <Page>
      <h1>My progress</h1>
      <div className={styles.grid}>
        <div className={styles.col}>
          <ThisWeek />
          <LogPractice />
          <Goal />
          <section className={styles.section} aria-labelledby="done-h">
            <h2 id="done-h" className={styles.h}>
              Modules completed
            </h2>
            <p className={styles.help}>A module is complete when you have read every lesson or section in it.</p>
            <ul className={styles.tracks}>
              {catalog.tracks.map((t) => {
                const p = trackProgress(t, visited)
                return (
                  <li key={t.id} className={styles.trackRow}>
                    <span className={styles.trackName}>{t.title}</span>
                    <span className={styles.count}>
                      {p.done} of {p.total}
                    </span>
                    <span className={`progress-line ${styles.trackLine}`} aria-hidden="true">
                      <span style={{ width: `${(p.done / p.total) * 100}%` }} />
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <div className={styles.col}>
          <section className={styles.section} aria-labelledby="badges-h">
            <h2 id="badges-h" className={styles.h}>
              Badges
            </h2>
            {badges.length === 0 ? (
              <p className={styles.help}>A badge appears here each time you finish a module.</p>
            ) : (
              <ul className={styles.badges}>
                {badges.map(({ m, t }) => (
                  <li key={m.id} className={styles.badge}>
                    <span className={styles.medal} aria-hidden="true">
                      <Check size={18} />
                    </span>
                    <span className={styles.badgeText}>
                      <Link to={modulePath(m)} className={styles.badgeTitle}>
                        {m.title}
                      </Link>
                      <span className="caption">{t.title}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
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

function ThisWeek() {
  const { weekly } = useAppState()
  const done = hoursInWeek(weekly.logs, weekStart(todayISO()))
  const goal = weekly.targetHours
  return (
    <section className={styles.section} aria-labelledby="week-h">
      <div className={styles.headRow}>
        <h2 id="week-h" className={styles.h}>
          This week
        </h2>
        <span className={styles.value}>{goal ? `${formatHours(done)} of ${goal} h` : formatHours(done)}</span>
      </div>
      <WeekStrip logs={weekly.logs} showMinutes label="Minutes practised each day this week, Monday to Sunday" />
      <p className={styles.help}>{streakLine(weeksGoalMet(weekly), !!goal)}</p>
    </section>
  )
}

/** Manual practice log: a number, never a timer or stopwatch. */
function LogPractice() {
  const { weekly, logPractice, removeLog } = useAppState()
  const uid = useId()
  const today = todayISO()
  const days = weekDays(weekStart(today)).filter((d) => d <= today)
  const [day, setDay] = useState(today)
  const [hours, setHours] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const h = Number(hours)
    if (!hours.trim() || !Number.isFinite(h) || h <= 0 || h > 16) {
      setError('Enter the hours you practised, for example 0.5 for half an hour.')
      setStatus('')
      return
    }
    logPractice(Math.round(h * 4) / 4, day)
    const i = days.indexOf(day)
    setStatus(`Added ${formatHours(Math.round(h * 4) / 4)} on ${dayName(i)}.`)
    setError('')
    setHours('')
  }

  const thisWeek = new Set(weekDays(weekStart(today)))
  const entries = weekly.logs.map((l, i) => ({ ...l, i })).filter((l) => thisWeek.has(l.date))

  return (
    <section className={styles.section} aria-labelledby="log-h">
      <h2 id="log-h" className={styles.h}>
        Log practice
      </h2>
      <p className={styles.help}>Add the time you spent practising: reading, exercises, or speaking and writing tasks.</p>
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.field}>
          <label htmlFor={`${uid}-day`}>Day</label>
          <select id={`${uid}-day`} value={day} onChange={(e) => setDay(e.target.value)} className={styles.input}>
            {days.map((d, i) => (
              <option key={d} value={d}>
                {dayName(i)}
                {d === today ? ' (today)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${uid}-h`}>Hours</label>
          <input
            id={`${uid}-h`}
            type="number"
            inputMode="decimal"
            min={0.25}
            max={16}
            step={0.25}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={styles.input}
            aria-invalid={!!error || undefined}
            aria-describedby={`${uid}-err`}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Add practice
        </button>
      </form>
      <p id={`${uid}-err`} className={styles.error} role="alert">
        {error}
      </p>
      <p className={styles.help} role="status">
        {status}
      </p>
      {entries.length > 0 && (
        <ul className={styles.entries} aria-label="Practice logged this week">
          {entries.map((l) => (
            <li key={l.i} className={styles.entry}>
              <span>
                {dayName(weekDays(weekStart(today)).indexOf(l.date))}: {formatHours(l.hours)}
              </span>
              <button type="button" className="link-button" onClick={() => removeLog(l.i)}>
                Remove<span className="visually-hidden"> {formatHours(l.hours)} on {l.date}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Goal() {
  const { weekly, setGoal } = useAppState()
  return (
    <section className={styles.section} aria-labelledby="goal-h">
      <h2 id="goal-h" className={styles.h}>
        Weekly practice goal
      </h2>
      <p className={styles.help} id="goal-help">
        {weekly.targetHours
          ? 'Choose a number of hours you can keep in a busy week. You can change it at any time.'
          : 'Choose how many hours a week you want to practise.'}
      </p>
      <div role="radiogroup" aria-labelledby="goal-h" aria-describedby="goal-help" className={styles.segments}>
        {WEEKLY_GOAL_OPTIONS.map((h) => (
          <label key={h} className={styles.segment}>
            <input type="radio" name="weekly-goal" value={h} checked={weekly.targetHours === h} onChange={() => setGoal(h)} />
            <span>{h} h</span>
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
      <h2 id="notes-h" className={styles.h}>
        My notes
      </h2>
      <p className={styles.help}>
        {n === 0 ? 'Your answers and notes from exercises are saved here on this device.' : `${n} ${n === 1 ? 'answer or note' : 'answers and notes'} saved on this device.`}
      </p>
      {!confirm ? (
        <button type="button" className="btn btn-secondary" onClick={() => setConfirm(true)}>
          Clear my notes
        </button>
      ) : (
        <Confirm
          text="Clear all your answers, notes and quiz answers? This cannot be undone."
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
      <h2 id="settings-h" className={styles.h}>
        Settings
      </h2>
      <label className={styles.check} htmlFor={uid}>
        <input id={uid} type="checkbox" checked={motion === 'reduce'} onChange={(e) => setMotion(e.target.checked ? 'reduce' : 'system')} />
        <span>Reduce motion</span>
      </label>
      <p className={styles.help}>Turns off movement in the app. Your device setting is always respected too.</p>
    </section>
  )
}

function Reset() {
  const { resetAll } = useAppState()
  const [confirm, setConfirm] = useState(false)
  return (
    <section className={styles.section} aria-labelledby="reset-h">
      <h2 id="reset-h" className={styles.h}>
        Reset my data
      </h2>
      <p className={styles.help}>Removes your track, reading progress, notes, practice log and settings from this device.</p>
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
