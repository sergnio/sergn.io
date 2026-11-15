const fontPreload = (href: string) =>
  ({
    rel: 'preload',
    as: 'font',
    type: 'font/woff2',
    href,
    crossOrigin: 'anonymous',
  }) as const

/** The serif and mono latin faces paint first on every page. */
export const everyPageFontPreloads = [
  '/fonts/newsreader-v26-400-650-normal-latin.woff2',
  '/fonts/dm-mono-v16-400-normal-latin.woff2',
].map(fontPreload)

/** Onest is above the fold on many pages (the mobile Menu, wing place names); the ranked lists and 404 opt into preloading it. */
export const sansFontPreload = fontPreload(
  '/fonts/onest-v11-400-600-normal-latin.woff2',
)
