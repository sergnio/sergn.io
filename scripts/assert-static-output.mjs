import { access, readdir, readFile, stat } from 'node:fs/promises'
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
  requireFile('feed.xml'),
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

const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

// Reads the dimensions out of a PNG's IHDR chunk, which always starts at byte
// 8, so an image regenerated at the wrong size fails the build rather than
// shipping cropped or blurry.
async function pngDimensions(relativePath) {
  await requireFile(relativePath)
  const png = await readFile(path.join(outputDirectory, relativePath))
  if (!png.subarray(0, 8).equals(pngSignature)) {
    throw new Error(`dist/client/${relativePath} is not a PNG.`)
  }
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }
}

async function requirePngSize(relativePath, width, height, reason) {
  const actual = await pngDimensions(relativePath)
  if (actual.width !== width || actual.height !== height) {
    throw new Error(
      `dist/client/${relativePath} is ${actual.width}x${actual.height}; ${reason} expect ${width}x${height}.`,
    )
  }
}

// The default preview image is only useful if it actually ships, is a real
// PNG, and matches the 1.91:1 / 1200x630 size the social platforms crop to.
await requirePngSize('og-image.png', 1200, 630, 'social previews')

// Home-screen shortcuts ignore the SVG favicon: iOS uses the apple-touch-icon
// and Android reads the manifest, so a missing or mis-sized icon degrades to a
// screenshot or a bare letter - invisible until someone installs the site.
await requirePngSize('apple-touch-icon.png', 180, 180, 'iOS home screens')

await requireFile('site.webmanifest')
const manifestSource = await readFile(
  path.join(outputDirectory, 'site.webmanifest'),
  'utf8',
)
let manifest
try {
  manifest = JSON.parse(manifestSource)
} catch (error) {
  throw new Error(`dist/client/site.webmanifest is not valid JSON: ${error}.`)
}
for (const field of ['name', 'short_name', 'start_url', 'theme_color']) {
  if (!manifest[field]) {
    throw new Error(`dist/client/site.webmanifest is missing "${field}".`)
  }
}
// Chrome only offers installation with a 192px and a 512px icon present, and
// only if each one actually resolves.
for (const size of [192, 512]) {
  const icon = manifest.icons?.find(
    (candidate) => candidate.sizes === `${size}x${size}`,
  )
  if (!icon) {
    throw new Error(
      `dist/client/site.webmanifest does not declare a ${size}x${size} icon.`,
    )
  }
  await requirePngSize(
    icon.src.replace(/^\//, ''),
    size,
    size,
    `the manifest's ${icon.sizes} entry`,
  )
}

// Every page must carry the install surface, not just the home page: a
// shortcut can be saved from any URL, and a page that omits these falls back
// to a screenshot icon and the default browser chrome colour.
const installTags = [
  [
    'apple-touch-icon',
    /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png"/,
  ],
  ['manifest', /<link rel="manifest" href="\/site\.webmanifest"/],
  ['theme-color', /<meta name="theme-color" content="#[0-9a-fA-F]{6}"/],
  // Feed autodiscovery: readers look for this on whichever page they are
  // handed, so it belongs on every page rather than only on /blog.
  [
    'feed autodiscovery link',
    /<link rel="alternate" type="application\/rss\+xml"[^>]*href="\/feed\.xml"/,
  ],
]

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

const pageFacts = []

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

  for (const [label, matcher] of installTags) {
    if (!matcher.test(head)) {
      throw new Error(`Prerendered ${page} is missing a ${label} tag.`)
    }
  }

  const themeColor = head.match(
    /<meta name="theme-color" content="([^"]+)"/,
  )?.[1]
  if (themeColor !== manifest.theme_color) {
    throw new Error(
      `Prerendered ${page} declares theme-color ${themeColor}, but the manifest declares ${manifest.theme_color}.`,
    )
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

  pageFacts.push({
    page,
    url: page === 'index.html' ? '/' : `/${path.dirname(page)}`,
    canonical: head.match(/<link rel="canonical" href="([^"]+)"/)?.[1],
    noindex: /<meta name="robots" content="[^"]*noindex/.test(head),
    anchors: [...body.matchAll(/<a\b[^>]*>/g)].map((match) => ({
      tag: match[0],
      href: match[0].match(/\shref="([^"]*)"/)?.[1] ?? '',
    })),
    ids: new Set(
      [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]),
    ),
  })
}

// The prerendered pages must agree with each other. An internal link that
// resolves to nothing is a 404 the build could have caught, a fragment with no
// matching id scrolls nowhere (the skip link is exactly this shape), and a
// trailing slash points crawlers at a duplicate of a URL whose canonical form
// has none.
const pagesByUrl = new Map(pageFacts.map((facts) => [facts.url, facts]))

// Authored links carry a destination the renderer cannot infer, so the built
// anchors are the only place their rendering can be proved: a new tab must not
// hand the opener over, a link to this site must not open one at all, and no
// anchor may point at a scheme the browser executes rather than navigates to.
const navigableScheme = /^(?:https?|mailto|tel):/i

for (const facts of pageFacts) {
  for (const { tag, href } of facts.anchors) {
    if (/\starget="_blank"/.test(tag)) {
      const rel = tag.match(/\srel="([^"]*)"/)?.[1] ?? ''
      if (!/\bnoopener\b|\bnoreferrer\b/.test(rel)) {
        throw new Error(
          `Prerendered ${facts.page} opens ${href} in a new tab without rel="noopener": ${tag}`,
        )
      }
      if (href.startsWith('/') && !href.startsWith('//')) {
        throw new Error(
          `Prerendered ${facts.page} opens the internal link ${href} in a new tab; links within the site must stay in the same tab.`,
        )
      }
    }

    if (href !== '' && !href.startsWith('/') && !href.startsWith('#')) {
      if (!navigableScheme.test(href)) {
        throw new Error(
          `Prerendered ${facts.page} links to "${href}", which is not an http(s), mailto or tel URL.`,
        )
      }
    }

    if (href.startsWith('#')) {
      if (!facts.ids.has(href.slice(1))) {
        throw new Error(
          `Prerendered ${facts.page} links to ${href}, but no element on the page has that id.`,
        )
      }
      continue
    }

    // Only same-origin paths are the build's to guarantee.
    if (!href.startsWith('/') || href.startsWith('//')) continue

    const [pathname, fragment] = href.split('#')
    const target = decodeURIComponent(pathname.split('?')[0])
    if (target !== '/' && target.endsWith('/')) {
      throw new Error(
        `Prerendered ${facts.page} links to ${href}, but internal links must omit the trailing slash to match the canonical URL.`,
      )
    }

    const targetPage = pagesByUrl.get(target)
    if (!targetPage) {
      // Not a page, so it must be a file the build emitted (/feed.xml).
      try {
        await access(path.join(outputDirectory, target.replace(/^\//, '')))
      } catch {
        throw new Error(
          `Prerendered ${facts.page} links to ${href}, which the build never emitted.`,
        )
      }
      continue
    }

    if (fragment && !targetPage.ids.has(fragment)) {
      throw new Error(
        `Prerendered ${facts.page} links to ${href}, but ${targetPage.page} has no element with that id.`,
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

// Spot checks cannot notice a page that was never added to the sitemap, so the
// sitemap and the prerendered output are compared as sets: every indexable page
// appears exactly once under its own canonical URL, every noindex page is
// absent, and the sitemap advertises nothing the build did not produce.
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
)
const indexablePages = pageFacts.filter((facts) => !facts.noindex)

for (const facts of indexablePages) {
  const url = `https://sergn.io${facts.url}`
  if (facts.canonical !== url) {
    throw new Error(
      `Prerendered ${facts.page} is served at ${url} but declares canonical ${facts.canonical}.`,
    )
  }
  const listed = sitemapLocations.filter((location) => location === url).length
  if (listed !== 1) {
    throw new Error(
      `The sitemap lists ${url} ${listed} time(s); every indexable page must appear exactly once.`,
    )
  }
}

for (const facts of pageFacts.filter((facts) => facts.noindex)) {
  const url = `https://sergn.io${facts.url}`
  if (sitemapLocations.includes(url)) {
    throw new Error(
      `The sitemap lists ${url}, but ${facts.page} is marked noindex.`,
    )
  }
}

const indexableUrls = new Set(
  indexablePages.map((facts) => `https://sergn.io${facts.url}`),
)
for (const location of sitemapLocations) {
  if (!indexableUrls.has(location)) {
    throw new Error(
      `The sitemap lists ${location}, which the build did not prerender as an indexable page.`,
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

// Fonts are served from this origin. A third-party font stylesheet costs two
// extra DNS + TLS handshakes and delays every woff2 behind a cross-origin CSS
// response, and it hands every reader's IP to a third party - so no
// prerendered page may reference Google's font hosts at all.
for (const pagePath of await prerenderedPages()) {
  const html = await readFile(pagePath, 'utf8')
  const offendingHost = html.match(/fonts\.(?:googleapis|gstatic)\.com/)?.[0]
  if (offendingHost) {
    throw new Error(
      `Prerendered ${path.relative(outputDirectory, pagePath)} references ${offendingHost}. Fonts must be self-hosted; regenerate with scripts/generate-fonts.mjs.`,
    )
  }
}

// The font stylesheet is emitted by Vite as its own CSS asset. Everything it
// declares must resolve to a file the build actually shipped, or the page
// silently falls back to system fonts in production while looking fine here.
const fontFaceCss = []
for (const asset of cssAssets) {
  const css = await readFile(
    path.join(outputDirectory, 'assets', asset),
    'utf8',
  )
  if (css.includes('@font-face')) fontFaceCss.push({ asset, css })
}
if (fontFaceCss.length !== 1) {
  throw new Error(
    `Expected exactly one emitted CSS asset to declare @font-face, found ${fontFaceCss.length}.`,
  )
}
const [{ asset: fontAsset, css: fontCss }] = fontFaceCss

const declaredFonts = [...fontCss.matchAll(/url\(([^)]+)\)/g)].map((match) =>
  match[1].replace(/['"]/g, ''),
)
if (declaredFonts.length === 0) {
  throw new Error(`${fontAsset} declares @font-face but no font source URL.`)
}
for (const source of declaredFonts) {
  if (!source.startsWith('/fonts/')) {
    throw new Error(
      `${fontAsset} loads a font from ${source}. Fonts must be self-hosted under /fonts/.`,
    )
  }
  await requireFile(source.slice(1))
}

// An unreferenced woff2 is dead weight in the deploy and a sign the generator
// and the checked-in stylesheet have drifted apart.
for (const file of await readdir(path.join(outputDirectory, 'fonts'))) {
  if (!declaredFonts.includes(`/fonts/${file}`)) {
    throw new Error(
      `/fonts/${file} is shipped but no @font-face references it. Re-run scripts/generate-fonts.mjs.`,
    )
  }
}

// The latin faces are what an English page paints with, so they are the font
// bytes on the critical path. A ceiling, not a target: it exists to catch a
// newly added family or a subset dropped from the generator request.
let latinFontBytes = 0
for (const source of declaredFonts) {
  // woff2 carries its own compression, so its on-disk size is what ships.
  const { size } = await stat(path.join(outputDirectory, source.slice(1)))
  if (source.includes('-latin.')) latinFontBytes += size
}
const fontBudgetBytes = 180 * 1024
if (latinFontBytes > fontBudgetBytes) {
  throw new Error(
    `Latin font faces total ${Math.round(latinFontBytes / 1024)} KB, over the ${fontBudgetBytes / 1024} KB budget.`,
  )
}

// Preloads are hardcoded in the document head so the preload scanner can start
// them on first byte, which means they can drift from the stylesheet. A
// preload naming a URL no @font-face uses is a wasted download on every visit.
for (const pagePath of await prerenderedPages()) {
  const page = path.relative(outputDirectory, pagePath)
  const head = (await readFile(pagePath, 'utf8')).split('</head>')[0]

  if (
    !new RegExp(`<link rel="stylesheet" href="/assets/${fontAsset}"`).test(head)
  ) {
    throw new Error(
      `Prerendered ${page} does not link the font stylesheet from its head.`,
    )
  }

  const preloads = [...head.matchAll(/<link[^>]*rel="preload"[^>]*>/g)]
    .map((match) => match[0])
    .filter((tag) => tag.includes('as="font"'))
  if (preloads.length === 0) {
    throw new Error(`Prerendered ${page} preloads no font.`)
  }
  for (const tag of preloads) {
    const href = tag.match(/href="([^"]+)"/)?.[1]
    if (!href || !declaredFonts.includes(href)) {
      throw new Error(
        `Prerendered ${page} preloads ${href ?? 'a font with no href'}, which no @font-face declares. Update preloadedFonts in src/routes/__root.tsx.`,
      )
    }
    // A font preload without crossorigin is fetched twice: once anonymously
    // for the preload and again by the CSS in CORS mode.
    if (!/\bcrossorigin\b/.test(tag)) {
      throw new Error(
        `Prerendered ${page} preloads ${href} without crossorigin, so the browser downloads it twice.`,
      )
    }
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

// The blog feed must describe exactly the posts the site actually serves.
// It is generated from the prerendered pages (scripts/generate-feed.mjs), so
// these assertions are what stop it from silently drifting into an empty or
// half-written channel that feed readers would happily accept.
const feed = await readFile(path.join(outputDirectory, 'feed.xml'), 'utf8')
if (
  !/^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<rss version="2\.0"/.test(feed)
) {
  throw new Error('feed.xml is not a well-formed RSS 2.0 document.')
}
for (const [label, matcher] of [
  ['channel title', /<channel>\s*<title>[^<]+<\/title>/],
  ['channel link', /<link>https:\/\/sergn\.io\/blog<\/link>/],
  ['channel description', /<description>[^<]+<\/description>/],
  [
    'atom self link',
    /<atom:link href="https:\/\/sergn\.io\/feed\.xml" rel="self"/,
  ],
]) {
  if (!matcher.test(feed)) {
    throw new Error(`feed.xml is missing its ${label}.`)
  }
}

const feedItems = [...feed.matchAll(/<item>(.*?)<\/item>/gs)].map(
  (match) => match[1],
)
const blogSlugs = [...new Set(await detailLinks('blog'))]
if (feedItems.length !== blogSlugs.length) {
  throw new Error(
    `feed.xml lists ${feedItems.length} item(s) but the site prerenders ${blogSlugs.length} blog post(s).`,
  )
}

for (const item of feedItems) {
  const link = item.match(/<link>([^<]+)<\/link>/)?.[1]
  const slug = link?.replace('https://sergn.io/blog/', '')
  if (!link || !slug || !blogSlugs.includes(slug)) {
    throw new Error(
      `feed.xml item links ${link ?? 'nothing'}, which is not a prerendered blog post.`,
    )
  }
  await requireFile(`blog/${slug}/index.html`)

  if (item.match(/<guid[^>]*>([^<]+)<\/guid>/)?.[1] !== link) {
    throw new Error(
      `feed.xml item for ${link} has a guid that is not its permalink.`,
    )
  }
  if (!/<title>[^<]+<\/title>/.test(item)) {
    throw new Error(`feed.xml item for ${link} has no title.`)
  }
  const pubDate = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]
  if (!pubDate || Number.isNaN(new Date(pubDate).getTime())) {
    throw new Error(
      `feed.xml item for ${link} has an unparseable pubDate: ${pubDate ?? 'none'}.`,
    )
  }
}
