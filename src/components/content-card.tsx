import type { CollectionName, ContentDocument } from '#/lib/content-types'
import { formatDate, formatRating } from '#/lib/formatters'
import { ContentImage } from './content-image'

type ContentCardProps = {
  collection: CollectionName
  document: ContentDocument
  /** Heading level for the card title, so cards never skip a level in the
      page outline: h2 under a page h1, h3 under a section h2. */
  headingLevel?: 2 | 3
  /** Set on the one card whose image a page paints its LCP with. */
  priority?: boolean
}

const labels: Record<CollectionName, string> = {
  coffee: 'Coffee',
  wings: 'Wings',
  'na-beers': 'N/A Beer',
  reubens: 'Reuben',
  blog: 'From the blog',
}

function cardSummary(document: ContentDocument) {
  if (document._type === 'coffee') return document.roaster ?? document.origin
  if (document._type === 'wingReview') return document.venue
  if (document._type === 'naBeer') return document.brewery
  if (document._type === 'reubenReview') return document.restaurant
  return document.excerpt
}

/**
 * A card's image is the only thing on it big enough to be an LCP candidate,
 * and not every document has one, so callers deciding which card to
 * prioritise have to ask this rather than assume the first card.
 */
export function cardImage(document: ContentDocument) {
  return document._type === 'post' ? document.coverImage : document.heroImage
}

function cardDate(document: ContentDocument) {
  if (document._type === 'wingReview' || document._type === 'reubenReview') {
    return document.visitedAt
  }
  return document.publishedAt
}

function cardRating(document: ContentDocument) {
  if ('rating' in document) return formatRating(document.rating)
  return undefined
}

export function ContentCard({
  collection,
  document,
  headingLevel = 3,
  priority = false,
}: ContentCardProps) {
  const Heading = `h${headingLevel}` as const
  const date = cardDate(document)
  const rating = cardRating(document)

  return (
    <article className="content-card">
      <a
        aria-hidden="true"
        className="content-card__image-link"
        href={`/${collection}/${document.slug}`}
        tabIndex={-1}
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
      </a>
      <div className="content-card__body">
        <p className="eyebrow">{labels[collection]}</p>
        <Heading>
          <a href={`/${collection}/${document.slug}`}>{document.title}</a>
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
