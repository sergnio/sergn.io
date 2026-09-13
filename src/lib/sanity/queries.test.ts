import { describe, expect, it } from 'vitest'
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

  it('dereferences image assets from where imageWithAlt nests them', () => {
    // Projecting `asset->` from the top level returns null for every image,
    // which renders a figure with no img inside it.
    for (const collection of ['coffee', 'wings', 'na-beers', 'blog'] as const) {
      const query = collectionQuery(collection)

      expect(query).toContain('"asset": image.asset->')
      expect(query).toContain('"crop": image.crop')
      expect(query).toContain('"hotspot": image.hotspot')
      expect(query).not.toMatch(/(?<!image\.)\basset->/)
    }
  })

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
})
