import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { SiteHeader } from '#/components/site-header'
import { siteName } from '#/lib/metadata'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: siteName },
      {
        name: 'description',
        content: 'Coffee, wings, N/A beers, reubens, and notes from Sergio.',
      },
      { property: 'og:site_name', content: siteName },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  notFoundComponent: NotFound,
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
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} sergn.io</p>
      </footer>
    </>
  )
}

function NotFound() {
  return (
    <div className="not-found page-shell">
      <p className="eyebrow">404</p>
      <h1>That page is not here.</h1>
      <p>Try one of the current collections instead.</p>
      <a className="button-link" href="/">
        Back home
      </a>
    </div>
  )
}
