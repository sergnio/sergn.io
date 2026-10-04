// Renders the PNG app icons referenced by public/site.webmanifest and the
// apple-touch-icon link. iOS and Android home screens ignore an SVG favicon,
// so without these a saved shortcut falls back to a screenshot or a letter.
// Kept as a script so the committed binaries have a readable source of truth.
// Run with: node scripts/generate-app-icons.mjs
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const mark = await readFile(
  path.join(process.cwd(), 'public', 'favicon.svg'),
  'utf8',
)
// Matches background_color in site.webmanifest; the 14% inset keeps the hat
// clear of iOS's rounded corners and Android's launcher masks.
const background = '#f2f0ed'
const inset = '14%'

const icons = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
]

const browser = await chromium.launch()

for (const { file, size } of icons) {
  const output = path.join(process.cwd(), 'public', file)
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  })
  // Opaque background: Apple composites a transparent icon onto black.
  await page.setContent(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;width:${size}px;height:${size}px;box-sizing:border-box;padding:${inset};background:${background}">${mark}</body>
</html>`)
  await page.screenshot({ path: output })
  await page.close()
  console.log(`Wrote ${path.relative(process.cwd(), output)} (${size}x${size})`)
}

await browser.close()
