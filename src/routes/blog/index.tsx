import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionJsonLd, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/blog/')({
  loader: () => getCollection({ data: { collection: 'blog' } }),
  head: () => ({
    ...pageHead({
      description: 'Longer notes from sergn.io.',
      path: '/blog',
      title: collectionTitles.blog,
    }),
    scripts: [
      { type: 'application/ld+json', children: collectionJsonLd('blog') },
    ],
  }),
  component: BlogIndex,
})

function BlogIndex() {
  return (
    <CollectionPage
      collection="blog"
      documents={Route.useLoaderData()}
      title="Blog"
    />
  )
}
