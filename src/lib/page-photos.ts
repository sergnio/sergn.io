import { cardImage } from './card-fields'
import type {
  CollectionName,
  ContentDocument,
  SanityImage,
  WingReview,
} from './content-types'
import { isRankedCollection } from './content-types'
import { imageSrcSet, imageUrl } from './sanity/image'
import { mainList, podiumSize, wingPageData } from './wings'

/** Shared by each `<img>` and its preload, so both pick the same srcset file. */
export const photoSizes = {
  card: '(min-width: 720px) 33vw, 100vw',
  detailHero: '(min-width: 900px) 50vw, 100vw',
  wingHero: '(min-width: 56rem) 36rem, calc(100vw - 2rem)',
  wingTop: (rank: number) =>
    `(min-width: 42rem) 33vw, ${rank === 1 ? 100 : 50}vw`,
}

export const wingThumbnailWidth = 200

export type PagePhoto = { src: string; srcSet?: string; sizes?: string }

function responsivePhoto(
  image: SanityImage | undefined,
  sizes: string,
): PagePhoto | undefined {
  const src = imageUrl(image, 800)
  return src ? { src, srcSet: imageSrcSet(image), sizes } : undefined
}

function thumbnailPhoto(image: SanityImage | undefined) {
  const src = imageUrl(image, wingThumbnailWidth)
  return src ? { src } : undefined
}

/** The photos a collection's list page shows, top of the page first. */
export function listPhotos(
  collection: CollectionName,
  documents: ContentDocument[],
): (PagePhoto | undefined)[] {
  if (collection === 'wings') {
    return mainList(documents as WingReview[])
      .filter(({ rank }) => rank <= podiumSize)
      .map(({ wing, rank }) =>
        responsivePhoto(wing.heroImage, photoSizes.wingTop(rank)),
      )
  }

  const withCards = isRankedCollection(collection)
    ? [
        ...documents
          .filter(
            (document) => document.recommendationStatus !== 'notRecommended',
          )
          .slice(0, podiumSize),
        ...documents.filter(
          (document) => document.recommendationStatus === 'notRecommended',
        ),
      ]
    : documents
  return withCards.map((document) =>
    responsivePhoto(cardImage(document), photoSizes.card),
  )
}

/** The photos at the top of each of a collection's detail pages. */
export function detailPhotos(
  collection: CollectionName,
  documents: ContentDocument[],
): (PagePhoto | undefined)[] {
  if (collection === 'wings') {
    const wings = documents as WingReview[]
    return wings.flatMap((wing) => [
      responsivePhoto(wing.heroImage, photoSizes.wingHero),
      ...(wingPageData(wings, wing.slug)?.siblings ?? []).map((sibling) =>
        thumbnailPhoto(sibling.wing.heroImage),
      ),
    ])
  }

  return documents.map((document) =>
    responsivePhoto(cardImage(document), photoSizes.detailHero),
  )
}
