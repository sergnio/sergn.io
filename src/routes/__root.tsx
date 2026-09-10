import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { NotFoundContent } from '#/components/not-found'
import { SiteHeader } from '#/components/site-header'
import { siteDescription, siteName } from '#/lib/metadata'
import appCss from '../styles.css?url'

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
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: siteName },
      { name: 'twitter:description', content: siteDescription },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
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
