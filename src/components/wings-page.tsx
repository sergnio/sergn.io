import { Link } from '@tanstack/react-router'
import type { WingReview } from '#/lib/content-types'
import { formatDate, formatVisits } from '#/lib/formatters'
import type { MainListEntry } from '#/lib/wings'
import {
  mainList,
  podiumSize,
  tierLetter,
  wingName,
  wingTiers,
} from '#/lib/wings'
import { ContentImage } from './content-image'

const footnoteId = 'footnote-non-buffalo'

export function WingsPage({ wings }: { wings: WingReview[] }) {
  const entries = mainList(wings)
  const nonBuffalo = entries.filter(
    ({ wing }) => wing.mainListRole === 'bestNonBuffalo',
  )
  // The podium photo highest up the page is its Largest Contentful Paint.
  const priorityRank = entries
    .slice(0, podiumSize)
    .find(({ wing }) => wing.heroImage?.asset)?.rank

  return (
    <div className="page-shell wings-page">
      <header className="wings-intro">
        <h1>Wings</h1>
        <div className="wings-intro__row">
          <p className="wings-intro__summary">
            Flavor, crunch, juiciness, and size matter.
          </p>
        </div>
      </header>

      {entries.length === 0 ? (
        <p className="empty-state">
          Nothing published here yet. Check back soon.
        </p>
      ) : (
        <div className="wing-tiers">
          {wingTiers(entries).map((tier) => {
            const tops = tier.entries.filter(({ rank }) => rank <= podiumSize)
            const lines = tier.entries.filter(({ rank }) => rank > podiumSize)
            const headingId = `tier-${tier.letter.toLowerCase()}`

            return (
              <section
                aria-labelledby={headingId}
                className="wing-tier"
                key={`${tier.letter}-${tier.entries[0].rank}`}
              >
                <header className="wing-tier__head">
                  <h2 className="wing-tier__letter" id={headingId}>
                    <span className="visually-hidden">Grade </span>
                    {tier.letter}
                  </h2>
                  <p className="wing-tier__count">
                    {tier.entries.length === 1
                      ? '1 wing'
                      : `${tier.entries.length} wings`}
                  </p>
                </header>
                <div className="wing-tier__body">
                  {tops.length ? (
                    <ol className="wing-tops" role="list">
                      {tops.map((entry) => (
                        <WingTop
                          entry={entry}
                          key={entry.wing._id}
                          priority={entry.rank === priorityRank}
                        />
                      ))}
                    </ol>
                  ) : null}
                  {lines.length ? (
                    <ol
                      className="wing-lines"
                      role="list"
                      start={lines[0].rank}
                    >
                      {lines.map((entry) => (
                        <WingLine entry={entry} key={entry.wing._id} />
                      ))}
                    </ol>
                  ) : null}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {nonBuffalo.map(({ wing }, index) => (
        <p
          className="wings-footnote"
          id={index === 0 ? footnoteId : undefined}
          key={wing._id}
        >
          <b aria-hidden="true">*</b>
          <span>
            {wing.location.name} had no buffalo on the menu, so its best wing
            holds the spot. Its other wings live on{' '}
            <Link params={{ slug: wing.slug }} to="/wings/$slug">
              its own page
            </Link>
            .
          </span>
        </p>
      ))}
    </div>
  )
}

function WingTop({
  entry: { wing, rank },
  priority,
}: {
  entry: MainListEntry
  priority: boolean
}) {
  return (
    <li className={rank === 1 ? 'wing-top wing-top--first' : 'wing-top'}>
      <article>
        {wing.heroImage?.asset ? (
          <ContentImage
            image={wing.heroImage}
            priority={priority}
            sizes={`(min-width: 42rem) 33vw, ${rank === 1 ? 100 : 50}vw`}
          />
        ) : (
          <div className="wing-top__placeholder">No photo yet</div>
        )}
        <div className="wing-top__body">
          <span aria-hidden="true" className="wing-top__rank">
            {rank === 1 ? <Crown /> : rank}
          </span>
          <WingGrade className="wing-top__grade" wing={wing} />
          <h3>
            <WingLink wing={wing} />
          </h3>
          <WingType className="wing-top__wing" wing={wing} />
          <p className="wing-top__meta">
            {formatVisits(wing.location.visitCount)} ·{' '}
            <time dateTime={wing.visitedAt}>{formatDate(wing.visitedAt)}</time>
          </p>
        </div>
      </article>
    </li>
  )
}

function WingLine({ entry: { wing, rank } }: { entry: MainListEntry }) {
  return (
    <li className="wing-line">
      <span aria-hidden="true" className="wing-line__rank">
        {rank}
      </span>
      <div className="wing-line__name">
        <h3>
          <WingLink wing={wing} />
        </h3>
        <WingType className="wing-line__wing" wing={wing} />
      </div>
      <span className="wing-line__leader" />
      <WingGrade className="wing-line__grade" wing={wing} />
    </li>
  )
}

function WingLink({ wing }: { wing: WingReview }) {
  return (
    <Link
      className="wing-stretch"
      params={{ slug: wing.slug }}
      to="/wings/$slug"
    >
      {wing.location.name}
    </Link>
  )
}

function WingType({
  className,
  wing,
}: {
  className: string
  wing: WingReview
}) {
  return (
    <p className={className}>
      {wingName(wing)}
      {wing.mainListRole === 'bestNonBuffalo' ? (
        <a
          aria-label="Not buffalo, see footnote"
          className="wing-asterisk"
          href={`#${footnoteId}`}
        >
          *
        </a>
      ) : null}
    </p>
  )
}

function WingGrade({
  className,
  wing,
}: {
  className: string
  wing: WingReview
}) {
  return (
    <span className={className}>
      <span className="visually-hidden">Grade: </span>
      {tierLetter(wing)}
      <span className="wing-grade__mod">{wing.grade?.slice(1)}</span>
    </span>
  )
}

function Crown() {
  return (
    <svg
      aria-hidden="true"
      className="wing-crown"
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
