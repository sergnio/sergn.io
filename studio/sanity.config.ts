import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import type { Template } from 'sanity'
import { structureTool } from 'sanity/structure'
import { deskStructure } from './deskStructure'
import { schemaTypes } from './schemaTypes'
import { documentTemplates } from './templates'

function requiredEnvironment(
  name: 'SANITY_STUDIO_PROJECT_ID' | 'SANITY_STUDIO_DATASET',
) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and set the Studio configuration before running Sanity.`,
    )
  }
  return value
}

const projectId = requiredEnvironment('SANITY_STUDIO_PROJECT_ID')
const dataset = requiredEnvironment('SANITY_STUDIO_DATASET')

export default defineConfig({
  name: 'default',
  title: 'sergn.io Studio',
  projectId,
  dataset,
  plugins: [structureTool({ structure: deskStructure }), visionTool()],
  schema: { types: schemaTypes },
  templates: (previousTemplates: Template[]) => [
    ...previousTemplates.filter(
      (template: Template) =>
        !['coffee', 'wingReview', 'naBeer', 'reubenReview', 'post'].includes(
          template.schemaType,
        ),
    ),
    ...documentTemplates,
  ],
})
