// Emits dist/client/_redirects from the slugs published documents have
// outgrown, so a rename ships its redirect in the same rebuild.
import { createClient } from '@sanity/client'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadEnv } from 'vite'
import { collectionPathsByType, redirectRules } from './redirect-rules.mjs'

const environment = loadEnv('production', process.cwd(), '')
const read = (key) => process.env[key] ?? environment[key]

if ((read('VITE_CONTENT_SOURCE') ?? 'sanity') === 'fixtures') {
  process.exit(0)
}

const client = createClient({
  projectId: read('VITE_SANITY_PROJECT_ID'),
  dataset: read('VITE_SANITY_DATASET'),
  apiVersion: '2025-05-01',
  perspective: 'published',
  useCdn: false,
})

const documents = await client.fetch(
  '*[_type in $types && defined(slug.current)]{_type, "slug": slug.current, previousSlugs}',
  { types: Object.keys(collectionPathsByType) },
)
const rules = redirectRules(documents)

await writeFile(
  path.join(process.cwd(), 'dist', 'client', '_redirects'),
  rules.map((rule) => `${rule}\n`).join(''),
)
console.log(`Wrote ${rules.length} slug redirects to dist/client/_redirects.`)
