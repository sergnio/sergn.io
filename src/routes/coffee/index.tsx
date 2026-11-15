import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionFirstScreen, imagesReady } from '#/lib/page-images'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/coffee/')({
  loader: async () => {
    const documents = await getCollection({ data: { collection: 'coffee' } })
    await imagesReady(collectionFirstScreen(documents))
    return documents
  },
  head: ({ loaderData }) => ({
    ...pageHead({
      preloadSans: true,
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
