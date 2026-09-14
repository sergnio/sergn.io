import { defineField } from 'sanity'

const apiVersion = '2025-06-27'

/**
 * The plugin's own `orderRankField` without its module-level `lexorank` import:
 * that package is CommonJS, which Sanity's schema extractor cannot evaluate.
 */
export function orderRankField(type: string) {
  return defineField({
    title: 'Order Rank',
    name: 'orderRank',
    type: 'string',
    hidden: true,
    readOnly: true,
    initialValue: async (_value, context) => {
      const { LexoRank } = await import('lexorank')
      const lowest: unknown = await context
        .getClient({ apiVersion })
        .fetch('*[_type == $type]|order(@[$order] asc)[0][$order]', {
          type,
          order: 'orderRank',
        })

      // A new entry outranks everything, so it lands above the current lowest.
      let base = LexoRank.min()
      if (typeof lowest === 'string') {
        try {
          base = LexoRank.parse(lowest)
        } catch {
          base = LexoRank.min()
        }
      }
      return base.genPrev().genPrev().toString()
    },
  })
}
