import type { CSSProperties } from 'react'

/** The "No photo yet" drumette from the design's placeholder-spec.md. */
// `decorative` hides it where the card around it already names the wing.
export function NoPhoto({
  className,
  decorative = false,
  style,
}: {
  className?: string
  decorative?: boolean
  style?: CSSProperties
}) {
  const a11y = decorative
    ? { 'aria-hidden': true }
    : { 'aria-label': 'No photo yet', role: 'img' }

  return (
    <div
      className={className ? `wing-ph ${className}` : 'wing-ph'}
      {...a11y}
      style={style}
    >
      <svg
        aria-hidden="true"
        className="wing-ph__art"
        focusable="false"
        viewBox="0 0 120 120"
      >
        <g transform="rotate(-35 60 60)">
          <path d="M75 55C63 52 59 36 37 36C19 36 11 48 11 60C11 74 21 84 37 84C57 84 63 68 75 65L96 64.5C96 72 108 72 107 63C104 60.5 104 59.5 107 57C108 48 96 48 96 55.5Z" />
        </g>
      </svg>
      <span className="wing-ph__caption">No photo yet</span>
    </div>
  )
}
