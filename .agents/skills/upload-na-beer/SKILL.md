---
name: upload-na-beer
description: Add a non-alcoholic beer review to Sergio's Sanity Studio using the Sanity CLI from a can or bottle photo, rough notes, and a grade. Use when asked to upload an N/A beer, add a non-alcoholic beer to Studio, or save/publish an N/A beer on sergn.io. No browser involvement. Defaults to a draft; publishes only when explicitly requested.
---

# Upload N/A beer

Turn a can or bottle photo and rough notes into a complete `naBeer` through the authenticated Sanity CLI. Do not open, automate, or depend on a browser. Do not build reusable scripts or new credential infrastructure for a content upload.

## Context and access

- Resolve the repository root as `../../..` relative to this skill directory (resolve symlinks first). Run Sanity commands from its `studio/` directory.
- Before authoring, read `AGENTS.md`, the hosting/content guidance in `README.md`, `studio/sanity.cli.ts`, `studio/schemaTypes/reviews.ts`, `studio/schemaTypes/shared.ts`, and `src/lib/content-contract.ts`. These are authoritative if configuration or fields change.
- Read `~/.agents/VOICE.md` before editing prose in Sergio's voice. Preserve his opinions and phrasing; lightly clean up notes, never invent tasting experiences.
- Confirm project and dataset from `studio/sanity.cli.ts`. Use explicit `--project-id` and `--dataset` flags on dataset commands. Current values are `0vbjaawm` and `production`.
- Use `npx sanity --help` and per-command `--help` for the installed CLI syntax. Use its existing login, not a Studio browser session. Check authentication with `npx sanity api users/me` and project access with `npx sanity users list`.
- If authentication is absent or expired, stop and ask the user to authenticate independently with `cd studio && npx sanity login`, then resume when ready. Do not launch login or any browser yourself. Never request credentials in chat, read/extract stored tokens, or put credentials in commands, temporary files, the repository, or `.env.local`.

## The label is the source of truth

Most of an N/A beer document is printed on the can. Read it off the photo rather than asking or guessing:

- `title` is the product name. `brewery` is the maker, a separate field: "Run Wild" is the product, `Athletic Brewing` is the brewery.
- `style` is what the label calls it, such as IPA, hazy IPA, stout, or golden ale. Do not upgrade a plain "ale" into a style the label does not claim.
- `abvPercent` is a percent, not a fraction, and the schema caps it at 0.5. A label reading "<0.5% ABV" sets `0.5`; "0.0%" sets `0`. Anything above 0.5 is not an N/A beer, so stop and ask rather than forcing the value through.
- `abvNote` is for a beer whose ABV is exceptional or stated oddly, such as a true 0.0% or a range. Use it instead of bending `abvPercent`.
- `package` must use `ml`, `fl-oz`, or `count`, the only units the schema accepts here. A 12 fl oz can sets `{ amount: 12, unit: "fl-oz" }`; a six-pack sets `{ amount: 6, unit: "count" }`. `packageFormat` is the free-text shape, such as "can", "bottle", or "six-pack of cans".
- `boughtFrom` is where Sergio got it, which is often not where it was brewed.

If the label contradicts something Sergio supplied, trust the label and say so. Do not carry forward a price or volume that cannot be sourced.

## Collect and map content

Accept conversational input with an attached image or local image path. No template is required. Extract everything already supplied, then ask one compact question covering only missing required information or genuine ambiguity.

- Required of a recommendation: title, unique URL slug, brewery, and a hero image with alt text.
- Required of a non-recommendation: title, unique URL slug, and the notes saying why it is not worth drinking again. Every other field stays optional, so fill in what is known and leave the rest unset rather than inventing a fuller record.
- Recommendation status: settle it from Sergio's notes, and ask when they do not. Write `recommendationStatus` explicitly on every draft instead of leaning on the schema default; it decides which fields the contract demands, which Studio list the review appears in, and whether it is ranked at all.
- Derive a title from the product name on the label. Generate a lowercase, hyphen-separated slug of at most 96 characters; ask only if ambiguous. Check uniqueness across both drafts and published N/A beers.
- Grade: optional, one of `S+`, `S`, `S-`, `A+`, `A`, `A-`, `B+`, `B`, `B-`, `C`, `D`, `F`. Do not convert a score out of five or any other scale without clarification. An untasted can has no grade; say so in the notes rather than inventing one.
- `isCrowned` marks the single best entry in the category. Only an `S+` can wear it, and only one per category, so never set it unless Sergio says so outright. The Studio rejects a second crown, and the page prints the crown in place of the letter.
- Optional: style, abvPercent, abvNote, package, packageFormat, boughtFrom, purchasedAt, price, notes, photo caption/credit, and publication date. Leave unknown optional fields unset. Store a supplied USD price as integer cents; clarify ambiguous currency.
- Inspect the image locally before writing factual alt text (5-180 characters). Describe the visible can or bottle and setting, not the flavor or the filename.
- Strip EXIF before uploading a photo. Phone photos can carry a GPS IFD, and the asset lands on a public CDN. `sips` preserves EXIF, so it is not sufficient on its own; drop the APP1/APP2 segments explicitly and verify they are gone.
- Convert unsupported images locally without changing the original. On macOS, for example: `sips -s format jpeg -Z 2000 /path/photo.HEIC --out /tmp/na-beer-photo.jpg`. Verify the file type and inspect the converted image. Use a unique temporary directory to avoid collisions.
- If an attachment has no accessible local file, ask for a usable file/path. For several photos, ask which is the hero unless specified.

## CLI workflow

### 1. Check for existing content

Query matching N/A beers by brewery/title before uploading assets or creating documents. Use an authenticated query with API version `2021-06-07` for raw draft and published visibility:

```sh
npx sanity documents query '*[_type == "naBeer" && (brewery match "*Athletic*" || title match "*Athletic*")]' --api-version 2021-06-07 --project-id 0vbjaawm --dataset production
```

Substitute the actual search terms, constructing queries safely instead of interpolating unescaped user text. If a likely duplicate exists, ask whether to finish/update it or create a distinct beer. Never overwrite an existing review without authorization. Query slug conflicts too, excluding both IDs of the document being edited.

### 2. Upload the photo

Use `npx sanity assets upload --help`, then upload the local file with explicit project/dataset flags:

```sh
npx sanity assets upload --file /tmp/<unique-directory>/na-beer.jpg --type image --filename na-beer-<slug>.jpg --content-type image/jpeg --project-id 0vbjaawm --dataset production
```

It prints JSON whose asset ID is nested at `.asset._id`, not at the top level. Save the output in a temporary directory and use that actual `_id` as the image reference. Do not guess asset IDs or URLs. Use a neutral filename rather than exposing the original camera filename. Reuse a verified asset from an earlier successful upload when resuming instead of uploading again.

A non-recommendation with no photo skips this step. Do not ask for one twice or hold the upload waiting on it; the detail page renders without a hero image.

### 3. Prepare and validate the draft

Prepare JSON in a unique temporary directory outside the repository. For a new review, generate a UUID and set `_id` to `drafts.<uuid>`, never the bare UUID. Use the exact schema shape:

- `_type: "naBeer"`.
- `recommendationStatus: "recommended"` or `"notRecommended"`, always set explicitly.
- `slug: { _type: "slug", current: "..." }`.
- `heroImage: { _type: "imageWithAlt", image: { _type: "image", asset: { _type: "reference", _ref: "<uploaded asset ID>" } }, alt: "..." }`. A recommendation owes the brewery and the photo. On a non-recommendation both are optional: include what the user actually supplied and omit the rest entirely. Never fabricate a brewery, an ABV, or a photo to fill the shape out.
- `package: { amount: <positive number>, unit: "ml" | "fl-oz" | "count" }`, or omit entirely. Do not create a partial package object.
- `notes`: Portable Text blocks with unique `_key` values, `_type: "block"`, `style: "normal"`, `markDefs: []`, and `children` containing `_type: "span"`, `_key`, `text`, and `marks: []`.
- `price: { amountCents: <integer>, currency: "USD" }`, or omit entirely. Do not create a partial money object.

For an authorized update, fetch the latest draft (or published document if no draft exists), preserve unrelated fields, and apply only the requested changes. Do not change an existing published slug without permission. Never delete or unpublish a published document to save a draft.

CLI/API writes bypass Studio form validation. Before writing, validate the candidate against the local schema:

```sh
npx sanity documents validate --file /tmp/<unique-directory>/candidate.ndjson --yes --format json --project-id 0vbjaawm --dataset production
```

An empty `[]` means no errors. Confirm the validator is actually resolving the schema rather than passing everything, for example by checking that an out-of-range ABV is rejected. Inspect validation output, not just the exit status. Resolve errors from known facts, ask if information is missing, and check the content contract too. Never claim a complete draft or publish content with unresolved required-field errors.

Do not pass `--level error`. A `requiredForRecommendations` rule on an object field, including `heroImage`, reports at warning level, so `--level error` hides a missing hero image entirely and reports `[]` on a document that is not finished. Read the warnings and treat a missing hero image on a recommendation as a blocker, not a suggestion.

### 4. Save and read back

`npx sanity documents create` parses one JSON5 document per invocation and rejects multi-line NDJSON, so write one file per review and loop. Use explicit project/dataset flags and no `--replace`. Retain each ID across retries and query before retrying an uncertain write.

For existing drafts, use `npx sanity api` with a JSON mutation body and a revision-guarded patch (`ifRevisionID` using the fetched `_rev`). Use `set` for supplied fields and `unset` only when explicitly needed. For a published review without a draft, create a draft copy with the same base ID, excluding system revision/timestamp fields. A conflict means refetch and reconcile, not blindly replace.

Authenticated mutations can be sent without exposing credentials:

```sh
npx sanity api 'data/mutate/{dataset}' --project-hosted --api-version v2021-06-07 --project-id 0vbjaawm --dataset production --method POST --input /tmp/<unique-directory>/mutation.json --header 'Content-Type: application/json'
```

Read back the exact draft using an authenticated raw query. Verify persisted title, `recommendationStatus`, brewery, style, ABV, package, grade, notes, image reference, alt text, optional values, and draft ID. Check the status against what was intended before step 5 branches on it: an absent value reads as a recommendation, so a partial write would route a non-recommendation into the ranking path while the read-back looks fine. Validate the read-back document as well. Do not report success solely because the write command exited successfully.

### 5. Rank a recommendation before the upload is finished

A rank belongs to a recommendation only, so this step follows `recommendationStatus`.

**Not recommended: skip this step.** `src/lib/content-contract.ts` exempts a non-recommendation from the rank rule, `studio/deskStructure.ts` keeps it out of the orderable list, and the site sorts it by date beneath the ranking. There is nothing to drag and nothing to wait for. Go straight to step 6.

**Recommended: the upload is not finished until the review has a rank.** The CLI cannot safely assign a unique `orderRank`: it is assigned by the Studio's drag-and-drop collection list. After saving and verifying the draft, stop and direct the user to open **N/A beers - Recommended** in the Studio and drag it into its intended position. Resume only once they confirm, then read the draft back and verify `orderRank` is present and unique among recommended N/A beers. If the draft already has an unchanged rank, still verify its uniqueness. An unranked or duplicate-ranked recommendation is an incomplete upload: do not publish it, and do not report it as done. Say plainly that it is waiting on a rank.

### 6. Publish only when explicitly requested

An explicit request to publish authorizes publishing after verification; do not ask redundantly. "Upload" or "add to Studio" alone means draft.

Use the CLI's authenticated API command and the currently documented Sanity document publishing action. Inspect `npx sanity openapi --help` and the relevant Actions API specification before constructing the request; do not guess the payload. Prefer the supported publish action over manually creating a published document and deleting its draft. If the supported action cannot be established, leave the verified draft and report the blocker.

Read back the published base ID and verify its content and draft state. The public site is statically built from published documents only: a draft never appears on the site, and publication and deployment are separate steps. Use `curl` or another terminal HTTP client to check the public `/na-beers/<slug>` page and confirm the actual new content, not just an HTTP 200. No browser. If not verified, say "Published in Studio; public-site update not verified." Do not create hooks, change hosting, or trigger unrelated deployments without authorization.

## Finish

Reply briefly with title, grade if supplied, recommendation status, and verified draft/published status. For a recommendation, say whether it is ranked. Include the document ID and, if the Studio route can be established from repository configuration, a Studio link (never claim it was opened or verified in a browser). Report blockers, unset fields, and any place the label contradicted the supplied notes. Do not commit/push code for a content upload.

## Invocation

- Pi: `/skill:upload-na-beer`
- Claude Code: `/upload-na-beer`

Example input: "Athletic Run Wild IPA, 12 oz can, <0.5%, bought at Lunds. Grade A-. Piney, actually tastes like beer. Photo: /path/can.HEIC. Save as draft."
