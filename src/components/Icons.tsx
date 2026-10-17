// Line icons from the handoff prototype (24px grid, 2px stroke). Decorative unless labelled.
interface IconProps {
  size?: number
  label?: string
}

function Svg({ size = 18, label, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
    >
      {children}
    </svg>
  )
}

export const ChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
)

export const ChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 18l6-6-6-6" />
  </Svg>
)

export const Check = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 6L9 17l-5-5" />
  </Svg>
)

export const Cross = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Svg>
)

export const Info = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
)


export const Book = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" />
    <path d="M4 19a2 2 0 012-2h13" />
  </Svg>
)

export const Campus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10l9-6 9 6M5 10v9h14v-9M10 19v-5h4v5" />
  </Svg>
)

export const Cards = (p: IconProps) => (
  <Svg {...p}>
    <rect x="7" y="3" width="13" height="16" rx="2" />
    <path d="M4 7v12a2 2 0 002 2h10" />
  </Svg>
)

export const User = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </Svg>
)

/** Shield with a check: the admin area. */
export const Shield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
)

/** Two people: the teacher's class view. */
export const Group = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M16.5 14c2.5 0 4.2 1.6 5 4.5" />
  </Svg>
)

export const Bolt = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
  </Svg>
)

export const Mic = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0014 0M12 18v3" />
  </Svg>
)

export const Play = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4l13 8-13 8z" />
  </Svg>
)

export const Stop = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </Svg>
)

