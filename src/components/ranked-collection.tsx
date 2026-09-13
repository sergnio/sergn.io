import { Link } from '@tanstack/react-router'
import { cardDate, cardImage, cardRating, cardSummary } from '#/lib/card-fields'
import type { CollectionName, ContentDocument } from '#/lib/content-types'
import { formatDate } from '#/lib/formatters'
import { ContentCard } from './content-card'

/**
 * How many entries lead a ranking as full cards. The rest render as rows, so
 * a long collection stays scannable and the best few still get a photo.
 */
const podiumSize = 3

type RankedCollectionProps = {
  collection: CollectionName
  documents: ContentDocument[]
  title: string
}

type RankedEntryProps = {
  collection: CollectionName
  document: ContentDocument
  rank: number
}

/**
 * A ranking is one ordered list, not a podium list plus a runners-up list:
 * the numbering has to continue across the two shapes, and assistive
 * technology has to hear one sequence, so both render as items of the same
 * <ol> and the layout alone tells them apart.
 */
export function RankedCollection({
  collection,
  documents,
  title,
}: RankedCollectionProps) {
  // Only a podium card paints an image, so the LCP candidate is the topmost
  // one of those that has one - never a row further down the page.
  const priorityIndex = documents
    .slice(0, podiumSize)
    .findIndex((document) => Boolean(cardImage(document)))

  // `list-style: none` makes Safari drop list semantics, and the rank badges
  // are decorative, so the position would go with it without an explicit role.
  return (
    <ol
      aria-label={`${title}, ranked best to worst`}
      className="ranked-list"
      role="list"
    >
      {documents.map((document, index) => (
        <li
          className={
            index < podiumSize ? 'ranked-list__podium' : 'ranked-list__row'
          }
          key={document._id}
        >
          {index < podiumSize ? (
            <ContentCard
              collection={collection}
              document={document}
              headingLevel={2}
              priority={index === priorityIndex}
              rank={index + 1}
            />
          ) : (
            <RankedRow
              collection={collection}
              document={document}
              rank={index + 1}
            />
          )}
        </li>
      ))}
    </ol>
  )
}

function RankedRow({ collection, document, rank }: RankedEntryProps) {
  const date = cardDate(document)
  const rating = cardRating(document)
  const summary = cardSummary(document)

  return (
    <article className="ranked-row">
      <p aria-hidden="true" className="ranked-row__rank">
        #{rank}
      </p>
      <div className="ranked-row__body">
        <h2>
          <Link params={{ slug: document.slug }} to={`/${collection}/$slug`}>
            {document.title}
          </Link>
        </h2>
        {summary ? <p>{summary}</p> : null}
      </div>
      <div className="ranked-row__meta">
        {rating ? (
          <span className="content-card__rating">
            <span className="visually-hidden">Rating: </span>
            {rating}
          </span>
        ) : null}
        {date ? <time dateTime={date}>{formatDate(date)}</time> : null}
      </div>
    </article>
  )
}
