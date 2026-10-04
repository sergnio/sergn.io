import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { CollectionName, ContentDocument } from '#/lib/content-types'
import { collectionNames } from '#/lib/content-types'
import { getFixtureCollection, getFixtureDocument } from '#/lib/fixtures'
import { formatDate } from '#/lib/formatters'
import { ContentDetail } from './content-detail'

const markupFor = (document: ContentDocument) =>
  renderToStaticMarkup(<ContentDetail document={document} />)

const requireDocument = (collection: CollectionName, slug: string) => {
  const document = getFixtureDocument(collection, slug)
  if (!document) throw new Error(`No ${collection} fixture for ${slug}`)
  return document
}

/**
 * Field paths a detail page deliberately does not print. Everything else a
 * document carries has to show up in the rendered page, so a field that is
 * authorable in the Studio and fetched by the query cannot be quietly
 * dropped on the way to the screen.
 */
const notRenderedInBody: Array<{
  path: RegExp
  collections?: Array<CollectionName>
  when?: (document: ContentDocument) => boolean
  why: string
}> = [
  {
    path: /^recommendationStatus$/,
    why: 'status uses its explicit callout instead of raw enum text',
  },
  { path: /^_(id|type|createdAt|updatedAt)$/, why: 'Sanity system fields' },
  { path: /^slug$/, why: 'the page is already at its own URL' },
  {
    path: /^orderRank$/,
    why: 'sort key for the collection index, not content',
  },
  { path: /^seo\./, why: 'overrides for the document head, not the body' },
  { path: /\._(key|type)$/, why: 'array and block identity' },
  { path: /\.(style|listItem)$/, why: 'portable text block styling' },
  { path: /\.asset\./, why: 'image identity, carried by src and srcset' },
  { path: /\.(crop|hotspot)\./, why: 'crop geometry, applied by the CDN URL' },
  { path: /currency$/, why: 'rendered as a symbol by formatMoney' },
  { path: /\.grinder\.system$/, why: 'chooses the grinder sentence shape' },
  { path: /\.marks\[\d+\]$/, why: 'mark keys pointing at markDefs' },
  {
    path: /^grade$/,
    when: (document) => 'isCrowned' in document && document.isCrowned === true,
    why: 'the crown stands in for the S+ it is the only grade allowed to hide',
  },
  {
    path: /^excerpt$/,
    collections: ['blog'] as Array<CollectionName>,
    why: 'a summary for cards, feeds and the head; the body says it in full',
  },
  {
    path: /^publishedAt$/,
    collections: ['wings', 'reubens'] as Array<CollectionName>,
    why: 'a visit shows the date it happened, not the date it was written up',
  },
]

/** Prose reaches the markup HTML-escaped, so an apostrophe never matches raw. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/** Every way a value may legitimately appear once formatted for the page. */
function candidates(value: string | number) {
  const raw = String(value)
  const formattedDate = /^\d{4}-\d{2}-\d{2}/.test(raw)
    ? formatDate(raw)
    : undefined
  const cents = typeof value === 'number' ? (value / 100).toFixed(2) : undefined

  return [
    raw,
    raw.toLowerCase(),
    escapeHtml(raw),
    escapeHtml(raw).toLowerCase(),
    formattedDate,
    cents,
  ].filter((candidate): candidate is string => Boolean(candidate))
}

function leafPaths(
  value: unknown,
  path = '',
): Array<[string, string | number]> {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      leafPaths(entry, `${path}[${index}]`),
    )
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) =>
      leafPaths(entry, path ? `${path}.${key}` : key),
    )
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return [[path, value]]
  }

  return []
}

describe('detail page field coverage', () => {
  it.each(collectionNames)('renders every authored %s field', (collection) => {
    const dropped = getFixtureCollection(collection).flatMap((document) => {
      const markup = markupFor(document)

      return leafPaths(document)
        .filter(([path]) =>
          notRenderedInBody.every(
            (exclusion) =>
              !exclusion.path.test(path) ||
              !(exclusion.collections ?? [collection]).includes(collection) ||
              !(exclusion.when ?? (() => true))(document),
          ),
        )
        .filter(
          ([, value]) =>
            !candidates(value).some((candidate) => markup.includes(candidate)),
        )
        .map(([path, value]) => `${document.slug}: ${path} = ${value}`)
    })

    expect(dropped).toEqual([])
  })
})

describe('review layout', () => {
  it.each(collectionNames.filter((collection) => collection !== 'blog'))(
    'places %s notes after the hero image and before the facts',
    (collection) => {
      const document = getFixtureCollection(collection)[0]
      const markup = markupFor(document)
      const image = markup.indexOf('class="detail-hero__image"')
      const notes = markup.indexOf('class="detail-hero__notes"')
      const facts = markup.indexOf('class="facts"')

      expect(markup).toContain('detail-page--review')
      expect(image).toBeGreaterThan(-1)
      expect(notes).toBeGreaterThan(image)
      expect(facts).toBeGreaterThan(notes)
    },
  )

  it('omits the notes wrapper when there are no notes', () => {
    const coffee = requireDocument('coffee', 'colombia-perky')
    if (coffee._type !== 'coffee') throw new Error('expected a coffee fixture')

    for (const notes of [undefined, []]) {
      const markup = markupFor({ ...coffee, notes })
      expect(markup).not.toContain('class="detail-hero__notes"')
      expect(markup).toContain('class="facts"')
      expect(markup).toContain('Brew recipes')
    }
  })

  it('keeps the blog body outside the hero', () => {
    const markup = markupFor(
      requireDocument('blog', 'small-rituals-better-cups'),
    )
    expect(markup).not.toContain('detail-page--review')
    expect(markup).not.toContain('detail-hero__notes')
    expect(markup.indexOf('class="rich-text"')).toBeGreaterThan(
      markup.indexOf('class="detail-content"'),
    )
  })

  it('leaves the excerpt off a blog post, where the body already says it', () => {
    for (const post of getFixtureCollection('blog')) {
      expect(markupFor(post)).not.toContain(escapeHtml(post.excerpt))
    }
  })
})

describe('review facts', () => {
  it('links a venue to its site and lists the sides ordered', () => {
    const markup = markupFor(
      requireDocument('wings', 'neighborhood-buffalo-wings'),
    )

    expect(markup).toContain(
      '<a href="https://neighborhood-tavern.example.com">18 Tavern Row, Columbus</a>',
    )
    expect(markup).toContain('Celery, Blue cheese')
    expect(markup).toContain('$16.50')
  })

  it('lists free-form reuben order details alongside the named ones', () => {
    const markup = markupFor(requireDocument('reubens', 'the-rye-house-reuben'))

    expect(markup).toContain('<dt>portion</dt>')
    expect(markup).toContain('<dt>Pickle</dt><dd>House dill spear</dd>')
  })

  it('links a coffee title to its product page', () => {
    const markup = markupFor(requireDocument('coffee', 'colombia-perky'))

    expect(markup).toContain(
      '<h1><a href="https://avocoffeeroasters.example.com">Colombia Perky</a></h1>',
    )
    expect(markup).toContain('<dt>Bought from</dt><dd>Avo Coffee Roasters</dd>')
  })

  it('leaves a title without a product page unlinked', () => {
    const markup = markupFor(requireDocument('coffee', 'ethiopia-direct-trade'))

    expect(markup).toMatch(/<h1>[^<]+<\/h1>/)
  })

  it('drops a fact row rather than printing an empty term', () => {
    const markup = markupFor(requireDocument('coffee', 'ethiopia-direct-trade'))

    expect(markup).not.toContain('<dt>Price</dt>')
    expect(markup).not.toContain('<dt>Roaster</dt>')
    expect(markup).toContain('<dt>Origin</dt><dd>Ethiopia</dd>')
  })
})

describe('brew recipes', () => {
  it('names a free-text method instead of printing "Other"', () => {
    const coffee = requireDocument('coffee', 'colombia-perky')
    if (coffee._type !== 'coffee') throw new Error('expected a coffee fixture')

    const recipe = coffee.brewRecipes?.[0]
    if (!recipe) throw new Error('expected a brew recipe fixture')

    const markup = markupFor({
      ...coffee,
      brewRecipes: [
        {
          ...recipe,
          label: undefined,
          method: 'Other',
          methodOther: 'Cold brew in a mason jar',
        },
      ],
    })

    expect(markup).toContain('Cold brew in a mason jar')
    expect(markup).not.toContain('>Other<')
  })

  it('prints a recipe whose grind was not recorded', () => {
    const coffee = requireDocument('coffee', 'colombia-perky')
    if (coffee._type !== 'coffee') throw new Error('expected a coffee fixture')

    const markup = markupFor({
      ...coffee,
      brewRecipes: [
        {
          _key: 'from-memory',
          method: 'V60',
          doseGrams: 18,
          notes: 'Did not write the grind down.',
        },
      ],
    })

    expect(markup).toContain('<h3>V60</h3>')
    expect(markup).toContain('<p>Did not write the grind down.</p>')
  })

  it('heads a milk drink with the drink and lists what went in the cup', () => {
    const markup = markupFor(requireDocument('coffee', 'colombia-perky'))

    expect(markup).toContain('<h3>Cappuccino</h3>')
    expect(markup).toContain('120g whole milk · 5g maple syrup')
    expect(markup).toContain('<dt>Roast</dt><dd>Medium</dd>')
    expect(markup).toContain('<dt>Process</dt><dd>Washed</dd>')
  })

  it('heads a straight cup with the drink above its brew method', () => {
    const markup = markupFor(requireDocument('coffee', 'sumatra-long-night'))

    expect(markup).toContain(
      '<h3>Straight</h3><p class="recipe__method">French Press</p>',
    )
  })

  it('prints an unlabeled method once', () => {
    const markup = markupFor(requireDocument('coffee', 'colombia-perky'))

    expect(markup).toContain('<h3>Filter</h3><p>')
  })
})

/**
 * A non-recommendation is worth publishing even when Sergio recorded nothing
 * beyond why he would not go back, so the contract asks it only for the
 * fields every document has. The page has to render around whatever is
 * missing rather than throw the prerender.
 */
describe('a non-recommendation', () => {
  const base = {
    _id: 'lightweight',
    _createdAt: '2025-05-01T12:00:00.000Z',
    _updatedAt: '2025-05-01T12:00:00.000Z',
    slug: 'lightweight',
    recommendationStatus: 'notRecommended',
  } as const

  const sparse: ContentDocument[] = [
    { ...base, _type: 'coffee', title: 'Sparse coffee' },
    { ...base, _type: 'wingReview', title: 'Sparse wings' },
    { ...base, _type: 'naBeer', title: 'Sparse beer' },
    { ...base, _type: 'reubenReview', title: 'Sparse reuben' },
    { ...base, _type: 'syrupReview', title: 'Sparse syrup' },
  ]

  it.each(sparse.map((document) => [document._type, document] as const))(
    'renders a %s carrying nothing but a title and a slug',
    (_type, document) => {
      const markup = markupFor(document)

      expect(markup).toContain(document.title)
      expect(markup).toContain('Sergio does not recommend this.')
      expect(markup).not.toContain('<dd></dd>')
      expect(markup).not.toContain('Brew recipes')
    },
  )

  it('says nothing about a place when the entry is a product', () => {
    for (const collection of ['coffee', 'syrup', 'na-beers'] as const) {
      const document = getFixtureCollection(collection).find(
        (entry) => entry.recommendationStatus === 'notRecommended',
      )
      if (!document) throw new Error(`No ${collection} non-recommendation`)

      const markup = markupFor(document)

      expect(markup).toContain('detail-callout')
      expect(markup).not.toContain('this place')
    }
  })

  it('drops the facts table on the sparse fixture rather than printing one empty row', () => {
    const markup = markupFor(
      requireDocument('syrup', 'airport-gift-shop-syrup'),
    )

    expect(markup).toContain('Sergio does not recommend this.')
    expect(markup).toContain('Corn syrup first on the label.')
    expect(markup).not.toContain('class="facts"')
    expect(markup).not.toContain('<figure')
  })

  it('leaves a recommendation unlabelled', () => {
    expect(
      markupFor(requireDocument('coffee', 'colombia-perky')),
    ).not.toContain('detail-callout')
  })
})
