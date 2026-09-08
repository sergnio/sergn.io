import { createClient } from '@sanity/client'

export type SanityBuildConfig = {
  projectId: string
  dataset: string
}

const source = import.meta.env.VITE_CONTENT_SOURCE ?? 'sanity'

export function usesFixtureContent() {
  return source === 'fixtures'
}

export function getSanityBuildConfig(): SanityBuildConfig {
  const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
  const dataset = import.meta.env.VITE_SANITY_DATASET

  if (!projectId || !dataset) {
    throw new Error(
      'Missing VITE_SANITY_PROJECT_ID or VITE_SANITY_DATASET. Set the public build values in .env.local or Netlify before building.',
    )
  }

  return { projectId, dataset }
}

export function getPublishedSanityClient() {
  const { projectId, dataset } = getSanityBuildConfig()

  return createClient({
    projectId,
    dataset,
    apiVersion: '2025-05-01',
    perspective: 'published',
    useCdn: false,
  })
}
