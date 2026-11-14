import type { WingReview } from './content-types'

/** The wings that hold the top spots as photo cards; the rest render as rows. */
export const podiumSize = 3

export type MainListEntry = {
  wing: WingReview
  rank: number
}

export type WingTier = {
  letter: string
  entries: MainListEntry[]
}

/**
 * The main list per docs/wings-constitution.md: the ranked buffalo wings plus
 * each no-buffalo place's best wing, numbered among themselves.
 */
export function mainList(wings: WingReview[]): MainListEntry[] {
  return wings
    .filter(isOnMainList)
    .map((wing, index) => ({ wing, rank: index + 1 }))
}

export function isOnMainList(wing: WingReview) {
  return (
    wing.recommendationStatus !== 'notRecommended' &&
    (wing.mainListRole === 'buffalo' || wing.mainListRole === 'bestNonBuffalo')
  )
}

/** Groups the list under its grade letters, which follow the ranking. */
export function wingTiers(entries: MainListEntry[]): WingTier[] {
  return entries.reduce<WingTier[]>((tiers, entry) => {
    const letter = tierLetter(entry.wing)
    const current = tiers.at(-1)
    if (current?.letter === letter) current.entries.push(entry)
    else tiers.push({ letter, entries: [entry] })
    return tiers
  }, [])
}

export function tierLetter(wing: Pick<WingReview, 'grade'>) {
  return wing.grade?.charAt(0) ?? ''
}

/**
 * The wing itself, with the place it is from taken off: "Steve O's Big Boy
 * Buffalo" at Steve O's reads "Big Boy Buffalo". A title that is only the
 * place, or names it differently, falls back to the ordered flavor.
 */
export function wingName(wing: WingReview) {
  const place = wing.location.name
  const flavor = wing.order?.styleOrFlavor ?? ''
  if (!wing.title.startsWith(place)) return flavor
  return wing.title.slice(place.length).trim() || flavor
}
