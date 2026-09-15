import { validateDocument } from '@sanity/validation'
import { getFallbackLocaleSource } from '@sanity/validation/_internal'
import type { SanityDocument } from 'sanity'
import { createSchema } from 'sanity'
import { describe, expect, it } from 'vitest'
import { schemaTypes } from './index'

/**
 * Sanity disables Publish while a document carries a validation error, so
 * these run the Studio's real rules against real documents: what an editor
 * can and cannot publish is the behaviour under test.
 */
const schema = createSchema({ name: 'test', types: schemaTypes })

// Slug uniqueness is the only rule that reaches the dataset; both the built-in
// check and the schema's own duplicate count read as "nothing else holds it".
const client = {
  fetch: async (query: string) =>
    query.trim().startsWith('count(') ? 0 : true,
  getDataUrl: () => '',
  observable: { fetch: () => undefined, request: () => undefined },
  withConfig: () => client,
} as never

async function errorsFor(document: Record<string, unknown>) {
  const markers = await validateDocument({
    document: {
      _id: 'drafts.test-document',
      _rev: 'rev',
      _createdAt: '2025-01-01T00:00:00.000Z',
      _updatedAt: '2025-01-01T00:00:00.000Z',
      ...document,
    } as SanityDocument,
    workspace: {
      schema,
      getClient: () => client,
      i18n: getFallbackLocaleSource(),
    } as never,
  })

  return markers
    .filter((marker) => marker.level === 'error')
    .map((marker) => marker.path.join('.'))
}

const reviewTypes = [
  'coffee',
  'wingReview',
  'naBeer',
  'reubenReview',
  'syrupReview',
] as const

const notes = [
  {
    _key: 'why',
    _type: 'block',
    style: 'normal',
    children: [
      { _key: 'span', _type: 'span', text: 'Would not buy this again.' },
    ],
  },
]

describe('publishing a non-recommendation', () => {
  it.each(reviewTypes)(
    'lets a %s publish with nothing but a title, slug and notes',
    async (_type) => {
      expect(
        await errorsFor({
          _type,
          title: 'Not worth it',
          slug: { _type: 'slug', current: 'not-worth-it' },
          notes,
          recommendationStatus: 'notRecommended',
        }),
      ).toEqual([])
    },
  )

  it.each(reviewTypes)(
    'still asks a %s non-recommendation for the notes saying why',
    async (_type) => {
      expect(
        await errorsFor({
          _type,
          title: 'Not worth it',
          slug: { _type: 'slug', current: 'not-worth-it' },
          recommendationStatus: 'notRecommended',
        }),
      ).toContain('notes')
    },
  )

  it.each(reviewTypes)(
    'keeps every category field publishable on a %s non-recommendation',
    async (_type) => {
      expect(
        await errorsFor({
          _type,
          title: 'Not worth it',
          slug: { _type: 'slug', current: 'not-worth-it' },
          notes,
          recommendationStatus: 'notRecommended',
          venue: 'The place',
          restaurant: 'The place',
          brewery: 'The brewery',
          producer: 'The producer',
          boughtFrom: 'The shop',
          visitedAt: '2025-01-01',
          order: { styleOrFlavor: 'Buffalo' },
        }),
      ).toEqual([])
    },
  )
})

describe('publishing a recommendation', () => {
  it.each(reviewTypes)('still holds a %s to the full record', async (_type) => {
    expect(
      await errorsFor({
        _type,
        title: 'Worth it',
        slug: { _type: 'slug', current: 'worth-it' },
        notes,
        recommendationStatus: 'recommended',
      }),
    ).toContain('heroImage')
  })

  const categoryField: Record<(typeof reviewTypes)[number], string> = {
    coffee: 'boughtFrom',
    wingReview: 'venue',
    naBeer: 'brewery',
    reubenReview: 'restaurant',
    syrupReview: 'producer',
  }

  it.each(reviewTypes)(
    'still asks a %s recommendation for its category essentials',
    async (_type) => {
      expect(
        await errorsFor({
          _type,
          title: 'Worth it',
          slug: { _type: 'slug', current: 'worth-it' },
          recommendationStatus: 'recommended',
        }),
      ).toContain(categoryField[_type])
    },
  )
})
