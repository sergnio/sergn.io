/** The #1 wing's crown, shared by the list and the wing page. */
export function WingCrown() {
  return (
    <svg
      aria-hidden="true"
      className="wing-crown"
      data-testid="wing-crown"
      focusable="false"
      viewBox="0 0 36 30"
    >
      <defs>
        <linearGradient id="crown-gold" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd966" />
          <stop offset=".55" stopColor="#f2b93b" />
          <stop offset="1" stopColor="#d4921c" />
        </linearGradient>
      </defs>
      <g stroke="#8a5d0b" strokeLinejoin="round" strokeWidth="1.4">
        <path
          d="M4 10.5 11 17 18 5.5 25 17l7-6.5-2.6 13.5H6.6z"
          fill="url(#crown-gold)"
        />
        <rect
          fill="url(#crown-gold)"
          height="4.4"
          rx="1.2"
          width="24"
          x="6"
          y="24"
        />
        <circle cx="4" cy="8.6" fill="#ffd966" r="2.5" />
        <circle cx="18" cy="3.2" fill="#ffd966" r="2.5" />
        <circle cx="32" cy="8.6" fill="#ffd966" r="2.5" />
      </g>
    </svg>
  )
}
