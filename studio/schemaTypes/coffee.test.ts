import { describe, expect, it } from 'vitest'
import { validateBrewRecipe } from './coffee'

describe('coffee recipe validation', () => {
  it('requires both legacy manual settings', () => {
    expect(
      validateBrewRecipe({
        method: 'Moka Pot',
        grinder: {
          name: 'Manual grinder',
          system: 'manual-number-rotations',
          number: 4,
        },
      }),
    ).toBe('Manual recipes require both a grinder number and rotations.')
  })

  it('requires the Niche setting', () => {
    expect(
      validateBrewRecipe({
        method: 'Filter',
        grinder: { name: 'Niche', system: 'niche-setting' },
      }),
    ).toBe('Niche recipes require a non-negative setting.')
  })

  it('requires a practical note for other systems', () => {
    expect(
      validateBrewRecipe({
        method: 'V60',
        grinder: { name: 'Hand grinder', system: 'other' },
      }),
    ).toBe('Add a practical note for this grinder system.')
  })

  it('accepts the preserved Perky manual recipe', () => {
    expect(
      validateBrewRecipe({
        method: 'Moka Pot',
        grinder: {
          name: 'Manual grinder',
          system: 'manual-number-rotations',
          number: 4,
          rotations: 1,
        },
      }),
    ).toBe(true)
  })
})
