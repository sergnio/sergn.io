import { cardImage } from '#/lib/card-fields'
import type { CollectionName, ContentDocument } from '#/lib/content-types'
import { isRankedCollection } from '#/lib/content-types'
import { ContentCard } from './content-card'
import { RankedCollection } from './ranked-collection'

type CollectionPageProps = {
  collection: CollectionName
  documents: ContentDocument[]
  title: string
}

export function CollectionPage({
  collection,
  documents,
  title,
}: CollectionPageProps) {
  const ranked = isRankedCollection(collection)

  // The topmost card that actually has an image is what this page paints its
  // Largest Contentful Paint with. Left lazy it cannot start loading until
  // layout runs, which measurably delays LCP on every collection index.
  const priorityIndex = documents.findIndex((document) =>
    Boolean(cardImage(document)),
  )

  return (
    <div className="page-shell collection-page">
      <header className="page-intro">
        <p className="eyebrow">{ranked ? 'Ranked' : 'Field notes'}</p>
        <h1>{title}</h1>
      </header>
      {documents.length === 0 ? (
        <p className="empty-state">
          Nothing published here yet. Check back soon.
        </p>
      ) : ranked ? (
        <RankedCollection
          collection={collection}
          documents={documents}
          title={title}
        />
      ) : (
        <ul aria-label={title} className="card-grid">
          {documents.map((document, index) => (
            <li key={document._id}>
              <ContentCard
                collection={collection}
                document={document}
                headingLevel={2}
                priority={index === priorityIndex}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
