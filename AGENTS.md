# Project instructions

- Every feature starts in its own git worktree on a branch off `main`. Never commit to `main` directly, and never reuse a branch or worktree another agent already has checked out - run `git worktree list` first to see what is taken.
- Before committing or pushing, run `github-account personal` for this `sergnio` repository. It pins the matching Git identity and SSH host. Verify with `github-account status`.
- Never add an agent name as a commit co-author.
- Merge every PR with `gh pr merge --rebase`. Never a merge commit, never a squash - `main` keeps each commit as written, which is why its SHAs change under a branch that has not refetched.
- Work is tracked in GitHub issues (`gh issue list`), not in this repo's Markdown. `docs/backlog.md` only indexes the exploration issues; a PR that finishes one says `Fixes #<issue-number>`.
- The public application is a statically prerendered TanStack Start site. See `README.md` for Sanity and Netlify configuration.
- Every collection but the blog publishes as a ranking, best first. `src/lib/content-types.ts` names them and `src/lib/content-contract.ts` fails the build for a recommendation with no rank; the Studio's drag-and-drop list is what assigns one. A non-recommendation sits outside the ranking, so it carries no rank and owes only a title, a slug and the notes saying why.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
