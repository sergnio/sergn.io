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
  validation: (Rule) =>
    Rule.min(0)
      .max(5)
      .precision(2)
      .custom((value) =>
        value === undefined || Number.isInteger(value * 4)
          ? true
          : 'Use 0.25 rating increments.',
      ),
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
