import { loadEnv } from 'vite'

const environment = loadEnv('production', process.cwd(), '')
const contentSource =
  process.env.VITE_CONTENT_SOURCE ?? environment.VITE_CONTENT_SOURCE ?? 'sanity'

if (contentSource === 'fixtures') {
  if (process.env.NETLIFY) {
    throw new Error('Fixture content is not allowed in Netlify builds.')
  }
  process.exit(0)
}

if (contentSource !== 'sanity') {
  throw new Error('VITE_CONTENT_SOURCE must be "sanity" or "fixtures".')
}

const missing = ['VITE_SANITY_PROJECT_ID', 'VITE_SANITY_DATASET'].filter(
  (key) => !(process.env[key] ?? environment[key]),
)

if (missing.length) {
  throw new Error(
    `Missing ${missing.join(', ')}. Set public Sanity build values in .env.local or Netlify. Use npm run build:fixtures only for local fixture checks.`,
  )
}
