import type { CollectionName } from './content-types'

/**
 * How many documents each home page section shows. The blog section is a row of
 * cards; the four highlight sections show a single card each.
 */
export const homeSectionSizes: Record<CollectionName, number> = {
  coffee: 1,
  wings: 1,
  'na-beers': 1,
  reubens: 1,
  blog: 3,
}

/**
 * Picks what a home page section shows: documents the author marked
 * "Feature on home page" come first, then the newest of the rest fills the
 * remaining slots. Callers pass collections already ordered newest-first, so
 * featured documents stay newest-first among themselves.
 */
export function selectForHome<T extends { featured?: boolean }>(
  documents: T[],
  count: number,
): T[] {
  if (count <= 0) return []

  return [
    ...documents.filter((document) => document.featured),
    ...documents.filter((document) => !document.featured),
  ].slice(0, count)
}
