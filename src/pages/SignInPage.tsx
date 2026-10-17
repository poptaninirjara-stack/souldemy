import { useId, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { Page } from '../components/Page'
import { useAuth } from '../state/useAuth'
import styles from './SignInPage.module.css'

/** Sign in with a username and password, or ask the admin for a new password. */
export function SignInPage() {
  const { enabled, session, profile } = useAuth()
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin')

  if (session) return <Navigate to={profile?.role === 'admin' ? '/admin' : '/me'} replace />

  return (
    <Page width="reading">
      <h1>{mode === 'signin' ? 'Sign in' : 'Forgot your password?'}</h1>
      {!enabled ? (
        <p className="meta">Accounts are not set up for this copy of the app. Your progress is saved on this device.</p>
      ) : mode === 'signin' ? (
        <SignInForm onForgot={() => setMode('forgot')} />
      ) : (
        <ForgotForm onBack={() => setMode('signin')} />
      )}
    </Page>
  )
}

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const uid = useId()

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }
    setBusy(true)
    setError(null)
    const err = await signIn(username, password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <p className="meta">
        Use the username and password your college admin gave you. Signing in saves your progress to your account, so it follows you to any phone or
        computer.
      </p>
      <div>
        <label className="form-label" htmlFor={`${uid}-u`}>
          Username
        </label>
        <input
          id={`${uid}-u`}
          className="field"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <div>
        <label className="form-label" htmlFor={`${uid}-p`}>
          Password
        </label>
        <input
          id={`${uid}-p`}
          className="field"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block" aria-disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <button type="button" className="link-button" onClick={onForgot}>
        Forgot your password?
      </button>
      <p className="caption">Your teachers can see your progress, quiz results, written answers and recordings.</p>
      <p className="caption">
        You can also keep using the app without an account: <Link to="/">go back to Campus</Link>.
      </p>
    </form>
  )
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { requestReset } = useAuth()
  const [username, setUsername] = useState('')
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)
  const uid = useId()

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (state === 'sending') return
    if (!username.trim()) {
      setError('Enter your username.')
      return
    }
    setState('sending')
    setError(null)
    const err = await requestReset(username, note)
    if (err) {
      setError(err)
      setState('idle')
    } else setState('sent')
  }

  if (state === 'sent')
    return (
      <div className={styles.form}>
        <p className="meta" role="status">
          Your request has been sent to the admin. They will set a new password and give it to you, usually in class or by message. Then sign in with
          it and choose your own password.
        </p>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back to sign in
        </button>
      </div>
    )

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <p className="meta">Tell us your username and the admin will set a new password for you.</p>
      <div>
        <label className="form-label" htmlFor={`${uid}-u`}>
          Username
        </label>
        <input
          id={`${uid}-u`}
          className="field"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <div>
        <label className="form-label" htmlFor={`${uid}-n`}>
          How can the admin reach you? (optional)
        </label>
        <textarea
          id={`${uid}-n`}
          className="field"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          placeholder="For example: FY BA Psych A, Monday class"
        />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block" aria-disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Ask for a new password'}
      </button>
      <button type="button" className="link-button" onClick={onBack}>
        Back to sign in
      </button>
    </form>
  )
}
