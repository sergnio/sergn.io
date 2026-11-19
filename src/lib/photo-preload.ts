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
const warmed = new Map<
  string,
  { image: HTMLImageElement; decoded: Promise<void> }
>()
let started = false

type NetworkInformation = { saveData?: boolean; effectiveType?: string }

function connectionAllowsPreload() {
  const { connection } = navigator as { connection?: NetworkInformation }
  if (connection?.saveData) return false
  return !connection?.effectiveType?.endsWith('2g')
}

function warmPhoto(
  { src, srcSet, sizes }: PagePhoto,
  priority: 'low' | 'high' = 'low',
) {
  const key = `${src}|${srcSet}|${sizes}`
  const existing = warmed.get(key)
  if (existing) return existing.decoded

  const image = new Image()
  image.fetchPriority = priority
  if (sizes) image.sizes = sizes
  if (srcSet) image.srcset = srcSet
  image.src = src
  const decoded = image.decode().catch(() => undefined)
  warmed.set(key, { image, decoded })
  return decoded
}

const longestPhotoWaitMs = 300

// Recorded per path, since the router skips the loader when a preload already ran it.
const photosByPath = new Map<string, (PagePhoto | undefined)[]>()

type Navigation = { location: { pathname: string }; preload: boolean }

const pathKey = (pathname: string) => pathname.replace(/\/$/, '') || '/'

async function decodedOrTimedOut(photos: (PagePhoto | undefined)[]) {
  const decoded = photos
    .filter((photo): photo is PagePhoto => Boolean(photo))
    .map((photo) => warmPhoto(photo, 'high'))
  await Promise.race([
    Promise.all(decoded),
    new Promise((resolve) => setTimeout(resolve, longestPhotoWaitMs)),
  ])
}

/** A loader's photos: a navigation waits for them, but never long. */
export async function photosDecoded(
  photos: (PagePhoto | undefined)[],
  { location, preload }: Navigation,
) {
  if (typeof window === 'undefined') return
  photosByPath.set(pathKey(location.pathname), photos)
  if (!preload) await decodedOrTimedOut(photos)
}

/** Waits on a page's photos when its loader already ran as a preload. */
export async function knownPhotosDecoded({ location, preload }: Navigation) {
  const photos = photosByPath.get(pathKey(location.pathname))
  if (photos && !preload) await decodedOrTimedOut(photos)
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
