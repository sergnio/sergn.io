import { createFileRoute } from '@tanstack/react-router'
import { canonicalUrl, siteJsonLd } from '#/lib/metadata'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ property: 'og:url', content: canonicalUrl('/') }],
    links: [{ rel: 'canonical', href: canonicalUrl('/') }],
    scripts: [{ type: 'application/ld+json', children: siteJsonLd() }],
  }),
  component: HomePage,
})

const pages = [
  { href: '/coffee', title: 'Coffee' },
  { href: '/wings', title: 'Wings' },
  { href: '/na-beers', title: 'N/A beers' },
  { href: '/reubens', title: 'Reubens' },
  { href: '/blog', title: 'Blog' },
]

function HomePage() {
  return (
    <div className="page-shell home-page">
      <h1 className="visually-hidden">sergn.io</h1>
      <nav aria-label="Sections" className="home-index">
        <ul>
          {pages.map(({ href, title }) => (
            <li key={href}>
              <a href={href}>{title}</a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
