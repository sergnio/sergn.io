import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { getFixtureCollection } from '#/lib/fixtures'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
    params,
    to,
  }: {
    children: React.ReactNode
    className?: string
    params: { slug: string }
    to: string
  }) => (
    <a className={className} href={to.replace('$slug', params.slug)}>
      {children}
    </a>
  ),
}))

const { WingsPage } = await import('./wings-page')

const wings = getFixtureCollection('wings')
const markup = renderToStaticMarkup(<WingsPage wings={wings} />)

describe('the wings page', () => {
  it('says only what the design says above the list', () => {
    expect(markup).toContain('<h1>Wings</h1>')
    expect(markup).toContain('Flavor, crunch, juiciness, and size matter.')
    expect(markup).not.toMatch(/Ranked|Best first|Recommended/)
  })

  it('heads each tier with its letter and wing count', () => {
    const heads = [
      ...markup.matchAll(
        /id="tier-(\w)">.*?<\/h2><p class="wing-tier__count">([^<]+)</g,
      ),
    ].map(([, letter, count]) => `${letter} ${count}`)
    expect(heads).toEqual(['a 2 wings', 'b 1 wing', 'c 1 wing'])
  })

  it('gives the top three photo cards and a crown in place of the first rank', () => {
    expect(markup.match(/class="wing-top[ "]/g)).toHaveLength(3)
    expect(markup).toContain('class="wing-top wing-top--first"')
    expect(markup).toContain('class="wing-crown"')
    expect(markup).not.toMatch(/wing-top__rank">1</)
    expect(markup.match(/class="wing-line"/g)).toHaveLength(1)
  })

  it('keeps wings off the main list off the page', () => {
    expect(markup).not.toContain('/wings/corner-bar-honey-hot')
    expect(markup).not.toContain('/wings/gas-station-case-wings')
  })

  it('marks the best non-buffalo wing and explains it in a footnote', () => {
    expect(markup.match(/class="wing-asterisk"/g)).toHaveLength(1)
    expect(markup).toContain('href="#footnote-non-buffalo"')
    expect(markup).toContain(
      'Eastside Smokehouse had no buffalo on the menu, so its best wing holds the spot.',
    )
  })

  it('leads each entry with the place and puts the wing type under it', () => {
    expect(markup).toMatch(
      /Neighborhood Tavern<\/a><\/h3><p class="wing-top__wing">Buffalo<\/p>/,
    )
  })

  it('prints no footnote when every wing is buffalo', () => {
    const buffalo = wings.filter(
      (wing) => wing.mainListRole !== 'bestNonBuffalo',
    )
    expect(renderToStaticMarkup(<WingsPage wings={buffalo} />)).not.toContain(
      'wings-footnote',
    )
  })
})
