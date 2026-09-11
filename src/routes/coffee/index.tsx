import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionJsonLd, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/coffee/')({
  loader: () => getCollection({ data: { collection: 'coffee' } }),
  head: () => ({
    ...pageHead({
      description: 'Coffee notes and practical brew recipes.',
      path: '/coffee',
      title: collectionTitles.coffee,
    }),
    scripts: [
      { type: 'application/ld+json', children: collectionJsonLd('coffee') },
    ],
  }),
  component: CoffeeIndex,
})

function CoffeeIndex() {
  return (
    <CollectionPage
      collection="coffee"
      description="Coffee worth remembering, with practical grinder and brew details."
      documents={Route.useLoaderData()}
      title="Coffee"
    />
  )
}
