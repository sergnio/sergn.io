import { describe, expect, it } from 'vitest'
import type { CollectionName } from '../content-types'
import { rankedCollections } from '../content-types'
import { collectionQuery, documentQuery } from './queries'

describe('published content queries', () => {
  it('projects all public image accessibility and responsive fields', () => {
    const query = collectionQuery('coffee')

    expect(query).toContain('alt')
    expect(query).toContain('crop')
    expect(query).toContain('hotspot')
    expect(query).toContain(
      'metadata {dimensions {width, height, aspectRatio}}',
    )
  })

  // Every collection renders one top-level image, and imageWithAlt nests the
  // upload under `image`. Projecting `asset->` from the top level returns null
  // for all of them, which renders a figure with no img inside it. These
  // assertions name the field so richTextProjection, which already
  // dereferences correctly, cannot satisfy them on the top level's behalf.
  const topLevelImageField = {
    coffee: 'heroImage',
    wings: 'heroImage',
    'na-beers': 'heroImage',
    blog: 'coverImage',
  } as const

  for (const [collection, field] of Object.entries(topLevelImageField)) {
    it(`dereferences the ${collection} ${field} asset from image.asset`, () => {
      for (const query of [
        collectionQuery(collection as CollectionName),
        documentQuery(collection as CollectionName),
      ]) {
        const projection = query.match(
          new RegExp(`\\b${field} \\{[^}]*\\}`, 's'),
        )?.[0]

        expect(projection).toBeDefined()
        expect(projection).toContain('"crop": image.crop')
        expect(projection).toContain('"hotspot": image.hotspot')
        expect(projection).toContain('"asset": image.asset->')
        expect(projection).not.toMatch(/(?<!image\.)\basset->/)
      }
    })
  }

  it('queries documents by their stored slug and document type', () => {
    const query = documentQuery('blog')

    expect(query).toContain('_type == $type')
    expect(query).toContain('slug.current == $slug')
    expect(query).toContain('excerpt')
    expect(query).toContain('coverImage')
  })

  it('sorts only documents with a defined public slug', () => {
    expect(collectionQuery('wings')).toContain('defined(slug.current)')
  })

  // The rank is what "best to worst" means on these pages. Sorting by date
  // instead would still render a full, plausible-looking list - just in the
  // wrong order - so the sort key is asserted rather than eyeballed.
  it.each(rankedCollections)(
    'orders the %s ranking by rank, and fetches the rank to print it',
    (collection) => {
      const query = collectionQuery(collection)

      expect(query).toContain('| order(orderRank asc)')
      expect(query).not.toContain('publishedAt, _createdAt) desc')
      for (const shape of [query, documentQuery(collection)]) {
        expect(shape).toMatch(/\borderRank\b/)
        expect(shape).toMatch(/\brating\b/)
      }
    },
  )

  it('leaves the blog newest first, because a post is not ranked', () => {
    const query = collectionQuery('blog')

    expect(query).toContain('order(coalesce(publishedAt, _createdAt) desc)')
    expect(query).not.toContain('orderRank')
  })
})
