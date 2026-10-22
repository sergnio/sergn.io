/** The URL segment each Sanity document type is published under. */
export const collectionPathsByType = {
  coffee: 'coffee',
  wingReview: 'wings',
  naBeer: 'na-beers',
  reubenReview: 'reubens',
  syrupReview: 'syrup',
  post: 'blog',
}

/**
 * Netlify `_redirects` lines sending every slug a document has outgrown to
 * the URL it lives at now. A previous slug that is live again is skipped, so
 * the page wins; one claimed by two documents fails the build.
 */
export function redirectRules(documents) {
  const pathOf = (document, slug) =>
    `/${collectionPathsByType[document._type]}/${slug}`
  const livePaths = new Set(
    documents.map((document) => pathOf(document, document.slug)),
  )
  const targets = new Map()

  for (const document of documents) {
    for (const previousSlug of document.previousSlugs ?? []) {
      const from = pathOf(document, previousSlug)
      if (livePaths.has(from)) continue
      if (targets.has(from)) {
        throw new Error(
          `${from} is a previous slug of two documents; keep it on one so the redirect has a single target.`,
        )
      }
      targets.set(from, pathOf(document, document.slug))
    }
  }

  return [...targets].map(([from, to]) => `${from} ${to} 301`)
}
