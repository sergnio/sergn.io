export type LinkedWing = {
  _id: string
  _rev: string
  title?: string | null
  venue?: string | null
  visitCount?: number | null
  location?: { _ref?: string | null } | null
}

export type LocationTarget = {
  _id: string
  _type: string
  visitCount?: number | null
}

export type CleanupPlan = {
  unsets: LinkedWing[]
  problems: string[]
}

/**
 * Decides which wings can drop `venue` and `visitCount`. It refuses the whole
 * cleanup on any problem, so a visit recorded between phases is never lost.
 */
export function planCleanup(
  wings: LinkedWing[],
  targets: LocationTarget[],
): CleanupPlan {
  const targetsById = new Map(targets.map((target) => [target._id, target]))
  const problems: string[] = []
  const unsets: LinkedWing[] = []

  for (const wing of wings) {
    const label = `${wing._id} (${wing.title})`
    const ref = wing.location?._ref
    if (!ref) {
      problems.push(`${label} is not linked to a location yet`)
      continue
    }

    const target = targetsById.get(ref)
    if (!target) {
      problems.push(
        `${label} points at ${ref}, which is missing or unpublished`,
      )
      continue
    }
    if (target._type !== 'location') {
      problems.push(`${label} points at ${ref}, which is a ${target._type}`)
      continue
    }

    const legacyVisits = wing.visitCount ?? null
    if (legacyVisits !== null && legacyVisits > (target.visitCount ?? 0)) {
      problems.push(
        `${label} has ${legacyVisits} visits but ${ref} has ${target.visitCount ?? 'none'} - set the location's visit count, then rerun`,
      )
      continue
    }

    if (wing.venue != null || wing.visitCount != null) unsets.push(wing)
  }

  return { unsets, problems }
}
