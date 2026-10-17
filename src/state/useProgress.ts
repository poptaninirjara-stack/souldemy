// Derived progress: XP, rank, weekly days, place progress and badges. Pure reads of app state.
import { useMemo } from 'react'
import { catalog } from '../lib/content'
import { bundle } from '../lib/games'
import { activeDays, earnedBadges, isDue, placeProgress, rankFor, totalXp } from '../lib/gamify'
import { activeDaysInWeek, todayISO, weekStart, weeksGoalMet } from '../lib/weekly'
import type { ModuleSummary } from '../types/content'
import { useAppState } from './useAppState'

export function useProgress() {
  const { xpLog, visited, records, deck, quiz, weekGoal } = useAppState()

  return useMemo(() => {
    const today = todayISO()
    const xp = totalXp(xpLog)
    const days = activeDays(xpLog)
    const thisWeek = activeDaysInWeek(days, weekStart(today))
    const weeksMet = weeksGoalMet(days, weekGoal, today)
    const dueCards = Object.entries(deck).filter(([, c]) => isDue(c, today)).map(([id]) => id)

    const quizCorrect = (moduleId: string) => {
      const total = catalog.tracks.flatMap((t) => t.modules).find((m) => m.id === moduleId)?.quizCount ?? 0
      const correct = Object.entries(quiz).filter(([k, a]) => k.startsWith(`${moduleId}-`) && a.status === 'correct').length
      return { correct, total }
    }

    const badges = earnedBadges({
      catalog,
      games: bundle.games,
      phrases: bundle.phrases,
      visited,
      records,
      deck,
      log: xpLog,
      quizCorrect,
      weeksMet,
    })

    const place = (m: ModuleSummary) => placeProgress(m, visited, bundle.games, records)

    return { today, xp, ...rankFor(xp), days, thisWeek, weekGoal, weeksMet, dueCards, badges, place, practisedToday: days.has(today) }
  }, [xpLog, visited, records, deck, quiz, weekGoal])
}

