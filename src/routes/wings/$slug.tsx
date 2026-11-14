import { createFileRoute, notFound } from '@tanstack/react-router'
import { WingDetail } from '#/components/wing-detail'
import { getCollection } from '#/lib/content.functions'
import type { WingReview } from '#/lib/content-types'
import { detailHead } from '#/lib/metadata'
import { wingPageData } from '#/lib/wings'

export const Route = createFileRoute('/wings/$slug')({
  loader: async ({ params }) => {
    const wings = (await getCollection({
      data: { collection: 'wings' },
    })) as WingReview[]
    const page = wingPageData(wings, params.slug)
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData }) =>
    loaderData ? detailHead('wings', loaderData.wing) : {},
  component: WingsDetail,
})

function WingsDetail() {
  return <WingDetail {...Route.useLoaderData()} />
}
