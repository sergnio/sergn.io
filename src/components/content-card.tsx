import type { CollectionName, ContentDocument } from '#/lib/content-types'
import { formatDate, formatRating } from '#/lib/formatters'
import { ContentImage } from './content-image'

type ContentCardProps = {
  collection: CollectionName
  document: ContentDocument
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

function cardImage(document: ContentDocument) {
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

export function ContentCard({ collection, document }: ContentCardProps) {
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
        <h3>
          <a href={`/${collection}/${document.slug}`}>{document.title}</a>
        </h3>
        {cardSummary(document) ? <p>{cardSummary(document)}</p> : null}
        <div className="content-card__meta">
          {cardRating(document) ? <span>{cardRating(document)}</span> : null}
          {cardDate(document) ? (
            <time>{formatDate(cardDate(document))}</time>
          ) : null}
        </div>
      </div>
    </article>
  )
}
