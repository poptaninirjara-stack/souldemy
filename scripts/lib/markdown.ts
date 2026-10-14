// Markdown → sanitised HTML, run at build time only.
import type { Element, ElementContent, Root, Text } from 'hast'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit, SKIP } from 'unist-util-visit'

// No form controls in content: GFM task lists must never become tickable.
const schema = {
  ...defaultSchema,
  tagNames: (defaultSchema.tagNames ?? []).filter((t) => t !== 'input'),
}

const DEVANAGARI = /[ऀ-ॿ]+(?:[\s।॥]+[ऀ-ॿ]+)*/g

/** Wrap each table in a focusable, horizontally scrollable region. */
function rehypeTableScroll() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return
      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'], role: 'region', tabIndex: 0, ariaLabel: 'Table (scrolls sideways on small screens)' },
        children: [node],
      }
      parent.children[index] = wrapper
      return SKIP
    })
  }
}

/** External links open in a new tab and say so to screen readers. */
function rehypeExternalLinks() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return
      const href = String(node.properties?.href ?? '')
      if (!/^https?:\/\//i.test(href)) return
      node.properties = { ...node.properties, target: '_blank', rel: ['noopener', 'noreferrer'] }
      node.children.push({
        type: 'element',
        tagName: 'span',
        properties: { className: ['visually-hidden'] },
        children: [{ type: 'text', value: ' (opens in a new tab)' }],
      })
    })
  }
}

/** Mark Devanagari runs with lang="mr" so the right font and pronunciation apply. */
function rehypeMarathiLang() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return
      if ((parent as Element).tagName === 'span' && (parent as Element).properties?.lang === 'mr') return
      const value = node.value
      DEVANAGARI.lastIndex = 0
      if (!DEVANAGARI.test(value)) return
      DEVANAGARI.lastIndex = 0
      const out: ElementContent[] = []
      let last = 0
      for (const m of value.matchAll(DEVANAGARI)) {
        const start = m.index ?? 0
        if (start > last) out.push({ type: 'text', value: value.slice(last, start) })
        out.push({ type: 'element', tagName: 'span', properties: { lang: 'mr' }, children: [{ type: 'text', value: m[0] }] })
        last = start + m[0].length
      }
      if (last < value.length) out.push({ type: 'text', value: value.slice(last) })
      parent.children.splice(index, 1, ...out)
      return [SKIP, index + out.length]
    })
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeTableScroll)
  .use(rehypeExternalLinks)
  .use(rehypeMarathiLang)
  .use(rehypeStringify)

/** Block-level markdown → HTML. */
export function mdToHtml(src: string): string {
  return String(processor.processSync(src.trim())).trim()
}

/** Inline markdown → HTML without the wrapping <p>. */
export function mdInline(src: string): string {
  const html = mdToHtml(src)
  const m = /^<p>([\s\S]*)<\/p>$/.exec(html)
  if (m && !m[1].includes('<p>')) return m[1]
  return html
}

/** Plain text from inline markdown (for labels and link notes). */
export function mdPlain(src: string): string {
  return src
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
