import { describe, expect, it } from 'vitest'
import { planCleanup } from './wing-locations-cleanup'
import type { LinkedWing, LocationTarget } from './wing-locations-cleanup'

const steveOs: LocationTarget = {
  _id: 'location-steve-os',
  _type: 'location',
  visitCount: 11,
}

function wing(overrides: Partial<LinkedWing> = {}): LinkedWing {
  return {
    _id: 'wing-steve-os',
    _rev: 'rev-1',
    title: "Steve O's Buffalo",
    venue: "Steve O's",
    visitCount: 11,
    location: { _ref: 'location-steve-os' },
    ...overrides,
  }
}

describe('wing location cleanup', () => {
  it('unsets the legacy fields once the location holds every visit', () => {
    const plan = planCleanup([wing()], [steveOs])

    expect(plan.problems).toEqual([])
    expect(plan.unsets.map((planned) => planned._id)).toEqual(['wing-steve-os'])
  })

  it('refuses when a visit was recorded on the wing between phases', () => {
    const plan = planCleanup([wing({ visitCount: 12 })], [steveOs])

    expect(plan.unsets).toEqual([])
    expect(plan.problems).toEqual([
      expect.stringMatching(/has 12 visits but location-steve-os has 11/),
    ])
  })

  it('refuses when the location has no visit count to keep them', () => {
    const plan = planCleanup(
      [wing({ visitCount: 1 })],
      [{ ...steveOs, visitCount: null }],
    )

    expect(plan.problems).toEqual([
      expect.stringMatching(/has 1 visits but location-steve-os has none/),
    ])
  })

  it('refuses a wing whose location is missing or unpublished', () => {
    const plan = planCleanup([wing()], [])

    expect(plan.problems).toEqual([
      expect.stringMatching(
        /location-steve-os, which is missing or unpublished/,
      ),
    ])
  })

  it('refuses a wing that points at a document of another type', () => {
    const plan = planCleanup([wing()], [{ ...steveOs, _type: 'wingReview' }])

    expect(plan.problems).toEqual([expect.stringMatching(/is a wingReview/)])
  })

  it('refuses a wing that is not linked yet', () => {
    const plan = planCleanup([wing({ location: null })], [steveOs])

    expect(plan.problems).toEqual([
      expect.stringMatching(/is not linked to a location yet/),
    ])
  })

  it('plans nothing for a wing already cleaned, whose fields read as null', () => {
    const plan = planCleanup(
      [wing({ venue: null, visitCount: null })],
      [steveOs],
    )

    expect(plan).toEqual({ unsets: [], problems: [] })
  })
})
