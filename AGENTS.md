# Project instructions

- Every feature starts in its own git worktree on a branch off `main`. Never commit to `main` directly, and never reuse a branch or worktree another agent already has checked out - run `git worktree list` first to see what is taken.
- Before committing or pushing, run `github-account personal` for this `sergnio` repository. It pins the matching Git identity and SSH host. Verify with `github-account status`.
- Never add an agent name as a commit co-author.
- The public application is a statically prerendered TanStack Start site. See `README.md` for Sanity and Netlify configuration.
- Every collection but the blog publishes as a ranking, best first. `src/lib/content-types.ts` names them and `src/lib/content-contract.ts` fails the build for an entry with no rank; the Studio's drag-and-drop list is what assigns one.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
