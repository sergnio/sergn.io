// Emits dist/client/feed.xml: an RSS 2.0 feed of the blog.
//
// The items are read back out of the prerendered blog pages rather than
// re-fetched from Sanity, so the feed can never describe content the site
// does not actually serve, and an empty dataset simply yields an empty
// channel instead of a build failure.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const outputDirectory = path.join(process.cwd(), 'dist', 'client')
const siteUrl = 'https://sergn.io'
const feedPath = '/feed.xml'
const channelTitle = 'sergn.io blog'
const channelDescription =
  'Longer notes on good food, good drinks, and the small details.'

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function articleJsonLd(html, page) {
  for (const [, block] of html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs,
  )) {
    const parsed = JSON.parse(block)
    if (parsed['@type'] === 'Article') {
      return parsed
    }
  }
  throw new Error(
    `Prerendered ${page} has no Article JSON-LD to build a feed item from.`,
  )
}

const indexHtml = await readFile(
  path.join(outputDirectory, 'blog', 'index.html'),
  'utf8',
)
// Each card links its post more than once (image and title), so the raw
// match list has to be de-duplicated before it becomes feed items.
const slugs = [
  ...new Set(
    [...indexHtml.matchAll(/href="\/blog\/([^"/?#]+)"/g)].map((match) =>
      decodeURIComponent(match[1]),
    ),
  ),
]

const items = []
for (const slug of slugs) {
  const page = `blog/${slug}/index.html`
  const article = articleJsonLd(
    await readFile(path.join(outputDirectory, page), 'utf8'),
    page,
  )
  const published = new Date(article.datePublished)
  if (Number.isNaN(published.getTime())) {
    throw new Error(`Prerendered ${page} has an unparseable datePublished.`)
  }
  items.push({
    description: article.description ?? '',
    link: `${siteUrl}/blog/${slug}`,
    published,
    title: article.headline,
  })
}

items.sort((a, b) => b.published.getTime() - a.published.getTime())

// Deliberately derived from the newest post rather than Date.now(): a
// rebuild that changes nothing should produce a byte-identical feed. An empty
// dataset omits the element rather than claiming the epoch.
const lastBuildDate = items[0]
  ? `    <lastBuildDate>${items[0].published.toUTCString()}</lastBuildDate>\n`
  : ''

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${siteUrl}/blog</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>en</language>
${lastBuildDate}    <atom:link href="${siteUrl}${feedPath}" rel="self" type="application/rss+xml"/>
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <pubDate>${item.published.toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`,
  )
  .join('\n')}${items.length > 0 ? '\n' : ''}  </channel>
</rss>
`

await writeFile(path.join(outputDirectory, 'feed.xml'), xml, 'utf8')
console.log(`[feed] Wrote dist/client/feed.xml with ${items.length} item(s).`)
