// Renders public/og-image.png, the default social preview every page falls
// back to when its content has no image of its own. Kept as a script so the
// committed PNG has a readable source of truth rather than being an opaque
// binary. Run with: node scripts/generate-og-image.mjs
import path from 'node:path'
import { chromium } from '@playwright/test'

const width = 1200
const height = 630
const output = path.join(process.cwd(), 'public', 'og-image.png')

const markup = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=block"
      rel="stylesheet"
    />
    <style>
      * { box-sizing: border-box; margin: 0; }
      body {
        width: ${width}px;
        height: ${height}px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 72px 88px;
        background: #f2f0ed;
        border-bottom: 18px solid #884444;
        color: #30272d;
      }
      .wordmark {
        font-family: 'DM Mono', monospace;
        font-size: 40px;
        font-weight: 500;
        letter-spacing: -0.08em;
        color: #30272d;
      }
      .wordmark span { color: #884444; }
      h1 {
        max-width: 15ch;
        font-family: 'Newsreader', Georgia, serif;
        font-size: 108px;
        font-weight: 500;
        line-height: 1.05;
        letter-spacing: -0.02em;
        color: #30272d;
      }
      p {
        font-family: 'DM Mono', monospace;
        font-size: 28px;
        letter-spacing: -0.02em;
        color: #615e5c;
      }
    </style>
  </head>
  <body>
    <div class="wordmark">sergn<span>.io</span></div>
    <h1>Coffee, wings, N/A beers, reubens.</h1>
    <p>Tasting notes and writing from Sergio.</p>
  </body>
</html>`

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 1,
})
await page.setContent(markup, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: output })
await browser.close()

console.log(
  `Wrote ${path.relative(process.cwd(), output)} (${width}x${height})`,
)
