import { describe, expect, it } from 'vitest'
import { formatGradeBadge, withPreviousSlug } from './shared'

describe('grade badges', () => {
  it('prints the grade when nothing wears the crown', () => {
    expect(formatGradeBadge('A+')).toBe('A+')
  })

  it('stands the crown in for an S+', () => {
    expect(formatGradeBadge('S+', true)).toBe('👑')
  })

  it('keeps the grade visible on a draft crowned below S+', () => {
    expect(formatGradeBadge('B', true)).toBe('B')
    expect(formatGradeBadge(undefined, true)).toBeUndefined()
  })
})

describe('previous slugs on publish', () => {
  it('remembers the published slug when the slug changes', () => {
    expect(withPreviousSlug(['first'], 'second', 'third')).toEqual([
      'first',
      'second',
    ])
  })

  it('changes nothing when the slug is unchanged or never published', () => {
    expect(withPreviousSlug(['first'], 'second', 'second')).toEqual(['first'])
    expect(withPreviousSlug(undefined, undefined, 'first')).toEqual([])
  })

  it('drops a previous slug the document takes back', () => {
    expect(withPreviousSlug(['first'], 'second', 'first')).toEqual(['second'])
  })

  it('does not record the same slug twice', () => {
    expect(withPreviousSlug(['first', 'second'], 'second', 'third')).toEqual([
      'first',
      'second',
    ])
  })
})
