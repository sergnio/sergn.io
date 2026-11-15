import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { browserAnimatedThisNavigation } from './lib/browser-animated-history'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    // Loader data is prerendered and only changes on deploy, so back and
    // forward redraw from memory, matching the browser's swipe snapshot.
    defaultStaleTime: Infinity,
    defaultPreloadStaleTime: Infinity,
    defaultGcTime: Infinity,
    defaultPreloadGcTime: Infinity,
    defaultViewTransition: {
      types: () => (browserAnimatedThisNavigation() ? false : []),
    },
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
