import type {
  Coffee,
  CollectionName,
  ContentDocument,
  NaBeer,
  Post,
  ReubenReview,
  SyrupReview,
  WingReview,
} from '../content-types'
import { isRankedCollection } from '../content-types'
import { assertValidCollection, assertValidDocument } from '../content-contract'
import { getFixtureCollection, getFixtureDocument } from '../fixtures'
import { getPublishedSanityClient, usesFixtureContent } from './client'

// imageWithAlt nests the upload under `image`, so crop, hotspot, and the asset
// reference all live one level down. Projecting them from the top level yields
// nulls, which renders a figure with no img inside it.
const imageProjection = `{
  alt,
  caption,
  credit,
  "crop": image.crop,
  "hotspot": image.hotspot,
  "asset": image.asset->{_id, url, metadata {dimensions {width, height, aspectRatio}}}
}`

const commonFields = `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  "slug": slug.current,
  publishedAt,
  recommendationStatus
`

const richTextProjection = `[] {
  ...,
  _type == "imageWithAlt" => {
    _key,
    _type,
    alt,
    caption,
    credit,
    display,
    "crop": image.crop,
    "hotspot": image.hotspot,
    "asset": image.asset->{_id, url, metadata {dimensions {width, height, aspectRatio}}}
  }
}`

const reviewFields = `
  ${commonFields},
  orderRank,
  grade,
  isCrowned,
  heroImage ${imageProjection},
  notes ${richTextProjection}
`

const projections: Record<CollectionName, string> = {
  coffee: `{
    ${commonFields},
    orderRank,
    grade,
    isCrowned,
    roaster,
    origin,
    boughtFrom,
    purchaseUrl,
    purchasedAt,
    price,
    bagSize,
    roastDate,
    heroImage ${imageProjection},
      tastingNotes,
    notes ${richTextProjection},
    brewRecipes[] {
      _key,
      method,
      methodOther,
      label,
      grinder,
      doseGrams,
      waterGrams,
      yieldGrams,
      waterTemperatureC,
      brewTimeSeconds,
      ratio,
      steps,
      notes
    }
  }`,
  wings: `{
    ${reviewFields},
    venue,
    location,
    visitedAt,
    order,
    price
  }`,
  'na-beers': `{
    ${reviewFields},
    brewery,
    style,
    abvPercent,
    abvNote,
    package,
    packageFormat,
    boughtFrom,
    purchasedAt,
    price
  }`,
  reubens: `{
    ${reviewFields},
    restaurant,
    location,
    visitedAt,
    price,
    orderDetails
  }`,
  syrup: `{
    ${reviewFields},
    producer,
    mapleGrade,
    origin,
    boughtFrom,
    volumeLiters,
    price
  }`,
  blog: `{
    ${commonFields},
    excerpt,
    coverImage ${imageProjection},
    body ${richTextProjection},
    tags,
    seo
  }`,
}

const sanityTypes: Record<CollectionName, string> = {
  coffee: 'coffee',
  wings: 'wingReview',
  'na-beers': 'naBeer',
  reubens: 'reubenReview',
  syrup: 'syrupReview',
  blog: 'post',
}

/**
 * A ranked collection is ordered by the rank the Studio's orderable list
 * writes, so the site renders best to worst; the blog stays newest first.
 * "recommended" sorts after "notRecommended" alphabetically, so the status key
 * runs descending to put the ranking first, and only recommendations carry a
 * rank - the date key orders the rest by the same date their cards print,
 * which is the visit for a place and the publish date for everything else.
 */
export function collectionQuery(collection: CollectionName) {
  const order = isRankedCollection(collection)
    ? 'coalesce(recommendationStatus, "recommended") desc, orderRank asc, coalesce(visitedAt, publishedAt, _createdAt) desc'
    : 'coalesce(publishedAt, _createdAt) desc'

  return `*[_type == $type && defined(slug.current)] | order(${order}) ${projections[collection]}`
}

export function documentQuery(collection: CollectionName) {
  return `*[_type == $type && slug.current == $slug][0] ${projections[collection]}`
}

export async function fetchCollection(collection: 'coffee'): Promise<Coffee[]>
export async function fetchCollection(
  collection: 'wings',
): Promise<WingReview[]>
export async function fetchCollection(collection: 'na-beers'): Promise<NaBeer[]>
export async function fetchCollection(
  collection: 'reubens',
): Promise<ReubenReview[]>
export async function fetchCollection(
  collection: 'syrup',
): Promise<SyrupReview[]>
export async function fetchCollection(collection: 'blog'): Promise<Post[]>
export async function fetchCollection(collection: CollectionName) {
  const documents = usesFixtureContent()
    ? getFixtureCollection(collection)
    : await getPublishedSanityClient().fetch(collectionQuery(collection), {
        type: sanityTypes[collection],
      })

  return assertValidCollection(collection, documents)
}

export async function fetchDocument(
  collection: CollectionName,
  slug: string,
): Promise<ContentDocument | undefined> {
  const document = usesFixtureContent()
    ? getFixtureDocument(collection, slug)
    : await getPublishedSanityClient().fetch(documentQuery(collection), {
        type: sanityTypes[collection],
        slug,
      })

  return assertValidDocument(collection, document)
}
