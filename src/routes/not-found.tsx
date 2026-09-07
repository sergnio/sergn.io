import { createFileRoute } from '@tanstack/react-router'
import { NotFoundContent } from '#/components/not-found'

export const Route = createFileRoute('/not-found')({
  head: () => ({
    meta: [{ title: '404 | sergn.io' }, { name: 'robots', content: 'noindex' }],
  }),
  component: NotFoundContent,
})
