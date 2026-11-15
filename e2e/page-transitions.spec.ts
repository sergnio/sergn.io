import type { Page } from '@playwright/test'
import { awaitClientRouter } from './client-router'
import { expect, test } from './tracker-stub'

type TransitionRecord = {
  types: string[]
  morphs: string[]
  animated: number
  finished: boolean
}

/**
 * Records every view transition the page starts: its types, the names that
 * morph from one page into the other, and how many animations it runs.
 */
async function recordTransitions(page: Page) {
  // Wraps rather than replaces the browser API: the transition still runs.
  await page.addInitScript(() => {
    const records: TransitionRecord[] = []
    ;(window as unknown as { transitions: TransitionRecord[] }).transitions =
      records
    const start = document.startViewTransition.bind(document)
    document.startViewTransition = ((update: Parameters<typeof start>[0]) => {
      const transition = start(update)
      const record: TransitionRecord = {
        types: [],
        morphs: [],
        animated: 0,
        finished: false,
      }
      records.push(record)
      void transition.finished.then(() => {
        record.finished = true
      })
      void transition.ready.then(() => {
        const pseudos = document
          .getAnimations()
          .map(
            (animation) => (animation.effect as KeyframeEffect).pseudoElement,
          )
        const named = (part: string) =>
          pseudos
            .filter((pseudo) =>
              pseudo?.startsWith(`::view-transition-${part}(`),
            )
            .map((pseudo) => pseudo!.slice(pseudo!.indexOf('(') + 1, -1))
        const olds = new Set(named('old'))
        record.types =
          update && typeof update === 'object' ? [...(update.types ?? [])] : []
        record.morphs = [...new Set(named('new'))].filter((name) =>
          olds.has(name),
        )
        record.animated = pseudos.filter(Boolean).length
      })
      return transition
    }) as typeof document.startViewTransition
  })

  const read = () =>
    page.evaluate(
      () =>
        (window as unknown as { transitions: TransitionRecord[] }).transitions,
    )
  /** Resolves once `count` transitions have run to the end. */
  return async (count: number) => {
    await expect
      .poll(async () => (await read()).filter((t) => t.finished).length)
      .toBe(count)
    return read()
  }
}

test.describe('page transitions', () => {
  test('a wing photo and name morph into its page and back again', async ({
    page,
  }) => {
    const transitions = await recordTransitions(page)
    await page.goto('/wings')
    await awaitClientRouter(page)

    await page.getByRole('link', { name: 'Neighborhood Tavern' }).click()
    await transitions(1)
    await page.goBack()
    await expect(page).toHaveURL(/\/wings$/)

    const [forward, back] = await transitions(2)
    expect(forward.types).toEqual(['forward'])
    expect(back.types).toEqual(['back'])
    for (const { morphs } of [forward, back]) {
      expect(morphs).toEqual(
        expect.arrayContaining([
          'wingReview-neighborhood-buffalo-photo',
          'wingReview-neighborhood-buffalo-title',
        ]),
      )
      expect(morphs).not.toContain('wingReview-corner-bar-buffalo-photo')
    }
  })

  test('a collection card title morphs into its page heading', async ({
    page,
  }) => {
    const transitions = await recordTransitions(page)
    await page.goto('/coffee')
    await awaitClientRouter(page)

    await page.getByRole('link', { name: 'Ethiopia Direct Trade' }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Ethiopia Direct Trade' }),
    ).toBeVisible()

    const [{ morphs }] = await transitions(1)
    expect(morphs).toContain('coffee-ethiopia-direct-trade-title')
    expect(morphs).not.toContain('coffee-colombia-perky-title')
  })

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' })

    test('pages swap instantly, with nothing animated', async ({ page }) => {
      const transitions = await recordTransitions(page)
      await page.goto('/wings')
      await awaitClientRouter(page)

      await page.getByRole('link', { name: 'Neighborhood Tavern' }).click()
      await expect(page).toHaveURL(/\/wings\/neighborhood-buffalo$/)

      const [{ animated }] = await transitions(1)
      expect(animated).toBe(0)
    })
  })

  test('a list and its pages fetch their data only once', async ({ page }) => {
    const dataRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/__tsr/staticServerFnCache/')) {
        dataRequests.push(request.url())
      }
    })
    await page.goto('/wings')
    await awaitClientRouter(page)

    for (let round = 0; round < 2; round++) {
      await page.getByRole('link', { name: 'Neighborhood Tavern' }).click()
      await expect(
        page.getByRole('heading', { level: 1, name: 'Buffalo', exact: true }),
      ).toBeVisible()
      await page.goBack()
      await expect(
        page.getByRole('heading', { level: 1, name: 'Wings', exact: true }),
      ).toBeVisible()
    }

    expect(new Set(dataRequests).size).toBe(dataRequests.length)
  })
})
