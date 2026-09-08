import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { canonicalUrl } from '#/lib/metadata'

export const Route = createFileRoute('/blog/')({
  loader: () => getCollection({ data: { collection: 'blog' } }),
  head: () => ({
    meta: [
      { title: 'Blog | sergn.io' },
      { name: 'description', content: 'Longer notes from sergn.io.' },
    ],
    links: [{ rel: 'canonical', href: canonicalUrl('/blog') }],
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
