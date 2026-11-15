import { Link } from '@tanstack/react-router'
import type { WingReview } from '#/lib/content-types'
import { isGrade } from '#/lib/content-types'
import { formatDate, formatVisits } from '#/lib/formatters'
import { imageSizes, wingThumbnail } from '#/lib/page-images'
import type { WingPageData, WingStanding } from '#/lib/wings'
import { wingName } from '#/lib/wings'
import { ImageFigure } from './content-image'
import { NoPhoto } from './no-photo'
import { RichText } from './rich-text'
import { WingCrown } from './wing-crown'

const footnoteId = 'wing-footnote'

/** One wing, per the agreed mockup for #96 (wing-combined.html). */
export function WingDetail({ wing, rank, listLength, siblings }: WingPageData) {
  const place = wing.location
  const name = wingName(wing) || wing.title
  const isAsterisked = wing.mainListRole === 'bestNonBuffalo' && rank

  return (
    <div className="page-shell wing-detail">
      <nav aria-label="Breadcrumb">
        <ol className="wing-crumbs">
          <li>
            <Link activeOptions={{ exact: true }} to="/wings">
              Wings
            </Link>
          </li>
          <li>{place.name}</li>
          <li aria-current="page">{name}</li>
        </ol>
      </nav>
      <article className="wing-hero">
        {wing.heroImage?.asset ? (
          <ImageFigure
            className="wing-hero__photo"
            image={wing.heroImage}
            priority
            sizes={imageSizes.wingHero}
          />
        ) : (
          <NoPhoto className="wing-ph--hero" />
        )}
        <div className="wing-hero__text">
          <h1>{name}</h1>
          <p className="wing-hero__at">
            at <span className="wing-hero__place">{place.name}</span>,{' '}
            <PlaceAddress address={place.address} city={place.city} />
          </p>
          {wing.recommendationStatus === 'notRecommended' ? (
            <p className="detail-callout">Sergio does not recommend this.</p>
          ) : null}
          <WingFacts
            isAsterisked={Boolean(isAsterisked)}
            listLength={listLength}
            rank={rank}
            wing={wing}
          />
          {wing.notes?.length ? (
            <div className="wing-hero__notes">
              <RichText value={wing.notes} />
            </div>
          ) : null}
          {isAsterisked ? (
            <p className="wing-hero__footnote" id={footnoteId}>
              <b aria-hidden="true">*</b> No buffalo at {place.name}, so this
              wing holds its spot on the list.
            </p>
          ) : null}
        </div>
      </article>

      {siblings.length ? (
        <section aria-labelledby="also-tried" className="wing-also">
          <h2 id="also-tried">Also tried at {place.name}</h2>
          <ul className="wing-sibs" role="list">
            {siblings.map((sibling) => (
              <WingSibling key={sibling.wing._id} {...sibling} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function WingFacts({
  wing,
  rank,
  listLength,
  isAsterisked,
}: {
  wing: WingReview
  rank?: number
  listLength: number
  isAsterisked: boolean
}) {
  const grade = isGrade(wing.grade) ? wing.grade : undefined
  const visitCount = wing.location.visitCount
  const hasStats = Boolean(visitCount || rank)
  if (!grade && !hasStats && !wing.visitedAt) return null

  return (
    <div className="wing-facts">
      {grade ? (
        <div
          aria-label={
            rank === 1 ? `Grade ${grade}, the crown pick` : `Grade ${grade}`
          }
          className="wing-stamp"
          role="img"
        >
          {rank === 1 ? <WingCrown /> : <b>{grade}</b>}
        </div>
      ) : null}
      {hasStats ? (
        <p className="wing-facts__stats">
          {visitCount ? <span>{formatVisits(visitCount)}</span> : null}
          {rank ? (
            <span>
              #{rank} of {listLength}
              {isAsterisked ? (
                <a
                  aria-label="Not buffalo, see note"
                  className="wing-facts__asterisk"
                  href={`#${footnoteId}`}
                >
                  *
                </a>
              ) : null}
            </span>
          ) : null}
        </p>
      ) : null}
      {wing.visitedAt ? (
        <p className="wing-facts__last">
          Last visit{' '}
          <time dateTime={wing.visitedAt}>{formatDate(wing.visitedAt)}</time>
        </p>
      ) : null}
    </div>
  )
}

function WingSibling({ wing, rank }: WingStanding) {
  const grade = isGrade(wing.grade) ? wing.grade : undefined
  const { src: thumbnail } = wingThumbnail(wing.heroImage)

  return (
    <li className="wing-sib">
      {thumbnail ? (
        <img
          alt=""
          decoding="async"
          height={60}
          loading="lazy"
          src={thumbnail}
          width={60}
        />
      ) : (
        <NoPhoto className="wing-ph--thumb" />
      )}
      <div>
        <h3>
          <Link
            className="wing-stretch"
            params={{ slug: wing.slug }}
            to="/wings/$slug"
          >
            {wingName(wing) || wing.title}
          </Link>
        </h3>
        <span className="wing-sib__tag">{siblingTag(wing, rank)}</span>
      </div>
      {grade ? (
        <span className="wing-sib__grade">
          <span className="visually-hidden">Grade </span>
          {grade}
        </span>
      ) : null}
    </li>
  )
}

/** Links the street address to a map search; a place without one shows only its city. */
function PlaceAddress({ address, city }: { address?: string; city: string }) {
  if (!address) return <>{city}</>
  const query = `${address}, ${city}`
  return (
    <a
      className="wing-hero__address"
      href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`}
      rel="noopener noreferrer"
      target="_blank"
    >
      {query}{' '}
      <span className="visually-hidden">(opens a map in a new tab)</span>
    </a>
  )
}

function siblingTag(wing: WingReview, rank?: number) {
  if (rank) return `#${rank} on the list`
  if (wing.recommendationStatus === 'notRecommended') return 'Not recommended'
  return 'Not buffalo'
}
