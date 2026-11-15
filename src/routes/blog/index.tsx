import { createFileRoute } from '@tanstack/react-router'
import { CollectionPage } from '#/components/collection-page'
import { getCollection } from '#/lib/content.functions'
import { collectionFirstScreen, imagesReady } from '#/lib/page-images'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/blog/')({
  loader: async () => {
    const documents = await getCollection({ data: { collection: 'blog' } })
    await imagesReady(collectionFirstScreen(documents))
    return documents
  },
  head: ({ loaderData }) => ({
    ...pageHead({
      description: 'Longer notes from sergn.io.',
      path: '/blog',
      title: collectionTitles.blog,
    }),
    scripts: collectionScripts('blog', loaderData),
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
