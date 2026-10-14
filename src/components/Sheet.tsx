import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './Sheet.module.css'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Element to return focus to on close. */
  returnFocus?: React.RefObject<HTMLElement | null>
}

/**
 * Bottom sheet (handoff §6). Uses <dialog>.showModal() so the page behind is inert and
 * focus is trapped; Escape and the scrim close it; focus returns to the trigger.
 */
export function Sheet({ open, onClose, title, children, returnFocus }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const uid = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal()
      else d.setAttribute('open', '')
      headingRef.current?.focus()
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close()
      else d.removeAttribute('open')
      returnFocus?.current?.focus()
    }
  }, [open, returnFocus])

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={`${uid}-t`}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        // A click on the dialog element itself (not its contents) is a click on the scrim.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.inner}>
        <div className={styles.handle} aria-hidden="true" />
        <h2 id={`${uid}-t`} ref={headingRef} tabIndex={-1} className={styles.title}>
          {title}
        </h2>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  )
}
