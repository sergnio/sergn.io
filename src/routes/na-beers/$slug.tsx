import { createFileRoute, notFound } from '@tanstack/react-router'
import { ContentDetail } from '#/components/content-detail'
import { getDocument } from '#/lib/content.functions'
import { detailHead } from '#/lib/metadata'
import { heroPhoto } from '#/lib/page-photos'
import { photosDecoded } from '#/lib/photo-preload'

export const Route = createFileRoute('/na-beers/$slug')({
  loader: async ({ location, params, preload }) => {
    const document = await getDocument({
      data: { collection: 'na-beers', slug: params.slug },
    })
    if (!document || document._type !== 'naBeer') throw notFound()
    await photosDecoded([heroPhoto(document)], { location, preload })
    return document
  },
  head: ({ loaderData }) =>
    loaderData ? detailHead('na-beers', loaderData) : {},
  component: NaBeerDetail,
})

function NaBeerDetail() {
  return <ContentDetail document={Route.useLoaderData()} />
}
