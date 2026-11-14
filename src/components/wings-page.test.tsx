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

  it('numbers each tier list from its first rank, podium cards included', () => {
    const starts = [
      ...markup.matchAll(
        /<ol class="(wing-tops|wing-lines)"[^>]*start="(\d+)"/g,
      ),
    ].map(([, list, start]) => `${list} ${start}`)
    expect(starts).toEqual(['wing-tops 1', 'wing-tops 3', 'wing-lines 4'])
  })

  it('states each rank to screen readers, which ignore an ol start', () => {
    const positions = [
      ...markup.matchAll(/<li aria-posinset="(\d+)" aria-setsize="(\d+)"/g),
    ].map(([, rank, size]) => `${rank}/${size}`)
    expect(positions).toEqual(['1/4', '2/4', '3/4', '4/4'])
  })

  it('reads each grade as one phrase', () => {
    const labels = [
      ...markup.matchAll(/<span class="visually-hidden">(Grade: [^<]+)</g),
    ].map(([, label]) => label)
    expect(labels).toEqual(['Grade: A+', 'Grade: A', 'Grade: B', 'Grade: C'])
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

  it('sets every grade modifier in its own slot, even when there is none', () => {
    const grades = [
      ...markup.matchAll(
        /aria-hidden="true">(\w)<span class="wing-grade__mod">([+-]?)<\/span>/g,
      ),
    ].map(([, letter, modifier]) => letter + modifier)
    expect(grades).toEqual(['A+', 'A', 'B', 'C'])
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
