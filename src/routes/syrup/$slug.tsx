import { createFileRoute, notFound } from '@tanstack/react-router'
import { ContentDetail } from '#/components/content-detail'
import { getDocument } from '#/lib/content.functions'
import { detailHead } from '#/lib/metadata'

export const Route = createFileRoute('/syrup/$slug')({
  loader: async ({ params }) => {
    const document = await getDocument({
      data: { collection: 'syrup', slug: params.slug },
    })
    if (!document || document._type !== 'syrupReview') throw notFound()
    return document
  },
  head: ({ loaderData }) => (loaderData ? detailHead('syrup', loaderData) : {}),
  component: SyrupDetail,
})

function SyrupDetail() {
  return <ContentDetail document={Route.useLoaderData()} />
}
