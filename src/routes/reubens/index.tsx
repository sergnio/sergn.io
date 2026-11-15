import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionFirstScreen, imagesReady } from '#/lib/page-images'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/reubens/')({
  loader: async () => {
    const documents = await getCollection({ data: { collection: 'reubens' } })
    await imagesReady(collectionFirstScreen(documents))
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
