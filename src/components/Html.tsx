import { useEffect, useRef, type ElementType } from 'react'

/**
 * Renders content HTML. All HTML passed here was produced and sanitised at build time
 * (scripts/lib/markdown.ts → rehype-sanitize); never pass user input.
 * Also marks scrollable tables so the "scroll sideways" affordance shows only when needed.
 */
export function Html({ html, as: Tag = 'div', className }: { html: string; as?: ElementType; className?: string }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const regions = [...root.querySelectorAll<HTMLElement>('.table-scroll')]
    if (!regions.length) return
    const update = (el: HTMLElement) => {
      const overflow = el.scrollWidth > el.clientWidth + 1
      el.dataset.overflow = String(overflow)
      el.dataset.atEnd = String(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
    }
    const onScroll = (e: Event) => update(e.currentTarget as HTMLElement)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => regions.forEach(update)) : null
    regions.forEach((el) => {
      update(el)
      el.addEventListener('scroll', onScroll, { passive: true })
      ro?.observe(el)
    })
    return () => {
      ro?.disconnect()
      regions.forEach((el) => el.removeEventListener('scroll', onScroll))
    }
  }, [html])

  return <Tag ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
