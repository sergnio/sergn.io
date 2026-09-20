import { describe, expect, it } from 'vitest'
import { grades } from './content-types'
import { getFixtureCollection } from './fixtures'
import { contentDescription, reviewJsonLd } from './metadata'

const wing = getFixtureCollection('wings')[0]

function ratingFor(grade?: string) {
  const json = reviewJsonLd({ ...wing, grade } as typeof wing, '/wings/x')
  return json ? JSON.parse(json).reviewRating : undefined
}

/**
 * Search engines only read stars, so a grade is converted at the edge. The
 * number is never stored and never shown, and the order has to survive the
 * trip or the structured data would contradict the ranking on the page.
 */
describe('grades as search-engine stars', () => {
  it('gives every grade a star value inside the advertised range', () => {
    for (const grade of grades) {
      const rating = ratingFor(grade)
      expect(rating.ratingValue).toBeGreaterThanOrEqual(rating.worstRating)
      expect(rating.ratingValue).toBeLessThanOrEqual(rating.bestRating)
    }
  })

  it('never rates a worse grade above a better one', () => {
    const values = grades.map((grade) => ratingFor(grade).ratingValue)
    expect(values).toEqual([...values].sort((a, b) => b - a))
  })

  it('reserves a perfect five for the top grade', () => {
    expect(ratingFor('S+').ratingValue).toBe(5)
  })

  it('claims no rating at all for an ungraded entry', () => {
    expect(
      reviewJsonLd({ ...wing, grade: undefined }, '/wings/x'),
    ).toBeUndefined()
  })
})

describe('link previews', () => {
  it('describes a syrup by what is in the bottle, not by its letter', () => {
    const syrup = getFixtureCollection('syrup')[0]

    expect(contentDescription(syrup)).toBe(
      `${syrup.producer} · ${syrup.mapleGrade}`,
    )
  })
})
