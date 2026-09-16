import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CollectionName, ContentDocument } from '#/lib/content-types'
import { rankedCollections } from '#/lib/content-types'
import { getFixtureCollection } from '#/lib/fixtures'

// The page is rendered outside a router, and a card's link target is the
// router's business rather than this page's.
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params,
    to,
  }: {
    children: React.ReactNode
    params: { slug: string }
    to: string
  }) => <a href={to.replace('$slug', params.slug)}>{children}</a>,
}))

const { CollectionPage } = await import('./collection-page')

const markupFor = (collection: CollectionName, documents: ContentDocument[]) =>
  renderToStaticMarkup(
    <CollectionPage
      collection={collection}
      documents={documents}
      title={collection}
    />,
  )

/** The markup of one list, so a title can be placed in the right section. */
function listMarkup(markup: string, label: string) {
  const start = markup.indexOf(`aria-label="${label}"`)
  expect(start).toBeGreaterThan(-1)
  const end = markup.indexOf('</ol>', start)
  const ulEnd = markup.indexOf('</ul>', start)
  return markup.slice(
    start,
    end === -1 ? ulEnd : Math.min(end, ulEnd === -1 ? end : ulEnd),
  )
}

const isNotRecommended = (document: ContentDocument) =>
  document.recommendationStatus === 'notRecommended'

describe('a ranked collection page', () => {
  it.each(rankedCollections)(
    'keeps %s non-recommendations out of the ranking and under their own heading',
    (collection) => {
      const documents = getFixtureCollection(collection)
      const notRecommended = documents.filter(isNotRecommended)
      const recommended = documents.filter(
        (document) => !isNotRecommended(document),
      )

      expect(notRecommended.length).toBeGreaterThan(0)
      expect(recommended.length).toBeGreaterThan(0)

      const markup = markupFor(collection, documents)
      const ranking = listMarkup(markup, `${collection}, ranked best to worst`)
      const rejects = listMarkup(markup, `${collection}, not recommended`)

      for (const document of notRecommended) {
        expect(ranking).not.toContain(document.title)
        expect(rejects).toContain(document.title)
      }
      for (const document of recommended) {
        expect(ranking).toContain(document.title)
        expect(rejects).not.toContain(document.title)
      }
    },
  )

  it('labels every non-recommendation on its card, not just in the heading', () => {
    const documents = getFixtureCollection('wings')
    const markup = markupFor('wings', documents)
    const rejects = listMarkup(markup, 'wings, not recommended')

    expect(markup).toContain('Not recommended</h2>')
    expect(rejects.match(/Not recommended<\/p>/g)?.length).toBe(
      documents.filter(isNotRecommended).length,
    )
  })

  it('numbers the ranking from one, so a non-recommendation never takes a place', () => {
    const documents = getFixtureCollection('syrup')
    const ranking = listMarkup(
      markupFor('syrup', documents),
      'syrup, ranked best to worst',
    )
    const ranks = [...ranking.matchAll(/#(\d+)/g)].map(([, rank]) =>
      Number(rank),
    )

    expect(ranks).toEqual(
      documents
        .filter((document) => !isNotRecommended(document))
        .map((_, index) => index + 1),
    )
  })

  // A non-recommendation often has no photo, so its card gets the labelled
  // placeholder every imageless card gets rather than a hole in the grid.
  it('gives a photoless non-recommendation a labelled placeholder', () => {
    const documents = getFixtureCollection('syrup')
    const sparse = documents.find(
      (document) => document.slug === 'airport-gift-shop-syrup',
    )
    if (!sparse) throw new Error('No sparse syrup fixture')
    expect(sparse.recommendationStatus).toBe('notRecommended')
    expect('heroImage' in sparse && sparse.heroImage).toBeFalsy()

    const rejects = listMarkup(
      markupFor('syrup', documents),
      'syrup, not recommended',
    )
    const card = rejects
      .split('<li>')
      .find((entry) => entry.includes(sparse.title))
    if (!card) throw new Error('No card for the sparse syrup fixture')

    expect(card).toContain('content-card__placeholder')
    expect(card).toContain('Maple Syrup')
    expect(card).not.toContain('<img')
  })

  it('prioritises the first non-recommendation photo when it is the only section', () => {
    const documents = getFixtureCollection('syrup').filter(isNotRecommended)
    const rejects = listMarkup(
      markupFor('syrup', documents),
      'syrup, not recommended',
    )

    expect(rejects.match(/fetchPriority="high"/g)).toHaveLength(1)
    expect(rejects).toContain('loading="eager"')
  })

  // A photoless podium leaves the first non-recommendation photo as the page's
  // largest image, so the priority has to follow the image rather than the
  // section that happens to be on top.
  it('hands the priority down to a non-recommendation when no podium card has a photo', () => {
    const documents = getFixtureCollection('syrup').map((document) =>
      isNotRecommended(document)
        ? document
        : { ...document, heroImage: undefined },
    )
    const markup = markupFor('syrup', documents)
    const rejects = listMarkup(markup, 'syrup, not recommended')

    expect(listMarkup(markup, 'syrup, ranked best to worst')).not.toContain(
      'fetchPriority="high"',
    )
    expect(rejects.match(/fetchPriority="high"/g)).toHaveLength(1)
    expect(rejects).toContain('loading="eager"')
  })

  it('drops a section entirely rather than printing an empty heading', () => {
    const documents = getFixtureCollection('wings').filter(
      (document) => !isNotRecommended(document),
    )
    const markup = markupFor('wings', documents)

    expect(markup).toContain('Recommended</h2>')
    expect(markup).not.toContain('Not recommended')
    expect(markup).not.toContain('not recommended"')
  })

  // Card and row titles sit under the section h2 they are listed beneath, so
  // the page outline never jumps a level.
  it('heads every entry one level below its section', () => {
    const markup = markupFor('coffee', getFixtureCollection('coffee'))

    expect(markup.match(/<h2/g)).toHaveLength(2)
    for (const title of getFixtureCollection('coffee').map(
      (document) => document.title,
    )) {
      expect(markup).toMatch(
        new RegExp(
          `<h3[^>]*>.{0,80}${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
          's',
        ),
      )
    }
  })
})

describe('an unranked collection page', () => {
  it('lists the blog as one grid with no recommendation sections', () => {
    const documents = getFixtureCollection('blog')
    const markup = markupFor('blog', documents)

    expect(markup).not.toContain('Not recommended')
    expect(markup).not.toContain('ranked best to worst')
    for (const document of documents) {
      expect(markup).toContain(document.title)
    }
  })
})
