import type { CollectionName } from './content-types'

/**
 * The shape the site renders with. `content-types.ts` declares these fields
 * non-optional, but GROQ hands back whatever the dataset happens to hold, so
 * the types are a promise nothing checks. This module is that check: it runs
 * on every fetch, so a document that cannot render correctly fails the build
 * with the collection, slug and field named instead of surfacing as a blank
 * section, a broken URL or a stack trace from inside the renderer.
 */
const requiredByCollection: Record<CollectionName, string[]> = {
  coffee: ['boughtFrom', 'bagSize.amount', 'bagSize.unit', 'brewRecipes'],
  wings: ['venue', 'visitedAt', 'order.styleOrFlavor', 'notes'],
  'na-beers': ['brewery'],
  reubens: ['restaurant', 'visitedAt'],
  blog: ['excerpt', 'body'],
}

const alwaysRequired = ['_id', '_type', 'title', 'slug']

/** Slugs become URL path segments, so anything else breaks the URL graph. */
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function readPath(document: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === 'object'
          ? (value as Record<string, unknown>)[key]
          : undefined,
      document,
    )
}

function isMissing(value: unknown) {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

function isImageLike(value: Record<string, unknown>) {
  return value._type === 'imageWithAlt' || 'asset' in value
}

/** Every image the site renders gets an alt attribute from this field. */
function collectImagesMissingAlt(value: unknown, path: string): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectImagesMissingAlt(entry, `${path}[${index}]`),
    )
  }

  if (!value || typeof value !== 'object') return []

  const record = value as Record<string, unknown>
  const nested = Object.entries(record).flatMap(([key, entry]) =>
    collectImagesMissingAlt(entry, path ? `${path}.${key}` : key),
  )

  if (isImageLike(record) && isMissing(record.alt)) {
    return [path, ...nested]
  }

  return nested
}

function describe(collection: CollectionName, document: unknown) {
  const record = (document ?? {}) as Record<string, unknown>
  const slug = typeof record.slug === 'string' ? record.slug : '(no slug)'
  const id = typeof record._id === 'string' ? record._id : '(no _id)'
  return `${collection} document "${slug}" (${id})`
}

function violationsFor(collection: CollectionName, document: unknown) {
  if (!document || typeof document !== 'object') {
    return [`${collection} returned a ${typeof document} instead of a document`]
  }

  const subject = describe(collection, document)
  const violations = [...alwaysRequired, ...requiredByCollection[collection]]
    .filter((path) => isMissing(readPath(document, path)))
    .map((path) => `${subject} is missing required field "${path}"`)

  const slug = (document as { slug?: unknown }).slug
  if (typeof slug === 'string' && slug !== '' && !slugPattern.test(slug)) {
    violations.push(
      `${subject} has a slug that is not URL safe: "${slug}" (expected lowercase words separated by single hyphens)`,
    )
  }

  return violations.concat(
    collectImagesMissingAlt(document, '').map(
      (path) => `${subject} has an image without alt text at "${path}"`,
    ),
  )
}

function duplicateSlugViolations(
  collection: CollectionName,
  documents: unknown[],
) {
  const seen = new Set<string>()

  return documents.flatMap((document) => {
    const slug = readPath(document, 'slug')
    if (typeof slug !== 'string' || slug === '') return []
    if (!seen.has(slug)) {
      seen.add(slug)
      return []
    }
    return [
      `${collection} has more than one document with the slug "${slug}", so only one of them can be published at /${collection}/${slug}`,
    ]
  })
}

function fail(violations: string[]): never {
  const message = `Content contract violated:\n${violations.map((violation) => `  - ${violation}`).join('\n')}`

  // The prerenderer fetches each page over HTTP and reports only "Internal
  // Server Error" when a loader throws, so the thrown message never reaches
  // the build log. Printing it here is what makes a failed build actionable.
  if (import.meta.env.MODE !== 'test') console.error(message)

  throw new Error(message)
}

export function assertValidCollection<T>(
  collection: CollectionName,
  documents: T[],
): T[] {
  if (!Array.isArray(documents)) {
    fail([`${collection} returned ${typeof documents} instead of a list`])
  }

  const violations = [
    ...documents.flatMap((document) => violationsFor(collection, document)),
    ...duplicateSlugViolations(collection, documents),
  ]

  if (violations.length > 0) fail(violations)

  return documents
}

export function assertValidDocument<T>(
  collection: CollectionName,
  document: T,
): T {
  if (document === undefined || document === null) return document

  const violations = violationsFor(collection, document)
  if (violations.length > 0) fail(violations)

  return document
}
