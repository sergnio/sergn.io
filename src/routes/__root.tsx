import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { Analytics } from '#/components/analytics'
import { NotFoundContent } from '#/components/not-found'
import { SiteHeader } from '#/components/site-header'
import {
  brandColor,
  defaultSocialImage,
  siteDescription,
  siteName,
} from '#/lib/metadata'
import fontCss from '../fonts.css?url'
import appCss from '../styles.css?url'

// The two faces every page paints with before anything else. They are named
// here rather than discovered from the stylesheet so the preload scanner can
// start them on first byte; scripts/assert-static-output.mjs fails the build
// if either URL stops matching what src/fonts.css actually declares.
const preloadedFonts = [
  '/fonts/newsreader-v26-400-600-normal-latin.woff2',
  '/fonts/dm-mono-v16-400-normal-latin.woff2',
]

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: siteName },
      { name: 'description', content: siteDescription },
      { property: 'og:site_name', content: siteName },
      { property: 'og:type', content: 'website' },
      // Social defaults every page inherits; routes with their own copy
      // override these by tag name in TanStack's head merge.
      { property: 'og:title', content: siteName },
      { property: 'og:description', content: siteDescription },
      { property: 'og:image', content: defaultSocialImage.url },
      { property: 'og:image:alt', content: defaultSocialImage.alt },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: siteName },
      { name: 'twitter:description', content: siteDescription },
      { name: 'twitter:image', content: defaultSocialImage.url },
      { name: 'twitter:image:alt', content: defaultSocialImage.alt },
      // Matches theme_color in site.webmanifest: mobile browser chrome and an
      // installed shortcut should not disagree about the brand colour.
      { name: 'theme-color', content: brandColor },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      // Home-screen shortcuts ignore an SVG favicon: iOS needs an
      // apple-touch-icon PNG and Android reads the manifest icons.
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
      // Feed readers look for this on any page of the site, not just /blog.
      {
        rel: 'alternate',
        type: 'application/rss+xml',
        title: 'sergn.io blog',
        href: '/feed.xml',
      },
      // Self-hosted from the site's own origin: a third-party font
      // stylesheet costs two extra DNS + TLS handshakes and makes the woff2
      // fetches wait on a cross-origin CSS response first.
      ...preloadedFonts.map(
        (href) =>
          ({
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            href,
            crossOrigin: 'anonymous',
          }) as const,
      ),
      // Linked here rather than @import-ed from styles.css: an @import makes
      // this request wait for styles.css to download and parse first, which
      // pushed the actual woff2 fetches behind two serial round trips.
      { rel: 'stylesheet', href: fontCss },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  notFoundComponent: NotFoundContent,
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        {/*
          GoatCounter: no cookies, no personal data, so no consent banner.
          Written into the document rather than the route's head config
          because TanStack only emits those tags after hydration, which would
          keep the tracker out of the prerendered HTML entirely. It is defer
          rather than async because React 19 hoists async scripts out of the
          tree and the prerender then drops them; defer is just as
          non-blocking. count.js
          counts the first pageview on load; src/components/analytics.tsx
          reports client-side navigations after that. Both origins it touches
          are allowed by the Content-Security-Policy in netlify.toml.
        */}
        <script
          defer
          src="https://gc.zgo.at/count.js"
          data-goatcounter="https://sergnio.goatcounter.com/count"
        />
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} sergn.io</p>
      </footer>
      <Analytics />
    </>
  )
}
