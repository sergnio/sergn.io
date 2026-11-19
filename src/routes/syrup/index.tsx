import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { firstScreenListPhotos } from '#/lib/page-photos'
import { photosDecoded } from '#/lib/photo-preload'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/syrup/')({
  loader: async ({ location, preload }) => {
    const documents = await getCollection({ data: { collection: 'syrup' } })
    await photosDecoded(firstScreenListPhotos('syrup', documents), {
      location,
      preload,
    })
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
