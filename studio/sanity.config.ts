import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import type { Template } from 'sanity'
import { structureTool } from 'sanity/structure'
import { deskStructure } from './deskStructure'
import { schemaTypes } from './schemaTypes'
import { documentTemplates } from './templates'

// Public, non-secret identifiers; see sanity.cli.ts.
const projectId = '0vbjaawm'
const dataset = 'production'

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
