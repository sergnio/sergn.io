import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/reubens/')({
  loader: () => getCollection({ data: { collection: 'reubens' } }),
  head: ({ loaderData }) => ({
    ...pageHead({
      description: 'Reuben reviews with the sandwich details that matter.',
      path: '/reubens',
      title: collectionTitles.reubens,
    }),
    scripts: collectionScripts('reubens', loaderData),
  }),
  component: ReubensIndex,
})

function ReubensIndex() {
  return (
    <CollectionPage
      collection="reubens"
      documents={Route.useLoaderData()}
      title="Reubens"
    />
  )
}
