import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/wings/')({
  loader: () => getCollection({ data: { collection: 'wings' } }),
  head: () =>
    pageHead({
      description: 'Wing reviews, flavor notes, and good plates.',
      path: '/wings',
      title: 'Wings',
    }),
  component: WingsIndex,
})

function WingsIndex() {
  return (
    <CollectionPage
      collection="wings"
      description="Wing reviews with useful details and no filler."
      documents={Route.useLoaderData()}
      title="Wings"
    />
  )
}
