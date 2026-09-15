import type {
  Coffee,
  ContentDocument,
  NaBeer,
  Post,
  ReubenReview,
  SyrupReview,
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

/**
 * Ranked collections are stored in rank order, best first, exactly as the
 * Studio's orderable list hands them over. The ranks are spaced so a fixture
 * can be slotted between two others without renumbering the rest, which is
 * the same property LexoRank gives the real dataset.
 */
export const fixtureCoffee: Coffee[] = [
  {
    _id: 'coffee-perky',
    _type: 'coffee',
    _createdAt: '2025-01-10T12:00:00.000Z',
    _updatedAt: '2025-01-10T12:00:00.000Z',
    title: 'Colombia Perky',
    slug: 'colombia-perky',
    publishedAt: '2025-01-10T12:00:00.000Z',
    orderRank: '0|100000:',
    roaster: 'Avo Coffee Roasters',
    origin: 'Colombia',
    boughtFrom: 'Avo Coffee Roasters',
    purchaseUrl: 'https://avocoffeeroasters.example.com',
    price: { amountCents: 1543, currency: 'USD' },
    bagSize: { amount: 250, unit: 'g' },
    rating: 4.75,
    heroImage: {
      ...fixtureImage(
        'photo-1495474472287-4d71bcdd2085',
        'A cup of dark coffee beside a coffee brewer',
      ),
      caption: 'Brewed fresh at the counter.',
    },
    purchasedAt: '2025-01-08',
    roastDate: '2025-01-05',
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
  {
    _id: 'coffee-sumatra',
    _type: 'coffee',
    _createdAt: '2025-01-24T12:00:00.000Z',
    _updatedAt: '2025-01-24T12:00:00.000Z',
    title: 'Sumatra Long Night',
    slug: 'sumatra-long-night',
    publishedAt: '2025-01-24T12:00:00.000Z',
    orderRank: '0|200000:',
    roaster: 'Ninth Street Roasting',
    origin: 'Indonesia',
    boughtFrom: 'Ninth Street Roasting',
    bagSize: { amount: 340, unit: 'g' },
    rating: 4,
    heroImage: fixtureImage(
      'photo-1442512595331-e89e73853f31',
      'Coffee poured slowly through a ceramic dripper',
    ),
    tastingNotes: ['Cedar', 'Cocoa'],
    notes: paragraph('Heavy bodied and low acid, best after dinner.'),
    brewRecipes: [
      {
        _key: 'press',
        method: 'French Press',
        grinder: {
          name: 'Manual grinder',
          system: 'manual-number-rotations',
          number: 8,
          rotations: 2,
        },
        doseGrams: 30,
        waterGrams: 450,
        brewTimeSeconds: 240,
      },
    ],
  },
  {
    _id: 'coffee-ethiopia',
    _type: 'coffee',
    _createdAt: '2025-02-02T12:00:00.000Z',
    _updatedAt: '2025-02-02T12:00:00.000Z',
    title: 'Ethiopia Direct Trade',
    slug: 'ethiopia-direct-trade',
    publishedAt: '2025-02-02T12:00:00.000Z',
    orderRank: '0|300000:',
    origin: 'Ethiopia',
    boughtFrom: 'Farmer direct import',
    bagSize: { amount: 340, unit: 'g' },
    notes: paragraph('A bright, unnamed-roaster bag picked up on a trip.'),
    brewRecipes: [
      {
        _key: 'pourover',
        method: 'Pour Over',
        grinder: {
          name: 'Manual grinder',
          system: 'manual-number-rotations',
          number: 6,
          rotations: 1,
        },
      },
    ],
  },
  {
    _id: 'coffee-grocery-blend',
    recommendationStatus: 'notRecommended',
    _type: 'coffee',
    _createdAt: '2025-02-18T12:00:00.000Z',
    _updatedAt: '2025-02-18T12:00:00.000Z',
    title: 'Grocery Store House Blend',
    slug: 'grocery-store-house-blend',
    publishedAt: '2025-02-18T12:00:00.000Z',
    roaster: 'Store Brand',
    boughtFrom: 'The supermarket down the street',
    bagSize: { amount: 12, unit: 'oz' },
    rating: 1.75,
    price: { amountCents: 699, currency: 'USD' },
    notes: paragraph('Flat and papery, but it was there at 6am.'),
    brewRecipes: [
      {
        _key: 'drip',
        method: 'Filter',
        grinder: {
          name: 'Pre-ground',
          system: 'other',
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
    orderRank: '0|100000:',
    venue: 'Neighborhood Tavern',
    location: {
      city: 'Columbus',
      address: '18 Tavern Row',
      url: 'https://neighborhood-tavern.example.com',
    },
    visitedAt: '2025-02-11',
    order: {
      styleOrFlavor: 'Buffalo',
      heat: 'Medium',
      pieceCount: 10,
      sides: ['Celery', 'Blue cheese'],
    },
    price: { amountCents: 1650, currency: 'USD' },
    rating: 4.25,
    heroImage: fixtureImage(
      'photo-1527477396000-e27163b481c2',
      'A plate of sauced chicken wings',
    ),
    notes: paragraph(
      'Crisp skin, a bright vinegar tang, and just enough heat.',
    ),
  },
  {
    _id: 'wings-smokehouse-dry-rub',
    _type: 'wingReview',
    _createdAt: '2025-02-20T12:00:00.000Z',
    _updatedAt: '2025-02-20T12:00:00.000Z',
    title: 'Smokehouse Dry Rub Wings',
    slug: 'smokehouse-dry-rub-wings',
    publishedAt: '2025-02-20T12:00:00.000Z',
    orderRank: '0|200000:',
    venue: 'Eastside Smokehouse',
    location: { city: 'Columbus' },
    visitedAt: '2025-02-19',
    order: { styleOrFlavor: 'Dry rub', heat: 'Mild', pieceCount: 8 },
    price: { amountCents: 1400, currency: 'USD' },
    rating: 4,
    heroImage: fixtureImage(
      'photo-1527477396000-e27163b481c2',
      'Smoked chicken wings dusted with a dark spice rub',
    ),
    notes: paragraph('Deep smoke, dry and craggy, no sauce needed.'),
  },
  {
    _id: 'wings-corner-bar-honey-hot',
    _type: 'wingReview',
    _createdAt: '2025-03-04T12:00:00.000Z',
    _updatedAt: '2025-03-04T12:00:00.000Z',
    title: 'Corner Bar Honey Hot',
    slug: 'corner-bar-honey-hot',
    publishedAt: '2025-03-04T12:00:00.000Z',
    orderRank: '0|300000:',
    venue: 'The Corner Bar',
    visitedAt: '2025-03-03',
    order: { styleOrFlavor: 'Honey hot', heat: 'Hot', pieceCount: 12 },
    rating: 3.5,
    notes: paragraph('Sweet up front, genuinely hot on the finish.'),
  },
  {
    _id: 'wings-arena-concession',
    _type: 'wingReview',
    _createdAt: '2025-03-18T12:00:00.000Z',
    _updatedAt: '2025-03-18T12:00:00.000Z',
    title: 'Arena Concession Wings',
    slug: 'arena-concession-wings',
    publishedAt: '2025-03-18T12:00:00.000Z',
    orderRank: '0|400000:',
    venue: 'Downtown Arena',
    visitedAt: '2025-03-17',
    order: { styleOrFlavor: 'Buffalo', pieceCount: 6 },
    price: { amountCents: 1899, currency: 'USD' },
    rating: 2.25,
    notes: paragraph('Warm, soft, and priced like they were not.'),
  },
  {
    _id: 'wings-gas-station',
    recommendationStatus: 'notRecommended',
    _type: 'wingReview',
    _createdAt: '2025-04-02T12:00:00.000Z',
    _updatedAt: '2025-04-02T12:00:00.000Z',
    title: 'Gas Station Case Wings',
    slug: 'gas-station-case-wings',
    publishedAt: '2025-04-02T12:00:00.000Z',
    venue: 'Highway 33 Fuel Stop',
    visitedAt: '2025-04-01',
    order: { styleOrFlavor: 'Whatever was left', pieceCount: 4 },
    rating: 1,
    notes: paragraph('A decision, not a meal. Reported here for completeness.'),
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
    orderRank: '0|100000:',
    brewery: 'Good Times Brewing',
    style: 'Lager',
    abvPercent: 0.5,
    package: { amount: 355, unit: 'ml' },
    packageFormat: 'Can',
    boughtFrom: 'Corner Bottle Shop',
    purchasedAt: '2025-03-01',
    price: { amountCents: 399, currency: 'USD' },
    rating: 4,
    heroImage: fixtureImage(
      'photo-1510812431401-41d2bd2722f3',
      'A chilled golden beer in a glass',
    ),
    notes: paragraph('Clean, bready, and easy to reach for at dinner.'),
  },
  {
    _id: 'na-hazy-zero',
    _type: 'naBeer',
    _createdAt: '2025-03-09T12:00:00.000Z',
    _updatedAt: '2025-03-09T12:00:00.000Z',
    title: 'Hazy Zero IPA',
    slug: 'hazy-zero-ipa',
    publishedAt: '2025-03-09T12:00:00.000Z',
    orderRank: '0|200000:',
    brewery: 'North Line Brewing',
    style: 'IPA',
    abvPercent: 0.4,
    package: { amount: 12, unit: 'fl-oz' },
    packageFormat: 'Can',
    rating: 3.75,
    heroImage: fixtureImage(
      'photo-1510812431401-41d2bd2722f3',
      'A cloudy pale beer in a stemmed glass',
    ),
    notes: paragraph('Real hop aroma, a little thin through the middle.'),
  },
  {
    _id: 'na-dark-roast-stout',
    _type: 'naBeer',
    _createdAt: '2025-03-23T12:00:00.000Z',
    _updatedAt: '2025-03-23T12:00:00.000Z',
    title: 'Dark Roast Stout',
    slug: 'dark-roast-stout',
    publishedAt: '2025-03-23T12:00:00.000Z',
    orderRank: '0|300000:',
    brewery: 'Kettle & Coal',
    style: 'Stout',
    abvPercent: 0.5,
    rating: 3,
    notes: paragraph('Coffee and cocoa, but it drinks watery when it warms.'),
  },
  {
    _id: 'na-flat-tonic-brew',
    recommendationStatus: 'notRecommended',
    _type: 'naBeer',
    _createdAt: '2025-04-06T12:00:00.000Z',
    _updatedAt: '2025-04-06T12:00:00.000Z',
    title: 'Flat Tonic Brew',
    slug: 'flat-tonic-brew',
    publishedAt: '2025-04-06T12:00:00.000Z',
    brewery: 'Value Cellar',
    style: 'Pale ale',
    abvNote: 'Alcohol free',
    rating: 1.5,
    notes: paragraph('Sweet, still, and closer to malt soda than to beer.'),
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
    orderRank: '0|100000:',
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
      portion: 'Half is plenty',
      other: [{ label: 'Pickle', value: 'House dill spear' }],
    },
    price: { amountCents: 1875, currency: 'USD' },
    notes: paragraph('A tall, balanced sandwich with a proper griddled crust.'),
  },
  {
    _id: 'reuben-deli-counter',
    _type: 'reubenReview',
    _createdAt: '2025-03-28T12:00:00.000Z',
    _updatedAt: '2025-03-28T12:00:00.000Z',
    title: 'Deli Counter Reuben',
    slug: 'deli-counter-reuben',
    publishedAt: '2025-03-28T12:00:00.000Z',
    orderRank: '0|200000:',
    restaurant: 'Fifth Street Deli',
    location: { city: 'Columbus' },
    visitedAt: '2025-03-27',
    rating: 4,
    heroImage: fixtureImage(
      'photo-1414235077428-338989a2e8c0',
      'A rye sandwich stacked high on a paper wrapper',
    ),
    orderDetails: {
      meat: 'Pastrami',
      bread: 'Light rye',
      cheese: 'Swiss',
      dressing: 'Russian',
    },
    price: { amountCents: 1650, currency: 'USD' },
    notes: paragraph('Generous meat, bread that gave up halfway through.'),
  },
  {
    _id: 'reuben-diner-classic',
    _type: 'reubenReview',
    _createdAt: '2025-04-11T12:00:00.000Z',
    _updatedAt: '2025-04-11T12:00:00.000Z',
    title: 'Diner Classic Reuben',
    slug: 'diner-classic-reuben',
    publishedAt: '2025-04-11T12:00:00.000Z',
    orderRank: '0|300000:',
    restaurant: 'Route 3 Diner',
    visitedAt: '2025-04-10',
    rating: 3.25,
    orderDetails: { meat: 'Corned beef', bread: 'Marbled rye' },
    notes: paragraph('Exactly what the menu promised and nothing more.'),
  },
  {
    _id: 'reuben-pub-grill',
    recommendationStatus: 'notRecommended',
    _type: 'reubenReview',
    _createdAt: '2025-04-25T12:00:00.000Z',
    _updatedAt: '2025-04-25T12:00:00.000Z',
    title: 'Pub Grill Reuben',
    slug: 'pub-grill-reuben',
    publishedAt: '2025-04-25T12:00:00.000Z',
    restaurant: 'The Landing Pub',
    visitedAt: '2025-04-24',
    rating: 2.5,
    orderDetails: { meat: 'Corned beef', sauerkraut: 'From a jar' },
    price: { amountCents: 1550, currency: 'USD' },
    notes: paragraph('Under-drained kraut turned the bottom slice to paste.'),
  },
]

export const fixtureSyrups: SyrupReview[] = [
  {
    _id: 'syrup-sweet-ontario',
    _type: 'syrupReview',
    orderRank: '0|100000:',
    _createdAt: '2024-09-20T12:00:00.000Z',
    _updatedAt: '2024-09-25T12:00:00.000Z',
    title: 'Sweet Ontario',
    slug: 'sweet-ontario',
    publishedAt: '2024-09-20T12:00:00.000Z',
    producer: 'Mountain Maple Products',
    grade: 'Amber, Rich Taste',
    origin: 'St. Joseph Island, Ontario',
    boughtFrom: 'Canada',
    volumeLiters: 0.5,
    price: { amountCents: 799, currency: 'USD' },
    rating: 5,
    heroImage: fixtureImage(
      'photo-1589985270826-4b7bb135bc9d',
      'A jug of amber maple syrup on a wooden table',
    ),
    notes: paragraph(
      "I didn't know the incredible wonders of pure maple syrup before trying this. It has the perfect maple syrup flavor without the disgusting taste of sweeteners. It's maple syrup in its purest form.",
    ),
  },
  {
    _id: 'syrup-skluzaceks',
    _type: 'syrupReview',
    orderRank: '0|200000:',
    _createdAt: '2024-09-22T12:00:00.000Z',
    _updatedAt: '2024-09-25T12:00:00.000Z',
    title: 'Skluzaceks',
    slug: 'skluzaceks',
    publishedAt: '2024-09-22T12:00:00.000Z',
    producer: 'Skluzacek Family, LLC',
    origin: 'New Prague, Minnesota',
    boughtFrom: '320th Street, New Prague',
    price: { amountCents: 799, currency: 'USD' },
    rating: 4.55,
    heroImage: fixtureImage(
      'photo-1600271886742-f049cd451bba',
      'A glass bottle of dark maple syrup from a local farm',
    ),
    notes: paragraph(
      "A bit darker, a bit sweet, like the Hidden Springs. It's a local farm so this has bonus points, but still is lacking the pure maple syrup taste of Sweet Ontario.",
    ),
  },
  {
    _id: 'syrup-hidden-springs',
    _type: 'syrupReview',
    orderRank: '0|300000:',
    _createdAt: '2024-09-21T12:00:00.000Z',
    _updatedAt: '2024-09-25T12:00:00.000Z',
    title: 'Hidden Springs',
    slug: 'hidden-springs',
    publishedAt: '2024-09-21T12:00:00.000Z',
    producer: 'Hidden Springs Maple',
    grade: 'Amber, Rich Taste',
    origin: 'Putney, Vermont',
    boughtFrom: 'Amazon',
    volumeLiters: 0.946,
    price: { amountCents: 799, currency: 'USD' },
    rating: 4,
    heroImage: fixtureImage(
      'photo-1518449007707-1c9b4f0c1c47',
      'A dark bottle of maple syrup beside a stack of pancakes',
    ),
    notes: paragraph(
      "A bit darker, and a bit too sweet. It's drastically sweet compared to Sweet Ontario, but decent maple syrup. Probably wouldn't recommend over other types.",
    ),
  },
  {
    _id: 'syrup-wild-country',
    _type: 'syrupReview',
    orderRank: '0|400000:',
    _createdAt: '2024-09-23T12:00:00.000Z',
    _updatedAt: '2024-09-25T12:00:00.000Z',
    title: 'Wild Country',
    slug: 'wild-country',
    publishedAt: '2024-09-23T12:00:00.000Z',
    producer: 'Wild Country Maple',
    origin: 'Lutsen, Minnesota',
    boughtFrom: '320th Street, New Prague',
    volumeLiters: 0.237,
    price: { amountCents: 799, currency: 'USD' },
    heroImage: fixtureImage(
      'photo-1608453162650-4a1c1f0f2b1e',
      'A small bottle of dark maple syrup',
    ),
    notes: paragraph(
      'Quite good! Bit darker too, and not super sweet. This is quality pure maple syrup.',
    ),
  },
  {
    _id: 'syrup-hamel',
    recommendationStatus: 'notRecommended',
    _type: 'syrupReview',
    _createdAt: '2024-09-24T12:00:00.000Z',
    _updatedAt: '2024-09-25T12:00:00.000Z',
    title: 'Hamel',
    slug: 'hamel',
    publishedAt: '2024-09-24T12:00:00.000Z',
    producer: 'Hamel',
    origin: 'Minnesota',
    boughtFrom: "Jake's house",
    volumeLiters: 0.237,
    heroImage: fixtureImage(
      'photo-1587049352846-4a222e784d38',
      'An unopened tin of maple syrup on a kitchen counter',
    ),
    notes: paragraph("Never tasted! I'm curious because Jake says it's good."),
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
      {
        _key: 'heading',
        _type: 'block' as const,
        children: [
          { _key: 'heading-span', _type: 'span' as const, text: 'The grind' },
        ],
        style: 'h2',
      },
      {
        _key: 'subheading',
        _type: 'block' as const,
        children: [
          {
            _key: 'subheading-span',
            _type: 'span' as const,
            text: 'Dial it in',
          },
        ],
        style: 'h3',
      },
      {
        _key: 'sub-subheading',
        _type: 'block' as const,
        children: [
          {
            _key: 'sub-subheading-span',
            _type: 'span' as const,
            text: 'Notes',
          },
        ],
        style: 'h4',
      },
      {
        _key: 'emphasis',
        _type: 'block' as const,
        children: [
          {
            _key: 'emphasis-span-0',
            _type: 'span' as const,
            text: 'Weigh it, ',
          },
          {
            _key: 'emphasis-span-1',
            _type: 'span' as const,
            marks: ['underline'],
            text: 'every time',
          },
          {
            _key: 'emphasis-span-2',
            _type: 'span' as const,
            marks: ['strike-through'],
            text: ' - eyeballing works',
          },
          { _key: 'emphasis-span-3', _type: 'span' as const, text: '.' },
        ],
        style: 'normal',
      },
      {
        ...fixtureImage(
          'photo-1442512595331-e89e73853f31',
          'A hand levelling coffee grounds in a dripper',
        ),
        _key: 'wide-image',
        _type: 'imageWithAlt' as const,
        caption: 'Level the bed before the first pour.',
        display: 'wide' as const,
      },
      {
        _key: 'callout',
        _type: 'callout' as const,
        tone: 'note' as const,
        content: [
          {
            _key: 'callout-paragraph',
            _type: 'block' as const,
            children: [
              {
                _key: 'callout-span',
                _type: 'span' as const,
                text: 'A cheap scale beats an expensive kettle.',
              },
            ],
            style: 'normal',
          },
        ],
      },
      {
        _key: 'code',
        _type: 'codeBlock' as const,
        language: 'text',
        filename: 'ratio.txt',
        code: '18g in\n300g out\n2:45 total',
      },
      {
        _key: 'divider',
        _type: 'divider' as const,
        variant: 'asterisks' as const,
      },
      {
        ...fixtureImage(
          'photo-1442512595331-e89e73853f31',
          'A finished cup of coffee on a wooden table',
        ),
        _key: 'full-image',
        _type: 'imageWithAlt' as const,
        caption: 'The payoff.',
        display: 'full' as const,
      },
    ],
    tags: ['coffee', 'recipes'],
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
          { _key: 'span', _type: 'span' as const, text: 'The lunch was ' },
          {
            _key: 'span-internal-link',
            _type: 'span' as const,
            marks: ['colombia-perky-link'],
            text: 'paired with a familiar coffee',
          },
          {
            _key: 'span-tail',
            _type: 'span' as const,
            text: ', simple, slow, and worth remembering.',
          },
        ],
        markDefs: [
          {
            _key: 'colombia-perky-link',
            _type: 'link',
            href: '/coffee/colombia-perky',
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
      {
        _key: 'inline-image',
        _type: 'imageWithAlt' as const,
        ...fixtureImage(
          'photo-1414235077428-338989a2e8c0',
          'A rye sandwich cut in half on a wooden board',
        ),
        caption: 'The rye, cut and ready.',
      },
    ],
    tags: ['food', 'reubens'],
  },
]

function byPublishedDesc<
  T extends { publishedAt?: string; _createdAt: string },
>(documents: T[]): T[] {
  return [...documents].sort(
    (a, b) =>
      new Date(b.publishedAt ?? b._createdAt).getTime() -
      new Date(a.publishedAt ?? a._createdAt).getTime(),
  )
}

/** Recommended entries stay ranked first; non-recommendations are newest first. */
function byRank<
  T extends {
    orderRank?: string
    recommendationStatus?: string
    publishedAt?: string
    _createdAt: string
  },
>(documents: T[]): T[] {
  return [...documents].sort((a, b) => {
    const aNotRecommended = a.recommendationStatus === 'notRecommended'
    const bNotRecommended = b.recommendationStatus === 'notRecommended'
    if (aNotRecommended !== bNotRecommended) return aNotRecommended ? 1 : -1
    if (!aNotRecommended)
      return (a.orderRank ?? '').localeCompare(b.orderRank ?? '')
    return (
      new Date(b.publishedAt ?? b._createdAt).getTime() -
      new Date(a.publishedAt ?? a._createdAt).getTime()
    )
  })
}

const collections = {
  coffee: byRank(fixtureCoffee),
  wings: byRank(fixtureWings),
  'na-beers': byRank(fixtureNaBeers),
  reubens: byRank(fixtureReubens),
  syrup: byRank(fixtureSyrups),
  blog: byPublishedDesc(fixturePosts),
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
