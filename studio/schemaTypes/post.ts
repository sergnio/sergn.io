import { defineField, defineType } from 'sanity'
import { slugField } from './shared'

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  groups: [
    { name: 'essentials', title: 'Essentials', default: true },
    { name: 'photo', title: 'Photo' },
    { name: 'tasting', title: 'Tasting and recipe' },
    { name: 'optional', title: 'Optional details' },
  ],
  fieldsets: [
    {
      name: 'optionalDetails',
      title: 'Optional details',
      options: { collapsible: true, collapsed: true },
    },
  ],
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
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'essentials',
      validation: (Rule) =>
        Rule.required().warning('Keep excerpts under 160 characters.').max(160),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'essentials',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'imageWithAlt',
      group: 'photo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: 'tasting',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'optional',
      fieldset: 'optionalDetails',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      validation: (Rule) => Rule.unique().max(8),
    }),
    defineField({
      name: 'featured',
      title: 'Feature on home page',
      type: 'boolean',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
    defineField({
      name: 'seo',
      title: 'SEO overrides',
      type: 'object',
      group: 'optional',
      fieldset: 'optionalDetails',
      fields: [
        defineField({
          name: 'title',
          title: 'SEO title',
          type: 'string',
          validation: (Rule) =>
            Rule.warning('Keep SEO titles under 60 characters.').max(60),
        }),
        defineField({
          name: 'description',
          title: 'SEO description',
          type: 'text',
          rows: 3,
          validation: (Rule) =>
            Rule.warning('Keep SEO descriptions under 160 characters.').max(
              160,
            ),
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', date: 'publishedAt', media: 'coverImage.image' },
    prepare: ({ title, date, media }) => ({
      title,
      subtitle: date ? new Date(date).toLocaleDateString() : 'Draft',
      media,
    }),
  },
})
