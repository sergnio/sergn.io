import { createFileRoute } from '@tanstack/react-router'
import { canonicalUrl } from '#/lib/metadata'

export const Route = createFileRoute('/retired-content')({
  head: () => ({
    meta: [
      { title: 'Retired content | sergn.io' },
      { name: 'robots', content: 'noindex' },
    ],
    links: [{ rel: 'canonical', href: canonicalUrl('/retired-content') }],
  }),
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
      <a className="button-link" href="/">
        Explore current notes
      </a>
    </div>
  )
}
