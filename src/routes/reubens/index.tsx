import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { canonicalUrl } from '#/lib/metadata'

export const Route = createFileRoute('/reubens/')({
  loader: () => getCollection({ data: { collection: 'reubens' } }),
  head: () => ({
    meta: [
      { title: 'Reubens | sergn.io' },
      {
        name: 'description',
        content: 'Reuben reviews with the sandwich details that matter.',
      },
    ],
    links: [{ rel: 'canonical', href: canonicalUrl('/reubens') }],
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
