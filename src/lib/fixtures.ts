import type {
  Coffee,
  ContentDocument,
  HomeContent,
  NaBeer,
  Post,
  ReubenReview,
  WingReview,
} from './content-types'

const fixtureImage = (id: string, alt: string) => ({
  alt,
  asset: {
    _id: id,
    url: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=82`,
    metadata: { dimensions: { width: 1200, height: 900, aspectRatio: 1.333 } },
  },
})

const paragraph = (text: string) => [
  {
    _key: 'paragraph',
    _type: 'block' as const,
    children: [{ _key: 'span', _type: 'span' as const, text }],
    style: 'normal',
  },
]

export const fixtureCoffee: Coffee[] = [
  {
    _id: 'coffee-perky',
    _type: 'coffee',
    _createdAt: '2025-01-10T12:00:00.000Z',
    _updatedAt: '2025-01-10T12:00:00.000Z',
    title: 'Colombia Perky',
    slug: 'colombia-perky',
    publishedAt: '2025-01-10T12:00:00.000Z',
    roaster: 'Avo Coffee Roasters',
    origin: 'Colombia',
    boughtFrom: 'Avo Coffee Roasters',
    purchaseUrl: 'https://avocoffeeroasters.example.com',
    price: { amountCents: 1543, currency: 'USD' },
    bagSize: { amount: 250, unit: 'g' },
    heroImage: fixtureImage(
      'photo-1495474472287-4d71bcdd2085',
      'A cup of dark coffee beside a coffee brewer',
    ),
    tastingNotes: ['Caramel', 'Citrus', 'Balanced'],
    notes: paragraph('A reliable coffee with a sweet, rounded cup.'),
    brewRecipes: [
      {
        _key: 'moka',
        method: 'Moka Pot',
        label: 'Morning moka pot',
        grinder: {
          name: 'Manual grinder',
          system: 'manual-number-rotations',
          number: 4,
          rotations: 1,
        },
        doseGrams: 18,
        waterGrams: 250,
        ratio: '1:14',
        steps: ['Fill the base with hot water', 'Add grounds, tamp lightly'],
      },
      {
        _key: 'filter',
        method: 'Filter',
        grinder: {
          name: 'Manual grinder',
          system: 'manual-number-rotations',
          number: 2,
          rotations: 1,
        },
      },
    ],
  },
]

export const fixtureWings: WingReview[] = [
  {
    _id: 'wings-neighborhood-buffalo',
    _type: 'wingReview',
    _createdAt: '2025-02-12T12:00:00.000Z',
    _updatedAt: '2025-02-12T12:00:00.000Z',
    title: 'Neighborhood Buffalo Wings',
    slug: 'neighborhood-buffalo-wings',
    publishedAt: '2025-02-12T12:00:00.000Z',
    venue: 'Neighborhood Tavern',
    location: { city: 'Columbus' },
    visitedAt: '2025-02-11',
    order: { styleOrFlavor: 'Buffalo', heat: 'Medium', pieceCount: 10 },
    rating: 4.25,
    heroImage: fixtureImage(
      'photo-1527477396000-e27163b481c2',
      'A plate of sauced chicken wings',
    ),
    notes: paragraph(
      'Crisp skin, a bright vinegar tang, and just enough heat.',
    ),
  },
]

export const fixtureNaBeers: NaBeer[] = [
  {
    _id: 'na-bright-lager',
    _type: 'naBeer',
    _createdAt: '2025-03-02T12:00:00.000Z',
    _updatedAt: '2025-03-02T12:00:00.000Z',
    title: 'Bright Lager',
    slug: 'bright-lager',
    publishedAt: '2025-03-02T12:00:00.000Z',
    brewery: 'Good Times Brewing',
    style: 'Lager',
    abvPercent: 0.5,
    package: { amount: 355, unit: 'ml' },
    packageFormat: 'Can',
    rating: 4,
    heroImage: fixtureImage(
      'photo-1510812431401-41d2bd2722f3',
      'A chilled golden beer in a glass',
    ),
    notes: paragraph('Clean, bready, and easy to reach for at dinner.'),
  },
]

export const fixtureReubens: ReubenReview[] = [
  {
    _id: 'reuben-rye-house',
    _type: 'reubenReview',
    _createdAt: '2025-03-14T12:00:00.000Z',
    _updatedAt: '2025-03-14T12:00:00.000Z',
    title: 'The Rye House Reuben',
    slug: 'the-rye-house-reuben',
    publishedAt: '2025-03-14T12:00:00.000Z',
    restaurant: 'The Rye House',
    location: { city: 'Columbus' },
    visitedAt: '2025-03-13',
    rating: 4.5,
    heroImage: fixtureImage(
      'photo-1550507992-eb63ffee0847',
      'A grilled sandwich cut in half on a plate',
    ),
    orderDetails: {
      meat: 'Corned beef',
      bread: 'Marbled rye',
      cheese: 'Swiss',
      sauerkraut: 'House-made',
      dressing: 'Thousand island',
    },
    notes: paragraph('A tall, balanced sandwich with a proper griddled crust.'),
  },
]

export const fixturePosts: Post[] = [
  {
    _id: 'post-small-rituals',
    _type: 'post',
    _createdAt: '2025-03-21T12:00:00.000Z',
    _updatedAt: '2025-03-22T12:00:00.000Z',
    title: 'Small rituals, better cups',
    slug: 'small-rituals-better-cups',
    publishedAt: '2025-03-21T12:00:00.000Z',
    excerpt:
      'A few repeatable choices that make weekday coffee feel considered.',
    coverImage: fixtureImage(
      'photo-1442512595331-e89e73853f31',
      'Coffee being poured from a ceramic dripper',
    ),
    body: [
      {
        _key: 'paragraph',
        _type: 'block' as const,
        children: [
          { _key: 'span-0', _type: 'span' as const, text: 'The best ' },
          {
            _key: 'span-1',
            _type: 'span' as const,
            marks: ['morning-ritual-link'],
            text: 'morning ritual',
          },
          {
            _key: 'span-2',
            _type: 'span' as const,
            text: ' is one that makes room for paying attention.',
          },
        ],
        markDefs: [
          {
            _key: 'morning-ritual-link',
            _type: 'link',
            href: 'https://example.com/morning-rituals',
          },
        ],
        style: 'normal',
      },
    ],
    tags: ['Coffee', 'Rituals'],
  },
  {
    _id: 'post-a-table-for-two',
    _type: 'post',
    _createdAt: '2025-03-12T12:00:00.000Z',
    _updatedAt: '2025-03-12T12:00:00.000Z',
    title: 'A table for two',
    slug: 'a-table-for-two',
    publishedAt: '2025-03-12T12:00:00.000Z',
    excerpt: 'Notes from a lunch that was better than the sum of its parts.',
    body: [
      {
        _key: 'heading',
        _type: 'block' as const,
        children: [
          {
            _key: 'heading-span',
            _type: 'span' as const,
            text: 'The setting',
          },
        ],
        style: 'h2',
      },
      {
        _key: 'paragraph',
        _type: 'block' as const,
        children: [
          {
            _key: 'span',
            _type: 'span' as const,
            text: 'The lunch was simple, slow, and worth remembering.',
          },
        ],
        style: 'normal',
      },
      {
        _key: 'quote',
        _type: 'block' as const,
        children: [
          {
            _key: 'quote-span',
            _type: 'span' as const,
            text: 'Good food does not need to be complicated.',
          },
        ],
        style: 'blockquote',
      },
      {
        _key: 'list-item-1',
        _type: 'block' as const,
        children: [
          {
            _key: 'list-span-1',
            _type: 'span' as const,
            text: 'Order the rye',
          },
        ],
        listItem: 'bullet',
        style: 'normal',
      },
      {
        _key: 'list-item-2',
        _type: 'block' as const,
        children: [
          {
            _key: 'list-span-2',
            _type: 'span' as const,
            text: 'Ask for the sauce on the side',
          },
        ],
        listItem: 'bullet',
        style: 'normal',
      },
      {
        _key: 'number-item-1',
        _type: 'block' as const,
        children: [
          {
            _key: 'number-span-1',
            _type: 'span' as const,
            text: 'Arrive hungry',
          },
        ],
        listItem: 'number',
        style: 'normal',
      },
      {
        _key: 'number-item-2',
        _type: 'block' as const,
        children: [
          {
            _key: 'number-span-2',
            _type: 'span' as const,
            text: 'Leave satisfied',
          },
        ],
        listItem: 'number',
        style: 'normal',
      },
      {
        _key: 'code-paragraph',
        _type: 'block' as const,
        children: [
          { _key: 'code-span-0', _type: 'span' as const, text: 'Table for ' },
          {
            _key: 'code-span-1',
            _type: 'span' as const,
            marks: ['code'],
            text: 'two',
          },
        ],
        style: 'normal',
      },
    ],
    tags: ['Food'],
  },
]

const collections = {
  coffee: fixtureCoffee,
  wings: fixtureWings,
  'na-beers': fixtureNaBeers,
  reubens: fixtureReubens,
  blog: fixturePosts,
} as const

export function getFixtureCollection<T extends keyof typeof collections>(
  name: T,
) {
  return collections[name]
}

export function getFixtureDocument(
  collection: keyof typeof collections,
  slug: string,
): ContentDocument | undefined {
  return collections[collection].find((document) => document.slug === slug)
}

export function getFixtureHomeContent(): HomeContent {
  return {
    coffee: fixtureCoffee.slice(0, 1),
    wings: fixtureWings.slice(0, 1),
    naBeers: fixtureNaBeers.slice(0, 1),
    reubens: fixtureReubens.slice(0, 1),
    posts: fixturePosts.slice(0, 3),
  }
}
