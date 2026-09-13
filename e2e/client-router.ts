import type { Page } from '@playwright/test'

/**
 * Resolves once the client router is mounted, which is the point the page
 * stops being static markup and starts handling clicks itself. The prerendered
 * HTML is interactive-looking long before that, so any test that clicks
 * without waiting is really timing the bundle rather than testing behaviour.
 */
export async function awaitClientRouter(page: Page) {
  await page.waitForFunction(() => '__TSR_ROUTER__' in window)
}
