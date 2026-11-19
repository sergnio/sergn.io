import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { firstScreenListPhotos } from '#/lib/page-photos'
import { photosDecoded } from '#/lib/photo-preload'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/reubens/')({
  loader: async ({ location, preload }) => {
    const documents = await getCollection({ data: { collection: 'reubens' } })
    await photosDecoded(firstScreenListPhotos('reubens', documents), {
      location,
      preload,
    })
    return documents
  },
  head: ({ loaderData }) => ({
    ...pageHead({
      preloadSans: true,
      description: 'Reuben reviews with the sandwich details that matter.',
      path: '/reubens',
      title: collectionTitles.reubens,
    }),
    scripts: collectionScripts('reubens', loaderData),
  }),
  component: ReubensIndex,
})

function ReubensIndex() {
  return (
    <CollectionPage
      collection="reubens"
      documents={Route.useLoaderData()}
      title="Reubens"
    />
  )
}
