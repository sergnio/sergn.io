import type { AnyRouter } from '@tanstack/react-router'
import type { CollectionName, ContentDocument } from './content-types'
import type { PagePhoto } from './page-photos'
import { detailPhotos, listPhotos } from './page-photos'

/** In the order the home page lists them, so the likeliest next page warms first. */
const collections: CollectionName[] = [
  'wings',
  'coffee',
  'na-beers',
  'reubens',
  'syrup',
  'blog',
]

const parallelDownloads = 4

// Held: once collected, Chrome and Safari download the photo again on the page.
const warmed = new Map<string, HTMLImageElement>()
let started = false

type NetworkInformation = { saveData?: boolean; effectiveType?: string }

function connectionAllowsPreload() {
  const { connection } = navigator as { connection?: NetworkInformation }
  if (connection?.saveData) return false
  return !connection?.effectiveType?.endsWith('2g')
}

function warmPhoto({ src, srcSet, sizes }: PagePhoto) {
  const key = `${src}|${srcSet}|${sizes}`
  if (warmed.has(key)) return Promise.resolve()

  const image = new Image()
  image.fetchPriority = 'low'
  if (sizes) image.sizes = sizes
  if (srcSet) image.srcset = srcSet
  image.src = src
  warmed.set(key, image)
  return image.decode().catch(() => undefined)
}

// One photo's slots warm one after another: at the same width two slots pick
// the same file, and racing them would download it twice.
async function warmInOrder(photos: PagePhoto[]) {
  const slotsByPhoto = new Map<string, PagePhoto[]>()
  for (const photo of photos) {
    slotsByPhoto.set(photo.src, [...(slotsByPhoto.get(photo.src) ?? []), photo])
  }
  const queue = [...slotsByPhoto.values()]
  const lane = async () => {
    for (let slots = queue.shift(); slots; slots = queue.shift()) {
      for (const slot of slots) await warmPhoto(slot)
    }
  }
  await Promise.all(Array.from({ length: parallelDownloads }, lane))
}

async function collectionDocuments(router: AnyRouter, name: CollectionName) {
  const matches = await router
    .preloadRoute({ to: `/${name}` })
    .catch(() => undefined)
  return (matches?.at(-1)?.loaderData ?? []) as ContentDocument[]
}

/** Once the first page is idle, readies every page's top photos at the size it shows them. */
export function preloadSitePhotos(router: AnyRouter) {
  if (started || !connectionAllowsPreload()) return
  started = true

  const run = async () => {
    const documents = await Promise.all(
      collections.map((name) => collectionDocuments(router, name)),
    )
    const photos = [
      ...collections.flatMap((name, index) =>
        listPhotos(name, documents[index]),
      ),
      ...collections.flatMap((name, index) =>
        detailPhotos(name, documents[index]),
      ),
    ].filter((photo): photo is PagePhoto => Boolean(photo))
    await warmInOrder(photos)
  }

  const whenIdle = () =>
    'requestIdleCallback' in window
      ? requestIdleCallback(() => void run())
      : setTimeout(() => void run(), 0)

  if (document.readyState === 'complete') whenIdle()
  else window.addEventListener('load', whenIdle, { once: true })
}
