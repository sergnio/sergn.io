import type {
  Coffee,
  CollectionName,
  ContentDocument,
  NaBeer,
  Post,
  ReubenReview,
  WingReview,
} from '../content-types'
import { assertValidCollection, assertValidDocument } from '../content-contract'
import { getFixtureCollection, getFixtureDocument } from '../fixtures'
import { getPublishedSanityClient, usesFixtureContent } from './client'

const imageProjection = `{
  alt,
  caption,
  credit,
  crop,
  hotspot,
  asset->{_id, url, metadata {dimensions {width, height, aspectRatio}}}
}`

const commonFields = `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  "slug": slug.current,
  publishedAt
`

const richTextProjection = `[] {
  ...,
  _type == "imageWithAlt" => {
    _key,
    _type,
    alt,
    caption,
    credit,
    "crop": image.crop,
    "hotspot": image.hotspot,
    "asset": image.asset->{_id, url, metadata {dimensions {width, height, aspectRatio}}}
  }
}`

const reviewFields = `
  ${commonFields},
  rating,
  heroImage ${imageProjection},
  gallery[] ${imageProjection},
  notes ${richTextProjection}
`

const projections: Record<CollectionName, string> = {
  coffee: `{
    ${commonFields},
    roaster,
    origin,
    boughtFrom,
    purchaseUrl,
    purchasedAt,
    price,
    bagSize,
    roastDate,
    heroImage ${imageProjection},
    gallery[] ${imageProjection},
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
  blog: 'post',
}

export function collectionQuery(collection: CollectionName) {
  return `*[_type == $type && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc) ${projections[collection]}`
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
