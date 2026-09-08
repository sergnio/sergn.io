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
