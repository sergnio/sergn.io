import { createFileRoute } from '@tanstack/react-router'
import { WingsPage } from '#/components/wings-page'
import { getCollection } from '#/lib/content.functions'
import type { WingReview } from '#/lib/content-types'
import { collectionScripts, collectionTitles, pageHead } from '#/lib/metadata'
import { imagesReady, wingsFirstScreen } from '#/lib/page-images'

export const Route = createFileRoute('/wings/')({
  loader: async () => {
    const wings = (await getCollection({
      data: { collection: 'wings' },
    })) as WingReview[]
    await imagesReady(wingsFirstScreen(wings))
    return wings
  },
  head: ({ loaderData }) => ({
    ...pageHead({
      preloadSans: true,
      description: 'Wing reviews, flavor notes, and good plates.',
      path: '/wings',
      title: collectionTitles.wings,
    }),
    scripts: collectionScripts('wings', loaderData),
  }),
  component: WingsIndex,
})

function WingsIndex() {
  return <WingsPage wings={Route.useLoaderData()} />
}
