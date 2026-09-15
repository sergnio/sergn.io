import { Link } from '@tanstack/react-router'
import { cardDate, cardImage, cardRating, cardSummary } from '#/lib/card-fields'
import type { CollectionName, ContentDocument } from '#/lib/content-types'
import { formatDate } from '#/lib/formatters'
import { ContentImage } from './content-image'

type ContentCardProps = {
  collection: CollectionName
  document: ContentDocument
  /** Heading level for the card title, so cards never skip a level in the
      page outline: h2 under a page h1, h3 under a section h2. */
  headingLevel?: 2 | 3
  /** Set on the one card whose image a page paints its LCP with. */
  priority?: boolean
  /** Place in a ranked collection, printed as a badge. Unset off a ranking. */
  rank?: number
}

const labels: Record<CollectionName, string> = {
  coffee: 'Coffee',
  wings: 'Wings',
  'na-beers': 'N/A Beer',
  reubens: 'Reuben',
  syrup: 'Maple Syrup',
  blog: 'From the blog',
}

export function ContentCard({
  collection,
  document,
  headingLevel = 3,
  priority = false,
  rank,
}: ContentCardProps) {
  const Heading = `h${headingLevel}` as const
  const date = cardDate(document)
  const rating = cardRating(document)

  return (
    <article className="content-card">
      {rank === undefined ? null : (
        // The ordered list around a ranking already carries the position for
        // assistive technology, so the badge is the sighted reader's copy of
        // it rather than a second announcement of the same number.
        <p
          aria-hidden="true"
          className={`content-card__rank${rank === 1 ? ' content-card__rank--first' : ''}`}
        >
          #{rank}
        </p>
      )}
      <Link
        aria-hidden="true"
        className="content-card__image-link"
        params={{ slug: document.slug }}
        tabIndex={-1}
        to={`/${collection}/$slug`}
      >
        <ContentImage
          image={cardImage(document)}
          priority={priority}
          sizes="(min-width: 720px) 33vw, 100vw"
        />
        {!cardImage(document) ? (
          <div aria-hidden="true" className="content-card__placeholder">
            {labels[collection]}
          </div>
        ) : null}
      </Link>
      <div className="content-card__body">
        <p className="eyebrow">
          {document.recommendationStatus === 'notRecommended'
            ? 'Not recommended by Sergio'
            : labels[collection]}
        </p>
        <Heading>
          <Link params={{ slug: document.slug }} to={`/${collection}/$slug`}>
            {document.title}
          </Link>
        </Heading>
        {cardSummary(document) ? <p>{cardSummary(document)}</p> : null}
        <div className="content-card__meta">
          {rating ? (
            <span className="content-card__rating">
              <span className="visually-hidden">Rating: </span>
              {rating}
            </span>
          ) : null}
          {date ? <time dateTime={date}>{formatDate(date)}</time> : null}
        </div>
      </div>
    </article>
  )
}
