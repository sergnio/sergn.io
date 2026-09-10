import type { BrewRecipe, Money } from './content-types'

export function formatMoney(money?: Money) {
  if (!money) return undefined

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currency,
  }).format(money.amountCents / 100)
}

export function formatPackageSize(size?: { amount: number; unit: string }) {
  if (!size) return undefined
  return `${formatNumber(size.amount)} ${size.unit}`
}

export function formatRating(rating?: number) {
  if (rating === undefined) return undefined
  return `${formatNumber(rating)} / 5`
}

export function formatDate(date?: string) {
  if (!date) return undefined

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(date))
}

export function formatAbv(abv?: number, note?: string) {
  if (note) return note
  if (abv === undefined) return undefined
  return `${formatNumber(abv)}% ABV`
}

/**
 * The method a recipe is actually brewed with. The Studio's method list ends
 * in "Other", which is a placeholder for the free-text methodOther beside it,
 * so printing method alone would show a literal "Other" on the page.
 */
export function formatMethod(recipe: BrewRecipe) {
  if (recipe.method === 'Other')
    return (recipe.methodOther ?? '').trim() || recipe.method
  return recipe.method
}

export function formatList(values?: string[]) {
  if (!values?.length) return undefined
  return values.join(', ')
}

export function formatLocation(location?: { city?: string; address?: string }) {
  const parts = [location?.address, location?.city].filter(Boolean)
  return parts.length ? parts.join(', ') : undefined
}

export function formatGrinder(recipe: BrewRecipe) {
  const { grinder } = recipe
  const model = grinder.model ? ` (${grinder.model})` : ''

  switch (grinder.system) {
    case 'manual-number-rotations':
      return `${grinder.name}${model}: number ${formatNumber(grinder.number ?? 0)}, ${formatNumber(grinder.rotations ?? 0)} rotation${grinder.rotations === 1 ? '' : 's'}`
    case 'niche-setting':
      return `${grinder.name}${model}: setting ${formatNumber(grinder.setting ?? 0)}`
    default:
      return `${grinder.name}${model}${recipe.notes ? `: ${recipe.notes}` : ''}`
  }
}

export function formatBrewSettings(recipe: BrewRecipe) {
  const settings = [
    recipe.doseGrams && `${formatNumber(recipe.doseGrams)}g dose`,
    recipe.waterGrams && `${formatNumber(recipe.waterGrams)}g water`,
    recipe.yieldGrams && `${formatNumber(recipe.yieldGrams)}g yield`,
    recipe.waterTemperatureC && `${formatNumber(recipe.waterTemperatureC)}°C`,
    recipe.brewTimeSeconds && `${formatNumber(recipe.brewTimeSeconds)} sec`,
    recipe.ratio,
  ].filter(Boolean)

  return settings.join(' · ')
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    value,
  )
}
