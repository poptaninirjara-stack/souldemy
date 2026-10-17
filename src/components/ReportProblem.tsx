import { supabase } from '../lib/supabase'
import { FeedbackForm } from './FeedbackForm'
import styles from './ReportProblem.module.css'

/** Small "report a problem" box at the end of a reading page. */
export function ReportProblem() {
  if (!supabase) return null
  return (
    <details className={styles.box}>
      <summary>Report a problem with this page</summary>
      <FeedbackForm kind="content" compact />
    </details>
  )
}
