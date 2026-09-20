import { describe, expect, it } from 'vitest'
import { assertValidCollection, assertValidDocument } from './content-contract'
import { collectionNames, rankedCollections } from './content-types'
import { getFixtureCollection } from './fixtures'

const validCoffee = {
  _id: 'coffee-1',
  _type: 'coffee',
  title: 'A coffee',
  slug: 'a-coffee',
  boughtFrom: 'A roaster',
  bagSize: { amount: 250, unit: 'g' },
  brewRecipes: [{ _key: 'a', method: 'Filter' }],
  orderRank: '0|100000:',
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

  it('rejects a rich text link the renderer would refuse to publish, naming its path', () => {
    const post = (href: unknown) => ({
      _id: 'post-1',
      _type: 'post',
      title: 'A post',
      slug: 'a-post',
      excerpt: 'An excerpt',
      body: [
        {
          _key: 'p',
          _type: 'block',
          children: [{ _key: 's', _type: 'span', marks: ['l'], text: 'here' }],
          markDefs: [{ _key: 'l', _type: 'link', href }],
          style: 'normal',
        },
      ],
    })

    expect(() =>
      assertValidCollection('blog', [post('javascript:alert(1)')]),
    ).toThrow(/rich text link at "body\[0\]\.markDefs\[0\]".*javascript:/s)

    for (const href of ['//example.com', 'coffee/a-coffee', '', undefined]) {
      expect(() => assertValidCollection('blog', [post(href)])).toThrow(
        /rich text link/,
      )
    }

    for (const href of [
      '/coffee/a-coffee',
      'https://example.com',
      'mailto:hello@sergn.io',
    ]) {
      expect(() => assertValidCollection('blog', [post(href)])).not.toThrow()
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
          notes: [{ _key: 'a', _type: 'imageWithAlt', alt: '' }],
        },
      ]),
    ).toThrow(/image without alt text at "notes\[0\]"/)
  })

  it('keeps fixture post tags in the slug shape the Studio vocabulary stores', () => {
    // The Studio offers a closed tag list whose values are lowercase slugs.
    // Fixtures are source-controlled content, so capitalised strays here would
    // sit outside that vocabulary and read as valid in every fixture test.
    const tags = getFixtureCollection('blog').flatMap(
      (post) => (post as { tags?: string[] }).tags ?? [],
    )

    expect(tags.length).toBeGreaterThan(0)
    for (const tag of tags) {
      expect(tag).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
  })

  it('rejects an entry with no place in a ranking, and names the list that gives it one', () => {
    for (const collection of rankedCollections) {
      expect(() =>
        assertValidCollection(collection, [
          { ...validCoffee, orderRank: undefined },
        ]),
      ).toThrow(
        new RegExp(
          `has no rank, so it cannot be placed in the ${collection} ranking`,
        ),
      )
    }
  })

  it('lets the blog through without a rank, because it is not a ranking', () => {
    expect(() =>
      assertValidCollection('blog', [
        {
          _id: 'post-1',
          _type: 'post',
          title: 'A post',
          slug: 'a-post',
          excerpt: 'An excerpt',
          body: [{ _key: 'a', _type: 'block', children: [] }],
        },
      ]),
    ).not.toThrow()
  })

  it('rejects two entries sharing a rank, which would leave their order undecided', () => {
    expect(() =>
      assertValidCollection('coffee', [
        validCoffee,
        { ...validCoffee, _id: 'coffee-2', slug: 'b-coffee' },
      ]),
    ).toThrow(/more than one document ranked at "0\|100000:"/)
  })

  it('keeps every ranked fixture collection in rank order, best first', () => {
    for (const collection of rankedCollections) {
      const ranks = getFixtureCollection(collection)
        .filter(
          (document) => document.recommendationStatus !== 'notRecommended',
        )
        .map((document) => (document as { orderRank: string }).orderRank)

      expect(ranks.length).toBeGreaterThan(0)
      expect(ranks.every(Boolean)).toBe(true)
      expect([...ranks].sort((a, b) => a.localeCompare(b))).toEqual(ranks)
    }
  })

  // A non-recommendation is a record of something not worth returning to, so
  // it is published from whatever little was written down. Only what every
  // document needs to have a page at all is still required of it.
  describe('a non-recommendation', () => {
    const notRecommended = {
      _id: 'coffee-2',
      _type: 'coffee',
      title: 'Not worth it',
      slug: 'not-worth-it',
      recommendationStatus: 'notRecommended',
      notes: [{ _key: 'a', _type: 'block' }],
    }

    it('publishes with nothing but the fields every document has', () => {
      expect(() =>
        assertValidCollection('coffee', [notRecommended]),
      ).not.toThrow()
    })

    // The Studio asks for this too, but a document can reach the dataset by
    // import or API mutation without ever meeting a Studio rule.
    it('still has to say why, since the callout alone explains nothing', () => {
      expect(() =>
        assertValidCollection('coffee', [
          { ...notRecommended, notes: undefined },
        ]),
      ).toThrow(/"notes"/)
      expect(() =>
        assertValidCollection('coffee', [{ ...notRecommended, notes: [] }]),
      ).toThrow(/"notes"/)
    })

    it('still has to carry a title, a slug and a URL-safe one at that', () => {
      expect(() =>
        assertValidCollection('coffee', [{ ...notRecommended, title: ' ' }]),
      ).toThrow(/"title"/)
      expect(() =>
        assertValidCollection('coffee', [
          { ...notRecommended, slug: 'Not Lowercase' },
        ]),
      ).toThrow(/not URL safe/)
    })

    it('does not excuse a recommendation from the same fields', () => {
      expect(() =>
        assertValidCollection('coffee', [
          { ...notRecommended, recommendationStatus: 'recommended' },
        ]),
      ).toThrow(/"brewRecipes"/)
      expect(() =>
        assertValidCollection('coffee', [
          { ...notRecommended, recommendationStatus: undefined },
        ]),
      ).toThrow(/has no rank/)
    })

    it('is not asked for a rank, and never collides with a ranked entry', () => {
      expect(() =>
        assertValidCollection('coffee', [
          validCoffee,
          { ...notRecommended, orderRank: validCoffee.orderRank },
        ]),
      ).not.toThrow()
    })
  })

  /**
   * The ranking sorts on the status key, so a value the site does not know
   * sorts into a group of its own and lands above the ranking rather than
   * inside it.
   */
  it('rejects a recommendation status it does not know', () => {
    expect(() =>
      assertValidCollection('coffee', [
        { ...validCoffee, recommendationStatus: 'notrecommended' },
      ]),
    ).toThrow(/unknown recommendation status: "notrecommended"/)
    for (const status of ['recommended', 'notRecommended', undefined]) {
      expect(() =>
        assertValidCollection('coffee', [
          { ...validCoffee, recommendationStatus: status },
        ]),
      ).not.toThrow(/unknown recommendation status/)
    }
  })

  describe('grades and the crown', () => {
    it('accepts a document carrying no grade at all', () => {
      expect(() =>
        assertValidCollection('coffee', [{ ...validCoffee }]),
      ).not.toThrow()
    })

    it('rejects a value that is not on the grade list', () => {
      expect(() =>
        assertValidCollection('coffee', [
          { ...validCoffee, grade: 'Amber, Rich Taste' },
        ]),
      ).toThrow(/unknown grade/)
    })

    it('rejects a crown on anything but an S+', () => {
      expect(() =>
        assertValidCollection('coffee', [
          { ...validCoffee, grade: 'S', isCrowned: true },
        ]),
      ).toThrow(/only an S\+ can be crowned/)
    })

    it('accepts the crown on an S+', () => {
      expect(() =>
        assertValidCollection('coffee', [
          { ...validCoffee, grade: 'S+', isCrowned: true },
        ]),
      ).not.toThrow()
    })

    it('rejects a second crown, which the Studio check can race past', () => {
      expect(() =>
        assertValidCollection('coffee', [
          { ...validCoffee, grade: 'S+', isCrowned: true },
          {
            ...validCoffee,
            _id: 'coffee-2',
            slug: 'another-coffee',
            orderRank: '0|200000:',
            grade: 'S+',
            isCrowned: true,
          },
        ]),
      ).toThrow(/one king/)
    })
  })

  it('validates single documents too, and passes a missing one through untouched', () => {
    expect(assertValidDocument('coffee', undefined)).toBeUndefined()
    expect(assertValidDocument('coffee', validCoffee)).toBe(validCoffee)
    expect(() =>
      assertValidDocument('wings', { ...validCoffee, _type: 'wingReview' }),
    ).toThrow(/"venue"/)
  })
})
