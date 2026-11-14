import { createFileRoute } from '@tanstack/react-router'
import { NotFoundContent } from '#/components/not-found'
import { sansFontPreload } from '#/lib/font-preloads'

export const Route = createFileRoute('/not-found')({
  head: () => ({
    meta: [{ title: '404 | sergn.io' }, { name: 'robots', content: 'noindex' }],
    links: [sansFontPreload],
  }),
  component: NotFoundContent,
})
