import { createFileRoute, notFound } from '@tanstack/react-router'
import { ContentDetail } from '#/components/content-detail'
import { getDocument } from '#/lib/content.functions'
import { detailHead } from '#/lib/metadata'

export const Route = createFileRoute('/reubens/$slug')({
  loader: async ({ params }) => {
    const document = await getDocument({
      data: { collection: 'reubens', slug: params.slug },
    })
    if (!document || document._type !== 'reubenReview') throw notFound()
    return document
  },
  head: ({ loaderData }) =>
    loaderData ? detailHead('reubens', loaderData) : {},
  component: ReubenDetail,
})

function ReubenDetail() {
  return <ContentDetail document={Route.useLoaderData()} />
}
