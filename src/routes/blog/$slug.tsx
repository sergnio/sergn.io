import { createFileRoute, notFound } from '@tanstack/react-router'
import { ContentDetail } from '#/components/content-detail'
import { getDocument } from '#/lib/content.functions'
import { detailHead } from '#/lib/metadata'
import { heroPhoto } from '#/lib/page-photos'
import { photosDecoded } from '#/lib/photo-preload'

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ location, params, preload }) => {
    const document = await getDocument({
      data: { collection: 'blog', slug: params.slug },
    })
    if (!document || document._type !== 'post') throw notFound()
    await photosDecoded([heroPhoto(document)], { location, preload })
    return document
  },
  head: ({ loaderData }) => (loaderData ? detailHead('blog', loaderData) : {}),
  component: BlogDetail,
})

function BlogDetail() {
  return <ContentDetail document={Route.useLoaderData()} />
}
