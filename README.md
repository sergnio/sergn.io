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

Content coming back from Sanity is checked against the shape the site renders
with before anything is rendered. `src/lib/content-types.ts` declares fields
like a coffee's `bagSize` or a post's `body` as non-optional, but GROQ returns
whatever the dataset holds, so `src/lib/content-contract.ts` enforces that
promise on every fetch: required fields must be present and non-blank, slugs
must be URL-safe and unique within their collection, and every image must carry
alt text. A violation fails the build naming the collection, slug, document id
and field, and the message is printed to stderr because the prerenderer reports
a throwing loader only as `Failed to fetch /coffee/: Internal Server Error`. An
empty dataset passes trivially; the first real document that cannot render
correctly fails loudly instead of shipping as a blank section or a dead URL.

Anything authorable in the Studio has to reach the page. Every field the GROQ
projections fetch is either rendered by `src/components/content-detail.tsx` or
listed in the `notRenderedInBody` table in `src/components/content-detail.test.tsx`
with a reason (Sanity system fields, head-only SEO overrides, image identity
carried by `src` and `srcset`). The test walks each fixture document's leaf
values, formats them the way the page would, and fails naming any value that
never made it into the markup, so a new Studio field cannot be fetched and then
silently dropped.

`npm run test:e2e` runs the Playwright suite against a fixtures build, including
`e2e/a11y.spec.ts`, which fails on any axe-core WCAG 2.2 A/AA violation across a
representative page of each template and pins the landmark, single-`h1`, and
skip-link focus contract, and `e2e/performance.spec.ts`, which pins the font
loading path and the hero image's eager/intrinsic-size attributes.

Beyond axe, the build asserts the screen-reader semantics axe cannot see in
static markup: every prerendered page opens with exactly one `<h1>` and never
skips a heading level, and every `<time>` carries a machine-readable `datetime`
attribute (its visible text is a localised string). Card grids render as
labelled `<ul>` lists so assistive tech announces an item count, and repeated
links such as "See all" carry a per-collection `aria-label`.

Every page ships a social preview image. `pageHead()` uses the content's own
image when it has one and otherwise falls back to `public/og-image.png`, so the
home page, the collection indexes, and any unillustrated entry still preview as
a `summary_large_image` card instead of a bare line of text. That default is
rendered by `node scripts/generate-og-image.mjs` (Playwright screenshots an HTML
template in the site's own type and palette), and the build asserts the file
ships, is a real PNG, is 1200x630, and that every prerendered page names an
absolute `og:image`, `og:image:alt`, and `twitter:image`.

Saving the site to a phone home screen is covered too. `public/favicon.svg` is
ignored by both iOS and Android there, so the root head also links an
`apple-touch-icon` and `public/site.webmanifest`, and declares a `theme-color`
that matches the manifest's `theme_color`. The PNGs (180x180, 192x192, 512x512)
are rendered by `node scripts/generate-app-icons.mjs` from the same mark as the
favicon. The build asserts the manifest is valid JSON with a name, `start_url`
and `theme_color`, that its 192 and 512 icons exist at exactly those sizes, that
the apple-touch-icon is 180x180, and that every prerendered page links both and
declares a `theme-color` equal to the manifest's.

The blog publishes an RSS 2.0 feed at `/feed.xml`, and every page links it with
a `rel="alternate"` autodiscovery tag so a reader can subscribe from whichever
URL it is handed. `scripts/generate-feed.mjs` runs after `vite build` and builds
the channel by reading the `Article` JSON-LD back out of the prerendered blog
pages, so the feed can never describe a post the site does not serve and an
empty dataset simply yields an empty channel. `lastBuildDate` comes from the
newest post rather than the clock, so an unchanged rebuild produces a
byte-identical feed. The build asserts the document is well-formed RSS 2.0 with
a channel title, link, description and `atom:link` self reference, that its item
count matches the number of prerendered blog posts, and that every item points
at a real permalink with a matching `guid` and a parseable `pubDate`.

The build cross-checks the site's URL graph against itself. Every internal
`<a href>` in the prerendered output must resolve to a page the build emitted or
a file it wrote, every fragment link must match an element `id` on the page it
points at (the skip link is exactly this shape), and no internal link may carry
a trailing slash, which would send crawlers to a duplicate of a URL whose
canonical form has none. The sitemap is compared as a set rather than spot
checked: every indexable page appears exactly once under its own canonical URL,
every `noindex` page is absent, and the sitemap advertises nothing the build did
not prerender - so a new page cannot ship without being listed. `e2e/navigation.spec.ts`
crawls the same graph over HTTP against the preview server, which is what proves
the host actually serves those extensionless paths instead of falling through to
the 404 shell.

Authored links get their destination classified in `src/lib/links.ts` before
anything renders. A link into this site (a root-relative path, a fragment, or an
absolute `https://sergn.io` URL) renders as a plain in-tab anchor, so it behaves
like every other link on the site and joins the URL-graph check above. A link to
anywhere else opens in a new tab with `rel="noopener noreferrer"` and a
visually hidden "(opens in a new tab)" so the context switch is announced.
Anything else - a `javascript:` or `data:` scheme, a protocol-relative
`//host/path` that reads like an internal path but is not, a page-relative URL
whose target depends on where the text is rendered, or a missing href - fails
the content contract, because the Studio's URL validation is client-side only
and content written by API or import never sees it. The build then re-checks the
rendered result: no anchor may open a new tab without `rel="noopener"`, no
internal link may open one at all, and no anchor anywhere may point at a scheme
outside `http(s)`, `mailto` and `tel`.

Structured data is built in `src/lib/metadata.ts` and emitted from route heads:
the home page carries a `WebSite` + `Person` graph, every collection index and
detail page carries a `BreadcrumbList` ending at its own canonical URL, blog
posts add `Article`, and rated reviews (wings, N/A beers, reubens) add `Review`
with a 1-5 `reviewRating`. Coffee entries have no rating field, so they are
deliberately left with the breadcrumb only rather than shipping invalid `Review`
markup. The build parses every JSON-LD block in the prerendered output and fails
on a block that does not parse, a missing `@context`, or a breadcrumb that skips
its collection index or does not end at the page it sits on.

The build also enforces an initial-payload budget. For every prerendered page it
gzips each local stylesheet and module script the document head loads up front
(the entry bundle plus everything it `modulepreload`s) and fails above 140 KB
combined - roughly 30 KB of headroom over the current ~110 KB. The budget is a
ceiling meant to catch a dependency that silently doubles the bundle, not a
target to optimise against. The same pass fails on a `/assets/` reference the
build never emitted, which would cost a wasted 404 round trip on every visit.

A Lighthouse pass (desktop and mobile, home page, a collection index, and both
detail templates) scores 100 for accessibility, best practices, and SEO. The one
deliberate exception is `/retired-content`, which scores lower on SEO purely
because it is `noindex` on purpose.

### Accessible geometry

axe covers rules a machine can decide from the DOM. Three WCAG 2.2 AA criteria
are decided by rendered geometry instead, and axe either reports them only as
"incomplete" (target size) or has no rule for them at all (reflow, resize
text), so the axe pass was green on pages that failed all three.

`e2e/a11y.spec.ts` measures the rendered boxes on every page template:

- **2.5.8 Target Size (Minimum)** - every link, button and form control is at
  least 24x24 CSS px on both a 390px and a 1280px viewport. The criterion's
  exception for a target "in a sentence or block of text" is encoded as: skip a
  link whose containing block holds text the link itself does not, which is the
  authored-prose case where padding a link out would collide with the line
  above. This found two real failures: the header wordmark (22px tall) and the
  links inside a detail page's fact rows (18px tall), both fixed in
  `src/styles.css` by growing the hit area without moving the layout.
- **1.4.10 Reflow** - nothing overflows horizontally at 320 CSS px. Checking
  `scrollWidth` alone would miss an element overflowing into a clipped
  ancestor, so every rendered box is also checked against the viewport.
- **1.4.4 Resize Text** - doubling the root font size loses no content and
  forces no horizontal scrolling. This is the text-only case, which is stricter
  than page zoom and is what the rem-based type scale has to survive.

All three assertions were negative-tested against mutated CSS, and all three
pass against a build of the live empty dataset as well as the fixtures.

### Fonts

Web fonts are self-hosted. `scripts/generate-fonts.mjs` mirrors the Google Fonts
CSS API into `public/fonts/` and writes `src/fonts.css`; both are committed, and
re-running the script is the only supported way to change them. Serving them
from this origin removes two DNS + TLS handshakes and a serial round trip from
the critical path (`HTML` -> googleapis CSS -> gstatic woff2), lets the CSP drop
both Google origins, and keeps reader IP addresses off a third party. Browser
cache partitioning means a shared Google cache hit was never available anyway.

The generator collapses faces that share a family, style and subset with a
byte-identical file into one `@font-face` declaring a weight _range_. Newsreader
is variable, so Google serves the same 131 KB binary under three URLs for
weights 400/500/600 - a page using two of them downloaded it twice.

Font filenames carry the family version Google publishes (`v16`, `v26`), so a
font that actually changes lands at a new URL; that is what makes the
`immutable` cache header for `/fonts/*` in `netlify.toml` safe.

`src/routes/__root.tsx` links `src/fonts.css` from the document head rather than
`@import`-ing it from `src/styles.css` - an `@import` hides it from the preload
scanner, so the woff2 files cannot start until `styles.css` has been fetched and
parsed - and preloads the two latin faces every page paints with.

The build fails if any prerendered page mentions `fonts.googleapis.com` or
`fonts.gstatic.com`, if more or fewer than one emitted CSS asset declares
`@font-face`, if a declared font source is off-origin or missing from the
output, if a shipped woff2 is referenced by no `@font-face`, if the latin faces
exceed a 180 KB budget, or if any page fails to link the font stylesheet,
preloads no font, preloads a URL no `@font-face` declares, or preloads without
`crossorigin` (which makes the browser download the file twice). E2e tests prove
the fonts are served as `font/woff2`, that both families reach
`status: 'loaded'`, and that no request leaves for a Google host.

### Image loading priority

Every page has exactly one Largest Contentful Paint element, and the only
images allowed to skip lazy loading are the ones that can be it. A lazy image
cannot start downloading until layout has run, so leaving the LCP candidate
lazy costs the page its largest paint; every other image is off-screen on load
and prioritising it only takes bandwidth from the one that matters.

- Collection index pages prioritise the topmost card that actually _has_ an
  image, which is not always the first card - a document with no hero leaves
  its card image-less, and `CollectionPage` looks the index up with `cardImage`
  rather than assuming zero.
- Detail pages prioritise the hero image.
- The home page prioritises nothing: its LCP is the hero heading, and every
  card sits below the fold.

`priority` sets `loading="eager"` **and** `fetchpriority="high"` together.
Eager alone still queues the image behind the stylesheet; `fetchpriority` on a
lazy image is a contradiction the browser ignores.

The build fails if any image declares neither `lazy` nor `eager`, if an image's
`loading` and `fetchpriority` disagree, if an image ships without intrinsic
`width`/`height` (which is what stops the page reflowing when it arrives), if a
page marks more than one image eager, if the eager image is not the first image
in document order, if the home page prioritises a card, or if a collection
index with cards or a detail page with a hero prioritises nothing. E2e tests
pin the rendered attributes and, separately, that the element the browser
reports as Largest Contentful Paint on a collection index really is the
prioritised image.

## Hosting contract

`netlify.toml` publishes `dist/client` from `npm run build` and serves
`/assets/*` with `Cache-Control: public, max-age=31536000, immutable`. Vite puts
a content hash in every filename under `assets`, so a new build always produces
a new URL and repeat visitors never pay a revalidation round trip. The build
asserts both halves of that: the header rule must be immutable and at least a
year, and every emitted asset filename must still carry a hash. `/__tsr/*` is
deliberately left on Netlify's default, because those filenames hash the
server-function call rather than the response.

Every response also carries a baseline set of security headers from the same
file: a Content-Security-Policy, `Referrer-Policy`, `Strict-Transport-Security`,
`X-Content-Type-Options: nosniff`, and a `Permissions-Policy`. The CSP allows
`'unsafe-inline'` for scripts because TanStack Start emits an inline hydration
payload on every prerendered page and Netlify cannot mint a nonce for static
files; it still restricts script, style, font, image, and connect sources to
this origin plus Google Fonts and the Sanity CDN, and forbids framing entirely.
The build asserts the header rule exists, that the locked-down directives are
exactly as intended, that no directive allows `*` or `'unsafe-eval'`, and that
every origin the prerendered pages actually load from is covered by the policy.
`e2e/security.spec.ts` additionally replays the real policy from `netlify.toml`
against the preview server, so a change that would break fonts or hydration
fails locally rather than after a deploy.

Configure Netlify with these public environment variables:

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
