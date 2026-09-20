import { defineField, defineType } from 'sanity'
import type { ValidationContext } from 'sanity'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isNotRecommended(context: ValidationContext) {
  return (
    (context.document as { recommendationStatus?: string } | undefined)
      ?.recommendationStatus === 'notRecommended'
  )
}

function isBlank(value: unknown) {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * A recommendation has to earn its rank, so it owes the full record. A
 * non-recommendation owes only a title, a slug and the notes saying why, and
 * the fields stay in the schema so a fuller record is still possible.
 */
export function requiredForRecommendations(message: string) {
  return (value: unknown, context: ValidationContext) =>
    isNotRecommended(context) || !isBlank(value) ? true : message
}

export function requiredForNonRecommendations(message: string) {
  return (value: unknown, context: ValidationContext) =>
    isNotRecommended(context) && isBlank(value) ? message : true
}

export function slugField() {
  return defineField({
    name: 'slug',
    title: 'URL slug',
    type: 'slug',
    options: { source: 'title', maxLength: 96 },
    validation: (Rule) =>
      Rule.required().custom(async (value, context) => {
        const slug = value?.current
        if (!slug) return 'A URL slug is required.'
        if (!slugPattern.test(slug)) {
          return 'Use lowercase letters, numbers, and single hyphens only.'
        }

        const document = context.document
        if (!document) return true
        const type = document._type
        const id = document._id.replace(/^drafts\./, '')
        if (!type || !id) return true

        const duplicateCount = await context
          .getClient({ apiVersion: '2025-05-01' })
          .fetch<number>(
            'count(*[_type == $type && slug.current == $slug && !(_id in [$draftId, $publishedId])])',
            {
              type,
              slug,
              draftId: `drafts.${id}`,
              publishedId: id,
            },
          )

        return duplicateCount === 0
          ? true
          : 'This slug is already used by another document of this type.'
      }),
  })
}

export function recommendationStatusField() {
  return defineField({
    name: 'recommendationStatus',
    title: 'Recommendation status',
    type: 'string',
    group: 'publication',
    initialValue: 'recommended',
    options: {
      layout: 'radio',
      list: [
        { title: 'Recommended', value: 'recommended' },
        { title: 'Not recommended', value: 'notRecommended' },
      ],
    },
  })
}

export const imageWithAlt = defineType({
  name: 'imageWithAlt',
  title: 'Image with alt text',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
        metadata: ['image', 'lqip', 'blurhash'],
        storeOriginalFilename: false,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the visible subject, not the filename.',
      validation: (Rule) => Rule.required().min(5).max(180),
    }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'credit', title: 'Credit', type: 'string' }),
    defineField({
      name: 'display',
      title: 'Display width',
      type: 'string',
      initialValue: 'inline',
      options: {
        list: [
          { title: 'Inline with the text', value: 'inline' },
          { title: 'Wider than the text', value: 'wide' },
          { title: 'Full bleed', value: 'full' },
        ],
        layout: 'radio',
      },
      // Only posts render a breakout column; the structured documents lay
      // their images out for them, so the control would be a dead end there.
      hidden: ({ document }) => document?._type !== 'post',
    }),
  ],
  preview: {
    select: { title: 'alt', media: 'image' },
    prepare: ({ title, media }) => ({ title: title || 'Image', media }),
  },
})

export const money = defineType({
  name: 'money',
  title: 'Money',
  type: 'object',
  fields: [
    defineField({
      name: 'amountCents',
      title: 'Amount in cents',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'USD',
      options: { list: [{ title: 'US dollars (USD)', value: 'USD' }] },
      validation: (Rule) => Rule.required(),
    }),
  ],
})

export const packageSize = defineType({
  name: 'packageSize',
  title: 'Package size',
  type: 'object',
  fields: [
    defineField({
      name: 'amount',
      title: 'Amount',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'unit',
      title: 'Unit',
      type: 'string',
      options: {
        list: ['g', 'oz', 'ml', 'fl-oz', 'count'].map((value) => ({
          title: value,
          value,
        })),
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
})

/**
 * The grades, best first. The S tier sits above A because a few things are
 * better than the best of an ordinary scale; C, D and F take no modifier
 * because the difference between a C+ and a C- is not one worth defending.
 */
export const grades = [
  'S+',
  'S',
  'S-',
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C',
  'D',
  'F',
] as const

export const grade = defineType({
  name: 'grade',
  title: 'Grade',
  type: 'string',
  options: { list: grades.map((value) => ({ title: value, value })) },
})

/** How a grade reads in a Studio list row. A crown stands in for its S+. */
export function formatGradeBadge(value?: string, isCrowned?: boolean) {
  if (isCrowned) return '👑'
  return value
}

/**
 * The crown marks the single best entry in a category. It is not a tier of
 * its own: only an S+ can wear it, so the crown picks a winner among the
 * best rather than inventing a grade nothing else can reach.
 */
export function crownField() {
  return defineField({
    name: 'isCrowned',
    title: 'King of the category',
    type: 'boolean',
    group: 'tasting',
    initialValue: false,
    description: 'Only one per category, and only on an S+.',
    validation: (Rule) =>
      Rule.custom(async (value, context) => {
        if (!value) return true

        const document = context.document
        if (!document) return true

        if ((document as { grade?: string }).grade !== 'S+') {
          return 'Only an S+ can be crowned. Raise the grade or drop the crown.'
        }

        const type = document._type
        const id = document._id.replace(/^drafts\./, '')
        if (!type || !id) return true

        const rivals = await context
          .getClient({ apiVersion: '2025-05-01' })
          .fetch<string[]>(
            '*[_type == $type && isCrowned == true && !(_id in [$draftId, $publishedId])].title',
            { type, draftId: `drafts.${id}`, publishedId: id },
          )

        return rivals.length === 0
          ? true
          : `"${rivals[0]}" already wears this category's crown. Take it off that one first.`
      }),
  })
}

export const blockContent = defineType({
  name: 'blockContent',
  title: 'Rich text',
  type: 'array',
  of: [
    {
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'URL',
                type: 'url',
                validation: (Rule) =>
                  Rule.required().uri({ allowRelative: true }),
              }),
            ],
          },
        ],
      },
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Number', value: 'number' },
      ],
    },
    { type: 'imageWithAlt' },
  ],
})

/**
 * The closed tag vocabulary for posts. Keep this small and orthogonal: a tag
 * earns its place only once several posts would share it.
 */
export const postTags = [
  { title: 'AI', value: 'ai' },
  { title: 'Agents', value: 'agents' },
  { title: 'Engineering', value: 'engineering' },
  { title: 'Tools', value: 'tools' },
  { title: 'Opinion', value: 'opinion' },
  { title: 'Food', value: 'food' },
  { title: 'Coffee', value: 'coffee' },
  { title: 'Wings', value: 'wings' },
  { title: 'Burgers', value: 'burgers' },
  { title: 'Reubens', value: 'reubens' },
  { title: 'Syrup', value: 'syrup' },
  { title: 'Recipes', value: 'recipes' },
  { title: 'Reviews', value: 'reviews' },
] as const
