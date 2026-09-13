export const collectionNames = [
  'coffee',
  'wings',
  'na-beers',
  'reubens',
  'blog',
] as const

export type CollectionName = (typeof collectionNames)[number]

/**
 * The collections the site publishes as a ranking, best first. The blog is
 * the only one that reads chronologically, because a post is not better or
 * worse than the post before it.
 */
export const rankedCollections = [
  'coffee',
  'wings',
  'na-beers',
  'reubens',
] as const satisfies readonly CollectionName[]

export type RankedCollection = (typeof rankedCollections)[number]

export function isRankedCollection(
  collection: CollectionName,
): collection is RankedCollection {
  return (rankedCollections as readonly CollectionName[]).includes(collection)
}

export type SanityImage = {
  alt: string
  caption?: string
  credit?: string
  asset?: {
    _id?: string
    _ref?: string
    url?: string
    metadata?: {
      dimensions?: {
        width: number
        height: number
        aspectRatio?: number
      }
    }
  }
  crop?: { top: number; bottom: number; left: number; right: number }
  hotspot?: { x: number; y: number; height: number; width: number }
  display?: ImageDisplay
}

export type ImageDisplay = 'inline' | 'wide' | 'full'

export type Money = {
  amountCents: number
  currency: string
}

export type Rating = number

export type PortableTextBlock = {
  _key: string
  _type: 'block'
  children: Array<{
    _key: string
    _type: 'span'
    marks?: string[]
    text: string
  }>
  markDefs?: Array<{
    _key: string
    _type: string
    href?: string
  }>
  listItem?: 'bullet' | 'number'
  style?: string
}

export type PortableTextImage = SanityImage & {
  _key: string
  _type: 'imageWithAlt'
}

export type CalloutBlock = {
  _key: string
  _type: 'callout'
  tone: 'note' | 'warning' | 'quote'
  content: PortableTextBlock[]
}

export type CodeBlock = {
  _key: string
  _type: 'codeBlock'
  language: string
  filename?: string
  code: string
}

export type DividerBlock = {
  _key: string
  _type: 'divider'
  variant: 'line' | 'asterisks'
}

export type PortableTextContent = Array<PortableTextBlock | PortableTextImage>

export type PostBodyContent = Array<
  | PortableTextBlock
  | PortableTextImage
  | CalloutBlock
  | CodeBlock
  | DividerBlock
>

export type BrewRecipe = {
  _key: string
  method: string
  methodOther?: string
  label?: string
  grinder: {
    name: string
    system: 'manual-number-rotations' | 'niche-setting' | 'other'
    model?: string
    number?: number
    rotations?: number
    setting?: number
  }
  doseGrams?: number
  waterGrams?: number
  yieldGrams?: number
  waterTemperatureC?: number
  brewTimeSeconds?: number
  ratio?: string
  steps?: string[]
  notes?: string
}

/**
 * The place a document holds in its collection's ranking. The Studio's
 * orderable list writes it as a LexoRank string, so inserting between two
 * entries never renumbers the rest; the site sorts on it ascending and the
 * position that falls out is the rank it prints.
 */
type RankedDocument = {
  orderRank: string
}

type BaseDocument = {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  title: string
  slug: string
  publishedAt?: string
}

export type Coffee = BaseDocument &
  RankedDocument & {
    _type: 'coffee'
    roaster?: string
    origin?: string
    boughtFrom: string
    purchaseUrl?: string
    purchasedAt?: string
    price?: Money
    bagSize: { amount: number; unit: 'g' | 'oz' }
    roastDate?: string
    rating?: Rating
    heroImage?: SanityImage
    tastingNotes?: string[]
    notes?: PortableTextContent
    brewRecipes: BrewRecipe[]
  }

export type WingReview = BaseDocument &
  RankedDocument & {
    _type: 'wingReview'
    venue: string
    location?: { city?: string; address?: string; url?: string }
    visitedAt: string
    order: {
      styleOrFlavor: string
      heat?: string
      pieceCount?: number
      sides?: string[]
    }
    price?: Money
    rating?: Rating
    notes: PortableTextContent
    heroImage?: SanityImage
  }

export type NaBeer = BaseDocument &
  RankedDocument & {
    _type: 'naBeer'
    brewery: string
    style?: string
    abvPercent?: number
    abvNote?: string
    package?: { amount: number; unit: 'ml' | 'fl-oz' | 'count' }
    packageFormat?: string
    boughtFrom?: string
    purchasedAt?: string
    price?: Money
    rating?: Rating
    notes?: PortableTextContent
    heroImage?: SanityImage
  }

export type ReubenReview = BaseDocument &
  RankedDocument & {
    _type: 'reubenReview'
    restaurant: string
    location?: { city?: string; address?: string; url?: string }
    visitedAt: string
    price?: Money
    orderDetails?: {
      meat?: string
      bread?: string
      cheese?: string
      sauerkraut?: string
      dressing?: string
      portion?: string
      other?: Array<{ label: string; value: string }>
    }
    rating?: Rating
    notes?: PortableTextContent
    heroImage?: SanityImage
  }

export type Post = BaseDocument & {
  _type: 'post'
  excerpt: string
  coverImage?: SanityImage
  body: PostBodyContent
  tags?: string[]
  seo?: { title?: string; description?: string }
}

export type ContentDocument = Coffee | WingReview | NaBeer | ReubenReview | Post
