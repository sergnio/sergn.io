import type { Template } from 'sanity'

const placeTemplates = [
  ['coffee', 'coffee'],
  ['wingReview', 'wing review'],
  ['naBeer', 'N/A beer'],
  ['reubenReview', 'reuben'],
  ['syrupReview', 'syrup review'],
] as const

export const documentTemplates: Template[] = [
  ...placeTemplates.flatMap(([schemaType, name]) => [
    {
      id: `new-recommended-${schemaType}`,
      title: `New recommended ${name}`,
      schemaType,
      value: { _type: schemaType, recommendationStatus: 'recommended' },
    },
    {
      id: `new-not-recommended-${schemaType}`,
      title: `New not-recommended ${name}`,
      schemaType,
      value: { _type: schemaType, recommendationStatus: 'notRecommended' },
    },
  ]),
  {
    id: 'new-post',
    title: 'New post',
    schemaType: 'post',
    value: { _type: 'post', publishedAt: new Date().toISOString() },
  },
]
