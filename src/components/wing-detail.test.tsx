// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { WingReview } from '#/lib/content-types'
import { getFixtureCollection } from '#/lib/fixtures'
import { wingPageData } from '#/lib/wings'
import { WingDetail } from './wing-detail'

const wings = getFixtureCollection('wings')

afterEach(cleanup)

async function renderWing(slug: string, collection: WingReview[] = wings) {
  const page = wingPageData(collection, slug)
  if (!page) throw new Error(`No wing fixture for ${slug}`)

  const rootRoute = createRootRoute()
  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/wings',
      component: () => <h1>Wings</h1>,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/wings/$slug',
      component: () => <WingDetail {...page} />,
    }),
  ])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/wings/${slug}`] }),
  })
  render(<RouterProvider router={router} />)
  await screen.findByRole('heading', { level: 1 })
}

function withSwap(slug: string, swap: (wing: WingReview) => WingReview) {
  return wings.map((wing) => (wing.slug === slug ? swap(wing) : wing))
}

describe('the wing page', () => {
  it('names the wing under a Wings / place breadcrumb', async () => {
    await renderWing('corner-bar-buffalo')
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Buffalo' }),
    ).toBeTruthy()
    expect(
      within(breadcrumb)
        .getAllByRole('listitem')
        .map((crumb) => crumb.textContent),
    ).toEqual(['Wings', 'The Corner Bar', 'Buffalo'])
  })

  it('links the Wings crumb back to the list without marking it current', async () => {
    await renderWing('corner-bar-buffalo')
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    const wingsCrumb = within(breadcrumb).getByRole('link', { name: 'Wings' })

    expect(wingsCrumb.getAttribute('href')).toBe('/wings')
    expect(wingsCrumb.getAttribute('aria-current')).toBeNull()
    expect(within(breadcrumb).getAllByRole('link')).toHaveLength(1)
    expect(
      within(breadcrumb).getByText('Buffalo').getAttribute('aria-current'),
    ).toBe('page')

    await userEvent.click(wingsCrumb)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Wings' }),
    ).toBeTruthy()
  })

  it('keeps the place name plain text', async () => {
    await renderWing('corner-bar-buffalo')

    expect(screen.queryByRole('link', { name: 'The Corner Bar' })).toBeNull()
  })

  it('opens the address as an OpenStreetMap search in a new tab', async () => {
    await renderWing('corner-bar-buffalo')
    const map = screen.getByRole('link', {
      name: '7 Corner Street, Columbus (opens a map in a new tab)',
    })

    expect(map.getAttribute('href')).toBe(
      'https://www.openstreetmap.org/search?query=7%20Corner%20Street%2C%20Columbus',
    )
    expect(map.getAttribute('target')).toBe('_blank')
    expect(map.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('stamps the letter grade beside visits, rank, and the last visit', async () => {
    await renderWing('corner-bar-buffalo')

    expect(screen.getByRole('img', { name: 'Grade B' }).textContent).toBe('B')
    expect(screen.getByText('2 visits')).toBeTruthy()
    expect(screen.getByText('#3 of 4')).toBeTruthy()
    expect(screen.getByText(/^Last visit/).textContent).toBe(
      'Last visit Mar 3, 2025',
    )
  })

  it('wears no crown below #1', async () => {
    await renderWing('corner-bar-buffalo')

    expect(screen.queryByTestId('wing-crown')).toBeNull()
    expect(screen.queryByRole('img', { name: /crown pick/ })).toBeNull()
  })

  it('prints the notes as written', async () => {
    await renderWing('corner-bar-buffalo')

    expect(
      screen.getByText('Plain and dependable, a step behind the honey hot.', {
        exact: false,
      }),
    ).toBeTruthy()
  })

  it('leaves out what the design dropped', async () => {
    await renderWing('corner-bar-buffalo')

    expect(screen.queryByText(/Website/)).toBeNull()
    expect(screen.queryByText(/All \d+ wings/)).toBeNull()
  })

  it('lists the other wings at the place, linked, with their standing', async () => {
    await renderWing('corner-bar-buffalo')
    const alsoTried = screen.getByRole('region', {
      name: 'Also tried at The Corner Bar',
    })
    const siblings = within(alsoTried).getAllByRole('listitem')

    expect(siblings).toHaveLength(1)
    expect(
      within(siblings[0])
        .getByRole('link', { name: 'Honey hot' })
        .getAttribute('href'),
    ).toBe('/wings/corner-bar-honey-hot')
    expect(within(siblings[0]).getByText('Not buffalo')).toBeTruthy()
    expect(
      within(siblings[0]).getByText(
        (_, element) => element?.textContent === 'Grade B+',
      ),
    ).toBeTruthy()
  })

  it('tags a sibling on the main list with its rank', async () => {
    await renderWing('corner-bar-honey-hot')

    expect(screen.getByText('#3 on the list')).toBeTruthy()
  })

  it('gives a wing off the main list no rank', async () => {
    await renderWing('corner-bar-honey-hot')

    expect(screen.queryByText(/#\d+ of \d+/)).toBeNull()
  })

  it('draws the no-photo placeholder in place of a missing photo', async () => {
    await renderWing('corner-bar-buffalo')

    expect(screen.getAllByRole('img', { name: 'No photo yet' })).toHaveLength(2)
    expect(screen.queryByRole('figure')).toBeNull()
  })
})

describe('the #1 wing, alone at its place', () => {
  it('wears the crown in its stamp in place of the letter, still announced', async () => {
    await renderWing('neighborhood-buffalo')
    const stamp = screen.getByRole('img', { name: 'Grade A+, the crown pick' })

    expect(within(stamp).getByTestId('wing-crown')).toBeTruthy()
    expect(stamp.textContent).not.toContain('A+')
  })

  it('has no Also tried section', async () => {
    await renderWing('neighborhood-buffalo')

    expect(screen.queryByRole('region', { name: /Also tried/ })).toBeNull()
  })

  it('loads its photo first and leaves out an unrecorded visit count', async () => {
    await renderWing('neighborhood-buffalo')

    expect(
      screen
        .getByRole('img', { name: 'A plate of sauced chicken wings' })
        .getAttribute('fetchpriority'),
    ).toBe('high')
    expect(screen.getByText('#1 of 4')).toBeTruthy()
    expect(screen.queryByText(/\d+ visits?/)).toBeNull()
  })
})

describe('a crowned S+', () => {
  it('announces the letter grade and never prints the emoji', async () => {
    await renderWing(
      'neighborhood-buffalo',
      withSwap('neighborhood-buffalo', (wing) => ({
        ...wing,
        grade: 'S+',
        isCrowned: true,
      })),
    )

    expect(
      screen.getByRole('img', { name: 'Grade S+, the crown pick' }),
    ).toBeTruthy()
    expect(document.body.textContent).not.toContain('👑')
  })
})

describe('the best non-buffalo wing', () => {
  it('stars its rank and links the star to the footnote', async () => {
    await renderWing('smokehouse-dry-rub-wings')

    expect(
      screen
        .getByRole('link', { name: 'Not buffalo, see note' })
        .getAttribute('href'),
    ).toBe('#wing-footnote')
    expect(
      screen.getByText(
        'No buffalo at Eastside Smokehouse, so this wing holds its spot on the list.',
        { exact: false },
      ),
    ).toBeTruthy()
  })

  it('has no footnote on a buffalo wing', async () => {
    await renderWing('corner-bar-buffalo')

    expect(screen.queryByText(/No buffalo at/)).toBeNull()
    expect(screen.queryByRole('link', { name: /see note/ })).toBeNull()
  })
})

describe('a place with no street address', () => {
  it('names its city without a map link', async () => {
    await renderWing(
      'corner-bar-buffalo',
      withSwap('corner-bar-buffalo', (wing) => ({
        ...wing,
        location: { ...wing.location, address: '' },
      })),
    )

    expect(screen.getByText(/, Columbus$/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /opens a map/ })).toBeNull()
  })
})

describe('a non-recommendation', () => {
  it('says so and renders with nothing but a title and a place', async () => {
    const sparse: WingReview = {
      _id: 'sparse',
      _type: 'wingReview',
      _createdAt: '2025-05-01T12:00:00.000Z',
      _updatedAt: '2025-05-01T12:00:00.000Z',
      title: 'Sparse wings',
      slug: 'sparse',
      recommendationStatus: 'notRecommended',
      mainListRole: 'none',
      location: {
        _ref: 'location-sparse',
        _id: 'location-sparse',
        name: 'Sparse tavern',
        city: 'Columbus',
        address: '1 Sparse Street',
      },
    }
    await renderWing('sparse', [sparse])

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sparse wings' }),
    ).toBeTruthy()
    expect(screen.getByText('Sergio does not recommend this.')).toBeTruthy()
    expect(screen.queryByRole('img', { name: /^Grade/ })).toBeNull()
    expect(screen.queryByText(/Last visit/)).toBeNull()
  })
})
