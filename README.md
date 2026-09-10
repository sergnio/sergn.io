# sergn.io

A statically prerendered TanStack Start public site for coffee, wings, N/A beers,
reubens, and blog posts. Published content is read from Sanity only while the
site builds. Readers receive static HTML and transformed Sanity image URLs. The
nested `studio/` workspace is the authenticated Sanity editing interface.

## Local development

Use Node 22.12 or later. Copy the public configuration template, which already
carries the real public project identifiers:

```bash
cp .env.example .env.local
npm ci
npm run dev
```

`VITE_SANITY_PROJECT_ID` and `VITE_SANITY_DATASET` are public identifiers, not
secrets. The production build intentionally fails without them. Netlify must
provide both values in every production and deploy-preview build context.

For a complete local visual check before a Sanity project exists, use the
explicit fixture mode:

```bash
npm run build:fixtures
npm run preview
```

Fixture mode is rejected when `NETLIFY` is set. It is only a local development
and automated-check path, never a fallback for a missing production CMS
configuration.

Run the Studio with the same `.env.local` values:

```bash
npm run studio:dev
```

The Studio uses the editor's Sanity login. Do not put `SANITY_AUTH_TOKEN`, a
Sanity write token, a Netlify build-hook URL, or any draft-preview credential in
this repository or `.env.local`.

## Checks

```bash
npm run typecheck
npm run lint
npm run check:format
npm test
npm run build:fixtures
npm run build
npm run test:e2e
```

`npm run build:fixtures` verifies static prerendering, dynamic detail-route
output, sitemap generation, and the intentional absence of syrup from the
public information architecture.

`npm run build` (with `.env.local` in place) builds against the live public
Sanity dataset over the network. It must succeed even while that dataset holds
no documents: `scripts/assert-static-output.mjs` then requires every collection
index to prerender its heading and empty-state message instead of nothing. CI
runs this as the `build-live-sanity` job.

`npm run test:e2e` runs the Playwright suite against a fixtures build, including
`e2e/a11y.spec.ts`, which fails on any axe-core WCAG 2.2 A/AA violation across a
representative page of each template and pins the landmark, single-`h1`, and
skip-link focus contract, and `e2e/performance.spec.ts`, which pins the font
loading path and the hero image's eager/intrinsic-size attributes.

Web fonts are linked from the document head in `src/routes/__root.tsx`, never
`@import`-ed from `src/styles.css`. An `@import` hides the font stylesheet from
the preload scanner, so the woff2 files cannot start downloading until
`styles.css` has been fetched and parsed. The build asserts both the direct link
and the `fonts.gstatic.com` preconnect.

## Hosting contract

`netlify.toml` publishes `dist/client` from `npm run build`. Configure Netlify
with these public environment variables:

- `VITE_SANITY_PROJECT_ID`
- `VITE_SANITY_DATASET` set to `production`

Create the Sanity project and its public `production` dataset outside this
repository. Host the Studio at the selected `*.sanity.studio` address, invite
the editor there, and configure a Sanity webhook for published changes only to
a Netlify build hook kept exclusively in Sanity's webhook settings. No reader
authentication, database, server mutation, draft website preview, or Sanity
write token is part of this application.

The Studio deployment workflow needs one GitHub environment secret named
`SANITY_AUTH_TOKEN` and public GitHub environment variables
`SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`. It deploys only after
changes to Studio-related files merge to `main`.

The canonical public URL remains `https://sergn.io`. `/syrup` is intentionally
served as a Netlify 404 that renders `/retired-content`; it is not redirected to
an unrelated collection. Domain, DNS, Netlify project, Sanity project, Studio
hostname, webhook, and credential setup are owner actions and are deliberately
not automated by this repository.
