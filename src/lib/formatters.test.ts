import { describe, expect, it } from 'vitest'
import {
  formatBrewSettings,
  formatGrinder,
  formatMoney,
  formatPackageSize,
} from './formatters'

describe('content formatters', () => {
  it('formats integer cents without floating point artifacts', () => {
    expect(formatMoney({ amountCents: 1543, currency: 'USD' })).toBe('$15.43')
  })

  it('formats coffee bag weights', () => {
    expect(formatPackageSize({ amount: 250, unit: 'g' })).toBe('250 g')
  })

  it('keeps legacy manual grinder number and rotations visible', () => {
    expect(
      formatGrinder({
        _key: 'manual',
        method: 'Moka Pot',
        grinder: {
          name: 'Manual grinder',
          system: 'manual-number-rotations',
          number: 4,
          rotations: 1,
        },
      }),
    ).toBe('Manual grinder: number 4, 1 rotation')
  })

  it('formats optional recipe settings together', () => {
    expect(
      formatBrewSettings({
        _key: 'filter',
        method: 'Filter',
        grinder: { name: 'Niche', system: 'niche-setting', setting: 22 },
        doseGrams: 18,
        waterTemperatureC: 93,
        brewTimeSeconds: 180,
      }),
    ).toBe('18g dose · 93°C · 180 sec')
  })
})
