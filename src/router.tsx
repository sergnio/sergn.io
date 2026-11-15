import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import type { ParsedLocation } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

/** Content only changes with a deploy, which reloads the page anyway. */
const neverStale = Number.POSITIVE_INFINITY

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultStaleTime: neverStale,
    defaultPreloadStaleTime: neverStale,
    defaultViewTransition: {
      types: ({ fromLocation, toLocation }) => [
        historyIndex(toLocation) < historyIndex(fromLocation)
          ? 'back'
          : 'forward',
      ],
    },
  })
}

function historyIndex(location?: ParsedLocation) {
  return location?.state.__TSR_index ?? 0
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
