import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/reubens/')({
  loader: () => getCollection({ data: { collection: 'reubens' } }),
  head: () =>
    pageHead({
      description: 'Reuben reviews with the sandwich details that matter.',
      path: '/reubens',
      title: 'Reubens',
    }),
  component: ReubensIndex,
})

function ReubensIndex() {
  return (
    <CollectionPage
      collection="reubens"
      description="Reubens worth returning to, recorded sandwich by sandwich."
      documents={Route.useLoaderData()}
      title="Reubens"
    />
  )
}
