import { describe, expect, it } from 'vitest'
import { getFixtureCollection } from './fixtures'
import { homeSectionSizes, selectForHome } from './home-selection'

const newestFirst = [
  { featured: false, slug: 'newest' },
  { featured: true, slug: 'featured-older' },
  { slug: 'oldest' },
]

describe('home page selection', () => {
  it('leads with a featured document over a newer unfeatured one', () => {
    expect(selectForHome(newestFirst, 1)).toEqual([
      { featured: true, slug: 'featured-older' },
    ])
  })

  it('fills the remaining slots with the newest unfeatured documents', () => {
    expect(selectForHome(newestFirst, 3).map((d) => d.slug)).toEqual([
      'featured-older',
      'newest',
      'oldest',
    ])
  })

  it('falls back to the newest documents when nothing is featured', () => {
    const documents = [
      { featured: false, slug: 'a' },
      { featured: false, slug: 'b' },
      { featured: false, slug: 'c' },
    ]

    expect(selectForHome(documents, 2).map((d) => d.slug)).toEqual(['a', 'b'])
  })

  it('keeps featured documents newest-first among themselves', () => {
    const documents = [
      { featured: true, slug: 'newer-featured' },
      { featured: false, slug: 'middle' },
      { featured: true, slug: 'older-featured' },
    ]

    expect(selectForHome(documents, 2).map((d) => d.slug)).toEqual([
      'newer-featured',
      'older-featured',
    ])
  })

  it('never returns more than the section holds', () => {
    expect(selectForHome(newestFirst, 2)).toHaveLength(2)
    expect(selectForHome(newestFirst, 0)).toHaveLength(0)
  })

  it('returns nothing for an empty collection', () => {
    expect(selectForHome([], homeSectionSizes.coffee)).toEqual([])
  })

  it('does not mutate the collection it was given', () => {
    const documents = [...newestFirst]

    selectForHome(documents, 3)

    expect(documents).toEqual(newestFirst)
  })

  it('sizes every home section', () => {
    expect(Object.values(homeSectionSizes).every((size) => size > 0)).toBe(true)
  })

  it('picks the featured fixture coffee, which is not the newest', () => {
    const coffee = getFixtureCollection('coffee')
    const [shown] = selectForHome(coffee, homeSectionSizes.coffee)

    expect(coffee[0].featured).toBeFalsy()
    expect(shown.slug).toBe('colombia-perky')
    expect(shown.featured).toBe(true)
  })
})
