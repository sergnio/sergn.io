---
name: upload-post
description: Add a blog post to Sergio's Sanity Studio using the Sanity CLI from notes, a transcript, or a finished draft. Use when asked to upload a post, turn writing into a blog post, or save/publish a post on sergn.io. Confirms every field with him before writing, so nothing needs fixing in the Studio afterwards. No browser involvement. Defaults to a draft; publishes only when explicitly requested.
---

# Upload post

Turn writing into a complete `post` through the authenticated Sanity CLI, with every field settled in chat first. Do not open, automate, or depend on a browser. Do not build reusable scripts or new credential infrastructure for a content upload.

## Context and access

- Resolve the repository root as `../../..` relative to this skill directory (resolve symlinks first). Run Sanity commands from its `studio/` directory.
- Before authoring, read `AGENTS.md`, the hosting/content guidance in `README.md`, `studio/sanity.cli.ts`, `studio/schemaTypes/post.ts`, `studio/schemaTypes/postBody.ts`, `studio/schemaTypes/shared.ts`, and `src/lib/content-contract.ts`. These are authoritative if configuration or fields change.
- Read `~/.agents/VOICE.md` before touching prose in Sergio's voice.
- Confirm project and dataset from `studio/sanity.cli.ts`. Use explicit `--project-id` and `--dataset` flags on dataset commands. Current values are `0vbjaawm` and `production`.
- Use `npx sanity --help` and per-command `--help` for the installed CLI syntax. Use its existing login, not a Studio browser session. Check authentication with `npx sanity api users/me`.
- If authentication is absent or expired, stop and ask the user to authenticate independently with `cd studio && npx sanity login`, then resume when ready. Do not launch login or any browser yourself. Never request credentials in chat, read/extract stored tokens, or put credentials in commands, temporary files, the repository, or `.env.local`.

## The body is his, the metadata is yours to propose

The post's prose is the one thing to leave alone. Everything wrapped around it is a proposal he reviews.

- Carry the body over as written. Fix punctuation, remove transcription filler, and repair a word the transcriber clearly mangled; say which words changed. Never add a sentence, an opinion, a heading, or a tidy conclusion he did not write.
- Propose title, slug, excerpt, publication date, tags, alt text, and any SEO override. Each is a starting point for him to overwrite, not a decision.
- A rearrangement of his paragraphs is a proposal shown in chat, never applied silently.

## Settle every field before writing

Fill the field sheet below, then show it in one block and wait. The completion criterion: every field is either supplied by Sergio or a proposal he has explicitly approved. Do not write to the dataset before that.

Mark each line `supplied`, `proposed`, or `missing`, so he can see at a glance what he is actually being asked to approve:

```
Title      proposed   Sometimes all that matters is that you are doing
Slug       proposed   sometimes-all-that-matters-is-that-you-are-doing
Excerpt    proposed   Pessimist or optimist barely matters. (138 chars)
Published  proposed   2026-09-14
Cover      missing    needs a local image path; publishing is blocked without one
Tags       proposed   opinion
SEO        unset      falls back to title and excerpt
Body       supplied   4 paragraphs, verbatim apart from "midnight" -> "night owl"
```

Take his edits, show the corrected sheet again, and keep going until he approves it. When one field blocks him and the rest are settled, offer to save the draft without it and say what that costs.

## Field sheet

- `title`: required. Propose one from his own words, usually a line already in the post.
- `slug`: required. Lowercase, hyphen-separated, at most 96 characters, derived from the title. Query both drafts and published posts for a conflict.
- `excerpt`: required by the schema and by the content contract. At most 160 characters, or the Studio warns. Write it from the post, and report the character count on the sheet.
- `body`: required, `postBody` Portable Text. Beyond normal blocks it accepts `h2`/`h3`/`h4`, `blockquote`, bullet and number lists, `imageWithAlt`, `callout` (tone `note`, `warning`, or `quote`), `codeBlock`, and `divider`. Offer these only where his text already implies one.
- `publishedAt`: required datetime. Propose today and say it is a placeholder while the post is a draft. For a piece written earlier, ask rather than backdating on your own.
- `coverImage`: required by the schema, absent from the content contract. A post without one saves and reads back fine as a draft, then cannot be published, so ask for an image path early instead of at the end. It is an `imageWithAlt`: inspect the file locally and write factual alt text (5-180 characters) describing the visible subject, not the post's theme.
- `tags`: optional, unique, at most 8, and bound to the closed `postTags` list in `studio/schemaTypes/shared.ts`. A value outside that list blocks Publish in the Studio, so propose only list values and tell him when the post has no good fit rather than inventing one.
- `seo.title` and `seo.description`: optional overrides, warned past 60 and 160 characters. Leave unset unless he wants them.

Strip EXIF before uploading a photo he took. Phone photos carry a GPS IFD and the asset lands on a public CDN. `sips` preserves EXIF, so drop the APP1/APP2 segments explicitly and verify they are gone.

## CLI workflow

### 1. Check for existing content

Query matching posts by title and slug before uploading assets or creating documents. Use an authenticated query with API version `2021-06-07` for raw draft and published visibility:

```sh
npx sanity documents query '*[_type == "post" && (title match "*yin*" || slug.current == "the-slug")]{_id, title, "slug": slug.current}' --api-version 2021-06-07 --project-id 0vbjaawm --dataset production
```

Substitute the actual search terms, constructing queries safely instead of interpolating unescaped user text. If a likely duplicate exists, ask whether to finish that one or create a separate post. Never overwrite an existing post without authorization. Query slug conflicts too, excluding both IDs of the document being edited.

### 2. Upload the cover image

The command takes `--file`, not a positional path:

```sh
npx sanity assets upload --file /tmp/<unique-directory>/cover.jpg --type image --filename post-<slug>.jpg --content-type image/jpeg --project-id 0vbjaawm --dataset production
```

It prints JSON whose asset ID is nested at `.asset._id`, not at the top level. Save the output in a temporary directory and use that actual `_id` as the image reference. Do not guess asset IDs or URLs. Use a neutral filename rather than exposing the original camera filename. Reuse a verified asset from an earlier successful upload when resuming instead of uploading again.

### 3. Prepare and validate the draft

Prepare JSON in a unique temporary directory outside the repository. For a new post, generate a UUID and set `_id` to `drafts.<uuid>`, never the bare UUID. Use the exact schema shape:

- `_type: "post"`.
- `slug: { _type: "slug", current: "..." }`.
- `coverImage: { _type: "imageWithAlt", image: { _type: "image", asset: { _type: "reference", _ref: "<uploaded asset ID>" } }, alt: "..." }`.
- `body`: Portable Text blocks with unique `_key` values, `_type: "block"`, `style: "normal"`, `markDefs: []`, and `children` containing `_type: "span"`, `_key`, `text`, and `marks: []`. Nested objects such as `callout` content need their own `_key` values too.
- One paragraph is one block. Splitting his prose into more blocks than he wrote changes the rendered spacing.

For an authorized update, fetch the latest draft (or published document if no draft exists), preserve unrelated fields, and apply only the requested changes. Do not change an existing published slug without permission. Never delete or unpublish a published document to save a draft.

CLI/API writes bypass Studio form validation. Before writing, validate the candidate against the local schema:

```sh
npx sanity documents validate --file /tmp/<unique-directory>/candidate.ndjson --yes --format json --project-id 0vbjaawm --dataset production
```

An empty `[]` means no errors, and a non-empty result exits non-zero, so read the markers rather than the exit status. Each marker names its `path`, which is how a missing `coverImage.alt` is told apart from a missing body. Resolve errors from known facts, ask if information is missing, and check the content contract too. Never claim a complete draft or publish content with unresolved required-field errors.

### 4. Save and read back

`npx sanity documents create` takes the file as a positional argument, parses one JSON5 document per invocation, and rejects multi-line NDJSON, so write one file per post. Use explicit project/dataset flags and no `--replace`. Retain the ID across retries and query before retrying an uncertain write.

For existing drafts, use `npx sanity api` with a JSON mutation body and a revision-guarded patch (`ifRevisionID` using the fetched `_rev`). Use `set` for supplied fields and `unset` only when explicitly needed. For a published post without a draft, create a draft copy with the same base ID, excluding system revision/timestamp fields. A conflict means refetch and reconcile, not blindly replace.

Authenticated mutations can be sent without exposing credentials:

```sh
npx sanity api 'data/mutate/{dataset}' --project-hosted --api-version v2021-06-07 --project-id 0vbjaawm --dataset production --method POST --input /tmp/<unique-directory>/mutation.json --header 'Content-Type: application/json'
```

Read back the exact draft using an authenticated raw query, projecting `body[].children[].text` so the prose itself is verified, not just the field count. Check title, slug, excerpt, publication date, tags, image reference, alt text, and draft ID. Validate the read-back document as well. Do not report success solely because the write command exited successfully.

### 5. Publish only when explicitly requested

An explicit request to publish authorizes publishing after verification; do not ask redundantly. "Upload", "save", or "make it a draft post" alone means draft.

Use the CLI's authenticated API command and the currently documented Sanity document publishing action. Inspect `npx sanity openapi --help` and the relevant Actions API specification before constructing the request; do not guess the payload. Prefer the supported publish action over manually creating a published document and deleting its draft. If the supported action cannot be established, leave the verified draft and report the blocker.

Read back the published base ID and verify its content and draft state. The public site is statically prerendered from published documents only: a draft never appears on the site, and publication and deployment are separate steps. Use `curl` or another terminal HTTP client to check the public `/blog/<slug>` page and confirm the actual new content, not just an HTTP 200. No browser. If not verified, say "Published in Studio; public-site update not verified." Do not create hooks, change hosting, or trigger unrelated deployments without authorization.

## Finish

Reply briefly with title, slug, and verified draft or published status. Include the document ID and, if the Studio route can be established from repository configuration, a Studio link (never claim it was opened or verified in a browser). Name every field still unset and what it blocks. Do not commit/push code for a content upload.

## Invocation

- Pi: `/skill:upload-post`
- Claude Code: `/upload-post`

Example input: "Make this a draft post" with pasted prose, or "Publish this as a post titled X, cover photo at /path/cover.jpg."
