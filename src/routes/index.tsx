import { createFileRoute } from '@tanstack/react-router'
import { ContentCard } from '#/components/content-card'
import { getHomeContent } from '#/lib/content.functions'
import { canonicalUrl, siteJsonLd } from '#/lib/metadata'

export const Route = createFileRoute('/')({
  loader: () => getHomeContent(),
  head: () => ({
    meta: [{ property: 'og:url', content: canonicalUrl('/') }],
    links: [{ rel: 'canonical', href: canonicalUrl('/') }],
    scripts: [{ type: 'application/ld+json', children: siteJsonLd() }],
  }),
  component: HomePage,
})

function HomePage() {
  const content = Route.useLoaderData()
  const highlights = [
    {
      collection: 'coffee' as const,
      title: 'Coffee',
      documents: content.coffee,
    },
    { collection: 'wings' as const, title: 'Wings', documents: content.wings },
    {
      collection: 'na-beers' as const,
      title: 'N/A beers',
      documents: content.naBeers,
    },
    {
      collection: 'reubens' as const,
      title: 'Reubens',
      documents: content.reubens,
    },
  ]

  return (
    <div className="page-shell home-page">
      <header className="home-hero">
        <p className="eyebrow">Small, considered things</p>
        <h1>Notes on good food, good drinks, and the places that make them.</h1>
        <p>
          Coffee recipes, wing and reuben reviews, non-alcoholic beer, and the
          occasional longer note.
        </p>
      </header>
      <div className="home-highlights">
        {highlights.map(({ collection, documents, title }) => (
          <section aria-labelledby={`${collection}-heading`} key={collection}>
            <div className="section-heading section-heading--link">
              <div>
                <p className="eyebrow">Latest</p>
                <h2 id={`${collection}-heading`}>{title}</h2>
              </div>
              <a
                aria-label={`See all ${title.toLowerCase()}`}
                href={`/${collection}`}
              >
                See all
              </a>
            </div>
            {documents.length ? (
              <ul
                aria-label={`Latest ${title.toLowerCase()}`}
                className="card-grid card-grid--single"
              >
                {documents.map((document) => (
                  <li key={document._id}>
                    <ContentCard collection={collection} document={document} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">Nothing published here yet.</p>
            )}
          </section>
        ))}
      </div>
      <section aria-labelledby="blog-heading" className="home-blog">
        <div className="section-heading section-heading--link">
          <div>
            <p className="eyebrow">Latest writing</p>
            <h2 id="blog-heading">From the blog</h2>
          </div>
          <a href="/blog">All posts</a>
        </div>
        {content.posts.length ? (
          <ul aria-label="Latest posts" className="card-grid">
            {content.posts.map((post) => (
              <li key={post._id}>
                <ContentCard collection="blog" document={post} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">Nothing published here yet.</p>
        )}
      </section>
    </div>
  )
}
