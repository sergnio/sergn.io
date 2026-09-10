import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { NotFoundContent } from '#/components/not-found'
import { SiteHeader } from '#/components/site-header'
import { defaultSocialImage, siteDescription, siteName } from '#/lib/metadata'
import appCss from '../styles.css?url'

const fontCss =
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap'

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
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      // Warm both font origins up front. Without these the browser only
      // starts resolving fonts.gstatic.com after the googleapis stylesheet
      // has been fetched and parsed.
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
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
    </>
  )
}
