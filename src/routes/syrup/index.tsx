import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionFirstScreen, imagesReady } from '#/lib/page-images'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/syrup/')({
  loader: async () => {
    const documents = await getCollection({ data: { collection: 'syrup' } })
    await imagesReady(collectionFirstScreen(documents))
    return documents
  },
  head: ({ loaderData }) => ({
    ...pageHead({
      preloadSans: true,
      description:
        'Pure maple syrup reviews, rated and compared by price per liter.',
      path: '/syrup',
      title: collectionTitles.syrup,
    }),
    scripts: collectionScripts('syrup', loaderData),
  }),
  component: SyrupIndex,
})

function SyrupIndex() {
  return (
    <CollectionPage
      collection="syrup"
      documents={Route.useLoaderData()}
      title="Maple syrup"
    />
  )
}
