# Backlog

Ideas and explorations queued up for future gnhf runs or manual passes. Not commitments - each item is a
spike first, decision second.

## Explore snapshot testing with Playwright

Investigate Playwright's visual snapshot testing (`toHaveScreenshot` / `toMatchAriaSnapshot`) for this site.

- The site is statically prerendered, so pages are highly deterministic - a good fit for pixel snapshots.
- Questions to answer: which pages/viewports are worth snapshotting, how to keep baselines stable across
  macOS (local) and Linux (CI) rendering differences, whether to run baselines only in a container, and
  where snapshot artifacts live so the repo does not bloat.
- Also evaluate ARIA snapshots as a lighter-weight alternative that captures structure without the
  cross-platform pixel pain, which pairs well with the existing accessibility work.
- Success criteria: a small proof-of-concept covering one or two pages that passes in CI twice in a row
  with no flake, plus a written recommendation on whether to expand it.

## Explore Biome as a replacement for ESLint + Prettier

Try [Biome](https://biomejs.dev) (Rust) in place of the current ESLint + Prettier setup.

- Motivation: learn a faster, Rust-based toolchain and collapse two tools with two configs into one.
- Questions to answer: does Biome cover the rules currently relied on (TypeScript, React hooks, import
  ordering, the TanStack/Sanity-specific plugins), how large is the diff when its formatter runs over the
  codebase, and how much wall-clock time does CI actually save.
- Compare against alternatives in the same space (oxlint, dprint) so the choice is informed rather than
  the first Rust tool tried.
- Success criteria: a branch with Biome wired into `npm run lint` and `npm run check:format`, a note on any
  rules lost in the migration, and a go/no-go recommendation.
