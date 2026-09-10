import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const outputDirectory = path.join(process.cwd(), 'dist', 'client')
const contentSource = process.env.VITE_CONTENT_SOURCE ?? 'sanity'
const collections = ['coffee', 'wings', 'na-beers', 'reubens', 'blog']

async function requireFile(relativePath) {
  try {
    await access(path.join(outputDirectory, relativePath))
  } catch {
    throw new Error(`Expected prerendered output at ${relativePath}.`)
  }
}

async function detailLinks(collection) {
  const indexPath = path.join(outputDirectory, collection, 'index.html')
  const html = await readFile(indexPath, 'utf8')
  const matcher = new RegExp(`href="/${collection}/([^"/?#]+)"`, 'g')
  return [...html.matchAll(matcher)].map((match) =>
    decodeURIComponent(match[1]),
  )
}

await Promise.all([
  requireFile('index.html'),
  requireFile('retired-content/index.html'),
  requireFile('not-found/index.html'),
  requireFile('robots.txt'),
  requireFile('sitemap.xml'),
  ...collections.map((collection) => requireFile(`${collection}/index.html`)),
])

for (const collection of collections) {
  const slugs = await detailLinks(collection)
  for (const slug of slugs) {
    await requireFile(`${collection}/${slug}/index.html`)
  }

  if (slugs.length === 0) {
    if (contentSource === 'fixtures') {
      throw new Error(
        `Fixture ${collection} index did not link to a detail route.`,
      )
    }

    // An empty dataset is a supported production state: the index must still
    // prerender its heading and the empty-state copy rather than nothing.
    const html = await readFile(
      path.join(outputDirectory, collection, 'index.html'),
      'utf8',
    )
    if (!html.includes('class="empty-state"')) {
      throw new Error(
        `Empty ${collection} index did not prerender the empty-state message.`,
      )
    }
    if (!/<h1[^>]*>/.test(html)) {
      throw new Error(`Empty ${collection} index did not prerender a heading.`)
    }
  }
}

// Every indexable page must ship a complete social preview in its prerendered
// HTML: a title, description, Open Graph title/description/url, and a Twitter
// card. Missing tags only show up when a URL is shared, long after deploy.
const socialTags = [
  ['<title>', /<title>[^<]+<\/title>/],
  ['meta description', /<meta name="description" content="[^"]+"/],
  ['og:title', /<meta property="og:title" content="[^"]+"/],
  ['og:description', /<meta property="og:description" content="[^"]+"/],
  ['og:url', /<meta property="og:url" content="https:\/\/sergn\.io[^"]*"/],
  ['twitter:card', /<meta name="twitter:card" content="[^"]+"/],
  ['canonical', /<link rel="canonical" href="https:\/\/sergn\.io[^"]*"/],
]

for (const page of [
  'index.html',
  ...collections.map((c) => `${c}/index.html`),
]) {
  const html = await readFile(path.join(outputDirectory, page), 'utf8')
  const head = html.split('</head>')[0]
  for (const [label, matcher] of socialTags) {
    if (!matcher.test(head)) {
      throw new Error(`Prerendered ${page} is missing a ${label} tag.`)
    }
  }
}

const home = await readFile(path.join(outputDirectory, 'index.html'), 'utf8')
if (!/<h1[^>]*>/.test(home)) {
  throw new Error('The home page did not prerender a heading.')
}

const sitemap = await readFile(
  path.join(outputDirectory, 'sitemap.xml'),
  'utf8',
)
if (!sitemap.includes('https://sergn.io/coffee')) {
  throw new Error('The generated sitemap is missing the Coffee collection.')
}
if (sitemap.includes('https://sergn.io/syrup')) {
  throw new Error('Retired syrup content must not appear in the sitemap.')
}
if (sitemap.includes('https://sergn.io/not-found')) {
  throw new Error('The 404 page must not appear in the sitemap.')
}
if (sitemap.includes('https://sergn.io/retired-content')) {
  throw new Error(
    'The retired-content page is noindex and must not appear in the sitemap.',
  )
}
for (const collection of collections) {
  if (sitemap.includes(`<loc>https://sergn.io/${collection}/</loc>`)) {
    throw new Error(
      `The sitemap lists a trailing-slash duplicate of /${collection}, which is not its canonical URL.`,
    )
  }
}

// Web fonts must be discoverable by the preload scanner on first byte. An
// @import inside the bundled CSS instead makes the browser fetch and parse
// styles.css before it even learns the font stylesheet exists, delaying every
// woff2 by two serial round trips.
const cssAssets = (await readdir(path.join(outputDirectory, 'assets'))).filter(
  (file) => file.endsWith('.css'),
)
for (const asset of cssAssets) {
  const css = await readFile(
    path.join(outputDirectory, 'assets', asset),
    'utf8',
  )
  if (/@import\s+url\(\s*['"]?https?:/i.test(css)) {
    throw new Error(
      `Bundled CSS ${asset} @imports a remote stylesheet. Link it from the document head instead.`,
    )
  }
}

for (const page of [
  'index.html',
  ...collections.map((c) => `${c}/index.html`),
]) {
  const head = (await readFile(path.join(outputDirectory, page), 'utf8')).split(
    '</head>',
  )[0]
  if (
    !/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com/.test(head)
  ) {
    throw new Error(
      `Prerendered ${page} does not link the font stylesheet from its head.`,
    )
  }
  if (
    !/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*crossorigin/.test(
      head,
    )
  ) {
    throw new Error(
      `Prerendered ${page} is missing a crossorigin preconnect to fonts.gstatic.com.`,
    )
  }
}
