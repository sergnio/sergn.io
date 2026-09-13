import { createFileRoute, Link } from '@tanstack/react-router'
import { pageHead } from '#/lib/metadata'

export const Route = createFileRoute('/retired-content')({
  head: () => {
    const head = pageHead({
      description:
        'Syrup reviews have retired. sergn.io now covers coffee, wings, N/A beers, reubens, and the blog.',
      path: '/retired-content',
      title: 'Retired content',
    })
    return {
      ...head,
      meta: [...head.meta, { name: 'robots', content: 'noindex' }],
    }
  },
  component: RetiredContent,
})

function RetiredContent() {
  return (
    <div className="not-found page-shell">
      <p className="eyebrow">Retired content</p>
      <h1>Syrup reviews have retired.</h1>
      <p>
        This site now focuses on coffee, wings, N/A beers, reubens, and the
        blog. The old syrup pages are intentionally unavailable.
      </p>
      <Link className="button-link" to="/">
        Explore current notes
      </Link>
    </div>
  )
}
