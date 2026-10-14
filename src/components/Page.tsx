import type { ReactNode } from 'react'
import styles from './Page.module.css'

/** Centred page container. `width`: "wide" (1040, dashboard/progress), "library" (760), "reading" (600). */
export function Page({ children, width = 'wide', busy }: { children: ReactNode; width?: 'wide' | 'library' | 'reading'; busy?: boolean }) {
  return (
    <div className={styles.page} data-width={width} aria-busy={busy || undefined}>
      {children}
    </div>
  )
}
