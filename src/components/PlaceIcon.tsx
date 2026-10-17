// Flat sticker-style drawings for campus places: 2px ink outlines, flat fills from tokens.
// Decorative (aria-hidden); the place name always appears as text next to them.
const S = { stroke: 'var(--ink)', strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

const DRAWINGS: Record<string, React.ReactNode> = {
  // Exam Hall: answer booklet + pen
  r1: (
    <>
      <rect x="10" y="8" width="30" height="40" rx="3" fill="var(--page)" {...S} />
      <path d="M16 18h18M16 25h18M16 32h12" {...S} fill="none" />
      <path d="M44 14l6 6-16 16-7 1 1-7z" fill="var(--vermilion)" {...S} />
    </>
  ),
  // Library: stack of books
  r2: (
    <>
      <rect x="8" y="34" width="40" height="10" rx="2" fill="var(--blue)" {...S} />
      <rect x="12" y="24" width="36" height="10" rx="2" fill="var(--mango)" {...S} />
      <rect x="10" y="14" width="34" height="10" rx="2" fill="var(--mint)" {...S} />
      <path d="M16 39h10M18 29h10M15 19h10" {...S} fill="none" />
    </>
  ),
  // Seminar Room: microphone
  c1: (
    <>
      <rect x="22" y="8" width="14" height="24" rx="7" fill="var(--page)" {...S} />
      <path d="M16 26a13 13 0 0026 0M29 39v8M21 48h16" {...S} fill="none" />
      <path d="M22 18h6M22 24h6" {...S} fill="none" />
    </>
  ),
  // Email Desk: envelope
  c2: (
    <>
      <rect x="8" y="14" width="42" height="30" rx="3" fill="var(--page)" {...S} />
      <path d="M8 17l21 16 21-16" {...S} fill="none" />
      <circle cx="46" cy="14" r="6" fill="var(--vermilion)" {...S} />
    </>
  ),
  // CV Desk: document with photo + lines
  c3: (
    <>
      <rect x="12" y="6" width="34" height="44" rx="3" fill="var(--page)" {...S} />
      <rect x="18" y="12" width="10" height="12" rx="2" fill="var(--sky)" {...S} />
      <path d="M32 15h8M32 21h6M18 31h22M18 37h22M18 43h14" {...S} fill="none" />
    </>
  ),
  // Interview Room: two chat bubbles
  c4: (
    <>
      <path d="M8 12h28a3 3 0 013 3v14a3 3 0 01-3 3H20l-8 7v-7H8a3 3 0 01-3-3V15a3 3 0 013-3z" fill="var(--page)" {...S} />
      <path d="M50 24H40v10a3 3 0 01-3 3H30v4a3 3 0 003 3h9l7 6v-6h1a3 3 0 003-3V27a3 3 0 00-3-3z" fill="var(--mint)" {...S} />
      <path d="M13 20h18M13 26h12" {...S} fill="none" />
    </>
  ),
}

export function PlaceIcon({ moduleId, size = 56 }: { moduleId: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true" focusable="false">
      {DRAWINGS[moduleId]}
    </svg>
  )
}
