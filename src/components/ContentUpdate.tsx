import { useEffect, useState } from 'react'
import { checkForContentUpdate } from '../lib/contentSource'
import styles from './ContentUpdate.module.css'

/** Checks once per start for newly published lessons and offers to show them. */
export function ContentUpdate() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let live = true
    checkForContentUpdate().then(
      (changed) => live && setReady(changed),
      () => undefined,
    )
    return () => {
      live = false
    }
  }, [])
  if (!ready) return null
  return (
    <div className={styles.bar} role="status">
      <span>The lessons have been updated.</span>
      <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
        Show the new version
      </button>
    </div>
  )
}
