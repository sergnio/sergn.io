---
name: upload-syrup
description: Add a maple syrup review to Sergio's Sanity Studio using the Sanity CLI from a bottle photo, rough notes, and a rating. Use when asked to upload syrup, add a syrup review to Studio, or save/publish maple syrup on sergn.io. No browser involvement. Defaults to a draft; publishes only when explicitly requested.
---

# Upload syrup

Turn a bottle photo and rough notes into a complete `syrupReview` through the authenticated Sanity CLI. Do not open, automate, or depend on a browser. Do not build reusable scripts or new credential infrastructure for a content upload.

## Context and access

- Resolve the repository root as `../../..` relative to this skill directory (resolve symlinks first). Run Sanity commands from its `studio/` directory.
- Before authoring, read `AGENTS.md`, the hosting/content guidance in `README.md`, `studio/sanity.cli.ts`, `studio/schemaTypes/reviews.ts`, `studio/schemaTypes/shared.ts`, and `src/lib/content-contract.ts`. These are authoritative if configuration or fields change.
- Read `~/.agents/VOICE.md` before editing prose in Sergio's voice. Preserve his opinions and phrasing; lightly clean up notes, never invent tasting experiences.
- Confirm project and dataset from `studio/sanity.cli.ts`. Use explicit `--project-id` and `--dataset` flags on dataset commands. Current values are `0vbjaawm` and `production`.
- Use `npx sanity --help` and per-command `--help` for the installed CLI syntax. Use its existing login, not a Studio browser session. Check authentication with `npx sanity api users/me`.
- If authentication is absent or expired, stop and ask the user to authenticate independently with `cd studio && npx sanity login`, then resume when ready. Do not launch login or any browser yourself. Never request credentials in chat, read/extract stored tokens, or put credentials in commands, temporary files, the repository, or `.env.local`.
- `syrupReview` must exist in the checked-out `studio/schemaTypes/`. A Studio built from a branch without it shows neither the schema nor the "Syrup reviews" desk item, and existing documents look missing even though they are in the dataset. Run the Studio from a worktree that has the type.

## The label is the source of truth

Most of a syrup document is printed on the bottle. Read it off the photo rather than asking or guessing:

- `producer` is the maker on the label, not the brand nickname Sergio uses as the title. "Sweet Ontario" is the product; `Mountain Maple Products` is the producer.
- `volumeLiters` comes from the stated net contents. Convert to liters: 8 fl oz = 0.237, 1 quart / 32 fl oz = 0.946, 500 ml = 0.5. Never infer volume from the apparent size of the bottle.
- `grade` must match the schema's list exactly (for example `Amber, Rich Taste`). US and Canadian Grade A wording maps onto the same four descriptors. If the label shows no grade, leave it unset.
- `origin` is where it was produced, which is often not where it was bought. `boughtFrom` is the latter. A syrup made in Lutsen, MN and bought in New Prague sets both, differently.

If the label contradicts a number Sergio supplied, trust the label and say so. Do not carry forward a price or volume that cannot be sourced: an identical price across bottles of very different sizes is a placeholder, not data.

## Collect and map content

Accept conversational input with an attached image or local image path. No template is required. Extract everything already supplied, then ask one compact question covering only missing required information or genuine ambiguity.

- Required of a recommendation by the schema and the content contract: title, unique URL slug, producer, hero image with alt text.
- Required of a non-recommendation: title, unique URL slug, and the notes saying why it is not worth buying again. Every other field stays optional, so fill in what is known and leave the rest unset rather than inventing a fuller record.
- Recommendation status: settle it from Sergio's notes, and ask when they do not. Write `recommendationStatus` explicitly on every draft instead of leaning on the schema default; it decides which fields the contract demands, which Studio list the review appears in, and whether it is ranked at all.
- Derive a title from how Sergio refers to the syrup. Generate a lowercase, hyphen-separated slug of at most 96 characters; ask only if ambiguous. Check uniqueness across both drafts and published syrup reviews.
- Rating: optional, 0-5 to at most two decimal places. Do not round or convert another scale without clarification. An untasted syrup has no rating; say so in the notes rather than inventing one.
- Optional: grade, origin, boughtFrom, volumeLiters, price, publishedAt, photo caption/credit. Store a supplied USD price as integer cents; clarify ambiguous currency. Leave unknown optional fields unset rather than guessing.
- Price per liter is computed at render time from `price` and `volumeLiters`. Setting only one of the pair silently hides that row, so set both or neither.
- Inspect the image locally before writing factual alt text (5-180 characters). Describe the visible bottle and setting, not the flavor or the filename. An empty bottle is worth saying; it is visible and it tells the reader something.
- Strip EXIF before uploading. Phone photos of bottles taken at home or at a farm carry a GPS IFD, and the asset lands on a public CDN. `sips` preserves EXIF, so it is not sufficient on its own; drop the APP1/APP2 segments explicitly and verify they are gone.
- Convert unsupported images locally without changing the original. On macOS, for example: `sips -s format jpeg -Z 2000 /path/photo.HEIC --out /tmp/syrup-photo.jpg`. Verify the file type and inspect the converted image. Use a unique temporary directory to avoid collisions.
- If an attachment has no accessible local file, ask for a usable file/path. For several photos, ask which is the hero unless specified.

## CLI workflow

### 1. Check for existing content

Query matching syrup reviews by producer/title before uploading assets or creating documents. Use an authenticated query with API version `2021-06-07` for raw draft and published visibility:

```sh
npx sanity documents query '*[_type == "syrupReview" && (producer match "*Hamel*" || title match "*Hamel*")]' --api-version 2021-06-07 --project-id 0vbjaawm --dataset production
```

Substitute the actual search terms, constructing queries safely instead of interpolating unescaped user text. If a likely duplicate exists, ask whether to finish/update it or create a distinct bottle. Never overwrite an existing review without authorization. Query slug conflicts too, excluding both IDs of the document being edited.

### 2. Upload the photo

The command takes `--file`, not a positional path:

```sh
npx sanity assets upload --file /tmp/<unique-directory>/syrup.jpg --type image --filename syrup-<slug>.jpg --content-type image/jpeg --project-id 0vbjaawm --dataset production
```

It prints JSON whose asset ID is nested at `.asset._id`, not at the top level. Save the output in a temporary directory and use that actual `_id` as the image reference. Do not guess asset IDs or URLs. Use a neutral filename rather than exposing the original camera filename. Reuse a verified asset from an earlier successful upload when resuming instead of uploading again.

### 3. Prepare and validate the draft

Prepare JSON in a unique temporary directory outside the repository. For a new review, generate a UUID and set `_id` to `drafts.<uuid>`, never the bare UUID. Use the exact schema shape:

- `_type: "syrupReview"`.
- `recommendationStatus: "recommended"` or `"notRecommended"`, always set explicitly.
- `slug: { _type: "slug", current: "..." }`.
- `heroImage: { _type: "imageWithAlt", image: { _type: "image", asset: { _type: "reference", _ref: "<uploaded asset ID>" } }, alt: "..." }`.
- `notes`: Portable Text blocks with unique `_key` values, `_type: "block"`, `style: "normal"`, `markDefs: []`, and `children` containing `_type: "span"`, `_key`, `text`, and `marks: []`.
- `price: { amountCents: <integer>, currency: "USD" }`, or omit entirely. Do not create a partial money object.

For an authorized update, fetch the latest draft (or published document if no draft exists), preserve unrelated fields, and apply only the requested changes. Do not change an existing published slug without permission. Never delete or unpublish a published document to save a draft.

CLI/API writes bypass Studio form validation. Before writing, validate the candidate against the local schema:

```sh
npx sanity documents validate --file /tmp/<unique-directory>/candidate.ndjson --yes --format json --project-id 0vbjaawm --dataset production
```

An empty `[]` means no errors. Confirm the validator is actually resolving the schema rather than passing everything, for example by checking that a deliberately bad value is rejected. Inspect validation output, not just the exit status. Resolve errors from known facts, ask if information is missing, and check the content contract too. Never claim a complete draft or publish content with unresolved required-field errors.

### 4. Save and read back

`npx sanity documents create` parses one JSON5 document per invocation and rejects multi-line NDJSON, so write one file per review and loop. Use explicit project/dataset flags and no `--replace`. Retain each ID across retries and query before retrying an uncertain write.

For existing drafts, use `npx sanity api` with a JSON mutation body and a revision-guarded patch (`ifRevisionID` using the fetched `_rev`). Use `set` for supplied fields and `unset` only when explicitly needed. For a published review without a draft, create a draft copy with the same base ID, excluding system revision/timestamp fields. A conflict means refetch and reconcile, not blindly replace.

Authenticated mutations can be sent without exposing credentials:

```sh
npx sanity api 'data/mutate/{dataset}' --project-hosted --api-version v2021-06-07 --project-id 0vbjaawm --dataset production --method POST --input /tmp/<unique-directory>/mutation.json --header 'Content-Type: application/json'
```

Read back the exact draft using an authenticated raw query. Verify persisted title, producer, grade, origin, volume, rating, notes, image reference, alt text, optional values, and draft ID. Validate the read-back document as well. Do not report success solely because the write command exited successfully.

### 5. Rank a recommendation before the upload is finished

A rank belongs to a recommendation only, so this step follows `recommendationStatus`.

**Not recommended: skip this step.** `src/lib/content-contract.ts` exempts a non-recommendation from the rank rule, `studio/deskStructure.ts` keeps it out of the orderable list, and the site sorts it by date beneath the ranking. There is nothing to drag and nothing to wait for. Go straight to step 6.

**Recommended: the upload is not finished until the review has a rank.** The CLI cannot safely assign a unique `orderRank`: it is assigned by the Studio's drag-and-drop collection list. After saving and verifying the draft, stop and direct the user to open **Syrup reviews - Recommended** in the Studio and drag it into its intended position. Resume only once they confirm, then read the draft back and verify `orderRank` is present and unique among recommended syrup reviews. If the draft already has an unchanged rank, still verify its uniqueness. An unranked or duplicate-ranked recommendation is an incomplete upload: do not publish it, and do not report it as done. Say plainly that it is waiting on a rank.

### 6. Publish only when explicitly requested

An explicit request to publish authorizes publishing after verification; do not ask redundantly. "Upload" or "add to Studio" alone means draft.

Use the CLI's authenticated API command and the currently documented Sanity document publishing action. Inspect `npx sanity openapi --help` and the relevant Actions API specification before constructing the request; do not guess the payload. Prefer the supported publish action over manually creating a published document and deleting its draft. If the supported action cannot be established, leave the verified draft and report the blocker.

Read back the published base ID and verify its content and draft state. The public site is statically built from published documents only: a draft never appears on the site, and publication and deployment are separate steps. Use `curl` or another terminal HTTP client to check the public `/syrup/<slug>` page and confirm the actual new content, not just an HTTP 200. No browser. If not verified, say "Published in Studio; public-site update not verified." Do not create hooks, change hosting, or trigger unrelated deployments without authorization.

## Finish

Reply briefly with title, rating if supplied, recommendation status, and verified draft/published status. For a recommendation, say whether it is ranked. Include the document ID and, if the Studio route can be established from repository configuration, a Studio link (never claim it was opened or verified in a browser). Report blockers, unset fields, and any place the label contradicted the supplied notes. Do not commit/push code for a content upload.

## Invocation

- Pi: `/skill:upload-syrup`
- Claude Code: `/upload-syrup`

Example input: "Hamel pure maple syrup, 8 oz, from Jake's house. Never tasted it but he says it's good. Photo: /path/hamel.HEIC. Save as draft."
