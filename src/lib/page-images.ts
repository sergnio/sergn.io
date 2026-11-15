import { cardImage, podiumSize } from './card-fields'
import type {
  ContentDocument,
  ImageDisplay,
  PortableTextImage,
  PostBodyContent,
  SanityImage,
  WingReview,
} from './content-types'
import { imageSrcSet, imageUrl } from './sanity/image'
import type { WingPageData } from './wings'
import { mainList, podiumSize as wingPodiumSize } from './wings'

/**
 * Each slot's `sizes`. The <img> and the loader that warms it share these, so
 * both pick the same srcset candidate and the warmed file is the one painted.
 */
export const imageSizes = {
  card: '(min-width: 720px) 33vw, 100vw',
  detailHero: '(min-width: 900px) 50vw, 100vw',
  wingHero: '(min-width: 56rem) 36rem, calc(100vw - 2rem)',
  wingTop: (rank: number) =>
    `(min-width: 42rem) 33vw, ${rank === 1 ? 100 : 50}vw`,
  richText: {
    inline: '(min-width: 768px) 48rem, 100vw',
    wide: '(min-width: 1100px) 64rem, 100vw',
    full: '100vw',
  } satisfies Record<ImageDisplay, string>,
}

export type ImageSource = { src?: string; srcSet?: string; sizes?: string }

export function responsiveImage(
  image: SanityImage | undefined,
  sizes: string,
): ImageSource {
  return { src: imageUrl(image, 800), srcSet: imageSrcSet(image), sizes }
}

export function wingThumbnail(image: SanityImage | undefined): ImageSource {
  return { src: imageUrl(image, 200) }
}

/** Longest a click keeps the current page up while the next one's photos load. */
export const imageWaitBudgetMs = 400

// Hover and touch preloads warm photos too; a reader saving data skips that.
function savesData() {
  const { connection } = navigator as { connection?: { saveData?: boolean } }
  return connection?.saveData === true
}

/**
 * Resolves once these photos are downloaded and decoded, or after the budget,
 * so a client navigation swaps in a page whose first screen is already painted.
 */
export async function imagesReady(sources: ImageSource[]) {
  if (typeof document === 'undefined' || savesData()) return

  const decoded = sources.flatMap(({ src, srcSet, sizes }) => {
    if (!src) return []
    const img = new Image()
    img.sizes = sizes ?? ''
    img.srcset = srcSet ?? ''
    img.src = src
    return [img.decode().catch(() => undefined)]
  })
  if (decoded.length === 0) return

  await Promise.race([
    Promise.all(decoded),
    new Promise((resolve) => setTimeout(resolve, imageWaitBudgetMs)),
  ])
}

export function collectionFirstScreen(documents: ContentDocument[]) {
  return documents
    .filter((document) => document.recommendationStatus !== 'notRecommended')
    .slice(0, podiumSize)
    .map((document) => responsiveImage(cardImage(document), imageSizes.card))
}

// Only the first photo in the text can reach the first screen.
function firstTextImage(value?: PostBodyContent) {
  const image = value?.find(
    (block): block is PortableTextImage => block._type === 'imageWithAlt',
  )
  return image
    ? [responsiveImage(image, imageSizes.richText[image.display ?? 'inline'])]
    : []
}

export function detailFirstScreen(document: ContentDocument) {
  return [
    responsiveImage(cardImage(document), imageSizes.detailHero),
    ...firstTextImage(
      document._type === 'post' ? document.body : document.notes,
    ),
  ]
}

export function wingsFirstScreen(wings: WingReview[]) {
  return mainList(wings)
    .slice(0, wingPodiumSize)
    .map(({ wing, rank }) =>
      responsiveImage(wing.heroImage, imageSizes.wingTop(rank)),
    )
}

export function wingFirstScreen({ wing, siblings }: WingPageData) {
  return [
    responsiveImage(wing.heroImage, imageSizes.wingHero),
    ...firstTextImage(wing.notes),
    ...siblings.map((sibling) => wingThumbnail(sibling.wing.heroImage)),
  ]
}
