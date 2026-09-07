import type { CollectionName, ContentDocument } from '#/lib/content-types'
import { ContentCard } from './content-card'

type CollectionPageProps = {
  collection: CollectionName
  description: string
  documents: ContentDocument[]
  title: string
}

export function CollectionPage({
  collection,
  description,
  documents,
  title,
}: CollectionPageProps) {
  return (
    <div className="page-shell collection-page">
      <header className="page-intro">
        <p className="eyebrow">Field notes</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {documents.length > 0 ? (
        <div className="card-grid">
          {documents.map((document) => (
            <ContentCard
              collection={collection}
              document={document}
              key={document._id}
            />
          ))}
        </div>
      ) : (
        <p className="empty-state">
          Nothing published here yet. Check back soon.
        </p>
      )}
    </div>
  )
}
