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
  const body = html.split('<body')[1] ?? ''

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
