import { access, readFile } from 'node:fs/promises'
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
