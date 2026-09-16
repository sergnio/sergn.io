---
name: upload-wings
description: Add a wing review to Sergio's Sanity Studio using the Sanity CLI from rough notes, ratings, and a photo. Use when asked to upload wings, add a wing review to Studio, or save/publish wings on sergn.io. No browser involvement. Defaults to a draft; publishes only when explicitly requested.
---

# Upload wings

Turn rough notes and a photo into a complete `wingReview` through the authenticated Sanity CLI. Do not open, automate, or depend on a browser. Do not build reusable scripts or new credential infrastructure for a content upload.

## Context and access

- Resolve the repository root as `../../..` relative to this skill directory (resolve symlinks first). Run Sanity commands from its `studio/` directory.
- Before authoring, read `AGENTS.md`, the hosting/content guidance in `README.md`, `studio/sanity.cli.ts`, `studio/schemaTypes/reviews.ts`, `studio/schemaTypes/shared.ts`, and `src/lib/content-contract.ts`. These are authoritative if configuration or fields change.
- Read `~/.agents/VOICE.md` before editing prose in Sergio's voice. Preserve his opinions and phrasing; lightly clean up notes, never invent tasting experiences.
- Confirm project and dataset from `studio/sanity.cli.ts`. Use explicit `--project-id` and `--dataset` flags on dataset commands. Current values are `0vbjaawm` and `production`.
- Use `npx sanity --help` and per-command `--help` for the installed CLI syntax. Use its existing login, not a Studio browser session. Check authentication with `npx sanity api users/me` and project access with `npx sanity users list`.
- If authentication is absent or expired, stop and ask the user to authenticate independently with `cd studio && npx sanity login`, then resume when ready. Do not launch login or any browser yourself. Never request credentials in chat, read/extract stored tokens, or put credentials in commands, temporary files, the repository, or `.env.local`.

## Collect and map content

Accept conversational input with an attached image or local image path. No template is required. Extract everything already supplied, then ask one compact question covering only missing required information or genuine ambiguity.

- Required of a recommendation: title, unique URL slug, venue, visit date, order's style/flavor, hero image with alt text, and review notes.
- Required of a non-recommendation: title, unique URL slug, and the notes saying why it is not worth returning to. Every other field stays optional, so fill in what is known and leave the rest unset rather than inventing a fuller record.
- Recommendation status: settle it from Sergio's notes, and ask when they do not. Write `recommendationStatus` explicitly on every draft instead of leaning on the schema default; it decides which fields the contract demands, which Studio list the review appears in, and whether it is ranked at all.
- Derive a concise title from venue and flavor. Generate a lowercase, hyphen-separated slug of at most 96 characters; ask only if ambiguous. Check uniqueness across both drafts and published wing reviews.
- Ask a recommendation for the visit date if absent. Do not default to today. Resolve relative dates against the user's local date and clarify ambiguous dates; use an approximate exact date only with user approval. Ask a non-recommendation once, accept that the date may not be remembered, and leave `visitedAt` unset rather than pressing for it.
- Rating: optional, 0-5 to at most two decimal places. Do not round or convert another scale without clarification. Preserve category ratings in notes and ask which score, if any, is overall; do not invent an average.
- Optional: heat, positive integer piece count, sides, price, city, address, venue URL, photo caption/credit, and publication date. Leave unknown optional fields unset. Store a supplied USD price as integer cents; clarify ambiguous currency.
- Inspect the image locally before writing factual alt text (5-180 characters). Describe visible subjects, not an imagined flavor or filename. Preserve supplied credit; never invent attribution.
- Strip EXIF before uploading a photo. Phone photos can carry a GPS IFD, and the asset lands on a public CDN. `sips` preserves EXIF, so it is not sufficient on its own; drop the APP1/APP2 segments explicitly and verify they are gone.
- Convert unsupported images locally without changing the original. On macOS, for example: `sips -s format png /path/photo.HEIC --out /tmp/wing-review-photo.png`. Verify the file type and inspect the converted image. Use a unique temporary directory to avoid collisions.
- If an attachment has no accessible local file, ask for a usable file/path. For several photos, ask which is the hero unless specified; add additional images to review notes only if requested.

## CLI workflow

### 1. Check for existing content

Query matching wing reviews by venue/title/date before uploading assets or creating documents. Use an authenticated query with API version `2021-06-07` for raw draft and published visibility:

```sh
npx sanity documents query '*[_type == "wingReview" && (venue match "*Northbound*" || title match "*Northbound*")]' --api-version 2021-06-07 --project-id 0vbjaawm --dataset production
```

Substitute the actual search terms, constructing queries safely instead of interpolating unescaped user text. If a likely duplicate exists, ask whether to finish/update it or create a distinct visit. Never overwrite an existing review without authorization. Query slug conflicts too, excluding both IDs of the document being edited.

### 2. Upload the photo

Use `npx sanity assets upload --help`, then upload the local file with explicit project/dataset flags. Save the returned asset JSON in a temporary directory and use its actual `_id` as the image reference. Do not guess asset IDs or URLs. Use a neutral filename such as `wing-review.png` rather than exposing the original camera filename. Reuse a verified asset from an earlier successful upload when resuming instead of uploading again.

A non-recommendation with no photo skips this step. Do not ask for one twice or hold the upload waiting on it; the detail page renders without a hero image.

### 3. Prepare and validate the draft

Prepare JSON/NDJSON in a unique temporary directory outside the repository. For a new review, generate a UUID and set `_id` to `drafts.<uuid>`, never the bare UUID. Use the exact schema shape:

- `_type: "wingReview"`.
- `recommendationStatus: "recommended"` or `"notRecommended"`, always set explicitly.
- `slug: { _type: "slug", current: "..." }`.
- `visitedAt: "YYYY-MM-DD"`, `order: { styleOrFlavor: "..." }` plus supplied optional order values, and `heroImage: { _type: "imageWithAlt", image: { _type: "image", asset: { _type: "reference", _ref: "<uploaded asset ID>" } }, alt: "..." }`. A recommendation owes all three. On a non-recommendation each is optional: include the ones the user actually supplied and omit the rest entirely. Never fabricate a date, a flavor, or a photo to fill the shape out.
- `notes`: Portable Text blocks with unique `_key` values, `_type: "block"`, `style: "normal"`, `markDefs: []`, and `children` containing `_type: "span"`, `_key`, `text`, and `marks: []`.
- Omit unknown optional objects entirely, rather than creating incomplete money/location objects.

For an authorized update, fetch the latest draft (or published document if no draft exists), preserve unrelated fields, and apply only the requested changes. Do not change an existing published slug without permission. Never delete or unpublish a published document to save a draft.

CLI/API writes bypass Studio form validation. Before writing, validate the candidate NDJSON against the local schema:

```sh
npx sanity documents validate --file /tmp/<unique-directory>/candidate.ndjson --yes --format json --project-id 0vbjaawm --dataset production
```

Inspect validation output, not just the exit status. Resolve errors from known facts, ask if information is missing, and check the content contract too. Never claim a complete draft or publish content with unresolved required-field errors.

### 4. Save and read back

For a new draft, use `npx sanity documents create <candidate.json>` with explicit project/dataset flags and no `--replace`. Retain its ID across retries and query before retrying an uncertain write.

For existing drafts, use `npx sanity api` with a JSON mutation body and a revision-guarded patch (`ifRevisionID` using the fetched `_rev`). Use `set` for supplied fields and `unset` only when explicitly needed. For a published review without a draft, create a draft copy with the same base ID, excluding system revision/timestamp fields. A conflict means refetch and reconcile, not blindly replace.

Authenticated mutations can be sent without exposing credentials:

```sh
npx sanity api 'data/mutate/{dataset}' --project-hosted --api-version v2021-06-07 --project-id 0vbjaawm --dataset production --method POST --input /tmp/<unique-directory>/mutation.json --header 'Content-Type: application/json'
```

Read back the exact draft using an authenticated raw query. Verify persisted title, `recommendationStatus`, venue, date, flavor, rating, notes, image reference, alt text, optional values, and draft ID. Check the status against what was intended before step 5 branches on it: an absent value reads as a recommendation, so a partial write would route a non-recommendation into the ranking path while the read-back looks fine. Validate the read-back document as well. Do not report success solely because the write command exited successfully.

### 5. Rank a recommendation before the upload is finished

A rank belongs to a recommendation only, so this step follows `recommendationStatus`.

**Not recommended: skip this step.** `src/lib/content-contract.ts` exempts a non-recommendation from the rank rule, `studio/deskStructure.ts` keeps it out of the orderable list, and the site sorts it by date beneath the ranking. There is nothing to drag and nothing to wait for. Go straight to step 6.

**Recommended: the upload is not finished until the review has a rank.** The CLI cannot safely assign a unique `orderRank`: it is assigned by the Studio's drag-and-drop collection list. After saving and verifying the draft, stop and direct the user to open **Wing reviews - Recommended** in the Studio and drag it into its intended position. Resume only once they confirm, then read the draft back and verify `orderRank` is present and unique among recommended wing reviews. If the draft already has an unchanged rank, still verify its uniqueness. An unranked or duplicate-ranked recommendation is an incomplete upload: do not publish it, and do not report it as done. Say plainly that it is waiting on a rank.

### 6. Publish only when explicitly requested

An explicit request to publish authorizes publishing after verification; do not ask redundantly. "Upload" or "add to Studio" alone means draft.

Use the CLI's authenticated API command and the currently documented Sanity document publishing action. Inspect `npx sanity openapi --help` and the relevant Actions API specification before constructing the request; do not guess the payload. Prefer the supported publish action over manually creating a published document and deleting its draft. If the supported action cannot be established, leave the verified draft and report the blocker.

Read back the published base ID and verify its content and draft state. The public site is statically built: publication and deployment are separate. Use `curl` or another terminal HTTP client to check the public `/wings/<slug>` page and confirm the actual new content, not just an HTTP 200. No browser. If not verified, say "Published in Studio; public-site update not verified." Do not create hooks, change hosting, or trigger unrelated deployments without authorization.

## Finish

Reply briefly with title, overall rating if supplied, recommendation status, and verified draft/published status. For a recommendation, say whether it is ranked. Include the document ID and, if the Studio route can be established from repository configuration, a Studio link (never claim it was opened or verified in a browser). Report blockers or incomplete fields clearly. Do not commit/push code for a content upload.

## Invocation

- Pi: `/skill:upload-wings`
- Claude Code: `/upload-wings`

Example input: "Buffalo wings at Example Tavern, visited June 5, 2026. 4.25/5. Crispy, good heat, a little dry. 10 wings for $16. Photo: /path/wings.HEIC. Save as draft."
