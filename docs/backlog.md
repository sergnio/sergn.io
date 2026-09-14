# Backlog

Ideas and explorations queued up for future gnhf runs or manual passes. Not commitments - each item is a
spike first, decision second.

Every item here is tracked as a GitHub issue, and the issue is the source of truth: scope, acceptance
criteria, and discussion live there, and the PR that closes it says `Fixes #<issue-number>`. This file is
the short index, so an item without an issue link has not been queued yet. Open issues are at
`gh issue list`.

## Explore snapshot testing with Playwright

Investigate Playwright's visual snapshot testing (`toHaveScreenshot` / `toMatchAriaSnapshot`) for this site.
Tracked in [#35](https://github.com/sergnio/sergn.io/issues/35).

- The site is statically prerendered, so pages are highly deterministic - a good fit for pixel snapshots.
- Questions to answer: which pages/viewports are worth snapshotting, how to keep baselines stable across
  macOS (local) and Linux (CI) rendering differences, whether to run baselines only in a container, and
  where snapshot artifacts live so the repo does not bloat.
- Also evaluate ARIA snapshots as a lighter-weight alternative that captures structure without the
  cross-platform pixel pain, which pairs well with the existing accessibility work.
- Success criteria: a small proof-of-concept covering one or two pages that passes in CI twice in a row
  with no flake, plus a written recommendation on whether to expand it.

## Explore Biome as a replacement for ESLint + Prettier

Try [Biome](https://biomejs.dev) (Rust) in place of the current ESLint + Prettier setup. Tracked in
[#36](https://github.com/sergnio/sergn.io/issues/36).

- Motivation: learn a faster, Rust-based toolchain and collapse two tools with two configs into one.
- Questions to answer: does Biome cover the rules currently relied on (TypeScript, React hooks, import
  ordering, the TanStack/Sanity-specific plugins), how large is the diff when its formatter runs over the
  codebase, and how much wall-clock time does CI actually save.
- Compare against alternatives in the same space (oxlint, dprint) so the choice is informed rather than
  the first Rust tool tried.
- Success criteria: a branch with Biome wired into `npm run lint` and `npm run check:format`, a note on any
  rules lost in the migration, and a go/no-go recommendation.

## Audit and strengthen answer engine optimization

Work out what "excellent AEO" means for this site, audit against it, and close the gaps so the rankings and
reviews are retrieved, quoted, and attributed correctly by answer engines. Tracked in
[#41](https://github.com/sergnio/sergn.io/issues/41).

- The SEO foundation is already strong (prerendered HTML, canonical and social tags, an asserted sitemap,
  JSON-LD in `src/lib/metadata.ts`), but it is tuned for ranking a link rather than for being quoted.
- Research first: survey primary sources, separate documented behaviour from folklore, and land the
  criteria as a document under `docs/` so the survey is not redone.
- Known gaps to settle: `public/robots.txt` takes no position on AI crawlers, the `Person` node carries no
  `sameAs`, unrated entries (all of coffee) ship no `Review`, rankings expose only position and URL, and
  reviews carry no `dateModified`.
- Success criteria: every finding is fixed or declined with a stated reason, and the new invariants are
  enforced by `scripts/assert-static-output.mjs` the way the existing JSON-LD and sitemap checks are.
