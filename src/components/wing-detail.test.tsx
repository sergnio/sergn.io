import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { WingReview } from '#/lib/content-types'
import { getFixtureCollection } from '#/lib/fixtures'
import { wingPageData } from '#/lib/wings'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
    params,
    to,
  }: {
    children: React.ReactNode
    className?: string
    params?: { slug: string }
    to: string
  }) => (
    <a
      className={className}
      href={params ? to.replace('$slug', params.slug) : to}
    >
      {children}
    </a>
  ),
}))

const { WingDetail } = await import('./wing-detail')

const wings = getFixtureCollection('wings')

function markupFor(slug: string, collection: WingReview[] = wings) {
  const page = wingPageData(collection, slug)
  if (!page) throw new Error(`No wing fixture for ${slug}`)
  return renderToStaticMarkup(<WingDetail {...page} />)
}

describe('the wing page', () => {
  const markup = markupFor('corner-bar-buffalo')

  it('names the wing, not the place, under a Wings / place breadcrumb', () => {
    expect(markup).toContain('<h1>Buffalo</h1>')
    expect(markup).toContain(
      '<li><a href="/wings">Wings</a></li><li>The Corner Bar</li><li aria-current="page">Buffalo</li>',
    )
  })

  it('says where it is on one line', () => {
    expect(markup).toContain(
      'at <span class="wing-hero__place">The Corner Bar</span>, 7 Corner Street, Columbus',
    )
  })

  it('stamps the grade beside visits, rank, and the last visit', () => {
    expect(markup).toContain('aria-label="Grade B" class="wing-stamp"')
    expect(markup).toContain('<span>2 visits</span><span>#3 of 4</span>')
    expect(markup).toContain('Last visit <time dateTime="2025-03-03">')
  })

  it('prints the notes as written', () => {
    expect(markup).toContain(
      'Plain and dependable, a step behind the honey hot.',
    )
  })

  it('leaves out what the design dropped', () => {
    expect(markup).not.toMatch(/Website|All \d+ wings|class="facts"/)
  })

  it('lists the other wings at the place, linked, with their standing', () => {
    expect(markup).toContain(
      '<h2 id="also-tried">Also tried at The Corner Bar</h2>',
    )
    expect(markup.match(/class="wing-sib"/g)).toHaveLength(1)
    expect(markup).toContain('href="/wings/corner-bar-honey-hot">Honey hot</a>')
    expect(markup).toContain('<span class="wing-sib__tag">Not buffalo</span>')
    expect(markup).toContain(
      '<span class="wing-sib__grade"><span class="visually-hidden">Grade </span>B+</span>',
    )
  })

  it('tags a sibling on the main list with its rank', () => {
    expect(markupFor('corner-bar-honey-hot')).toContain(
      '<span class="wing-sib__tag">#3 on the list</span>',
    )
  })

  it('gives a wing off the main list no rank', () => {
    expect(markupFor('corner-bar-honey-hot')).not.toMatch(/#\d+ of \d+/)
  })

  it('draws the no-photo placeholder in place of a missing photo', () => {
    expect(markup).toContain(
      'aria-label="No photo yet" class="wing-ph wing-ph--hero" role="img"',
    )
    expect(markup).toContain('class="wing-ph wing-ph--thumb"')
    expect(markup).not.toContain('<figure')
  })
})

describe('the only wing at its place', () => {
  const markup = markupFor('neighborhood-buffalo')

  it('has no Also tried section', () => {
    expect(markup).not.toContain('Also tried')
  })

  it('shows its whole photo with the visit count left out when unrecorded', () => {
    expect(markup).toContain('class="wing-hero__photo"')
    expect(markup).toContain('fetchPriority="high"')
    expect(markup).toContain('<span>#1 of 4</span>')
    expect(markup).not.toMatch(/\d+ visits?/)
  })
})

describe('the best non-buffalo wing', () => {
  const markup = markupFor('smokehouse-dry-rub-wings')

  it('stars its rank and explains it under the notes', () => {
    expect(markup).toContain(
      '#2 of 4<a aria-label="Not buffalo, see note" class="wing-facts__asterisk" href="#wing-footnote">*</a>',
    )
    expect(markup).toContain(
      'id="wing-footnote"><b aria-hidden="true">*</b> No buffalo at Eastside Smokehouse, so this wing holds its spot on the list.',
    )
    expect(markup.indexOf('wing-footnote"><b')).toBeGreaterThan(
      markup.indexOf('wing-hero__notes'),
    )
  })

  it('has no footnote on a buffalo wing', () => {
    expect(markupFor('corner-bar-buffalo')).not.toContain('id="wing-footnote"')
  })
})

describe('a non-recommendation', () => {
  it('says so and renders with nothing but a title and a place', () => {
    const sparse: WingReview = {
      _id: 'sparse',
      _type: 'wingReview',
      _createdAt: '2025-05-01T12:00:00.000Z',
      _updatedAt: '2025-05-01T12:00:00.000Z',
      title: 'Sparse wings',
      slug: 'sparse',
      recommendationStatus: 'notRecommended',
      mainListRole: 'none',
      location: {
        _ref: 'location-sparse',
        _id: 'location-sparse',
        name: 'Sparse tavern',
        city: 'Columbus',
        address: '1 Sparse Street',
      },
    }
    const markup = markupFor('sparse', [sparse])

    expect(markup).toContain('<h1>Sparse wings</h1>')
    expect(markup).toContain('Sergio does not recommend this.')
    expect(markup).not.toContain('wing-facts')
    expect(markup).not.toContain('wing-hero__notes')
  })
})
