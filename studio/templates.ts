import type { Template } from 'sanity'

const today = () => new Date().toISOString().slice(0, 10)

/** What each review starts with before its recommendation status is applied. */
const reviewTemplates = [
  { schemaType: 'coffee', name: 'coffee', initialValue: { brewRecipes: [] } },
  {
    schemaType: 'wingReview',
    name: 'wing review',
    initialValue: { visitedAt: today() },
  },
  { schemaType: 'naBeer', name: 'N/A beer', initialValue: {} },
  {
    schemaType: 'reubenReview',
    name: 'reuben',
    initialValue: { visitedAt: today() },
  },
  { schemaType: 'syrupReview', name: 'syrup review', initialValue: {} },
] as const

export const documentTemplates: Template[] = [
  ...reviewTemplates.flatMap(({ schemaType, name, initialValue }) => [
    {
      id: `new-recommended-${schemaType}`,
      title: `New recommended ${name}`,
      schemaType,
      value: {
        _type: schemaType,
        ...initialValue,
        recommendationStatus: 'recommended',
      },
    },
    {
      id: `new-not-recommended-${schemaType}`,
      title: `New not-recommended ${name}`,
      schemaType,
      value: {
        _type: schemaType,
        ...initialValue,
        recommendationStatus: 'notRecommended',
      },
    },
  ]),
  {
    id: 'new-post',
    title: 'New post',
    schemaType: 'post',
    value: { _type: 'post', publishedAt: new Date().toISOString() },
  },
]
