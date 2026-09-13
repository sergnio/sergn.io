import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/na-beers/')({
  loader: () => getCollection({ data: { collection: 'na-beers' } }),
  head: ({ loaderData }) => ({
    ...pageHead({
      description: 'N/A beer reviews for the beers worth drinking again.',
      path: '/na-beers',
      title: collectionTitles['na-beers'],
    }),
    scripts: collectionScripts('na-beers', loaderData),
  }),
  component: NaBeersIndex,
})

function NaBeersIndex() {
  return (
    <CollectionPage
      collection="na-beers"
      documents={Route.useLoaderData()}
      title="N/A Beers"
    />
  )
}
