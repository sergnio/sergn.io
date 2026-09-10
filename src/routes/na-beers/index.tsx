import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/na-beers/')({
  loader: () => getCollection({ data: { collection: 'na-beers' } }),
  head: () =>
    pageHead({
      description: 'N/A beer reviews for the beers worth drinking again.',
      path: '/na-beers',
      title: 'N/A Beers',
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
