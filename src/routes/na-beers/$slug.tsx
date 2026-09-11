import { createFileRoute, notFound } from '@tanstack/react-router'
import { ContentDetail } from '#/components/content-detail'
import { getDocument } from '#/lib/content.functions'
import { detailHead } from '#/lib/metadata'

export const Route = createFileRoute('/na-beers/$slug')({
  loader: async ({ params }) => {
    const document = await getDocument({
      data: { collection: 'na-beers', slug: params.slug },
    })
    if (!document || document._type !== 'naBeer') throw notFound()
    return document
  },
  head: ({ loaderData }) =>
    loaderData ? detailHead('na-beers', loaderData) : {},
  component: NaBeerDetail,
})

function NaBeerDetail() {
  return <ContentDetail document={Route.useLoaderData()} />
}
