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
  why: string
}> = [
  { path: /^_(id|type|createdAt|updatedAt)$/, why: 'Sanity system fields' },
  { path: /^slug$/, why: 'the page is already at its own URL' },
  { path: /^featured$/, why: 'a home page selection flag, not page copy' },
  { path: /^seo\./, why: 'overrides for the document head, not the body' },
  { path: /\._(key|type)$/, why: 'array and block identity' },
  { path: /\.(style|listItem)$/, why: 'portable text block styling' },
  { path: /\.asset\./, why: 'image identity, carried by src and srcset' },
  { path: /\.(crop|hotspot)\./, why: 'crop geometry, applied by the CDN URL' },
  { path: /currency$/, why: 'rendered as a symbol by formatMoney' },
  { path: /\.grinder\.system$/, why: 'chooses the grinder sentence shape' },
  { path: /\.marks\[\d+\]$/, why: 'mark keys pointing at markDefs' },
  {
    path: /^publishedAt$/,
    collections: ['wings', 'reubens'] as Array<CollectionName>,
    why: 'a visit shows the date it happened, not the date it was written up',
  },
]

/** Every way a value may legitimately appear once formatted for the page. */
function candidates(value: string | number) {
  const raw = String(value)
  const formattedDate = /^\d{4}-\d{2}-\d{2}/.test(raw)
    ? formatDate(raw)
    : undefined
  const cents = typeof value === 'number' ? (value / 100).toFixed(2) : undefined

  return [raw, raw.toLowerCase(), formattedDate, cents].filter(
    (candidate): candidate is string => Boolean(candidate),
  )
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
              !(exclusion.collections ?? [collection]).includes(collection),
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

  it('drops a fact row rather than printing an empty term', () => {
    const markup = markupFor(requireDocument('coffee', 'ethiopia-direct-trade'))

    expect(markup).not.toContain('<dt>Price</dt>')
    expect(markup).toContain('<dt>Roaster</dt><dd>Not listed</dd>')
  })
})

describe('gallery', () => {
  it('renders every gallery image with its caption and credit', () => {
    const markup = markupFor(requireDocument('coffee', 'colombia-perky'))

    expect(markup).toContain('id="gallery-title"')
    expect(markup).toContain(
      'alt="Ground coffee in a glass jar surrounded by roasted beans"',
    )
    expect(markup).toContain('The bag, a week off roast.')
    expect(markup).toContain(
      '<span class="figcaption__credit">Photo: Avo Coffee Roasters</span>',
    )
  })

  it('omits the gallery section entirely when there are no extra images', () => {
    const markup = markupFor(
      requireDocument('wings', 'neighborhood-buffalo-wings'),
    )

    expect(markup).not.toContain('gallery-title')
  })
})

describe('brew recipes', () => {
  it('names a free-text method instead of printing "Other"', () => {
    const coffee = requireDocument('coffee', 'colombia-perky')
    if (coffee._type !== 'coffee') throw new Error('expected a coffee fixture')

    const markup = markupFor({
      ...coffee,
      brewRecipes: [
        {
          ...coffee.brewRecipes[0],
          label: undefined,
          method: 'Other',
          methodOther: 'Cold brew in a mason jar',
        },
      ],
    })

    expect(markup).toContain('Cold brew in a mason jar')
    expect(markup).not.toContain('>Other<')
  })
})
