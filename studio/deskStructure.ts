import type { StructureResolver } from 'sanity/structure'

const contentTypes = [
  { type: 'coffee', title: 'Coffee' },
  { type: 'wingReview', title: 'Wing reviews' },
  { type: 'naBeer', title: 'N/A beers' },
  { type: 'reubenReview', title: 'Reuben reviews' },
  { type: 'post', title: 'Blog posts' },
] as const

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('sergn.io')
    .items(
      contentTypes.map((content) =>
        S.listItem()
          .title(content.title)
          .child(S.documentTypeList(content.type).title(content.title)),
      ),
    )
