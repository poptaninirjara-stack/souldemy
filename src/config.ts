// App-wide settings. Change the name here; it is used everywhere.

/** Working title. Not final. */
export const APP_NAME = '[Working Title]'

/**
 * Prefix for every localStorage key. Kept separate from APP_NAME so renaming
 * the app does not wipe students' saved progress.
 */
export const STORAGE_NAMESPACE = 'english-app:v1:'

/** Show "Pending faculty review" on Marathi to English notes until a Marathi-speaking faculty member has reviewed them. */
export const SHOW_UNREVIEWED_BADGE = true

/** Notes that must always appear on a given page (content build notes). Keyed by `${moduleId}/${pageId}`. */
export const PAGE_NOTES: Record<string, string> = {
  'r2/l4': "Ask your library for your institute's exact login steps and which services it has joined.",
}

/** One-line track blurbs on the welcome page (handoff §9, drafted; author to review). */
export const TRACK_BLURBS: Record<'research' | 'communicative', string> = {
  research: 'Read papers, find a research gap, and write in the register of your discipline.',
  communicative: 'Write formal email, speak in seminars and vivas, and introduce yourself professionally.',
}

/** Time zone and first weekday for the weekly practice record. */
export const PRACTICE_TIME_ZONE = 'Asia/Kolkata'

/** Weekly goal choices in hours (handoff: segmented control 1 h–6 h). */
export const WEEKLY_GOAL_OPTIONS = [1, 2, 3, 4, 5, 6] as const
