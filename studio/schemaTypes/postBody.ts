import { defineArrayMember, defineField, defineType } from 'sanity'

const linkAnnotation = defineArrayMember({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({
      name: 'href',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.required().uri({ allowRelative: true }),
    }),
  ],
})

const inlineDecorators = [
  { title: 'Strong', value: 'strong' },
  { title: 'Emphasis', value: 'em' },
  { title: 'Underline', value: 'underline' },
  { title: 'Strike', value: 'strike-through' },
  { title: 'Code', value: 'code' },
]

export const callout = defineType({
  name: 'callout',
  title: 'Callout',
  type: 'object',
  fields: [
    defineField({
      name: 'tone',
      title: 'Tone',
      type: 'string',
      initialValue: 'note',
      options: {
        list: [
          { title: 'Note', value: 'note' },
          { title: 'Warning', value: 'warning' },
          { title: 'Pull quote', value: 'quote' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
          marks: {
            decorators: inlineDecorators,
            annotations: [linkAnnotation],
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: { tone: 'tone', content: 'content' },
    prepare: ({ tone, content }) => ({
      title: content?.[0]?.children?.[0]?.text || 'Callout',
      subtitle: tone,
    }),
  },
})

export const divider = defineType({
  name: 'divider',
  title: 'Divider',
  type: 'object',
  fields: [
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      initialValue: 'line',
      options: {
        list: [
          { title: 'Line', value: 'line' },
          { title: 'Asterisks', value: 'asterisks' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { variant: 'variant' },
    prepare: ({ variant }) => ({ title: `Divider (${variant})` }),
  },
})

export const codeBlock = defineType({
  name: 'codeBlock',
  title: 'Code block',
  type: 'object',
  fields: [
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      initialValue: 'text',
      options: {
        list: [
          'text',
          'bash',
          'json',
          'typescript',
          'tsx',
          'javascript',
          'css',
          'html',
          'python',
          'go',
          'sql',
          'yaml',
        ].map((value) => ({ title: value, value })),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'filename',
      title: 'Filename',
      type: 'string',
      description: 'Shown above the code, e.g. src/lib/sanity/queries.ts',
    }),
    defineField({
      name: 'code',
      title: 'Code',
      type: 'text',
      rows: 12,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { language: 'language', filename: 'filename', code: 'code' },
    prepare: ({ language, filename, code }) => ({
      title: filename || code?.split('\n')[0] || 'Code',
      subtitle: language,
    }),
  },
})

/**
 * The writing surface for blog posts. Unlike `blockContent`, which stays
 * deliberately strict for the structured food and coffee documents, this
 * trades constraint for expression: a post is prose first.
 */
export const postBody = defineType({
  name: 'postBody',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Heading 4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        decorators: inlineDecorators,
        annotations: [linkAnnotation],
      },
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Number', value: 'number' },
      ],
    }),
    defineArrayMember({ type: 'imageWithAlt' }),
    defineArrayMember({ type: 'callout' }),
    defineArrayMember({ type: 'codeBlock' }),
    defineArrayMember({ type: 'divider' }),
  ],
})
