import { defineField, defineType } from 'sanity'
import { slugField } from './shared'

type BrewRecipeValue = {
  method?: string
  methodOther?: string
  grinder?: {
    name?: string
    system?: string
    number?: number
    rotations?: number
    setting?: number
  }
  notes?: string
}

export function validateBrewRecipe(value: BrewRecipeValue | undefined) {
  if (!value?.method) return 'Choose a brew method.'
  if (value.method === 'Other' && !value.methodOther?.trim()) {
    return 'Describe the other brew method.'
  }

  const grinder = value.grinder
  if (!grinder?.name?.trim() || !grinder.system) {
    return 'Add the grinder name and system.'
  }

  if (grinder.system === 'manual-number-rotations') {
    if (
      typeof grinder.number !== 'number' ||
      typeof grinder.rotations !== 'number'
    ) {
      return 'Manual recipes require both a grinder number and rotations.'
    }
    if (grinder.number < 0 || grinder.rotations < 0) {
      return 'Manual grinder number and rotations cannot be negative.'
    }
  }

  if (grinder.system === 'niche-setting') {
    if (typeof grinder.setting !== 'number' || grinder.setting < 0) {
      return 'Niche recipes require a non-negative setting.'
    }
  }

  if (grinder.system === 'other' && !value.notes?.trim()) {
    return 'Add a practical note for this grinder system.'
  }

  return true
}

const grinder = defineType({
  name: 'grinder',
  title: 'Grinder',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Grinder name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'system',
      title: 'Setting system',
      type: 'string',
      options: {
        list: [
          {
            title: 'Manual number and rotations',
            value: 'manual-number-rotations',
          },
          { title: 'Niche setting', value: 'niche-setting' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'model', title: 'Model', type: 'string' }),
    defineField({
      name: 'number',
      title: 'Grinder number',
      type: 'number',
      hidden: ({ parent }) =>
        (parent as { system?: string } | undefined)?.system !==
        'manual-number-rotations',
      validation: (Rule) =>
        Rule.min(0).custom((value, context) =>
          (context.parent as { system?: string } | undefined)?.system ===
            'manual-number-rotations' && typeof value !== 'number'
            ? 'A manual recipe needs a grinder number.'
            : true,
        ),
    }),
    defineField({
      name: 'rotations',
      title: 'Rotations',
      type: 'number',
      hidden: ({ parent }) =>
        (parent as { system?: string } | undefined)?.system !==
        'manual-number-rotations',
      validation: (Rule) =>
        Rule.min(0).custom((value, context) =>
          (context.parent as { system?: string } | undefined)?.system ===
            'manual-number-rotations' && typeof value !== 'number'
            ? 'A manual recipe needs rotations.'
            : true,
        ),
    }),
    defineField({
      name: 'setting',
      title: 'Niche setting',
      type: 'number',
      hidden: ({ parent }) =>
        (parent as { system?: string } | undefined)?.system !== 'niche-setting',
      validation: (Rule) =>
        Rule.min(0).custom((value, context) =>
          (context.parent as { system?: string } | undefined)?.system ===
            'niche-setting' && typeof value !== 'number'
            ? 'A Niche recipe needs a setting.'
            : true,
        ),
    }),
  ],
})

const brewRecipe = defineType({
  name: 'brewRecipe',
  title: 'Brew recipe',
  type: 'object',
  fields: [
    defineField({
      name: 'method',
      title: 'Method',
      type: 'string',
      options: {
        list: [
          'Moka Pot',
          'Filter',
          'V60',
          'Espresso',
          'AeroPress',
          'French Press',
          'Other',
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'methodOther',
      title: 'Other method',
      type: 'string',
      hidden: ({ parent }) =>
        (parent as { method?: string } | undefined)?.method !== 'Other',
      validation: (Rule) =>
        Rule.custom((value, context) =>
          (context.parent as { method?: string } | undefined)?.method ===
            'Other' && !value?.trim()
            ? 'Describe the other brew method.'
            : true,
        ),
    }),
    defineField({ name: 'label', title: 'Recipe label', type: 'string' }),
    defineField({ name: 'grinder', title: 'Grinder', type: 'grinder' }),
    defineField({
      name: 'doseGrams',
      title: 'Dose (g)',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'waterGrams',
      title: 'Water (g)',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'yieldGrams',
      title: 'Yield (g)',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'waterTemperatureC',
      title: 'Water temperature (°C)',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'brewTimeSeconds',
      title: 'Brew time (seconds)',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({ name: 'ratio', title: 'Ratio', type: 'string' }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'notes',
      title: 'Practical note',
      type: 'text',
      rows: 3,
    }),
  ],
  validation: (Rule) => Rule.custom((value) => validateBrewRecipe(value)),
  preview: {
    select: { title: 'label', method: 'method', grinder: 'grinder.name' },
    prepare: ({ title, method, grinder: grinderName }) => ({
      title: title || method || 'Brew recipe',
      subtitle: grinderName,
    }),
  },
})

export const coffee = defineType({
  name: 'coffee',
  title: 'Coffee',
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
      title: 'Coffee name',
      type: 'string',
      group: 'essentials',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ ...slugField(), group: 'essentials' }),
    defineField({
      name: 'boughtFrom',
      title: 'Bought from',
      type: 'string',
      group: 'essentials',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bagSize',
      title: 'Bag size',
      type: 'packageSize',
      group: 'essentials',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          const packageValue = value as { unit?: string } | undefined
          return packageValue?.unit === 'g' || packageValue?.unit === 'oz'
            ? true
            : 'Coffee bags must use g or oz.'
        }),
    }),
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
      name: 'brewRecipes',
      title: 'Brew recipes',
      type: 'array',
      group: 'tasting',
      of: [{ type: 'brewRecipe' }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'tastingNotes',
      title: 'Tasting notes',
      type: 'array',
      group: 'tasting',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'notes',
      title: 'Longer notes',
      type: 'blockContent',
      group: 'tasting',
    }),
    defineField({
      name: 'roaster',
      title: 'Roaster',
      type: 'string',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
    defineField({
      name: 'origin',
      title: 'Origin',
      type: 'string',
      group: 'optional',
      fieldset: 'optionalDetails',
    }),
    defineField({
      name: 'purchaseUrl',
      title: 'Purchase URL',
      type: 'url',
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
      name: 'roastDate',
      title: 'Roast date',
      type: 'date',
      group: 'optional',
      fieldset: 'optionalDetails',
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
  ],
  preview: {
    select: { title: 'title', roaster: 'roaster', media: 'heroImage.image' },
    prepare: ({ title, roaster, media }) => ({
      title,
      subtitle: roaster,
      media,
    }),
  },
})

export const coffeeSchemaTypes = [grinder, brewRecipe, coffee]
