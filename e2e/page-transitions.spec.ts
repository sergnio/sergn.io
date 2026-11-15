import type { Page } from '@playwright/test'
import { awaitClientRouter } from './client-router'
import { expect, test } from './tracker-stub'

type TransitionWindow = Window & { __viewTransitions: Set<string> }

// The crossfade is the requirement itself, and it lives only in the browser's
// ::view-transition pseudo-elements, so the test reads their animations.
async function recordViewTransitions(page: Page) {
  await page.evaluate(() => {
    const seen = new Set<string>()
    ;(window as unknown as TransitionWindow).__viewTransitions = seen
    const sample = () => {
      for (const animation of document.getAnimations()) {
        const effect = animation.effect as KeyframeEffect | null
        if (effect?.pseudoElement?.startsWith('::view-transition')) {
          seen.add(effect.pseudoElement)
        }
      }
      requestAnimationFrame(sample)
    }
    sample()
  })
}

const recordedTransitions = (page: Page) =>
  page.evaluate(() => [
    ...(window as unknown as TransitionWindow).__viewTransitions,
  ])

// Waits out the transition still playing, so it is not counted for the next one.
async function forgetTransitions(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          !(animation.effect as KeyframeEffect | null)?.pseudoElement,
      ),
  )
  await page.evaluate(() =>
    (window as unknown as TransitionWindow).__viewTransitions.clear(),
  )
}

// A view transition animates from the frame its new page first paints, so a
// few frames after the page appears are enough to see whether one ran.
async function expectNoTransition(page: Page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let frames = 5
        const tick = () => (--frames ? requestAnimationFrame(tick) : resolve(0))
        requestAnimationFrame(tick)
      }),
  )
  expect(await recordedTransitions(page)).toEqual([])
}

type SwipeWindow = Window & { __nextBackIsSwipe?: boolean }

// Stands in for Safari's edge swipe, which no automated browser can perform:
// the real back navigation reports that the browser already animated it.
async function enableSwipeBack(page: Page) {
  // Added before the page's scripts so it sees each popstate first.
  await page.addInitScript(() => {
    const swipeWindow = window as SwipeWindow
    window.addEventListener('popstate', (event) => {
      if (!swipeWindow.__nextBackIsSwipe) return
      swipeWindow.__nextBackIsSwipe = false
      event.stopImmediatePropagation()
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: event.state as unknown,
          hasUAVisualTransition: true,
        }),
      )
    })
  })
}

const goBackBySwipe = (page: Page) =>
  page.evaluate(() => {
    ;(window as SwipeWindow).__nextBackIsSwipe = true
    history.back()
  })

const primaryNavLink = (page: Page, name: string) =>
  page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name })

const pageHeading = (page: Page) => page.getByRole('heading', { level: 1 })

async function openWingsFromHome(page: Page) {
  await page.goto('/')
  await awaitClientRouter(page)
  await recordViewTransitions(page)
  await primaryNavLink(page, 'Wings').click()
  await expect(pageHeading(page)).toHaveText('Wings')
}

test.describe('page transitions', () => {
  test('a click and the browser Back button both crossfade the page', async ({
    page,
  }) => {
    await openWingsFromHome(page)
    await expect
      .poll(() => recordedTransitions(page))
      .toContain('::view-transition-new(root)')

    await forgetTransitions(page)
    await page.goBack()
    await expect
      .poll(() => recordedTransitions(page))
      .toContain('::view-transition-new(root)')
  })

  test('a swipe back keeps only the browser animation and redraws without loading', async ({
    page,
  }) => {
    await enableSwipeBack(page)
    await openWingsFromHome(page)
    const dataRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/__tsr/staticServerFnCache/')) {
        dataRequests.push(request.url())
      }
    })
    await forgetTransitions(page)

    await goBackBySwipe(page)

    await expect(page).toHaveURL(/\/$/)
    await expect(
      page.getByRole('navigation', { name: 'Sections' }),
    ).toBeVisible()
    expect(dataRequests).toEqual([])
    await expectNoTransition(page)
  })

  test('reduced motion swaps pages with no animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openWingsFromHome(page)

    await expectNoTransition(page)
  })
})

test.describe('page transitions in Safari before 26.2', () => {
  test.use({ hasTouch: true })

  // Older Safari has no hasUAVisualTransition, so the site infers a swipe from touch.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Reflect.deleteProperty(PopStateEvent.prototype, 'hasUAVisualTransition')
    })
  })

  test('Back after touching the page keeps only the browser animation', async ({
    page,
  }) => {
    await openWingsFromHome(page)
    await pageHeading(page).tap()
    await forgetTransitions(page)

    await page.goBack()

    await expect(
      page.getByRole('navigation', { name: 'Sections' }),
    ).toBeVisible()
    await expectNoTransition(page)
  })

  test('Back with no touch since the last page change still crossfades', async ({
    page,
  }) => {
    await page.goto('/')
    await awaitClientRouter(page)
    await recordViewTransitions(page)
    await primaryNavLink(page, 'Wings').tap()
    await expect(pageHeading(page)).toHaveText('Wings')
    await forgetTransitions(page)

    await page.goBack()

    await expect
      .poll(() => recordedTransitions(page))
      .toContain('::view-transition-new(root)')
  })
})
