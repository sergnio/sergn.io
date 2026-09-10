import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

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

// A social card without an image previews as a bare line of text, so every
// page must name one - either its own content image or the site default -
// as an absolute URL, since crawlers do not resolve relative og:image paths.
const socialImageTags = [
  ['og:image', /<meta property="og:image" content="https:\/\/[^"]+"/],
  ['og:image:alt', /<meta property="og:image:alt" content="[^"]+"/],
  ['twitter:image', /<meta name="twitter:image" content="https:\/\/[^"]+"/],
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

// The default preview image is only useful if it actually ships, is a real
// PNG, and matches the 1.91:1 / 1200x630 size the social platforms crop to.
await requireFile('og-image.png')
const ogImage = await readFile(path.join(outputDirectory, 'og-image.png'))
const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])
if (!ogImage.subarray(0, 8).equals(pngSignature)) {
  throw new Error('dist/client/og-image.png is not a PNG.')
}
const ogWidth = ogImage.readUInt32BE(16)
const ogHeight = ogImage.readUInt32BE(20)
if (ogWidth !== 1200 || ogHeight !== 630) {
  throw new Error(
    `dist/client/og-image.png is ${ogWidth}x${ogHeight}; social previews expect 1200x630.`,
  )
}

const home = await readFile(path.join(outputDirectory, 'index.html'), 'utf8')
if (!/<h1[^>]*>/.test(home)) {
  throw new Error('The home page did not prerender a heading.')
}

// Screen-reader semantics that axe cannot see in the prerendered markup:
// a page outline that skips a level (h1 -> h3) misleads anyone navigating by
// heading, and a <time> without a datetime attribute is not machine readable
// by assistive tech or crawlers, since the visible text is a localised string.
async function prerenderedPages(directory = outputDirectory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const pages = []
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === '__tsr') continue
      pages.push(...(await prerenderedPages(entryPath)))
    } else if (entry.name.endsWith('.html')) {
      pages.push(entryPath)
    }
  }
  return pages
}

for (const pagePath of await prerenderedPages()) {
  const page = path.relative(outputDirectory, pagePath)
  const html = await readFile(pagePath, 'utf8')
  const head = html.split('</head>')[0]
  const body = html.split('<body')[1] ?? ''

  for (const [label, matcher] of socialImageTags) {
    if (!matcher.test(head)) {
      throw new Error(`Prerendered ${page} is missing a ${label} tag.`)
    }
  }

  const levels = [...body.matchAll(/<h([1-6])[\s>]/g)].map((match) =>
    Number(match[1]),
  )
  if (levels.filter((level) => level === 1).length !== 1) {
    throw new Error(`Prerendered ${page} must contain exactly one <h1>.`)
  }
  if (levels[0] !== 1) {
    throw new Error(`Prerendered ${page} does not open its outline with <h1>.`)
  }
  let deepest = 1
  for (const level of levels) {
    if (level > deepest + 1) {
      throw new Error(
        `Prerendered ${page} skips from <h${deepest}> to <h${level}>; heading levels must not jump.`,
      )
    }
    deepest = Math.max(deepest, level)
  }

  for (const [tag] of body.matchAll(/<time\b[^>]*>/g)) {
    if (!/\sdatetime="[^"]+"/i.test(tag)) {
      throw new Error(
        `Prerendered ${page} has a <time> element without a datetime attribute.`,
      )
    }
  }
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

// A Lighthouse pass measures the payload the browser actually downloads before
// the page is interactive, but nothing in CI runs Lighthouse. Pin the same
// number here instead: every prerendered page's render-blocking stylesheets and
// module scripts (the entry plus everything it modulepreloads) must stay under
// budget once gzipped, which is how Netlify serves them. The budget is a
// ceiling, not a target - it exists to catch a dependency that silently doubles
// the bundle, not to police normal drift.
const initialPayloadBudgetBytes = 140 * 1024

const gzippedAssetSize = new Map()
async function gzippedSize(reference, page) {
  if (!gzippedAssetSize.has(reference)) {
    let contents
    try {
      contents = await readFile(path.join(outputDirectory, reference))
    } catch {
      throw new Error(
        `Page ${page} references ${reference}, which the build did not emit. A dangling preload or script costs a wasted 404 round trip on every visit.`,
      )
    }
    gzippedAssetSize.set(reference, gzipSync(contents).length)
  }
  return gzippedAssetSize.get(reference)
}

for (const pagePath of await prerenderedPages()) {
  const page = path.relative(outputDirectory, pagePath)
  const head = (await readFile(pagePath, 'utf8')).split('</head>')[0]
  const references = new Set(
    [
      ...head.matchAll(
        /<(?:link|script)\b[^>]*\b(?:href|src)="(\/assets\/[^"]+)"[^>]*>/g,
      ),
    ].map((match) => match[1]),
  )

  let payload = 0
  for (const reference of references) {
    payload += await gzippedSize(reference, page)
  }

  if (references.size === 0) {
    throw new Error(
      `Page ${page} loads no local stylesheet or module script, so the payload budget cannot be measured.`,
    )
  }
  if (payload > initialPayloadBudgetBytes) {
    throw new Error(
      `Page ${page} ships ${Math.round(payload / 1024)} KB of gzipped CSS and JS up front, over the ${initialPayloadBudgetBytes / 1024} KB budget.`,
    )
  }
}

// Long-lived caching for /assets is only safe while every filename in there
// carries a content hash. Assert both halves of that contract together, so a
// build config change that drops hashing can never quietly ship alongside an
// immutable Cache-Control.
const assetFiles = await readdir(path.join(outputDirectory, 'assets'), {
  recursive: true,
  withFileTypes: true,
})
for (const entry of assetFiles) {
  if (!entry.isFile()) continue
  if (!/-[A-Za-z0-9_-]{8}\.[A-Za-z0-9]+$/.test(entry.name)) {
    throw new Error(
      `Asset ${entry.name} has no content hash in its filename, so it must not be served with an immutable Cache-Control.`,
    )
  }
}

const netlifyConfig = await readFile(
  path.join(process.cwd(), 'netlify.toml'),
  'utf8',
)
const assetHeaderRule = netlifyConfig
  .split(/^\[\[headers\]\]$/m)
  .slice(1)
  .find((block) => /^\s*for\s*=\s*"\/assets\/\*"\s*$/m.test(block))
if (!assetHeaderRule) {
  throw new Error('netlify.toml declares no [[headers]] rule for /assets/*.')
}
const cacheControl = assetHeaderRule.match(/Cache-Control\s*=\s*"([^"]+)"/)?.[1]
if (!/\bimmutable\b/.test(cacheControl ?? '')) {
  throw new Error(
    `The /assets/* Cache-Control must be immutable, got: ${cacheControl ?? '(none)'}`,
  )
}
const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] ?? 0)
if (maxAge < 31536000) {
  throw new Error(
    `The /assets/* Cache-Control max-age must be at least one year, got ${maxAge}.`,
  )
}

// Security headers are only settable in netlify.toml for a static site, so a
// missing directive here is invisible until someone scans the deployed site.
const headerBlock = (glob) =>
  netlifyConfig
    .split(/^\[\[headers\]\]$/m)
    .slice(1)
    .find((block) =>
      new RegExp(
        `^\\s*for\\s*=\\s*"${glob.replace('*', '\\*')}"\\s*$`,
        'm',
      ).test(block),
    )

const siteHeaders = headerBlock('/*')
if (!siteHeaders) {
  throw new Error('netlify.toml declares no [[headers]] rule for /*.')
}
const headerValue = (name) =>
  siteHeaders.match(new RegExp(`${name}\\s*=\\s*"([^"]+)"`))?.[1]

for (const header of [
  'Content-Security-Policy',
  'Referrer-Policy',
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'Permissions-Policy',
]) {
  if (!headerValue(header)) {
    throw new Error(`The /* header rule is missing ${header}.`)
  }
}
if (headerValue('X-Content-Type-Options') !== 'nosniff') {
  throw new Error('X-Content-Type-Options must be nosniff.')
}

const csp = headerValue('Content-Security-Policy')
const directives = new Map(
  csp
    .split(';')
    .map((part) => part.trim().split(/\s+/))
    .filter((parts) => parts[0])
    .map(([name, ...values]) => [name, values]),
)
for (const [directive, required] of [
  ['default-src', "'self'"],
  ['base-uri', "'self'"],
  ['object-src', "'none'"],
  ['frame-ancestors', "'none'"],
  ['form-action', "'self'"],
]) {
  const values = directives.get(directive)
  if (!values || values.join(' ') !== required) {
    throw new Error(
      `The CSP ${directive} must be exactly ${required}, got: ${values?.join(' ') ?? '(missing)'}`,
    )
  }
}
for (const [directive, values] of directives) {
  if (values.includes('*') || values.includes("'unsafe-eval'")) {
    throw new Error(
      `The CSP ${directive} allows ${values.includes('*') ? 'any origin' : "'unsafe-eval'"}.`,
    )
  }
}

// Every origin the prerendered pages actually load from must be allowed by the
// CSP, or the deployed site silently drops fonts, images, or styles. Fixture
// builds reference throwaway image hosts that production never serves, so this
// coverage check only applies to real content builds.
if (contentSource === 'sanity') {
  const allowedOrigins = new Set(
    [...directives.values()].flat().filter((value) => value.startsWith('http')),
  )
  const pages = [
    'index.html',
    'retired-content/index.html',
    'not-found/index.html',
    ...collections.map((collection) => `${collection}/index.html`),
  ]
  for (const page of pages) {
    const html = await readFile(path.join(outputDirectory, page), 'utf8')
    for (const match of html.matchAll(
      /(?:href|src|srcset)="(https:\/\/[^"/]+)/g,
    )) {
      const origin = match[1]
      if (origin === 'https://sergn.io') continue
      if (!allowedOrigins.has(origin)) {
        throw new Error(
          `Prerendered ${page} loads ${origin}, which the Content-Security-Policy does not allow.`,
        )
      }
    }
  }
}

// Structured data is only useful if it parses and points at canonical URLs.
// A JSON-LD block that throws on parse, or a breadcrumb whose last item is not
// the page it sits on, is silently ignored by crawlers and shows up nowhere in
// the rendered page, so nothing but a build check catches it.
function jsonLdBlocks(html, page) {
  return [
    ...html.matchAll(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ].map((match) => {
    try {
      return JSON.parse(match[1])
    } catch (error) {
      throw new Error(
        `Prerendered ${page} has a JSON-LD block that does not parse: ${error.message}`,
      )
    }
  })
}

function breadcrumbTrail(blocks, page) {
  const breadcrumb = blocks.find((block) => block['@type'] === 'BreadcrumbList')
  if (!breadcrumb) {
    throw new Error(`Prerendered ${page} is missing BreadcrumbList JSON-LD.`)
  }

  const items = breadcrumb.itemListElement
  items.forEach((item, index) => {
    if (item.position !== index + 1) {
      throw new Error(
        `Prerendered ${page} has a breadcrumb item at position ${item.position}, expected ${index + 1}.`,
      )
    }
    if (!item.name || !item.item?.startsWith('https://sergn.io')) {
      throw new Error(
        `Prerendered ${page} has a breadcrumb item without a name or an absolute site URL.`,
      )
    }
  })
  if (items[0].item !== 'https://sergn.io/') {
    throw new Error(
      `Prerendered ${page} breadcrumb does not start at the home page.`,
    )
  }
  return items
}

for (const pagePath of await prerenderedPages()) {
  const page = path.relative(outputDirectory, pagePath)
  const html = await readFile(pagePath, 'utf8')
  for (const block of jsonLdBlocks(html, page)) {
    if (block['@context'] !== 'https://schema.org') {
      throw new Error(
        `Prerendered ${page} has JSON-LD without an https://schema.org @context.`,
      )
    }
    if (!block['@type'] && !block['@graph']) {
      throw new Error(`Prerendered ${page} has JSON-LD without an @type.`)
    }
  }
}

const homeGraph = jsonLdBlocks(home, 'index.html').flatMap(
  (block) => block['@graph'] ?? [block],
)
if (
  !homeGraph.some(
    (node) => node['@type'] === 'WebSite' && node.url === 'https://sergn.io',
  )
) {
  throw new Error(
    'The home page is missing WebSite JSON-LD for the site itself.',
  )
}

for (const collection of collections) {
  const indexHtml = await readFile(
    path.join(outputDirectory, collection, 'index.html'),
    'utf8',
  )
  const trail = breadcrumbTrail(
    jsonLdBlocks(indexHtml, `${collection}/index.html`),
    `${collection}/index.html`,
  )
  if (trail.at(-1).item !== `https://sergn.io/${collection}`) {
    throw new Error(
      `The /${collection} breadcrumb does not end at its own canonical URL.`,
    )
  }

  for (const slug of await detailLinks(collection)) {
    const page = `${collection}/${slug}/index.html`
    const detailHtml = await readFile(path.join(outputDirectory, page), 'utf8')
    const detailTrail = breadcrumbTrail(jsonLdBlocks(detailHtml, page), page)
    if (detailTrail.at(-1).item !== `https://sergn.io/${collection}/${slug}`) {
      throw new Error(
        `The /${collection}/${slug} breadcrumb does not end at its own canonical URL.`,
      )
    }
    if (detailTrail.at(-2)?.item !== `https://sergn.io/${collection}`) {
      throw new Error(
        `The /${collection}/${slug} breadcrumb does not pass through its collection index.`,
      )
    }
  }
}
