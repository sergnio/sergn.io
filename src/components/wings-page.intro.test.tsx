// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WingReview } from '#/lib/content-types'
import { getFixtureCollection } from '#/lib/fixtures'
import { WingsPage } from './wings-page'

const questLine =
  'On a quest with Mike to find the best wings. Flavor, crunch, juiciness and size matter.'

// jsdom has no IntersectionObserver; the sticky tier heads need one to mount.
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    disconnect() {}
  },
)

afterEach(cleanup)

async function renderWingsPage(wings: WingReview[]) {
  const rootRoute = createRootRoute()
  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/wings',
      component: () => <WingsPage wings={wings} />,
    }),
  ])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/wings'] }),
  })
  render(<RouterProvider router={router} />)
  await screen.findByRole('heading', { level: 1, name: 'Wings' })
}

describe('the wings page intro', () => {
  it('tells the quest under the Wings heading', async () => {
    await renderWingsPage(getFixtureCollection('wings'))

    expect(screen.getByText(questLine)).toBeTruthy()
  })

  it('keeps the quest out of the heading outline', async () => {
    await renderWingsPage(getFixtureCollection('wings'))

    expect(screen.queryByRole('heading', { name: questLine })).toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('says nothing about ranking above the list', async () => {
    await renderWingsPage(getFixtureCollection('wings'))

    expect(screen.queryByText(/Ranked|Best first|Recommended/)).toBeNull()
  })

  it('still tells the quest before any wing is published', async () => {
    await renderWingsPage([])

    expect(screen.getByText(questLine)).toBeTruthy()
  })
})
