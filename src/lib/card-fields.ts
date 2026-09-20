import type { ContentDocument } from './content-types'
import { formatGrade } from './formatters'

/**
 * How a document summarises itself in a list. Podium cards and ranked rows
 * are two shapes for the same entry, so the fields each one leans on are
 * derived here rather than twice, where they could drift apart.
 */

/**
 * A card's image is the only thing on it big enough to be an LCP candidate,
 * and not every document has one, so callers deciding which card to
 * prioritise have to ask this rather than assume the first card.
 */
export function cardImage(document: ContentDocument) {
  return document._type === 'post' ? document.coverImage : document.heroImage
}

export function cardSummary(document: ContentDocument) {
  if (document._type === 'coffee') return document.roaster ?? document.origin
  if (document._type === 'wingReview') return document.venue
  if (document._type === 'naBeer') return document.brewery
  if (document._type === 'reubenReview') return document.restaurant
  if (document._type === 'syrupReview') return document.producer
  return document.excerpt
}

export function cardDate(document: ContentDocument) {
  if (document._type === 'wingReview' || document._type === 'reubenReview') {
    return document.visitedAt
  }
  return document.publishedAt
}

export function cardGrade(document: ContentDocument) {
  if ('grade' in document)
    return formatGrade(document.grade, document.isCrowned)
  return undefined
}
