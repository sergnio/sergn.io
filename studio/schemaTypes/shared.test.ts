import { describe, expect, it } from 'vitest'
import { formatGradeBadge } from './shared'

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
