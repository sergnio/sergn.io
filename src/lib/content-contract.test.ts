import { describe, expect, it } from 'vitest'
import { assertValidCollection, assertValidDocument } from './content-contract'
import { collectionNames } from './content-types'
import { getFixtureCollection } from './fixtures'

const validCoffee = {
  _id: 'coffee-1',
  _type: 'coffee',
  title: 'A coffee',
  slug: 'a-coffee',
  boughtFrom: 'A roaster',
  bagSize: { amount: 250, unit: 'g' },
  brewRecipes: [{ _key: 'a', method: 'Filter' }],
}

describe('content contract', () => {
  it('accepts an empty collection, which is what an empty dataset returns', () => {
    for (const collection of collectionNames) {
      expect(assertValidCollection(collection, [])).toEqual([])
    }
  })

  it('accepts every fixture document, so the fixtures stay honest about the shape real content must have', () => {
    for (const collection of collectionNames) {
      const documents: unknown[] = [...getFixtureCollection(collection)]
      expect(() => assertValidCollection(collection, documents)).not.toThrow()
    }
  })

  it('names the collection, slug, id and field when a required field is missing', () => {
    expect(() =>
      assertValidCollection('coffee', [{ ...validCoffee, bagSize: undefined }]),
    ).toThrow(/coffee document "a-coffee" \(coffee-1\).*"bagSize\.amount"/s)
  })

  it('treats blank strings and empty lists as missing, not as content', () => {
    expect(() =>
      assertValidCollection('coffee', [{ ...validCoffee, boughtFrom: '  ' }]),
    ).toThrow(/"boughtFrom"/)
    expect(() =>
      assertValidCollection('coffee', [{ ...validCoffee, brewRecipes: [] }]),
    ).toThrow(/"brewRecipes"/)
  })

  it('reports every violation at once rather than only the first', () => {
    try {
      assertValidCollection('blog', [
        { _id: 'post-1', _type: 'post', title: 'A post', slug: 'a-post' },
      ])
      expect.unreachable('expected the contract to fail')
    } catch (error) {
      expect((error as Error).message).toMatch(/"excerpt"/)
      expect((error as Error).message).toMatch(/"body"/)
    }
  })

  it('rejects slugs that would not survive being used as a URL segment', () => {
    for (const slug of ['Not Lowercase', 'has/slash', 'trailing-', 'a--b']) {
      expect(() =>
        assertValidCollection('coffee', [{ ...validCoffee, slug }]),
      ).toThrow(/not URL safe/)
    }
  })

  it('rejects two documents competing for the same published URL', () => {
    expect(() =>
      assertValidCollection('coffee', [
        validCoffee,
        { ...validCoffee, _id: 'coffee-2' },
      ]),
    ).toThrow(/more than one document with the slug "a-coffee"/)
  })

  it('rejects an image without alt text, wherever it is nested', () => {
    expect(() =>
      assertValidCollection('coffee', [
        { ...validCoffee, heroImage: { asset: { _id: 'image-1' } } },
      ]),
    ).toThrow(/image without alt text at "heroImage"/)

    expect(() =>
      assertValidCollection('coffee', [
        {
          ...validCoffee,
          gallery: [
            { alt: 'Fine', asset: { _id: 'image-1' } },
            { asset: { _id: 'image-2' } },
          ],
        },
      ]),
    ).toThrow(/image without alt text at "gallery\[1\]"/)

    expect(() =>
      assertValidCollection('coffee', [
        {
          ...validCoffee,
          notes: [{ _key: 'a', _type: 'imageWithAlt', alt: '' }],
        },
      ]),
    ).toThrow(/image without alt text at "notes\[0\]"/)
  })

  it('validates single documents too, and passes a missing one through untouched', () => {
    expect(assertValidDocument('coffee', undefined)).toBeUndefined()
    expect(assertValidDocument('coffee', validCoffee)).toBe(validCoffee)
    expect(() =>
      assertValidDocument('wings', { ...validCoffee, _type: 'wingReview' }),
    ).toThrow(/"venue"/)
  })
})
