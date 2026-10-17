// Admin: create student and teacher accounts, give out and reset passwords, edit or delete
// accounts, and answer "forgot password" requests. Changes go through the admin-users Edge
// Function; reads use the normal client (row-level security allows admins to read these).
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { LoadError, Loading } from '../components/Loading'
import { Page } from '../components/Page'
import { adminCall, tempPassword } from '../lib/adminApi'
import { supabase } from '../lib/supabase'
import { useAuth } from '../state/useAuth'
import styles from './AdminPage.module.css'

interface Account {
  id: string
  username: string
  full_name: string
  role: 'student' | 'teacher' | 'admin'
  must_change_password: boolean
  created_at: string
  classes: { name: string } | null
}

interface ResetRequest {
  id: string
  user_id: string
  note: string | null
  created_at: string
  profiles: { username: string; full_name: string } | null
}

/** A password just set, shown once so the admin can pass it on. */
interface Handout {
  name: string
  username: string
  password: string
}

const ROLE_LABEL = { student: 'Student', teacher: 'Teacher', admin: 'Admin' }

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

function useAdminData() {
  const [accounts, setAccounts] = useState<Account[] | 'loading' | 'error'>('loading')
  const [classes, setClasses] = useState<string[]>([])
  const [requests, setRequests] = useState<ResetRequest[]>([])
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((n) => n + 1), [])
  useEffect(() => {
    let live = true
    Promise.all([
      supabase!.from('profiles').select('id, username, full_name, role, must_change_password, created_at, classes!profiles_class_id_fkey(name)').order('full_name'),
      supabase!.from('classes').select('name').order('name'),
      supabase!
        .from('password_reset_requests')
        .select('id, user_id, note, created_at, profiles(username, full_name)')
        .eq('status', 'open')
        .order('created_at'),
    ]).then(
      ([a, c, r]) => {
        if (!live) return
        if (a.error) return setAccounts('error')
        setAccounts(a.data as unknown as Account[])
        setClasses((c.data ?? []).map((x) => x.name as string))
        setRequests((r.data ?? []) as unknown as ResetRequest[])
      },
      () => live && setAccounts('error'),
    )
    return () => {
      live = false
    }
  }, [version])
  return { accounts, classes, requests, reload }
}

export function AdminPage() {
  const { enabled, session, profile, isAdmin } = useAuth()
  const [tab, setTab] = useState<'accounts' | 'requests'>('accounts')

  let gate: React.ReactNode = null
  if (!enabled) gate = <p className="meta">Accounts are not set up for this copy of the app.</p>
  else if (!session)
    gate = (
      <p className="meta">
        This page is for the admin. <Link to="/signin">Sign in</Link> with the admin account.
      </p>
    )
  else if (!profile) gate = <Loading thing="your account" />
  else if (!isAdmin) gate = <p className="meta">This page is for the admin only.</p>

  return (
    <Page>
      <h1>Admin</h1>
      {gate ?? <AdminBody tab={tab} setTab={setTab} />}
    </Page>
  )
}

function AdminBody({ tab, setTab }: { tab: 'accounts' | 'requests'; setTab: (t: 'accounts' | 'requests') => void }) {
  const data = useAdminData()
  const [handout, setHandout] = useState<Handout | null>(null)

  if (data.accounts === 'loading') return <Loading thing="accounts" />
  if (data.accounts === 'error') return <LoadError what="The account list" onRetry={data.reload} />

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Admin">
        <button type="button" role="tab" aria-selected={tab === 'accounts'} className={styles.tab} onClick={() => setTab('accounts')}>
          Accounts
        </button>
        <button type="button" role="tab" aria-selected={tab === 'requests'} className={styles.tab} onClick={() => setTab('requests')}>
          Password requests
          {data.requests.length > 0 && <span className={styles.badge}>{data.requests.length}</span>}
        </button>
      </div>

      {handout && <HandoutCard handout={handout} onClose={() => setHandout(null)} />}

      {tab === 'accounts' ? (
        <div className={styles.stack}>
          <CreateAccount
            classes={data.classes}
            onCreated={(h) => {
              setHandout(h)
              data.reload()
            }}
          />
          <AccountList accounts={data.accounts} classes={data.classes} onChanged={data.reload} onHandout={setHandout} />
        </div>
      ) : (
        <Requests requests={data.requests} onChanged={data.reload} onHandout={setHandout} />
      )}
    </>
  )
}

function HandoutCard({ handout, onClose }: { handout: Handout; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const text = `SoulDemy sign-in for ${handout.name}\nUsername: ${handout.username}\nPassword: ${handout.password}\nYou will be asked to choose your own password after signing in.`
  return (
    <section className={styles.handout} role="status" aria-label="New password">
      <p className={styles.handoutTitle}>Give these to {handout.name}. The password is shown only now.</p>
      <dl className={styles.creds}>
        <dt>Username</dt>
        <dd>{handout.username}</dd>
        <dt>Password</dt>
        <dd>{handout.password}</dd>
      </dl>
      <div className={styles.row}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            navigator.clipboard?.writeText(text).then(
              () => setCopied(true),
              () => undefined,
            )
          }
        >
          {copied ? 'Copied' : 'Copy to send'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Done
        </button>
      </div>
    </section>
  )
}

function ClassInput({ id, value, onChange, classes }: { id: string; value: string; onChange: (v: string) => void; classes: string[] }) {
  return (
    <>
      <input id={id} className="field" list={`${id}-list`} value={value} onChange={(e) => onChange(e.target.value)} placeholder="e.g. FY BA Psych A" />
      <datalist id={`${id}-list`}>
        {classes.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  )
}

function CreateAccount({ classes, onCreated }: { classes: string[]; onCreated: (h: Handout) => void }) {
  const [form, setForm] = useState({ full_name: '', username: '', role: 'student', class: '', password: tempPassword() })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const uid = useId()
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const username = form.username.trim().toLowerCase()
    if (!form.full_name.trim() || !username) return setError('Enter a name and a username.')
    setBusy(true)
    setError(null)
    const err = await adminCall({ action: 'create', ...form, username })
    setBusy(false)
    if (err) return setError(err)
    onCreated({ name: form.full_name.trim(), username, password: form.password })
    setForm((f) => ({ full_name: '', username: '', role: f.role, class: f.class, password: tempPassword() }))
  }

  return (
    <details className={styles.panel} open>
      <summary className={styles.panelTitle}>Add an account</summary>
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.grid}>
          <div>
            <label className="form-label" htmlFor={`${uid}-n`}>
              Full name
            </label>
            <input
              id={`${uid}-n`}
              className="field"
              value={form.full_name}
              onChange={(e) => {
                const name = e.target.value
                setForm((f) => ({
                  ...f,
                  full_name: name,
                  // Suggest "firstname.l" until the admin types a username themselves.
                  username: f.username === suggest(f.full_name) ? suggest(name) : f.username,
                }))
              }}
            />
          </div>
          <div>
            <label className="form-label" htmlFor={`${uid}-u`}>
              Username
            </label>
            <input
              id={`${uid}-u`}
              className="field"
              value={form.username}
              onChange={(e) => set('username')(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="form-label" htmlFor={`${uid}-r`}>
              Role
            </label>
            <select id={`${uid}-r`} className="field" value={form.role} onChange={(e) => set('role')(e.target.value)}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor={`${uid}-c`}>
              Class (optional)
            </label>
            <ClassInput id={`${uid}-c`} value={form.class} onChange={set('class')} classes={classes} />
          </div>
          <div>
            <label className="form-label" htmlFor={`${uid}-p`}>
              Starting password
            </label>
            <div className={styles.inline}>
              <input id={`${uid}-p`} className="field" value={form.password} onChange={(e) => set('password')(e.target.value)} spellCheck={false} />
              <button type="button" className="btn btn-secondary" onClick={() => set('password')(tempPassword())}>
                New
              </button>
            </div>
          </div>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div>
          <button type="submit" className="btn btn-primary" aria-disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </div>
        <p className="caption">
          The person signs in with this password and is then asked to choose their own. For a whole class at once, use the CSV import (see the
          README).
        </p>
      </form>
    </details>
  )
}

/** "Riya Patil" → "riya.p" */
function suggest(name: string): string {
  const parts = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return ''
  return parts.length === 1 ? parts[0] : `${parts[0]}.${parts[parts.length - 1][0]}`
}

function AccountList({
  accounts,
  classes,
  onChanged,
  onHandout,
}: {
  accounts: Account[]
  classes: string[]
  onChanged: () => void
  onHandout: (h: Handout) => void
}) {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<'all' | Account['role']>('all')
  const [open, setOpen] = useState<string | null>(null)
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return accounts.filter(
      (a) =>
        (role === 'all' || a.role === role) &&
        (!q || a.full_name.toLowerCase().includes(q) || a.username.includes(q) || a.classes?.name.toLowerCase().includes(q)),
    )
  }, [accounts, query, role])

  return (
    <section className={styles.stack} aria-labelledby="accounts-h">
      <h2 id="accounts-h" className={styles.h2}>
        Accounts <span className={styles.count}>{accounts.length}</span>
      </h2>
      <div className={styles.filters}>
        <label className="visually-hidden" htmlFor="acct-search">
          Search accounts
        </label>
        <input id="acct-search" className="field" placeholder="Search by name, username or class" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="visually-hidden" htmlFor="acct-role">
          Role
        </label>
        <select id="acct-role" className="field" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
          <option value="all">Everyone</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      {shown.length === 0 ? (
        <p className="meta">{accounts.length ? 'No accounts match.' : 'No accounts yet. Add one above.'}</p>
      ) : (
        <ul className={styles.list}>
          {shown.map((a) => (
            <li key={a.id} className={styles.account}>
              <button type="button" className={styles.accountHead} aria-expanded={open === a.id} onClick={() => setOpen(open === a.id ? null : a.id)}>
                <span>
                  <span className={styles.name}>{a.full_name || a.username}</span>
                  <span className={styles.sub}>
                    {a.username} · {ROLE_LABEL[a.role]}
                    {a.classes ? ` · ${a.classes.name}` : ''}
                  </span>
                </span>
                {a.must_change_password && <span className={styles.tag}>Temporary password</span>}
              </button>
              {open === a.id && <ManageAccount account={a} classes={classes} onChanged={onChanged} onHandout={onHandout} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ManageAccount({
  account,
  classes,
  onChanged,
  onHandout,
}: {
  account: Account
  classes: string[]
  onChanged: () => void
  onHandout: (h: Handout) => void
}) {
  const { profile } = useAuth()
  const self = profile?.id === account.id
  const [form, setForm] = useState({
    username: account.username,
    full_name: account.full_name,
    role: account.role as string,
    class: account.classes?.name ?? '',
  })
  const [password, setPassword] = useState(tempPassword)
  const [msg, setMsg] = useState<{ error?: string; ok?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const uid = useId()

  const run = async (fn: () => Promise<string | null>, ok: string, after?: () => void) => {
    if (busy) return
    setBusy(true)
    setMsg(null)
    const err = await fn()
    setBusy(false)
    if (err) return setMsg({ error: err })
    setMsg({ ok })
    after?.()
    onChanged()
  }

  return (
    <div className={styles.manage}>
      <div className={styles.grid}>
        <div>
          <label className="form-label" htmlFor={`${uid}-n`}>
            Full name
          </label>
          <input id={`${uid}-n`} className="field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <label className="form-label" htmlFor={`${uid}-u`}>
            Username
          </label>
          <input
            id={`${uid}-u`}
            className="field"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="form-label" htmlFor={`${uid}-r`}>
            Role
          </label>
          <select id={`${uid}-r`} className="field" value={form.role} disabled={self} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor={`${uid}-c`}>
            Class
          </label>
          <ClassInput id={`${uid}-c`} value={form.class} onChange={(v) => setForm({ ...form, class: v })} classes={classes} />
        </div>
      </div>
      <div>
        <button
          type="button"
          className="btn btn-secondary"
          aria-disabled={busy}
          onClick={() => {
            const renamed = form.username.trim().toLowerCase() !== account.username
            run(
              () => adminCall({ action: 'update', user_id: account.id, ...form }),
              renamed ? `Saved. They now sign in as ${form.username.trim().toLowerCase()} (same password).` : 'Saved.',
              // Your own new username: reload so the app picks it up (you stay signed in).
              () => self && renamed && window.location.reload(),
            )
          }}
        >
          Save changes
        </button>
      </div>

      <div>
        <label className="form-label" htmlFor={`${uid}-p`}>
          {self ? 'Set a new password for yourself' : 'Reset password'}
        </label>
        <div className={styles.inline}>
          <input id={`${uid}-p`} className="field" value={password} onChange={(e) => setPassword(e.target.value)} spellCheck={false} />
          <button type="button" className="btn btn-secondary" onClick={() => setPassword(tempPassword())}>
            New
          </button>
          <button
            type="button"
            className="btn btn-primary"
            aria-disabled={busy}
            onClick={() =>
              run(
                () => adminCall({ action: 'set_password', user_id: account.id, password }),
                self ? 'Your password has been changed.' : 'Password reset.',
                () => {
                  if (!self) onHandout({ name: account.full_name || account.username, username: account.username, password })
                  setPassword(tempPassword())
                },
              )
            }
          >
            Set password
          </button>
        </div>
      </div>

      {!self &&
        (confirmDelete ? (
          <div className={styles.confirm} role="group" aria-label="Confirm delete">
            <p role="alert">
              Delete {account.full_name || account.username}&apos;s account and all their progress? This cannot be undone.
            </p>
            <div className={styles.row}>
              <button
                type="button"
                className="btn btn-primary"
                aria-disabled={busy}
                onClick={() => run(() => adminCall({ action: 'delete', user_id: account.id }), 'Deleted.')}
              >
                Delete account
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)} autoFocus>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button type="button" className="link-button" onClick={() => setConfirmDelete(true)}>
              Delete this account
            </button>
          </div>
        ))}

      {msg?.error && (
        <p className="form-error" role="alert">
          {msg.error}
        </p>
      )}
      {msg?.ok && (
        <p className="caption" role="status">
          {msg.ok}
        </p>
      )}
    </div>
  )
}

function Requests({ requests, onChanged, onHandout }: { requests: ResetRequest[]; onChanged: () => void; onHandout: (h: Handout) => void }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function reset(r: ResetRequest) {
    if (busy) return
    setBusy(r.id)
    setError(null)
    const password = tempPassword()
    const err = await adminCall({ action: 'set_password', user_id: r.user_id, password })
    setBusy(null)
    if (err) return setError(err)
    onHandout({ name: r.profiles?.full_name || r.profiles?.username || 'this person', username: r.profiles?.username ?? '', password })
    onChanged()
  }

  async function dismiss(r: ResetRequest) {
    setBusy(r.id)
    const { error: e } = await supabase!.from('password_reset_requests').update({ status: 'dismissed', resolved_at: new Date().toISOString() }).eq('id', r.id)
    setBusy(null)
    if (e) setError('Could not dismiss it. Try again.')
    else onChanged()
  }

  if (!requests.length) return <p className="meta">No one is waiting for a new password.</p>
  return (
    <section className={styles.stack}>
      <p className="meta">These people used "Forgot your password?" on the sign-in page. Set a new password, then give it to them in person or by message.</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <ul className={styles.list}>
        {requests.map((r) => (
          <li key={r.id} className={styles.request}>
            <p>
              <span className={styles.name}>{r.profiles?.full_name || r.profiles?.username}</span>
              <span className={styles.sub}>
                {r.profiles?.username} · asked {when(r.created_at)}
              </span>
            </p>
            {r.note && <p className={styles.note}>{r.note}</p>}
            <div className={styles.row}>
              <button type="button" className="btn btn-primary" aria-disabled={busy === r.id} onClick={() => reset(r)}>
                {busy === r.id ? 'Setting…' : 'Set a new password'}
              </button>
              <button type="button" className="btn btn-secondary" aria-disabled={busy === r.id} onClick={() => dismiss(r)}>
                Dismiss
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
