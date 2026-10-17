import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Check, Cross, Mic, Stop } from '../components/Icons'
import { Html } from '../components/Html'
import { findModule, modulePath } from '../lib/content'
import { mirrorFor } from '../lib/games'
import { placeFor } from '../lib/places'
import { useModuleContent } from '../lib/useModuleContent'
import { useAppState } from '../state/useAppState'
import game from './GamePage.module.css'
import styles from './MirrorPage.module.css'
import { NotFound } from './NotFound'

type Phase = 'ready' | 'recording' | 'recorded' | 'unsupported' | 'denied'

const canRecord = () =>
  typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

/**
 * Mirror mode: record yourself, play it back, tick a checklist. The recording lives only in
 * this page's memory. It is never uploaded or saved, and it disappears when you leave.
 * The checklist is for you; it is never scored.
 */
export function MirrorPage() {
  const { moduleId } = useParams()
  const task = mirrorFor(moduleId ?? '')
  const mod = findModule(moduleId ?? '')
  const { mirrorDone } = useAppState()
  const { data } = useModuleContent(mod?.id)
  const [phase, setPhase] = useState<Phase>(canRecord() ? 'ready' : 'unsupported')
  const [url, setUrl] = useState<string | null>(null)
  const [ticks, setTicks] = useState<boolean[]>([])
  const [finished, setFinished] = useState(false)
  const rec = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)

  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop())
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )

  if (!task || !mod) return <NotFound />
  const place = placeFor(mod.id)
  const example = data?.sections?.find((s) => s.id === 'example')

  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = s
      const chunks: Blob[] = []
      const r = new MediaRecorder(s)
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      r.onstop = () => {
        s.getTracks().forEach((t) => t.stop())
        if (url) URL.revokeObjectURL(url)
        setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType || 'audio/webm' })))
        setPhase('recorded')
      }
      rec.current = r
      r.start()
      setPhase('recording')
    } catch {
      setPhase('denied')
    }
  }
  const stop = () => rec.current?.state === 'recording' && rec.current.stop()

  const finish = () => {
    mirrorDone(mod.id)
    setFinished(true)
  }

  return (
    <div className={game.screen}>
      <div className={game.top}>
        <Link to={modulePath(mod)} className={game.quit} aria-label={`Leave and go back to ${place?.name ?? mod.title}`}>
          <Cross size={20} />
        </Link>
        <div className={game.titleWrap}>
          <p className={game.where}>{place?.name} · Private rehearsal</p>
          <h1 className={game.title}>Mirror mode</h1>
        </div>
      </div>

      <div className={game.body}>
        <div className={`${game.card} ${styles.task}`}>
          <p className={game.ask}>Your task (from "Try it")</p>
          <p className={styles.taskText}>{task.task}</p>
          <p className="caption">Aim for about {task.seconds} seconds. There is no clock; take the time you need.</p>
        </div>

        {example && (
          <details className={styles.example}>
            <summary>See the worked example first</summary>
            <h2 className={styles.exampleTitle}>{example.title}</h2>
            <Html className="prose" html={example.html} />
          </details>
        )}

        <section className={`card ${styles.recorder}`} aria-labelledby="rec-h">
          <h2 id="rec-h" className={styles.recTitle}>
            Record
          </h2>
          {phase === 'ready' && (
            <>
              <p className={styles.note}>Your voice stays on this phone. Nothing is uploaded or saved.</p>
              <button type="button" className={`btn btn-go ${styles.recBtn}`} onClick={start}>
                <Mic size={22} /> Start recording
              </button>
            </>
          )}
          {phase === 'recording' && (
            <>
              <p className={styles.live} role="status">
                <span className={styles.dot} aria-hidden="true" /> Recording. Speak when you are ready.
              </p>
              <button type="button" className={`btn btn-primary ${styles.recBtn}`} onClick={stop}>
                <Stop size={20} /> Stop
              </button>
            </>
          )}
          {phase === 'recorded' && url && (
            <>
              <p className={styles.note}>Listen back once. Then tick what you did.</p>
              <audio className={styles.audio} src={url} controls />
              <button type="button" className="btn btn-secondary" onClick={start}>
                <Mic size={18} /> Record again
              </button>
            </>
          )}
          {(phase === 'unsupported' || phase === 'denied') && (
            <p className={styles.note} role="status">
              {phase === 'denied'
                ? 'The microphone is blocked for this site. You can allow it in your browser settings, or simply say your answer aloud and tick the checklist.'
                : 'Recording is not available in this browser. Say your answer aloud anyway, then tick the checklist.'}
            </p>
          )}
        </section>

        <fieldset className={`card ${styles.checklist}`}>
          <legend className={styles.legend}>Check yourself (just for you, never scored)</legend>
          {task.checklist.map((c, i) => (
            <label key={c} className={styles.check}>
              <input
                type="checkbox"
                checked={!!ticks[i]}
                onChange={(e) => setTicks((t) => Object.assign([...t], { [i]: e.target.checked }))}
              />
              <span>{c}</span>
            </label>
          ))}
        </fieldset>

        {finished ? (
          <div className={`${game.feedback} pop-in`} data-tone="right" role="status">
            <p className={game.fbHead}>
              <Check size={20} /> <strong>Rehearsed. Well done.</strong>
            </p>
            <p className={game.why}>Saying it aloud is what makes it easier next time. Come back and try it again before your next seminar or interview.</p>
            <Link to={modulePath(mod)} className="btn btn-primary btn-block">
              Back to {place?.name}
            </Link>
          </div>
        ) : (
          <button type="button" className="btn btn-go btn-block" onClick={finish}>
            I've rehearsed it
          </button>
        )}
      </div>
    </div>
  )
}
