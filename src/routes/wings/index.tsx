import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { canonicalUrl } from '#/lib/metadata'

export const Route = createFileRoute('/wings/')({
  loader: () => getCollection({ data: { collection: 'wings' } }),
  head: () => ({
    meta: [
      { title: 'Wings | sergn.io' },
      {
        name: 'description',
        content: 'Wing reviews, flavor notes, and good plates.',
      },
    ],
    links: [{ rel: 'canonical', href: canonicalUrl('/wings') }],
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
