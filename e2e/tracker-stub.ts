import { test as base } from '@playwright/test'

export const trackerScript = 'https://gc.zgo.at/count.js'

/**
 * Every page ships the GoatCounter tracker, so without this each page load in
 * the suite fetches a third-party script for real: dozens of external requests
 * per run, whose latency lands inside the load-state waits the specs depend on.
 * Serving it locally keeps the suite off the network and off GoatCounter.
 *
 * `count.js` already declines to count on localhost, so this is not about
 * polluting the stats - it is about not depending on a remote host to decide
 * whether the tests pass.
 */
export const test = base.extend<{ stubTracker: void }>({
  stubTracker: [
    async ({ page }, use) => {
      await page.route(trackerScript, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'text/javascript',
          body: '',
        }),
      )
      await use()
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
