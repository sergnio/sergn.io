import { describe, expect, it } from 'vitest'
import type { WingReview } from './content-types'
import { getFixtureCollection } from './fixtures'
import { mainList, wingName, wingPageData, wingTiers } from './wings'

const wings = getFixtureCollection('wings')

const wingWith = (overrides: Partial<WingReview>): WingReview => ({
  ...wings[0],
  ...overrides,
})

describe('the main wings list', () => {
  it('shows buffalo and best non-buffalo wings, numbered among themselves', () => {
    expect(mainList(wings).map(({ wing, rank }) => [rank, wing.slug])).toEqual([
      [1, 'neighborhood-buffalo'],
      [2, 'smokehouse-dry-rub-wings'],
      [3, 'corner-bar-buffalo'],
      [4, 'arena-concession-wings'],
    ])
  })

  it('leaves out a non-recommendation, whatever its role', () => {
    const rejected = wingWith({
      slug: 'rejected',
      recommendationStatus: 'notRecommended',
      mainListRole: 'buffalo',
    })
    expect(mainList([rejected])).toEqual([])
  })

  it('groups consecutive wings under their grade letter', () => {
    expect(
      wingTiers(mainList(wings)).map((tier) => [
        tier.letter,
        tier.entries.map(({ rank }) => rank),
      ]),
    ).toEqual([
      ['A', [1, 2]],
      ['B', [3]],
      ['C', [4]],
    ])
  })
})

describe('a wing name', () => {
  const at = (title: string, place: string, styleOrFlavor = 'Buffalo') =>
    wingName(
      wingWith({
        title,
        location: { ...wings[0].location, name: place },
        order: { styleOrFlavor },
      }),
    )

  it('drops the place it is from', () => {
    expect(at("Steve O's Big Boy Buffalo", "Steve O's")).toBe('Big Boy Buffalo')
  })

  it('falls back to the flavor when the title is only the place', () => {
    expect(at('King of the Wing', 'King of the Wing')).toBe('Buffalo')
  })

  it('falls back to the flavor when the title names the place differently', () => {
    expect(
      at("Sportsmen's Hot", "Sportsmen's Restaurant & Taverna", 'Hot'),
    ).toBe('Hot')
  })
})

describe('a wing page', () => {
  it('ranks a wing on the main list out of the whole list', () => {
    const page = wingPageData(wings, 'corner-bar-buffalo')
    expect([page?.rank, page?.listLength]).toEqual([3, 4])
  })

  it('gives a wing off the main list no rank', () => {
    expect(wingPageData(wings, 'corner-bar-honey-hot')?.rank).toBeUndefined()
  })

  it('lists the other wings at the place with their ranks, never itself', () => {
    const siblings = wingPageData(wings, 'corner-bar-honey-hot')?.siblings
    expect(siblings?.map(({ wing, rank }) => [wing.slug, rank])).toEqual([
      ['corner-bar-buffalo', 3],
    ])
  })

  it('lists no siblings for the only wing at its place', () => {
    expect(wingPageData(wings, 'neighborhood-buffalo')?.siblings).toEqual([])
  })

  it('finds nothing for an unknown slug', () => {
    expect(wingPageData(wings, 'nope')).toBeUndefined()
  })
})
