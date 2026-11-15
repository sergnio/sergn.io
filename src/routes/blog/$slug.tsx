import { createFileRoute, notFound } from '@tanstack/react-router'
import { ContentDetail } from '#/components/content-detail'
import { getDocument } from '#/lib/content.functions'
import { detailHead } from '#/lib/metadata'
import { detailFirstScreen, imagesReady } from '#/lib/page-images'

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const document = await getDocument({
      data: { collection: 'blog', slug: params.slug },
    })
    if (!document || document._type !== 'post') throw notFound()
    await imagesReady(detailFirstScreen(document))
    return document
  },
  head: ({ loaderData }) => (loaderData ? detailHead('blog', loaderData) : {}),
  component: BlogDetail,
})

function BlogDetail() {
  return <ContentDetail document={Route.useLoaderData()} />
}
