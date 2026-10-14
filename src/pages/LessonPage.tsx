import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { Exercise } from '../components/Exercise'
import { FurtherReadingButton } from '../components/FurtherReading'
import { Html } from '../components/Html'
import { LoadError, Loading } from '../components/Loading'
import { Practice } from '../components/Practice'
import { Quiz } from '../components/Quiz'
import { Rail } from '../components/Rail'
import { ReaderLayout } from '../components/ReaderLayout'
import s from '../components/ReaderLayout.module.css'
import { PAGE_NOTES } from '../config'
import { getModule, getTrack, pageKey } from '../lib/content'
import { moduleProgress } from '../lib/progress'
import { useModuleContent } from '../lib/useModuleContent'
import { useAppState } from '../state/useAppState'
import type { Block } from '../types/content'
import { NotFound } from './NotFound'

export function LessonPage() {
  const { moduleId, pageId } = useParams()
  const track = getTrack('research')
  const mod = getModule('research', moduleId)
  const index = mod?.pages.findIndex((p) => p.id === pageId) ?? -1
  const { data, error, retry } = useModuleContent(mod ? moduleId : undefined)
  const { visited, markVisited, setLastLocation } = useAppState()

  useEffect(() => {
    if (!mod || index < 0 || !pageId) return
    markVisited(mod.id, pageId)
    setLastLocation({ trackId: 'research', moduleId: mod.id, pageId })
  }, [mod, pageId, index, markVisited, setLastLocation])

  if (!track || !mod || index < 0) return <NotFound />

  const page = mod.pages[index]
  const prev = mod.pages[index - 1]
  const next = mod.pages[index + 1]
  const lesson = data?.lessons?.find((l) => l.id === pageId)
  const progress = moduleProgress(mod, visited)
  const note = PAGE_NOTES[pageKey(mod.id, page.id)]

  const margin = (
    <div className={s.marginNote}>
      <p className={s.marginTitle}>
        Lesson {page.number} of {mod.pages.length}
      </p>
      <div className="progress-line" data-size="4" aria-hidden="true">
        <span style={{ width: `${progress.pct}%` }} />
      </div>
      <p className="caption">
        {progress.visited} of {progress.total} lessons read in this module.
      </p>
      <FurtherReadingButton reading={mod.furtherReading} moduleTitle={mod.title} block />
    </div>
  )

  return (
    <ReaderLayout rail={<Rail track={track} current={mod} activePage={page.id} />} margin={margin}>
      <header className={s.head}>
        <h1>{page.title}</h1>
        <p className="meta">
          Lesson {page.number} of {mod.pages.length} in Module {mod.number}: {mod.title}.
        </p>
        <div
          className="progress-line"
          data-size="4"
          role="img"
          aria-label={`${progress.visited} of ${progress.total} lessons read`}
        >
          <span style={{ width: `${progress.pct}%` }} />
        </div>
        <div className={s.toolbar}>
          <FurtherReadingButton reading={mod.furtherReading} moduleTitle={mod.title} />
        </div>
      </header>

      {note && (
        <p className={s.note} role="note">
          {note}
        </p>
      )}

      {error ? (
        <LoadError what="This lesson" onRetry={retry} />
      ) : !lesson ? (
        <Loading thing={page.title} />
      ) : (
        lesson.blocks.map((b) => <LessonBlock key={b.id} block={b} />)
      )}

      <nav className={s.pager} aria-label="Lessons">
        {prev && (
          <Link to={`/research/${mod.id}/${prev.id}`} className={s.pagerLink} data-dir="prev" rel="prev">
            <span className={s.pagerDir}>Previous lesson</span>
            <span className={s.pagerTitle}>{prev.title}</span>
          </Link>
        )}
        {next ? (
          <Link to={`/research/${mod.id}/${next.id}`} className={s.pagerLink} data-dir="next" rel="next">
            <span className={s.pagerDir}>Next lesson</span>
            <span className={s.pagerTitle}>{next.title}</span>
          </Link>
        ) : (
          <Link to={`/research/${mod.id}`} className={s.pagerLink} data-dir="next">
            <span className={s.pagerDir}>End of module</span>
            <span className={s.pagerTitle}>Back to contents</span>
          </Link>
        )}
      </nav>
    </ReaderLayout>
  )
}

function LessonBlock({ block }: { block: Block }) {
  switch (block.kind) {
    case 'exercise':
      return <Exercise {...block} />
    case 'quiz':
      return <Quiz title={block.title} items={block.items} />
    case 'practice':
      return <Practice id={block.id} title={block.title} html={block.html} />
    case 'section':
      return (
        <section className={s.section}>
          {block.title && <h2>{block.title}</h2>}
          <Html className="prose" html={block.html} />
        </section>
      )
  }
}
