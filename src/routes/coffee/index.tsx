import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { canonicalUrl } from '#/lib/metadata'

export const Route = createFileRoute('/coffee/')({
  loader: () => getCollection({ data: { collection: 'coffee' } }),
  head: () => ({
    meta: [
      { title: 'Coffee | sergn.io' },
      {
        name: 'description',
        content: 'Coffee notes and practical brew recipes.',
      },
    ],
    links: [{ rel: 'canonical', href: canonicalUrl('/coffee') }],
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
