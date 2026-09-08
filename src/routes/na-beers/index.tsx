import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { canonicalUrl } from '#/lib/metadata'

export const Route = createFileRoute('/na-beers/')({
  loader: () => getCollection({ data: { collection: 'na-beers' } }),
  head: () => ({
    meta: [
      { title: 'N/A Beers | sergn.io' },
      {
        name: 'description',
        content: 'N/A beer reviews for the beers worth drinking again.',
      },
    ],
    links: [{ rel: 'canonical', href: canonicalUrl('/na-beers') }],
  }),
  component: NaBeersIndex,
})

function NaBeersIndex() {
  return (
    <CollectionPage
      collection="na-beers"
      description="Non-alcoholic beers with notes on what makes each one work."
      documents={Route.useLoaderData()}
      title="N/A Beers"
    />
  )
}
