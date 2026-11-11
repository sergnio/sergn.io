/**
 * Moves every wing's venue onto a shared `location` document (#84).
 *
 *   npx sanity exec migrations/wing-locations.ts --with-user-token
 *   npx sanity exec migrations/wing-locations.ts --with-user-token -- --apply
 *   npx sanity exec migrations/wing-locations.ts --with-user-token -- --cleanup [--apply]
 *
 * It only prints the plan unless `--apply` is passed. The default phase links
 * each wing to a location and leaves `venue` and `visitCount` on the wing, so
 * the site still built from main keeps rendering. `--cleanup` removes them once
 * the site and Studio that read locations are live. Both phases are safe to
 * rerun: anything already done is skipped.
 */
import { getCliClient } from 'sanity/cli'

type OldWing = {
  _id: string
  _rev: string
  title?: string
  venue?: string
  visitCount?: number | null
  location?: {
    _ref?: string
    city?: string
    address?: string
    url?: string
  } | null
}

type Place = { city?: string; address?: string; url?: string }

/**
 * City and address are required of a location but were optional on a wing,
 * so most wings never recorded them. Fill each gap here, keyed by the wing's
 * venue exactly as it reads today, before running with `--apply`.
 */
const placeDetails: Record<string, Place> = {
  'NE Moose Bar & Grill': { city: 'Minneapolis', address: '356 Monroe St NE' },
  'Cedar Inn': { city: 'Minneapolis', address: '4155 Cedar Ave S' },
  'King of the Wing': { city: 'Champlin', address: '11469 Marketplace Dr N' },
  'The Nook': {
    city: 'St. Paul',
    address: '492 Hamline Ave S',
    url: 'https://crnook.com',
  },
  "Sportsmen's Restaurant & Taverna": {
    city: 'Hibbing',
    address: '509 E Howard St',
  },
  'Monte Carlo': { city: 'Minneapolis', address: '219 3rd Ave N' },
  Runyons: { city: 'Minneapolis', address: '107 N Washington Ave' },
  Hilltop: { city: 'Edina', address: '5101 Arcadia Ave' },
  "Steve O's": { city: 'Crystal', address: '4900 W Broadway Ave' },
  Wingstop: { city: 'Hopkins', address: '525 Blake Rd N, Suite 102' },
  'Northbound Brew Pub': { city: 'Minneapolis', address: '2716 E 38th St' },
}

const apply = process.argv.includes('--apply')
const cleanup = process.argv.includes('--cleanup')

const client = getCliClient({ apiVersion: '2025-05-01' }).withConfig({
  perspective: 'raw',
})

function slugify(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function present(value: string | undefined | null) {
  return value?.trim() ? value.trim() : undefined
}

async function link() {
  const wings = await client.fetch<OldWing[]>(
    '*[_type == "wingReview" && !(_id in path("versions.**"))] | order(_id) {_id, _rev, title, venue, visitCount, location}',
  )
  const existing = await client.fetch<Array<{ _id: string; slug?: string }>>(
    '*[_type == "location"]{_id, "slug": slug.current}',
  )
  const pending = wings.filter((wing) => !wing.location?._ref)
  const problems: string[] = []

  const groups = new Map<string, { name: string; wings: OldWing[] }>()
  for (const wing of pending) {
    const name = present(wing.venue)
    if (!name) {
      problems.push(`${wing._id} (${wing.title}) has no venue to name it by`)
      continue
    }
    const slug = slugify(name)
    const group = groups.get(slug) ?? { name, wings: [] }
    group.wings.push(wing)
    groups.set(slug, group)
  }

  const locations = [...groups].map(([slug, group]) => {
    const recorded = (field: keyof Place) =>
      group.wings.map((wing) => present(wing.location?.[field])).find(Boolean)
    const override = placeDetails[group.name] ?? {}
    const visitCounts = group.wings
      .map((wing) => wing.visitCount)
      .filter((count): count is number => typeof count === 'number')
    const place = {
      city: present(override.city) ?? recorded('city'),
      address: present(override.address) ?? recorded('address'),
      url: present(override.url) ?? recorded('url'),
    }

    for (const field of ['city', 'address'] as const) {
      if (!place[field]) {
        problems.push(
          `location "${group.name}" has no ${field} - add it to placeDetails`,
        )
      }
    }

    return {
      reused: existing.find((location) => location.slug === slug)?._id,
      document: {
        _id: `location-${slug}`,
        _type: 'location',
        name: group.name,
        slug: { _type: 'slug', current: slug },
        ...Object.fromEntries(
          Object.entries(place).filter(([, value]) => value),
        ),
        ...(visitCounts.length ? { visitCount: Math.max(...visitCounts) } : {}),
      },
      wings: group.wings,
    }
  })

  console.log(
    `${wings.length} wings, ${wings.length - pending.length} already linked, ${locations.length} locations to link.\n`,
  )

  const transaction = client.transaction()
  for (const { reused, document, wings: atLocation } of locations) {
    const id = reused ?? document._id
    console.log(
      reused
        ? `Reuse location ${id} for "${document.name}"`
        : `Create location ${JSON.stringify(document)}`,
    )
    if (!reused) transaction.createIfNotExists(document)

    for (const wing of atLocation) {
      console.log(`  link wing ${wing._id} (${wing.title}) -> ${id}`)
      transaction.patch(wing._id, (patch) =>
        patch
          .ifRevisionId(wing._rev)
          .set({ location: { _type: 'reference', _ref: id } }),
      )
    }
  }

  return { transaction, problems, changes: locations.length }
}

async function unsetWingVenue() {
  const wings = await client.fetch<OldWing[]>(
    '*[_type == "wingReview" && !(_id in path("versions.**"))] | order(_id) {_id, _rev, title, venue, visitCount, location}',
  )
  const problems = wings
    .filter((wing) => !wing.location?._ref)
    .map(
      (wing) => `${wing._id} (${wing.title}) is not linked to a location yet`,
    )
  const stale = wings.filter(
    (wing) =>
      wing.location?._ref &&
      (wing.venue !== undefined || wing.visitCount !== undefined),
  )

  console.log(`${stale.length} linked wings still carry venue or visitCount.\n`)

  const transaction = client.transaction()
  for (const wing of stale) {
    console.log(
      `Unset venue ${JSON.stringify(wing.venue)} and visitCount ${JSON.stringify(wing.visitCount)} on ${wing._id} (${wing.title})`,
    )
    transaction.patch(wing._id, (patch) =>
      patch.ifRevisionId(wing._rev).unset(['venue', 'visitCount']),
    )
  }

  return { transaction, problems, changes: stale.length }
}

const { transaction, problems, changes } = cleanup
  ? await unsetWingVenue()
  : await link()

if (problems.length) {
  console.log(`\nCannot apply until these are fixed:`)
  for (const problem of problems) console.log(`  - ${problem}`)
  process.exitCode = 1
} else if (!changes) {
  console.log('Nothing to do.')
} else if (!apply) {
  console.log('\nDry run: nothing was written. Pass --apply to write it.')
} else {
  const result = await transaction.commit({ visibility: 'sync' })
  console.log(`\nApplied in transaction ${result.transactionId}.`)
}
