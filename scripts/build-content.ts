// Parses /content/*.md into typed JSON under src/content/ (git-ignored).
// Run: node scripts/build-content.ts   (runs automatically before dev, build and test)
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ContentError, FILES, parseAll } from './lib/parse.ts'
import { countContent } from './lib/counts.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = join(root, 'content')
const outDir = join(root, 'src', 'content')

function read(name: string): string {
  try {
    return readFileSync(join(contentDir, name), 'utf8')
  } catch {
    throw new ContentError(name, `file not found in /content. Expected ${Object.values(FILES).join(', ')}.`)
  }
}

try {
  const { catalog, contents, omissions } = parseAll({
    module1: read(FILES.module1),
    module2: read(FILES.module2),
    communication: read(FILES.communication),
  })

  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(join(outDir, 'modules'), { recursive: true })
  writeFileSync(join(outDir, 'catalog.json'), JSON.stringify(catalog))
  for (const c of contents) writeFileSync(join(outDir, 'modules', `${c.id}.json`), JSON.stringify(c))

  if (!process.argv.includes('--quiet')) {
    console.log('Content built:')
    console.table(countContent(catalog, contents))
    console.log('Omitted or changed at build time:')
    for (const o of omissions) console.log(`  - ${o.file}: ${o.what}`)
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
