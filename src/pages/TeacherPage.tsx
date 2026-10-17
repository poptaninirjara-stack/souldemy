// Teacher view: every student's progress, quiz results and written answers, plus feedback.
// Row-level security lets only teachers and admins read other students' data, so this page
// shows nothing useful to anyone else even if they open the URL.
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Html } from '../components/Html'
import { LoadError, Loading } from '../components/Loading'
import { Page } from '../components/Page'
import { catalog, loadModule } from '../lib/content'
import { supabase } from '../lib/supabase'
import type { Attempt, QuizAnswer } from '../state/useAppState'
import { useAuth } from '../state/useAuth'
import type { ModuleContent } from '../types/content'
import styles from './TeacherPage.module.css'

interface StudentRow {
  id: string
  username: string
  full_name: string
  role: string
  classes: { name: string } | null
}

interface Progress {
  visited: string[]
  quiz: Record<string, QuizAnswer>
  attempts: Record<string, Attempt>
  xp: Record<string, { xp: number }>
  lastActive: string | null
}

interface FeedbackRow {
  id: string
  kind: string
  page: string | null
  message: string
  resolved: boolean
  created_at: string
  profiles: { username: string; full_name: string } | null
}

const TOTAL_PAGES = catalog.tracks.reduce((n, t) => n + t.modules.reduce((k, m) => k + m.pages.length, 0), 0)
const TOTAL_QUIZ = catalog.tracks.reduce((n, t) => n + t.modules.reduce((k, m) => k + m.quizCount, 0), 0)

const emptyProgress = (): Progress => ({ visited: [], quiz: {}, attempts: {}, xp: {}, lastActive: null })

function toProgress(rows: { key: string; value: unknown; updated_at: string }[]): Progress {
  const p = emptyProgress()
  for (const r of rows) {
    if (r.key === 'visited' && Array.isArray(r.value)) p.visited = r.value as string[]
    if (r.key === 'quiz' && r.value) p.quiz = r.value as Progress['quiz']
    if (r.key === 'attempts' && r.value) p.attempts = r.value as Progress['attempts']
    if (r.key === 'xp' && r.value) p.xp = r.value as Progress['xp']
    if (!p.lastActive || r.updated_at > p.lastActive) p.lastActive = r.updated_at
  }
  return p
}

const summary = (p: Progress) => {
  const answers = Object.values(p.quiz).filter((q) => q.status === 'correct' || q.status === 'incorrect')
  return {
    read: p.visited.length,
    correct: Object.values(p.quiz).filter((q) => q.status === 'correct').length,
    answered: answers.length,
    written: Object.values(p.attempts).filter((a) => a.text?.trim()).length,
    xp: Object.values(p.xp).reduce((n, e) => n + (e?.xp ?? 0), 0),
  }
}

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : 'Never'

/** Shown instead of the page to anyone who is not a signed-in teacher or admin. */
function useStaffGate() {
  const { enabled, session, isStaff, profile } = useAuth()
  if (!enabled) return <p className="meta">Accounts are not set up for this copy of the app.</p>
  if (!session)
    return (
      <p className="meta">
        This page is for teachers. <Link to="/signin">Sign in</Link> with a teacher account.
      </p>
    )
  if (!profile) return <Loading thing="your account" />
  if (!isStaff) return <p className="meta">This page is for teachers. Your account is a student account.</p>
  return null
}

export function TeacherPage() {
  const gate = useStaffGate()
  const [tab, setTab] = useState<'students' | 'feedback'>('students')
  return (
    <Page>
      <h1>Teacher view</h1>
      {gate ?? (
        <>
          <div className={styles.tabs} role="tablist" aria-label="Teacher view">
            {(['students', 'feedback'] as const).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} className={styles.tab} onClick={() => setTab(t)}>
                {t === 'students' ? 'Students' : 'Feedback'}
              </button>
            ))}
          </div>
          {tab === 'students' ? <Students /> : <Feedback />}
        </>
      )}
    </Page>
  )
}

function Students() {
  const [state, setState] = useState<{ students: StudentRow[]; progress: Map<string, Progress> } | 'loading' | 'error'>('loading')
  const [query, setQuery] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    Promise.all([
      supabase!.from('profiles').select('id, username, full_name, role, classes!profiles_class_id_fkey(name)').eq('role', 'student').order('full_name'),
      supabase!.from('progress').select('user_id, key, value, updated_at').in('key', ['visited', 'quiz', 'attempts', 'xp']),
    ]).then(([s, p]) => {
      if (!live) return
      if (s.error || p.error) return setState('error')
      const byUser = new Map<string, { key: string; value: unknown; updated_at: string }[]>()
      for (const r of p.data) byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r])
      setState({
        students: s.data as unknown as StudentRow[],
        progress: new Map([...byUser].map(([id, rows]) => [id, toProgress(rows)])),
      })
    }, () => live && setState('error'))
    return () => {
      live = false
    }
  }, [attempt])

  const rows = useMemo(() => {
    if (typeof state === 'string') return []
    const q = query.trim().toLowerCase()
    return state.students
      .filter((s) => !q || s.full_name.toLowerCase().includes(q) || s.username.includes(q) || s.classes?.name.toLowerCase().includes(q))
      .map((s) => {
        const p = state.progress.get(s.id) ?? emptyProgress()
        return { s, p, sum: summary(p) }
      })
  }, [state, query])

  if (state === 'loading') return <Loading thing="students" />
  if (state === 'error') return <LoadError what="The student list" onRetry={() => setAttempt((n) => n + 1)} />

  return (
    <section className={styles.section}>
      <div className={styles.toolbar}>
        <label className="visually-hidden" htmlFor="student-search">
          Search students
        </label>
        <input
          id="student-search"
          className="field"
          placeholder="Search by name, username or class"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="caption">
          {rows.length} of {state.students.length} students
        </p>
      </div>
      {state.students.length === 0 ? (
        <p className="meta">No student accounts yet. Create them with npm run import-users (see the README).</p>
      ) : (
        <div className="table-scroll">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Class</th>
                <th scope="col">Pages read</th>
                <th scope="col">Quiz correct</th>
                <th scope="col">Answers written</th>
                <th scope="col">XP</th>
                <th scope="col">Last active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, p, sum }) => (
                <tr key={s.id}>
                  <th scope="row">
                    <Link to={`/teacher/${s.id}`}>{s.full_name || s.username}</Link>
                    <span className={styles.username}>{s.username}</span>
                  </th>
                  <td>{s.classes?.name ?? '—'}</td>
                  <td>
                    {sum.read} / {TOTAL_PAGES}
                  </td>
                  <td>
                    {sum.correct} / {TOTAL_QUIZ}
                  </td>
                  <td>{sum.written}</td>
                  <td>{sum.xp}</td>
                  <td>{date(p.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Feedback() {
  const [items, setItems] = useState<FeedbackRow[] | 'loading' | 'error'>('loading')
  const [showResolved, setShowResolved] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    supabase!
      .from('feedback')
      .select('id, kind, page, message, resolved, created_at, profiles(username, full_name)')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data, error }) => live && setItems(error ? 'error' : (data as unknown as FeedbackRow[])))
    return () => {
      live = false
    }
  }, [attempt])

  if (items === 'loading') return <Loading thing="feedback" />
  if (items === 'error') return <LoadError what="Feedback" onRetry={() => setAttempt((n) => n + 1)} />

  const shown = items.filter((f) => showResolved || !f.resolved)
  async function toggle(f: FeedbackRow) {
    const { error } = await supabase!.from('feedback').update({ resolved: !f.resolved }).eq('id', f.id)
    if (!error && Array.isArray(items)) setItems(items.map((x) => (x.id === f.id ? { ...x, resolved: !f.resolved } : x)))
  }

  return (
    <section className={styles.section}>
      <label className={styles.check}>
        <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
        <span>Show resolved</span>
      </label>
      {shown.length === 0 ? (
        <p className="meta">No open feedback.</p>
      ) : (
        <ul className={styles.feedback}>
          {shown.map((f) => (
            <li key={f.id} className={styles.item} data-resolved={f.resolved}>
              <p className="caption">
                {date(f.created_at)} · {f.kind === 'content' ? 'Lesson problem' : f.kind === 'bug' ? 'Not working' : 'General'} ·{' '}
                {f.profiles ? `${f.profiles.full_name || f.profiles.username} (${f.profiles.username})` : 'Not signed in'}
                {f.page ? (
                  <>
                    {' · '}
                    <a href={`#${f.page}`}>{f.page}</a>
                  </>
                ) : null}
              </p>
              <p className={styles.message}>{f.message}</p>
              <button type="button" className="btn btn-secondary" onClick={() => toggle(f)}>
                {f.resolved ? 'Reopen' : 'Mark resolved'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** One student's progress, quiz results and written answers, module by module. */
export function StudentPage() {
  const gate = useStaffGate()
  const { userId } = useParams()
  const [data, setData] = useState<{ student: StudentRow; progress: Progress; modules: ModuleContent[] } | 'loading' | 'error' | 'missing'>(
    'loading',
  )
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (gate || !userId) return
    let live = true
    const ids = catalog.tracks.flatMap((t) => t.modules.map((m) => m.id))
    Promise.all([
      supabase!.from('profiles').select('id, username, full_name, role, classes!profiles_class_id_fkey(name)').eq('id', userId).maybeSingle(),
      supabase!.from('progress').select('key, value, updated_at').eq('user_id', userId),
      Promise.all(ids.map((id) => loadModule(id))),
    ]).then(([s, p, modules]) => {
      if (!live) return
      if (s.error || p.error) return setData('error')
      if (!s.data) return setData('missing')
      setData({ student: s.data as unknown as StudentRow, progress: toProgress(p.data), modules })
    }, () => live && setData('error'))
    return () => {
      live = false
    }
  }, [gate, userId, attempt])

  const back = (
    <p>
      <Link to="/teacher">← All students</Link>
    </p>
  )
  if (gate)
    return (
      <Page>
        <h1>Teacher view</h1>
        {gate}
      </Page>
    )
  if (data === 'loading')
    return (
      <Page>
        <Loading thing="this student" />
      </Page>
    )
  if (data === 'error' || data === 'missing')
    return (
      <Page>
        {back}
        <h1>Student</h1>
        {data === 'missing' ? <p className="meta">No student with this ID.</p> : <LoadError what="This student" onRetry={() => setAttempt((n) => n + 1)} />}
      </Page>
    )

  const { student, progress, modules } = data
  const sum = summary(progress)
  const visited = new Set(progress.visited)
  const content = new Map(modules.map((m) => [m.id, m]))

  return (
    <Page>
      {back}
      <h1>{student.full_name || student.username}</h1>
      <p className="meta">
        {student.username}
        {student.classes ? ` · ${student.classes.name}` : ''} · Last active {date(progress.lastActive)}
      </p>
      <p className="meta">
        {sum.read} of {TOTAL_PAGES} pages read · {sum.correct} of {TOTAL_QUIZ} quiz questions correct · {sum.written} answers written · {sum.xp} XP
      </p>

      {catalog.tracks.flatMap((t) =>
        t.modules.map((m) => {
          const mc = content.get(m.id)
          const read = m.pages.filter((pg) => visited.has(`${m.id}/${pg.id}`)).length
          const blocks = (mc?.lessons ?? []).flatMap((l) => l.blocks.map((b) => ({ lesson: l, b })))
          const quizzes = blocks.flatMap(({ lesson, b }) => (b.kind === 'quiz' ? [{ lesson, b }] : []))
          const written = blocks.flatMap(({ lesson, b }) =>
            (b.kind === 'exercise' || b.kind === 'practice') && progress.attempts[b.id]?.text?.trim() ? [{ lesson, b, a: progress.attempts[b.id] }] : [],
          )
          // Answers keyed by IDs that are not lesson exercises (e.g. communicative "Try it" tasks).
          const other = Object.entries(progress.attempts).filter(
            ([id, a]) => a.text?.trim() && id.startsWith(`${m.id}-`) && !blocks.some(({ b }) => b.id === id),
          )
          return (
            <section key={m.id} className={styles.module} aria-labelledby={`m-${m.id}`}>
              <h2 id={`m-${m.id}`} className={styles.h2}>
                {m.title}
              </h2>
              <p className="caption">
                {read} of {m.pages.length} pages read
              </p>
              {quizzes.map(({ lesson, b }) => {
                if (b.kind !== 'quiz') return null
                const answered = b.items.filter((q) => progress.quiz[q.id])
                if (!answered.length) return null
                return (
                  <details key={b.id} className={styles.details}>
                    <summary>
                      Lesson {lesson.number} quiz: {b.items.filter((q) => progress.quiz[q.id]?.status === 'correct').length} of {b.items.length} correct
                    </summary>
                    <ol className={styles.quiz}>
                      {b.items.map((q) => {
                        const a = progress.quiz[q.id]
                        return (
                          <li key={q.id}>
                            <Html html={q.questionHtml} />
                            <p className="caption" data-status={a?.status ?? 'idle'}>
                              {!a || a.selected === null
                                ? 'Not answered'
                                : `${a.status === 'correct' ? 'Correct' : a.status === 'shown' ? 'Answer shown' : 'Incorrect'}: chose (${String.fromCharCode(97 + a.selected)})${a.status !== 'correct' ? `, answer (${String.fromCharCode(97 + q.correctIndex)})` : ''}`}
                            </p>
                          </li>
                        )
                      })}
                    </ol>
                  </details>
                )
              })}
              {[...written.map(({ lesson, b, a }) => ({ id: b.id, title: `Lesson ${lesson.number}: ${b.title}`, a })), ...other.map(([id, a]) => ({ id, title: id, a }))].map(
                ({ id, title, a }) => (
                  <details key={id} className={styles.details}>
                    <summary>
                      {title}
                      {a.revealed ? ' · model answer seen' : ''}
                    </summary>
                    <p className={styles.answer}>{a.text}</p>
                  </details>
                ),
              )}
            </section>
          )
        }),
      )}
      <p className="caption">Audio recordings will appear here once recording is added to the communicative track.</p>
    </Page>
  )
}
