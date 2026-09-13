import { defineCliConfig } from 'sanity/cli'

// Public, non-secret identifiers. They ship inside the browser bundle anyway,
// so they are committed here to keep builds independent of local env files.
const projectId = '0vbjaawm'
const dataset = 'production'

export default defineCliConfig({
  api: { projectId, dataset },
  studioHost: 'sergnio',
  deployment: { appId: 'jotsr28ar9er472atbi9sd42', autoUpdates: true },
})
