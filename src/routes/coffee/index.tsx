import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/coffee/')({
  loader: () => getCollection({ data: { collection: 'coffee' } }),
  head: ({ loaderData }) => ({
    ...pageHead({
      description: 'Coffee notes and practical brew recipes.',
      path: '/coffee',
      title: collectionTitles.coffee,
    }),
    scripts: collectionScripts('coffee', loaderData),
  }),
  component: CoffeeIndex,
})

function CoffeeIndex() {
  return (
    <CollectionPage
      collection="coffee"
      documents={Route.useLoaderData()}
      title="Coffee"
    />
  )
}
