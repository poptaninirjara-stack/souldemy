import { useCallback, useEffect, useState } from 'react'
import type { ModuleContent } from '../types/content'
import { cachedModule, loadModule } from './content'

interface Result {
  id: string
  data?: ModuleContent
  error?: boolean
}

/** Lazy-loads one module's lessons (per-module JSON chunk). */
export function useModuleContent(id: string | undefined) {
  const [result, setResult] = useState<Result>()
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!id || cachedModule(id)) return
    let live = true
    loadModule(id).then(
      (data) => live && setResult({ id, data }),
      () => live && setResult({ id, error: true }),
    )
    return () => {
      live = false
    }
  }, [id, attempt])

  const data = id ? (cachedModule(id) ?? (result?.id === id ? result.data : undefined)) : undefined
  const error = !data && result?.id === id && !!result?.error
  const retry = useCallback(() => {
    setResult(undefined)
    setAttempt((n) => n + 1)
  }, [])
  return { data, error, retry }
}
