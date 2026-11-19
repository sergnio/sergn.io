import { createFileRoute, notFound } from '@tanstack/react-router'
import { ContentDetail } from '#/components/content-detail'
import { getDocument } from '#/lib/content.functions'
import { detailHead } from '#/lib/metadata'
import { heroPhoto } from '#/lib/page-photos'
import { photosDecoded } from '#/lib/photo-preload'

export const Route = createFileRoute('/coffee/$slug')({
  loader: async ({ location, params, preload }) => {
    const document = await getDocument({
      data: { collection: 'coffee', slug: params.slug },
    })
    if (!document || document._type !== 'coffee') throw notFound()
    await photosDecoded([heroPhoto(document)], { location, preload })
    return document
  },
  head: ({ loaderData }) =>
    loaderData ? detailHead('coffee', loaderData) : {},
  component: CoffeeDetail,
})

function CoffeeDetail() {
  return <ContentDetail document={Route.useLoaderData()} />
}
