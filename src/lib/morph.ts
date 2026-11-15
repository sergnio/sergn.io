import type { CSSProperties } from 'react'
import type { ContentDocument } from './content-types'

export type MorphPart = 'photo' | 'title'

/**
 * Pairs a list entry with the same part of its detail page, so a view
 * transition morphs one into the other. Each name must appear once per page.
 */
export function morph(
  part: MorphPart,
  { _type, slug }: Pick<ContentDocument, '_type' | 'slug'>,
): CSSProperties {
  return {
    viewTransitionName: `${_type}-${slug}-${part}`,
    viewTransitionClass: part,
  }
}
