import type { Template } from 'sanity'

export const documentTemplates: Template[] = [
  {
    id: 'new-coffee',
    title: 'New coffee',
    schemaType: 'coffee',
    value: { _type: 'coffee', brewRecipes: [] },
  },
  {
    id: 'new-wing-review',
    title: 'New wing review',
    schemaType: 'wingReview',
    value: {
      _type: 'wingReview',
      visitedAt: new Date().toISOString().slice(0, 10),
    },
  },
  {
    id: 'new-na-beer',
    title: 'New N/A beer',
    schemaType: 'naBeer',
    value: { _type: 'naBeer' },
  },
  {
    id: 'new-reuben',
    title: 'New reuben',
    schemaType: 'reubenReview',
    value: {
      _type: 'reubenReview',
      visitedAt: new Date().toISOString().slice(0, 10),
    },
  },
  {
    id: 'new-post',
    title: 'New post',
    schemaType: 'post',
    value: { _type: 'post', publishedAt: new Date().toISOString() },
  },
]
