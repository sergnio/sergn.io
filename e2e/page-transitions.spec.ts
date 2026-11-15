import type { Page } from '@playwright/test'
import { awaitClientRouter } from './client-router'
import { expect, test } from './tracker-stub'

// The crossfade is the requirement itself, and it lives only in the browser's
// ::view-transition pseudo-elements, so the test reads their animations.
async function recordViewTransitionAnimations(page: Page) {
  await page.evaluate(() => {
    const seen = new Set<string>()
    Object.assign(window, { __viewTransitionAnimations: seen })
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

const recordedAnimations = (page: Page) =>
  page.evaluate(() => [
    ...(window as unknown as { __viewTransitionAnimations: Set<string> })
      .__viewTransitionAnimations,
  ])

const primaryNavLink = (page: Page, name: string) =>
  page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name })

test.describe('page transitions', () => {
  test('a click and browser back both crossfade the page', async ({ page }) => {
    await page.goto('/')
    await awaitClientRouter(page)
    await recordViewTransitionAnimations(page)

    await primaryNavLink(page, 'Wings').click()
    await expect
      .poll(() => recordedAnimations(page))
      .toContain('::view-transition-new(root)')

    await page.evaluate(() =>
      (
        window as unknown as { __viewTransitionAnimations: Set<string> }
      ).__viewTransitionAnimations.clear(),
    )
    await page.goBack()
    await expect
      .poll(() => recordedAnimations(page))
      .toContain('::view-transition-new(root)')
  })

  test('reduced motion swaps pages with no animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await awaitClientRouter(page)
    await recordViewTransitionAnimations(page)

    await primaryNavLink(page, 'Wings').click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Wings' }),
    ).toBeVisible()
    // A second navigation finishing proves the first one's frames have run.
    await primaryNavLink(page, 'Coffee').click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Coffee' }),
    ).toBeVisible()

    expect(await recordedAnimations(page)).toEqual([])
  })
})
