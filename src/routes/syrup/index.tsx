import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionJsonLd, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/syrup/')({
  loader: () => getCollection({ data: { collection: 'syrup' } }),
  head: () => ({
    ...pageHead({
      description:
        'Pure maple syrup reviews, rated and compared by price per liter.',
      path: '/syrup',
      title: collectionTitles.syrup,
    }),
    scripts: [
      { type: 'application/ld+json', children: collectionJsonLd('syrup') },
    ],
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
