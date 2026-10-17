import { Link } from 'react-router'
import { gamesAfter, KIND_LABEL, phrasesFor } from '../lib/games'
import { useAppState } from '../state/useAppState'
import { Play } from './Icons'
import styles from './PractiseThis.module.css'

/**
 * Right after a lesson or section: the games that practise it, and (for "Useful language")
 * a button to collect its phrases into the review deck. Attempt-first, then move on.
 */
export function PractiseThis({ moduleId, pageId, collect }: { moduleId: string; pageId: string; collect?: boolean }) {
  const { records, deck, collectPhrases } = useAppState()
  const games = gamesAfter(moduleId, pageId)
  const phrases = collect ? phrasesFor(moduleId) : []
  const missing = phrases.filter((p) => !deck[p.id])
  if (!games.length && !phrases.length) return null

  return (
    <aside className={styles.box} aria-label="Practise this">
      <p className={styles.kicker}>Practise this</p>
      {games.map((g) => {
        const r = records[g.id]
        return (
          <Link key={g.id} to={`/play/${g.id}`} className={styles.game}>
            <span className={styles.play} aria-hidden="true">
              <Play size={18} />
            </span>
            <span className={styles.text}>
              <span className={styles.title}>{g.title}</span>
              <span className={styles.meta}>
                {KIND_LABEL[g.kind]} · {r ? `Best ${r.best}/${r.total}` : 'New'}
              </span>
            </span>
          </Link>
        )
      })}
      {phrases.length > 0 &&
        (missing.length ? (
          <button type="button" className="btn btn-go" onClick={() => collectPhrases(missing.map((p) => p.id))}>
            Collect {missing.length} phrase {missing.length === 1 ? 'card' : 'cards'} for Review
          </button>
        ) : (
          <p className={styles.meta}>All {phrases.length} phrases from this place are in your Review deck.</p>
        ))}
    </aside>
  )
}
