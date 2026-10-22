import { describe, expect, it } from 'vitest'
import { sanityTypes } from '../src/lib/sanity/queries'
import { collectionPathsByType, redirectRules } from './redirect-rules.mjs'

const wing = (slug, previousSlugs) => ({
  _type: 'wingReview',
  slug,
  previousSlugs,
})

describe('slug redirects', () => {
  it('publishes every type under the path the site serves it from', () => {
    expect(
      Object.fromEntries(
        Object.entries(collectionPathsByType).map(([type, path]) => [
          path,
          type,
        ]),
      ),
    ).toEqual(sanityTypes)
  })

  it('sends each previous slug to the current one', () => {
    expect(
      redirectRules([
        wing('runyons-buffalo', ['runyons-buffalo-wings', 'runyons']),
        wing('wingstop'),
        { _type: 'post', slug: 'hello', previousSlugs: ['hi'] },
      ]),
    ).toEqual([
      '/wings/runyons-buffalo-wings /wings/runyons-buffalo 301',
      '/wings/runyons /wings/runyons-buffalo 301',
      '/blog/hi /blog/hello 301',
    ])
  })

  it('lets a live page win over a previous slug that points elsewhere', () => {
    expect(
      redirectRules([wing('hilltop', ['wingstop']), wing('wingstop')]),
    ).toEqual([])
  })

  it('keeps the same slug apart across collections', () => {
    expect(
      redirectRules([
        wing('hilltop', ['classic']),
        { _type: 'coffee', slug: 'house', previousSlugs: ['classic'] },
      ]),
    ).toEqual([
      '/wings/classic /wings/hilltop 301',
      '/coffee/classic /coffee/house 301',
    ])
  })

  it('fails when two documents claim the same previous slug', () => {
    expect(() =>
      redirectRules([wing('hilltop', ['classic']), wing('nook', ['classic'])]),
    ).toThrow('/wings/classic is a previous slug of two documents')
  })
})
