#!/usr/bin/env node
/**
 * Mirrors the Google Fonts the site uses into `public/fonts/` and writes the
 * matching `src/fonts.css`.
 *
 * The site links its own copy rather than fonts.googleapis.com: a third-party
 * stylesheet puts two extra DNS + TLS handshakes and a serial round trip
 * (HTML -> googleapis CSS -> gstatic woff2) on the critical render path, and
 * browser cache partitioning means the visitor never gets a shared-cache hit
 * for it anyway. Self-hosting also lets the CSP drop both Google origins and
 * keeps reader IP addresses off a third party.
 *
 * Filenames carry the family version Google publishes (`v16`, `v26`), so the
 * URL changes whenever the font binary does - that is what makes the
 * immutable cache header in netlify.toml safe.
 *
 * Run `node scripts/generate-fonts.mjs` to refresh; commit the result.
 */
import { createHash } from 'node:crypto'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = join(root, 'public', 'fonts')
const cssPath = join(root, 'src', 'fonts.css')

// Exactly the families, weights and axes the stylesheet asks for.
const googleCssUrl =
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap'

// Google serves woff2 only to browsers that support it; an unrecognised
// user agent gets ttf, which is roughly twice the bytes.
const browserUserAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function fetchOk(url, init) {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`)
  }
  return response
}

/** Splits the Google stylesheet into one record per @font-face block. */
function parseFaces(css) {
  const faces = []
  const blockPattern = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g
  for (const [, subset, body] of css.matchAll(blockPattern)) {
    const field = (name) => {
      const match = body.match(new RegExp(`${name}:\\s*([^;]+);`))
      if (!match) throw new Error(`@font-face block has no ${name}: ${body}`)
      return match[1].trim()
    }
    const url = field('src').match(/url\((https:\/\/[^)]+)\)/)?.[1]
    if (!url) throw new Error(`@font-face block has no woff2 url: ${body}`)
    faces.push({
      family: field('font-family').replace(/['"]/g, ''),
      style: field('font-style'),
      weight: field('font-weight'),
      display: field('font-display'),
      unicodeRange: field('unicode-range'),
      subset,
      url,
    })
  }
  if (faces.length === 0) throw new Error('No @font-face blocks found.')
  return faces
}

/** `.../s/newsreader/v26/cY9A...woff2` -> `v26`. */
function familyVersion(url) {
  const version = url.match(/\/s\/[^/]+\/(v\d+)\//)?.[1]
  if (!version) throw new Error(`Cannot read a family version from ${url}`)
  return version
}

const css = await (
  await fetchOk(googleCssUrl, {
    headers: { 'user-agent': browserUserAgent },
  })
).text()

const faces = parseFaces(css)

await mkdir(outputDir, { recursive: true })
for (const stale of await readdir(outputDir).catch(() => [])) {
  await rm(join(outputDir, stale))
}

/**
 * Google emits one @font-face per requested weight even for a variable font,
 * pointing each at a byte-identical file under a different URL - so a page
 * using Newsreader 400 and 600 downloads the same 131 KB binary twice. Faces
 * that share a family, style, subset and file content collapse into a single
 * face declaring the weight range the one file already covers.
 */
function groupFaces(parsed) {
  const groups = new Map()
  for (const face of parsed) {
    const key = [face.family, face.style, face.subset, face.digest].join('|')
    const existing = groups.get(key)
    if (existing) existing.weights.push(Number(face.weight))
    else groups.set(key, { ...face, weights: [Number(face.weight)] })
  }
  return [...groups.values()].map((group) => {
    const weights = [...group.weights].sort((a, b) => a - b)
    const first = weights[0]
    const last = weights[weights.length - 1]
    return {
      ...group,
      weight: first === last ? `${first}` : `${first} ${last}`,
    }
  })
}

const downloads = await Promise.all(
  faces.map(async (face) => {
    const bytes = Buffer.from(await (await fetchOk(face.url)).arrayBuffer())
    return {
      ...face,
      bytes,
      digest: createHash('sha256').update(bytes).digest('hex'),
    }
  }),
)

const blocks = []
for (const face of groupFaces(downloads)) {
  const fileName = `${slug(face.family)}-${familyVersion(face.url)}-${face.weight.replace(' ', '-')}-${face.style}-${face.subset}.woff2`
  await writeFile(join(outputDir, fileName), face.bytes)
  blocks.push(
    [
      `/* ${face.family} ${face.weight} ${face.style} - ${face.subset} */`,
      `@font-face {`,
      `  font-family: '${face.family}';`,
      `  font-style: ${face.style};`,
      `  font-weight: ${face.weight};`,
      `  font-display: ${face.display};`,
      `  src: url('/fonts/${fileName}') format('woff2');`,
      `  unicode-range: ${face.unicodeRange};`,
      `}`,
    ].join('\n'),
  )
  console.log(`${fileName} (${face.bytes.length} bytes)`)
}

await writeFile(
  cssPath,
  [
    '/*',
    ' * Generated by scripts/generate-fonts.mjs from the Google Fonts CSS API.',
    ' * Do not edit by hand: change the request in that script and re-run it.',
    ' * The woff2 files live in public/fonts/ so these URLs stay stable and',
    ' * predictable enough to preload from the document head.',
    ' */',
    '',
    ...blocks,
    '',
  ].join('\n'),
)

console.log(`\nWrote ${blocks.length} faces to ${cssPath}`)
