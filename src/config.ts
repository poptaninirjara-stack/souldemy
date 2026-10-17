// App-wide settings. Change the name here; it is used everywhere.

/** App name, used everywhere (wordmark, opening, page title, About). */
export const APP_NAME = 'SoulDemy'

/**
 * Prefix for every localStorage key. Kept separate from APP_NAME so renaming
 * the app does not wipe students' saved progress.
 */
export const STORAGE_NAMESPACE = 'souldemy:v1:'

/** Show "Pending faculty review" on Marathi to English notes until a Marathi-speaking faculty member has reviewed them. */
export const SHOW_UNREVIEWED_BADGE = true

/** Notes that must always appear on a given page (content build notes). Keyed by `${moduleId}/${pageId}`. */
export const PAGE_NOTES: Record<string, string> = {
  'r2/l4': "Ask your library for your institute's exact login steps and which services it has joined.",
}

/** Time zone and first weekday for the weekly practice record. */
export const PRACTICE_TIME_ZONE = 'Asia/Kolkata'

