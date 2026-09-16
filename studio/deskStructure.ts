import type { StructureResolver } from 'sanity/structure'

/**
 * Every collection but the blog publishes as a ranking, so its list is the
 * drag-and-drop one: the order the editor sees here is the order the site
 * renders, best first. The blog stays a plain list ordered by date.
 *
 * Only recommendations are ranked, so each type splits into the orderable list
 * and a plain list of what Sergio does not recommend. The orderable plugin
 * already scopes its query to `_type == $type`, so these filters add only the
 * status clause; a document written before the field existed has no status and
 * stays in the ranking.
 */
const rankedTypes = [
  { type: 'coffee', title: 'Coffee' },
  { type: 'wingReview', title: 'Wing reviews' },
  { type: 'naBeer', title: 'N/A beers' },
  { type: 'reubenReview', title: 'Reuben reviews' },
  { type: 'syrupReview', title: 'Syrup reviews' },
] as const

export const deskStructure: StructureResolver = async (S, context) => {
  // Loaded here rather than at module scope: the plugin pulls in CommonJS
  // `lexorank`, which Sanity's schema extractor cannot evaluate.
  const { orderableDocumentListDeskItem } =
    await import('@sanity/orderable-document-list')

  return S.list()
    .title('sergn.io')
    .items([
      ...rankedTypes.map((ranked) =>
        orderableDocumentListDeskItem({
          type: ranked.type,
          title: `${ranked.title} - Recommended`,
          filter: 'recommendationStatus != "notRecommended"',
          S,
          context,
        }),
      ),
      ...rankedTypes.map((ranked) =>
        S.listItem()
          .title(`${ranked.title} - Not recommended`)
          .child(
            S.documentList()
              .title(`${ranked.title} - Not recommended`)
              .filter(
                '_type == $type && recommendationStatus == "notRecommended"',
              )
              .params({ type: ranked.type }),
          ),
      ),
      S.listItem()
        .title('Blog posts')
        .child(S.documentTypeList('post').title('Blog posts')),
    ])
}
