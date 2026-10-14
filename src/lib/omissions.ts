// Render-time omissions that the build brief requires (constraint 5: no self-assessment).
// The source text is unchanged; see CONTENT_ISSUES.md item 2 for the owner's decision.
import type { LessonMapRow } from '../types/content'

export function displaySkill(moduleId: string, row: LessonMapRow): string {
  if (moduleId === 'r1' && row.number === '7') {
    return row.skill.replace(/,\s*self-assessment\b/i, '')
  }
  return row.skill
}
