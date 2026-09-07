const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

if (!projectId || !dataset) {
  throw new Error(
    'Missing SANITY_STUDIO_PROJECT_ID or SANITY_STUDIO_DATASET. See .env.example.',
  )
}

export default {
  api: { projectId, dataset },
}
