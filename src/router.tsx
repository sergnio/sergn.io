import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    // Loader data is prerendered at build time and cannot change until the
    // next deploy, so a session loads each page's data once and keeps it.
    defaultStaleTime: Infinity,
    defaultPreloadStaleTime: Infinity,
    defaultGcTime: Infinity,
    defaultPreloadGcTime: Infinity,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
