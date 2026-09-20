import { orderRankField } from './orderRank'
import { defineField, defineType } from 'sanity'
import {
  crownField,
  formatGradeBadge,
  recommendationStatusField,
  requiredForNonRecommendations,
  requiredForRecommendations,
  slugField,
} from './shared'

const documentGroups = [
  { name: 'essentials', title: 'Essentials', default: true },
  { name: 'photo', title: 'Photo' },
  { name: 'tasting', title: 'Tasting and recipe' },
  { name: 'optional', title: 'Optional details' },
  { name: 'publication', title: 'Publication' },
]

const optionalFieldset = [
  {
    name: 'optionalDetails',
    title: 'Optional details',
    options: { collapsible: true, collapsed: true },
  },
]

function commonFields(type: string) {
  return [
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'imageWithAlt',
      group: 'photo',
      validation: (Rule) =>
        Rule.custom(requiredForRecommendations('Add a hero image.')),
    }),
    defineField({
      name: 'grade',
      title: 'Grade',
      type: 'grade',
      group: 'tasting',
    }),
    crownField(),
    defineField({
      name: 'notes',
      title: 'Review notes',
      type: 'blockContent',
      group: 'tasting',
      validation: (Rule) =>
        Rule.custom(
          requiredForNonRecommendations(
            'Say why you would not recommend this.',
          ),
        ),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
    recommendationStatusField(),
    orderRankField(type),
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
      validation: (Rule) =>
        Rule.custom(requiredForRecommendations('Name the venue.')),
    }),
    defineField({
      name: 'visitedAt',
      title: 'Visited at',
      type: 'date',
      group: 'essentials',
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (Rule) =>
        Rule.custom(requiredForRecommendations('Record the visit date.')),
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
          validation: (Rule) =>
            Rule.custom(
              requiredForRecommendations('Record the style or flavor.'),
            ),
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
      validation: (Rule) =>
        Rule.custom(requiredForRecommendations('Record what was ordered.')),
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
    // Wings owe their notes either way: recommended or not, the write-up is
    // the review.
    ...commonFields('wingReview').map((field) =>
      field.name === 'notes'
        ? defineField({ ...field, validation: (Rule) => Rule.required() })
        : field,
    ),
  ],
  preview: {
    select: {
      title: 'title',
      venue: 'venue',
      grade: 'grade',
      isCrowned: 'isCrowned',
      media: 'heroImage.image',
    },
    prepare: ({ title, venue, grade, isCrowned, media }) => ({
      title,
      subtitle: [venue, formatGradeBadge(grade, isCrowned)]
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
      validation: (Rule) =>
        Rule.custom(requiredForRecommendations('Name the brewery.')),
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
    ...commonFields('naBeer'),
  ],
  preview: {
    select: {
      title: 'title',
      brewery: 'brewery',
      grade: 'grade',
      isCrowned: 'isCrowned',
      media: 'heroImage.image',
    },
    prepare: ({ title, brewery, grade, isCrowned, media }) => ({
      title,
      subtitle: [brewery, formatGradeBadge(grade, isCrowned)]
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
      validation: (Rule) =>
        Rule.custom(requiredForRecommendations('Name the restaurant.')),
    }),
    defineField({
      name: 'visitedAt',
      title: 'Visited at',
      type: 'date',
      group: 'essentials',
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (Rule) =>
        Rule.custom(requiredForRecommendations('Record the visit date.')),
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
    ...commonFields('reubenReview'),
  ],
  preview: {
    select: {
      title: 'title',
      restaurant: 'restaurant',
      grade: 'grade',
      isCrowned: 'isCrowned',
      media: 'heroImage.image',
    },
    prepare: ({ title, restaurant, grade, isCrowned, media }) => ({
      title,
      subtitle: [restaurant, formatGradeBadge(grade, isCrowned)]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
})

export const syrupReview = defineType({
  name: 'syrupReview',
  title: 'Syrup review',
  type: 'document',
  groups: documentGroups,
  fieldsets: optionalFieldset,
  fields: [
    defineField({
      name: 'title',
      title: 'Syrup name',
      type: 'string',
      group: 'essentials',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ ...slugField(), group: 'essentials' }),
    defineField({
      name: 'producer',
      title: 'Producer',
      type: 'string',
      group: 'essentials',
      validation: (Rule) =>
        Rule.custom(requiredForRecommendations('Name the producer.')),
    }),
    defineField({
      name: 'mapleGrade',
      title: 'Maple grade',
      type: 'string',
      group: 'essentials',
      options: {
        list: [
          'Golden, Delicate Taste',
          'Amber, Rich Taste',
          'Dark, Robust Taste',
          'Very Dark, Strong Taste',
        ].map((value) => ({ title: value, value })),
      },
    }),
    defineField({
      name: 'origin',
      title: 'Origin',
      type: 'string',
      group: 'essentials',
    }),
    // Price alone does not compare two syrups, because the bottles are sold in
    // sizes that differ by an order of magnitude.
    defineField({
      name: 'volumeLiters',
      title: 'Volume in liters',
      type: 'number',
      group: 'essentials',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'money',
      group: 'essentials',
    }),
    defineField({
      name: 'boughtFrom',
      title: 'Bought from',
      type: 'string',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
    ...commonFields('syrupReview'),
  ],
  preview: {
    select: {
      title: 'title',
      producer: 'producer',
      grade: 'grade',
      isCrowned: 'isCrowned',
      media: 'heroImage.image',
    },
    prepare: ({ title, producer, grade, isCrowned, media }) => ({
      title,
      subtitle: [producer, formatGradeBadge(grade, isCrowned)]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
})
