import { createServerFn } from '@tanstack/react-start'
import { staticFunctionMiddleware } from '@tanstack/start-static-server-functions'
import type { CollectionName } from './content-types'
import { fetchCollection, fetchDocument } from './sanity/queries'

const staticData = [staticFunctionMiddleware]

function collectionInput(data: unknown): { collection: CollectionName } {
  if (!data || typeof data !== 'object') {
    throw new Error('Expected a valid content collection.')
  }

  const input = data as { collection?: unknown }
  if (
    !['coffee', 'wings', 'na-beers', 'reubens', 'blog'].includes(
      String(input.collection),
    )
  ) {
    throw new Error('Expected a valid content collection.')
  }

  return { collection: input.collection as CollectionName }
}

function documentInput(data: unknown): {
  collection: CollectionName
  slug: string
} {
  const collection = collectionInput(data)
  const input = data as { slug?: unknown }

  if (typeof input.slug !== 'string') {
    throw new Error('Expected a content slug.')
  }

  return { ...collection, slug: input.slug }
}

export const getCollection = createServerFn({ method: 'GET' })
  .middleware(staticData)
  .validator(collectionInput)
  .handler(async ({ data }) => {
    switch (data.collection) {
      case 'coffee':
        return fetchCollection('coffee')
      case 'wings':
        return fetchCollection('wings')
      case 'na-beers':
        return fetchCollection('na-beers')
      case 'reubens':
        return fetchCollection('reubens')
      case 'blog':
        return fetchCollection('blog')
    }
  })

export const getDocument = createServerFn({ method: 'GET' })
  .middleware(staticData)
  .validator(documentInput)
  .handler(async ({ data }) => fetchDocument(data.collection, data.slug))
