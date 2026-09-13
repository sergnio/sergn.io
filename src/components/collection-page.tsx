import type { CollectionName, ContentDocument } from '#/lib/content-types'
import { cardImage, ContentCard } from './content-card'

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
  // The topmost card that actually has an image is what this page paints its
  // Largest Contentful Paint with. Left lazy it cannot start loading until
  // layout runs, which measurably delays LCP on every collection index.
  const priorityIndex = documents.findIndex((document) =>
    Boolean(cardImage(document)),
  )

  return (
    <div className="page-shell collection-page">
      <header className="page-intro">
        <p className="eyebrow">Field notes</p>
        <h1>{title}</h1>
      </header>
      {documents.length > 0 ? (
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
      ) : (
        <p className="empty-state">
          Nothing published here yet. Check back soon.
        </p>
      )}
    </div>
  )
}
