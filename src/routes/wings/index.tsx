import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionJsonLd, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/wings/')({
  loader: () => getCollection({ data: { collection: 'wings' } }),
  head: () => ({
    ...pageHead({
      description: 'Wing reviews, flavor notes, and good plates.',
      path: '/wings',
      title: collectionTitles.wings,
    }),
    scripts: [
      { type: 'application/ld+json', children: collectionJsonLd('wings') },
    ],
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
