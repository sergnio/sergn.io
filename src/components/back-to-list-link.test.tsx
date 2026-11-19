// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { BackToListLink, openedFromList } from './back-to-list-link'

afterEach(cleanup)

async function renderAt(path: string) {
  const rootRoute = createRootRoute()
  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/wings',
      component: () => (
        <>
          <h1>Wings</h1>
          <Link
            params={{ slug: 'arena' }}
            state={openedFromList('wings')}
            to="/wings/$slug"
          >
            Downtown Arena
          </Link>
        </>
      ),
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/wings/$slug',
      component: () => (
        <>
          <h1>Arena wings</h1>
          <BackToListLink collection="wings">Wings</BackToListLink>
          <Link params={{ slug: 'corner-bar' }} to="/wings/$slug">
            Also tried: Corner Bar
          </Link>
        </>
      ),
    }),
  ])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(<RouterProvider router={router} />)
  await screen.findByRole('heading', { level: 1 })
  return router
}

const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name })

describe('the back-to-list link', () => {
  it('goes back to the list it came from, leaving no wing entry behind it', async () => {
    const router = await renderAt('/wings')
    await userEvent.click(screen.getByRole('link', { name: 'Downtown Arena' }))
    await heading('Arena wings')

    await userEvent.click(screen.getByRole('link', { name: 'Wings' }))

    expect(await heading('Wings')).toBeTruthy()
    expect(router.history.canGoBack()).toBe(false)
  })

  it('opens the list as a new page when the item was opened directly', async () => {
    const router = await renderAt('/wings/arena')

    await userEvent.click(screen.getByRole('link', { name: 'Wings' }))
    expect(await heading('Wings')).toBeTruthy()

    router.history.back()
    expect(await heading('Arena wings')).toBeTruthy()
  })

  it('opens the list as a new page when the page before was another wing', async () => {
    const router = await renderAt('/wings')
    await userEvent.click(screen.getByRole('link', { name: 'Downtown Arena' }))
    await heading('Arena wings')
    await userEvent.click(
      screen.getByRole('link', { name: 'Also tried: Corner Bar' }),
    )
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/wings/corner-bar'),
    )

    await userEvent.click(screen.getByRole('link', { name: 'Wings' }))
    expect(await heading('Wings')).toBeTruthy()

    router.history.back()
    expect(await heading('Arena wings')).toBeTruthy()
    expect(router.state.location.pathname).toBe('/wings/corner-bar')
  })

  it('leaves a modified click to the browser, so it can open a new tab', async () => {
    await renderAt('/wings')
    await userEvent.click(screen.getByRole('link', { name: 'Downtown Arena' }))
    await heading('Arena wings')
    const user = userEvent.setup()

    await user.keyboard('{Meta>}')
    await user.click(screen.getByRole('link', { name: 'Wings' }))
    await user.keyboard('{/Meta}')

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Arena wings',
    )
    expect(
      screen.getByRole('link', { name: 'Wings' }).getAttribute('href'),
    ).toBe('/wings')
  })
})
