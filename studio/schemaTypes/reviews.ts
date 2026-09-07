import { defineField, defineType } from 'sanity'
import { slugField } from './shared'

const documentGroups = [
  { name: 'essentials', title: 'Essentials', default: true },
  { name: 'photo', title: 'Photo' },
  { name: 'tasting', title: 'Tasting and recipe' },
  { name: 'optional', title: 'Optional details' },
]

const optionalFieldset = [
  {
    name: 'optionalDetails',
    title: 'Optional details',
    options: { collapsible: true, collapsed: true },
  },
]

function commonFields() {
  return [
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'imageWithAlt',
      group: 'photo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'gallery',
      group: 'photo',
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'rating',
      group: 'tasting',
    }),
    defineField({
      name: 'notes',
      title: 'Review notes',
      type: 'blockContent',
      group: 'tasting',
    }),
    defineField({
      name: 'featured',
      title: 'Feature on home page',
      type: 'boolean',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
  ]
}

export const wingReview = defineType({
  name: 'wingReview',
  title: 'Wing review',
  type: 'document',
  groups: documentGroups,
  fieldsets: optionalFieldset,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'essentials',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ ...slugField(), group: 'essentials' }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'string',
      group: 'essentials',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'visitedAt',
      title: 'Visited at',
      type: 'date',
      group: 'essentials',
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'object',
      group: 'essentials',
      fields: [
        defineField({
          name: 'styleOrFlavor',
          title: 'Style or flavor',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({ name: 'heat', title: 'Heat', type: 'string' }),
        defineField({
          name: 'pieceCount',
          title: 'Piece count',
          type: 'number',
          validation: (Rule) => Rule.integer().positive(),
        }),
        defineField({
          name: 'sides',
          title: 'Sides',
          type: 'array',
          of: [{ type: 'string' }],
          options: { layout: 'tags' },
          validation: (Rule) => Rule.unique(),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'money',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'object',
      group: 'optional',
      fieldset: 'optionalDetails',
      fields: [
        defineField({ name: 'city', title: 'City', type: 'string' }),
        defineField({ name: 'address', title: 'Address', type: 'string' }),
        defineField({ name: 'url', title: 'Venue URL', type: 'url' }),
      ],
    }),
    ...commonFields().map((field) =>
      field.name === 'notes'
        ? defineField({ ...field, validation: (Rule) => Rule.required() })
        : field,
    ),
  ],
  preview: {
    select: {
      title: 'title',
      venue: 'venue',
      rating: 'rating',
      media: 'heroImage.image',
    },
    prepare: ({ title, venue, rating, media }) => ({
      title,
      subtitle: [venue, rating === undefined ? undefined : `${rating}/5`]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
})

export const naBeer = defineType({
  name: 'naBeer',
  title: 'N/A beer',
  type: 'document',
  groups: documentGroups,
  fieldsets: optionalFieldset,
  fields: [
    defineField({
      name: 'title',
      title: 'Product name',
      type: 'string',
      group: 'essentials',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ ...slugField(), group: 'essentials' }),
    defineField({
      name: 'brewery',
      title: 'Brewery',
      type: 'string',
      group: 'essentials',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      group: 'essentials',
    }),
    defineField({
      name: 'abvPercent',
      title: 'ABV percent',
      type: 'number',
      group: 'essentials',
      validation: (Rule) => Rule.min(0).max(0.5),
    }),
    defineField({
      name: 'package',
      title: 'Package size',
      type: 'packageSize',
      group: 'essentials',
      validation: (Rule) =>
        Rule.custom((value) => {
          const packageValue = value as { unit?: string } | undefined
          return !packageValue ||
            ['ml', 'fl-oz', 'count'].includes(packageValue.unit ?? '')
            ? true
            : 'N/A beer packages must use ml, fl-oz, or count.'
        }),
    }),
    defineField({
      name: 'packageFormat',
      title: 'Package format',
      type: 'string',
      group: 'essentials',
    }),
    defineField({
      name: 'boughtFrom',
      title: 'Bought from',
      type: 'string',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
    defineField({
      name: 'purchasedAt',
      title: 'Purchased at',
      type: 'date',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'money',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
    defineField({
      name: 'abvNote',
      title: 'Exceptional ABV note',
      type: 'string',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
    ...commonFields(),
  ],
  preview: {
    select: {
      title: 'title',
      brewery: 'brewery',
      rating: 'rating',
      media: 'heroImage.image',
    },
    prepare: ({ title, brewery, rating, media }) => ({
      title,
      subtitle: [brewery, rating === undefined ? undefined : `${rating}/5`]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
})

export const reubenReview = defineType({
  name: 'reubenReview',
  title: 'Reuben review',
  type: 'document',
  groups: documentGroups,
  fieldsets: optionalFieldset,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'essentials',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ ...slugField(), group: 'essentials' }),
    defineField({
      name: 'restaurant',
      title: 'Restaurant',
      type: 'string',
      group: 'essentials',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'visitedAt',
      title: 'Visited at',
      type: 'date',
      group: 'essentials',
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'money',
      group: 'essentials',
    }),
    defineField({
      name: 'orderDetails',
      title: 'Order details',
      type: 'object',
      group: 'tasting',
      fields: [
        defineField({ name: 'meat', title: 'Meat', type: 'string' }),
        defineField({ name: 'bread', title: 'Bread', type: 'string' }),
        defineField({ name: 'cheese', title: 'Cheese', type: 'string' }),
        defineField({
          name: 'sauerkraut',
          title: 'Sauerkraut',
          type: 'string',
        }),
        defineField({ name: 'dressing', title: 'Dressing', type: 'string' }),
        defineField({ name: 'portion', title: 'Portion', type: 'string' }),
        defineField({
          name: 'other',
          title: 'Other details',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'label',
                  title: 'Label',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'value',
                  title: 'Value',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'object',
      group: 'optional',
      fieldset: 'optionalDetails',
      fields: [
        defineField({ name: 'city', title: 'City', type: 'string' }),
        defineField({ name: 'address', title: 'Address', type: 'string' }),
        defineField({ name: 'url', title: 'Restaurant URL', type: 'url' }),
      ],
    }),
    ...commonFields(),
  ],
  preview: {
    select: {
      title: 'title',
      restaurant: 'restaurant',
      rating: 'rating',
      media: 'heroImage.image',
    },
    prepare: ({ title, restaurant, rating, media }) => ({
      title,
      subtitle: [restaurant, rating === undefined ? undefined : `${rating}/5`]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
})
