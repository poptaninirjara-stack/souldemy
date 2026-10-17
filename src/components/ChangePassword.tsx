import { useId, useState, type FormEvent } from 'react'
import { useAuth } from '../state/useAuth'
import styles from './FeedbackForm.module.css'

/** Choose your own password (required after the admin gives out a temporary one). */
export function ChangePassword() {
  const { profile, changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle')
  const uid = useId()
  const temporary = !!profile?.must_change_password

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (state === 'saving') return
    if (!current || !next) return setError('Fill in all three boxes.')
    if (next !== again) return setError('The two new passwords do not match.')
    setState('saving')
    setError(null)
    const err = await changePassword(current, next)
    if (err) {
      setError(err)
      setState('idle')
    } else {
      setCurrent('')
      setNext('')
      setAgain('')
      setState('done')
    }
  }

  return (
    <details id="password" open={temporary}>
      <summary className="link-button">{temporary ? 'Choose your own password' : 'Change password'}</summary>
      <form className={styles.form} onSubmit={submit} noValidate>
        {temporary && <p className="meta">You are using a password the admin gave you. Choose your own, one only you know.</p>}
        <div>
          <label className="form-label" htmlFor={`${uid}-c`}>
            {temporary ? 'Password the admin gave you' : 'Current password'}
          </label>
          <input id={`${uid}-c`} className="field" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor={`${uid}-n`}>
            New password (at least 8 characters)
          </label>
          <input id={`${uid}-n`} className="field" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor={`${uid}-a`}>
            New password again
          </label>
          <input id={`${uid}-a`} className="field" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div>
          <button type="submit" className="btn btn-primary" aria-disabled={state === 'saving'}>
            {state === 'saving' ? 'Saving…' : 'Save new password'}
          </button>
        </div>
        {state === 'done' && (
          <p className="caption" role="status">
            Your password has been changed.
          </p>
        )}
      </form>
    </details>
  )
}
