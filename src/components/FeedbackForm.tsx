import { useId, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../state/useAuth'
import styles from './FeedbackForm.module.css'

type Kind = 'general' | 'content' | 'bug'

/** Sends a note to the teachers (feedback table). Works signed in or not. */
export function FeedbackForm({ kind: initialKind = 'general', page, compact = false }: { kind?: Kind; page?: string; compact?: boolean }) {
  const { session } = useAuth()
  const [kind, setKind] = useState<Kind>(initialKind)
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const uid = useId()
  if (!supabase) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!message.trim() || state === 'sending') return
    setState('sending')
    const { error } = await supabase!.from('feedback').insert({
      kind,
      message: message.trim().slice(0, 4000),
      page: (page ?? window.location.hash.replace(/^#/, '')).slice(0, 200) || null,
      user_id: session?.user.id ?? null,
    })
    if (error) setState('error')
    else {
      setMessage('')
      setState('sent')
    }
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      {!compact && (
        <div>
          <label className="form-label" htmlFor={`${uid}-k`}>
            About
          </label>
          <select id={`${uid}-k`} className="field" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            <option value="general">Something about the app</option>
            <option value="content">A mistake or problem in a lesson</option>
            <option value="bug">Something not working</option>
          </select>
        </div>
      )}
      <div>
        <label className="form-label" htmlFor={`${uid}-m`}>
          {compact ? 'What is wrong on this page?' : 'Your message'}
        </label>
        <textarea
          id={`${uid}-m`}
          className="field"
          value={message}
          maxLength={4000}
          onChange={(e) => {
            setMessage(e.target.value)
            if (state !== 'sending') setState('idle')
          }}
        />
      </div>
      <div>
        <button type="submit" className="btn btn-secondary" aria-disabled={state === 'sending' || !message.trim()}>
          {state === 'sending' ? 'Sending…' : 'Send'}
        </button>
      </div>
      <p className="caption" role="status">
        {state === 'sent'
          ? 'Thank you. Your teachers will read it.'
          : state === 'error'
            ? 'It did not send. Check your connection and try again.'
            : session
              ? 'Your teachers will see your name with this message.'
              : 'You are not signed in, so this is sent without your name.'}
      </p>
    </form>
  )
}
