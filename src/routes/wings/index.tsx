import { createFileRoute } from '@tanstack/react-router'
import { WingsPage } from '#/components/wings-page'
import { getCollection } from '#/lib/content.functions'
import { firstScreenListPhotos } from '#/lib/page-photos'
import { photosDecoded } from '#/lib/photo-preload'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/wings/')({
  loader: async ({ location, preload }) => {
    const documents = await getCollection({ data: { collection: 'wings' } })
    await photosDecoded(firstScreenListPhotos('wings', documents), {
      location,
      preload,
    })
    return documents
  },
  head: ({ loaderData }) => ({
    ...pageHead({
      preloadSans: true,
      description: 'Wing reviews, flavor notes, and good plates.',
      path: '/wings',
      title: collectionTitles.wings,
    }),
    scripts: collectionScripts('wings', loaderData),
  }),
  component: WingsIndex,
})

function WingsIndex() {
  return <WingsPage wings={Route.useLoaderData()} />
}
