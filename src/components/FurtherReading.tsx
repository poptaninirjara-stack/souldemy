import { useRef, useState } from 'react'
import { hostOf } from '../lib/content'
import type { FurtherReading as FR } from '../types/content'
import { Html } from './Html'
import { Book } from './Icons'
import { Sheet } from './Sheet'
import styles from './FurtherReading.module.css'

/** The module's sources, never inline: behind a "Further reading" button that opens a sheet. */
export function FurtherReadingButton({ reading, moduleTitle, block }: { reading: FR; moduleTitle: string; block?: boolean }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={`btn btn-secondary ${block ? 'btn-block' : ''}`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Book size={18} />
        Further reading
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`${reading.heading}: ${moduleTitle}`} returnFocus={trigger}>
        <ReadingList reading={reading} />
      </Sheet>
    </>
  )
}

export function ReadingList({ reading }: { reading: FR }) {
  return (
    <div className={styles.wrap}>
      <p className="caption">Links open the original site in a new tab.</p>
      <ul className={styles.list}>
        {reading.items.map((item, i) => (
          <li key={i} className={styles.item}>
            <Html as="span" html={item.html} />
            {item.links.length > 0 && (
              <span className={styles.host}>{[...new Set(item.links.map((l) => hostOf(l.url)))].join(' · ')}</span>
            )}
          </li>
        ))}
      </ul>
      {reading.afterHtml && <Html className={styles.after} html={reading.afterHtml} />}
    </div>
  )
}

