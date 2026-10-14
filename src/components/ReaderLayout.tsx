import type { ReactNode } from 'react'
import styles from './ReaderLayout.module.css'

/**
 * Desktop: | rail 248 | main (pad 48) | reading 600 | gap 40 | margin 254 |.
 * Phone and tablet: the reading column alone, capped at 600px and centred.
 */
export function ReaderLayout({ rail, margin, children }: { rail: ReactNode; margin?: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.shell}>
      {rail}
      <div className={styles.main}>
        <div className={styles.grid}>
          <article className={styles.reading}>{children}</article>
          {margin && <aside className={`${styles.margin} margin-arrive`}>{margin}</aside>}
        </div>
      </div>
    </div>
  )
}

