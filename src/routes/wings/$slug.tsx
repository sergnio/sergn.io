import { createFileRoute, notFound } from '@tanstack/react-router'
import { ContentDetail } from '#/components/content-detail'
import { getDocument } from '#/lib/content.functions'
import { detailHead } from '#/lib/metadata'

export const Route = createFileRoute('/wings/$slug')({
  loader: async ({ params }) => {
    const document = await getDocument({
      data: { collection: 'wings', slug: params.slug },
    })
    if (!document || document._type !== 'wingReview') throw notFound()
    return document
  },
  head: ({ loaderData }) => (loaderData ? detailHead('wings', loaderData) : {}),
  component: WingsDetail,
})

function WingsDetail() {
  return <ContentDetail document={Route.useLoaderData()} />
}
