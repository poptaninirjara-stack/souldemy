// Parses /content/*.md into typed JSON under src/content/ (git-ignored), and assembles the
// practice games from content/games.json plus the phrase cards extracted from the lessons.
// Run: node scripts/build-content.ts   (runs automatically before dev, build and test)
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { countContent } from './lib/counts.ts'
import { buildGames } from './lib/games.ts'
import { ContentError, FILES, parseAll } from './lib/parse.ts'
import { extractCommPhrases, extractTaskWords } from './lib/phrases.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = join(root, 'content')
const outDir = join(root, 'src', 'content')

function read(name: string): string {
  try {
    return readFileSync(join(contentDir, name), 'utf8')
  } catch {
    throw new ContentError(name, `file not found in /content. Expected ${[...Object.values(FILES), 'games.json'].join(', ')}.`)
  }
}

try {
  const src = {
    module1: read(FILES.module1),
    module2: read(FILES.module2),
    communication: read(FILES.communication),
  }
  const { catalog, contents, omissions } = parseAll(src)

  const phrases = [...extractTaskWords(FILES.module1, src.module1), ...extractCommPhrases(FILES.communication, src.communication)]
  let gamesRaw: unknown
  try {
    gamesRaw = JSON.parse(read('games.json'))
  } catch (e) {
    throw e instanceof ContentError ? e : new ContentError('games.json', `invalid JSON: ${(e as Error).message}`)
  }
  const bundle = buildGames(gamesRaw, phrases, catalog)

  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(join(outDir, 'modules'), { recursive: true })
  writeFileSync(join(outDir, 'catalog.json'), JSON.stringify(catalog))
  writeFileSync(join(outDir, 'games.json'), JSON.stringify(bundle))
  for (const c of contents) writeFileSync(join(outDir, 'modules', `${c.id}.json`), JSON.stringify(c))

  if (!process.argv.includes('--quiet')) {
    console.log('Content built:')
    console.table(countContent(catalog, contents))
    const drafted = bundle.games.reduce(
      (n, g) => n + (g.kind === 'scenario' ? g.steps.flatMap((s) => s.choices) : g.items).filter((i) => i.d).length,
      0,
    )
    console.log(`Games: ${bundle.games.length}, phrase cards: ${bundle.phrases.length}, mirror tasks: ${bundle.mirror.length}, drafted items for review: ${drafted}`)
    console.log('Omitted or changed at build time:')
    for (const o of omissions) console.log(`  - ${o.file}: ${o.what}`)
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
