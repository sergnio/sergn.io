import { createFileRoute, notFound } from '@tanstack/react-router'
import { ContentDetail } from '#/components/content-detail'
import { getDocument } from '#/lib/content.functions'
import { detailHead } from '#/lib/metadata'

export const Route = createFileRoute('/coffee/$slug')({
  loader: async ({ params }) => {
    const document = await getDocument({
      data: { collection: 'coffee', slug: params.slug },
    })
    if (!document || document._type !== 'coffee') throw notFound()
    return document
  },
  head: ({ loaderData }) =>
    loaderData ? detailHead('coffee', loaderData) : {},
  component: CoffeeDetail,
})

function CoffeeDetail() {
  return <ContentDetail document={Route.useLoaderData()} />
}
