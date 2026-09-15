import { evaluate, parse } from 'groq-js'
import { describe, expect, it } from 'vitest'
import type { CollectionName } from '../content-types'
import { rankedCollections } from '../content-types'
import { collectionQuery, documentQuery } from './queries'

/** Runs a query the way the dataset does, so a sort key is read, not matched. */
async function run(query: string, dataset: unknown[], type: string) {
  const result = await evaluate(parse(query), { dataset, params: { type } })
  return ((await result.get()) as Array<{ _id: string }>).map(
    (document) => document._id,
  )
}

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
  // wrong order - so the query is run against a dataset rather than eyeballed.
  const sanityTypes: Record<string, string> = {
    coffee: 'coffee',
    wings: 'wingReview',
    'na-beers': 'naBeer',
    reubens: 'reubenReview',
    syrup: 'syrupReview',
  }

  const entry = (
    _id: string,
    fields: {
      orderRank?: string
      publishedAt?: string
      recommendationStatus?: string
    },
    type: string,
  ) => ({ _id, _type: type, slug: { current: _id }, ...fields })

  it.each(rankedCollections)(
    'puts the %s ranking first, in rank order, and dates the rest',
    async (collection) => {
      const type = sanityTypes[collection]
      const dataset = [
        entry(
          'older-reject',
          {
            publishedAt: '2025-01-01',
            recommendationStatus: 'notRecommended',
          },
          type,
        ),
        entry('second', { orderRank: '0|200000:' }, type),
        entry(
          'newer-reject',
          {
            publishedAt: '2025-06-01',
            recommendationStatus: 'notRecommended',
          },
          type,
        ),
        entry(
          'first',
          {
            orderRank: '0|100000:',
            recommendationStatus: 'recommended',
          },
          type,
        ),
      ]

      expect(await run(collectionQuery(collection), dataset, type)).toEqual([
        'first',
        'second',
        'newer-reject',
        'older-reject',
      ])
    },
  )

  it('fetches the rank and rating each ranked page prints', () => {
    for (const collection of rankedCollections) {
      for (const shape of [
        collectionQuery(collection),
        documentQuery(collection),
      ]) {
        expect(shape).toMatch(/\borderRank\b/)
        expect(shape).toMatch(/\brating\b/)
        expect(shape).toMatch(/\brecommendationStatus\b/)
      }
    }
  })

  it('leaves the blog newest first, because a post is not ranked', () => {
    const query = collectionQuery('blog')

    expect(query).toContain('order(coalesce(publishedAt, _createdAt) desc)')
    expect(query).not.toContain('orderRank')
  })
})
