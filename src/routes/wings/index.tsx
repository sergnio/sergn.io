import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/wings/')({
  loader: () => getCollection({ data: { collection: 'wings' } }),
  head: ({ loaderData }) => ({
    ...pageHead({
      description: 'Wing reviews, flavor notes, and good plates.',
      path: '/wings',
      title: collectionTitles.wings,
    }),
    scripts: collectionScripts('wings', loaderData),
  }),
  component: WingsIndex,
})

function WingsIndex() {
  return (
    <CollectionPage
      collection="wings"
      documents={Route.useLoaderData()}
      title="Wings"
    />
  )
}
