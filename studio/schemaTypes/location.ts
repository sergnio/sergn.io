import { defineField, defineType } from 'sanity'
import type { ValidationContext } from 'sanity'
import { slugFields } from './shared'

/**
 * One physical place, not a brand: two branches of the same chain are two
 * locations. Visits are counted here because a visit is to the place, not to
 * any one thing ordered there. Locations are never ranked; what is served at
 * them is.
 */
export const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => [
        Rule.required(),
        Rule.custom(warnOnNameAndCityTwin).warning(),
      ],
    }),
    ...slugFields({ source: 'name' }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'url', title: 'Website', type: 'url' }),
    defineField({ name: 'point', title: 'Map point', type: 'geopoint' }),
    defineField({
      name: 'visitCount',
      title: 'Visit count',
      description: 'How many times we have eaten here.',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.integer().min(1),
    }),
  ],
  preview: {
    select: { title: 'name', city: 'city', address: 'address' },
    prepare: ({ title, city, address }) => ({
      title,
      subtitle: [address, city].filter(Boolean).join(', '),
    }),
  },
})

async function warnOnNameAndCityTwin(
  name: unknown,
  context: ValidationContext,
) {
  const document = context.document as
    { _id: string; city?: string } | undefined
  if (typeof name !== 'string' || !name.trim() || !document?.city?.trim()) {
    return true
  }

  const id = document._id.replace(/^drafts\./, '')
  const twin = await context
    .getClient({ apiVersion: '2025-05-01' })
    .fetch<{ address?: string } | null>(
      '*[_type == "location" && lower(name) == lower($name) && lower(city) == lower($city) && !(_id in [$draftId, $publishedId])][0]{address}',
      {
        name: name.trim(),
        city: document.city.trim(),
        draftId: `drafts.${id}`,
        publishedId: id,
      },
    )

  return twin === null
    ? true
    : `Another location in this city already has this name${twin.address ? ` (${twin.address})` : ''}. Pick that one from the wing instead, unless this is a different branch.`
}
