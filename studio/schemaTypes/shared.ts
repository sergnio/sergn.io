import { defineField, defineType } from 'sanity'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

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

export const rating = defineType({
  name: 'rating',
  title: 'Rating',
  type: 'number',
  // precision(2) is the whole rule: rate to the hundredth and stop there, so
  // a rating stays a number someone can defend rather than a long float.
  validation: (Rule) => Rule.min(0).max(5).precision(2),
})

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
