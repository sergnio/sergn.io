import type { CollectionName, ContentDocument } from './content-types'
import { isRankedCollection } from './content-types'

/** How many entries lead a ranking as full cards; the rest render as rows. */
export const podiumSize = 3

export function splitByRecommendation(
  collection: CollectionName,
  documents: ContentDocument[],
) {
  if (!isRankedCollection(collection)) {
    return { recommended: documents, notRecommended: [] }
  }
  return {
    recommended: documents.filter(
      (document) => document.recommendationStatus !== 'notRecommended',
    ),
    notRecommended: documents.filter(
      (document) => document.recommendationStatus === 'notRecommended',
    ),
  }
}

/** The entries a collection page shows as cards with a photo, top first. */
export function documentsWithPhotoCards(
  collection: CollectionName,
  documents: ContentDocument[],
) {
  const { recommended, notRecommended } = splitByRecommendation(
    collection,
    documents,
  )
  return isRankedCollection(collection)
    ? [...recommended.slice(0, podiumSize), ...notRecommended]
    : recommended
}
