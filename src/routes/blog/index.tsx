import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/blog/')({
  loader: () => getCollection({ data: { collection: 'blog' } }),
  head: () =>
    pageHead({
      description: 'Longer notes from sergn.io.',
      path: '/blog',
      title: 'Blog',
    }),
  component: BlogIndex,
})

function BlogIndex() {
  return (
    <CollectionPage
      collection="blog"
      description="Longer notes on good food, good drinks, and the small details."
      documents={Route.useLoaderData()}
      title="Blog"
    />
  )
}
