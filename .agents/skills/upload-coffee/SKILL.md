---
name: upload-coffee
description: Add a coffee to Sergio's Sanity Studio using the Sanity CLI from a bag photo, rough notes, a grade, and brew recipes. Use when asked to upload coffee, add a coffee to Studio, or save/publish a bag on sergn.io. No browser involvement. Defaults to a draft; publishes only when explicitly requested.
---

# Upload coffee

Turn a bag photo, rough notes, and brew settings into a complete `coffee` document through the authenticated Sanity CLI. Do not open, automate, or depend on a browser. Do not build reusable scripts or new credential infrastructure for a content upload.

## Context and access

- Resolve the repository root as `../../..` relative to this skill directory (resolve symlinks first). Run Sanity commands from its `studio/` directory.
- Before authoring, read `AGENTS.md`, the hosting/content guidance in `README.md`, `studio/sanity.cli.ts`, `studio/schemaTypes/coffee.ts`, `studio/schemaTypes/shared.ts`, and `src/lib/content-contract.ts`. These are authoritative if configuration or fields change.
- Read `~/.agents/VOICE.md` before editing prose in Sergio's voice. Preserve his opinions and phrasing; lightly clean up notes, never invent tasting experiences.
- Confirm project and dataset from `studio/sanity.cli.ts`. Use explicit `--project-id` and `--dataset` flags on dataset commands. Current values are `0vbjaawm` and `production`.
- Use `npx sanity --help` and per-command `--help` for the installed CLI syntax. Use its existing login, not a Studio browser session. Check authentication with `npx sanity api users/me` and project access with `npx sanity users list`.
- If authentication is absent or expired, stop and ask the user to authenticate independently with `cd studio && npx sanity login`, then resume when ready. Do not launch login or any browser yourself. Never request credentials in chat, read/extract stored tokens, or put credentials in commands, temporary files, the repository, or `.env.local`.

## The bag is the source of truth

Most of a coffee document is printed on the bag. Read it off the photo rather than asking or guessing:

- `title` is how Sergio refers to the coffee, usually the roaster's name for the blend or single origin. `roaster` is the company that roasted it, which is a separate field and often not part of the name.
- `bagSize` comes from the stated net weight and must use `g` or `oz`, the only units the schema accepts for coffee. Never infer weight from the apparent size of the bag.
- `origin` is where the beans were grown. `boughtFrom` is where Sergio got the bag, which is frequently a local shop rather than the roaster.
- `roastDate` is printed as "roasted on" and is not the purchase date. A "best by" date is neither; do not convert one into the other.
- `tastingNotes` on the bag are the roaster's claims. Keep them in `tastingNotes` as the roaster's list and keep Sergio's own impressions in `notes`; do not merge the two.

If the bag contradicts something Sergio supplied, trust the bag and say so. Do not carry forward a price or weight that cannot be sourced.

## Collect and map content

Accept conversational input with an attached image or local image path. No template is required. Extract everything already supplied, then ask one compact question covering only missing required information or genuine ambiguity.

- Required of a recommendation: title, unique URL slug, `boughtFrom`, `bagSize` (amount and unit), hero image with alt text, and at least one brew recipe.
- Required of a non-recommendation: title, unique URL slug, and the notes saying why it is not worth buying again. Every other field stays optional, so fill in what is known and leave the rest unset rather than inventing a fuller record.
- Recommendation status: settle it from Sergio's notes, and ask when they do not. Write `recommendationStatus` explicitly on every draft instead of leaning on the schema default; it decides which fields the contract demands, which Studio list the coffee appears in, and whether it is ranked at all.
- Derive a concise title from the roaster's name for the coffee. Generate a lowercase, hyphen-separated slug of at most 96 characters; ask only if ambiguous. Check uniqueness across both drafts and published coffees.
- Grade: optional, one of `S+`, `S`, `S-`, `A+`, `A`, `A-`, `B+`, `B`, `B-`, `C`, `D`, `F`. Do not convert a score out of five or any other scale without clarification. An unbrewed bag has no grade; say so in the notes rather than inventing one.
- `isCrowned` marks the single best entry in the category. Only an `S+` can wear it, and only one per category, so never set it unless Sergio says so outright. The Studio rejects a second crown, and the page prints the crown in place of the letter.
- Optional: roaster, origin, purchaseUrl, purchasedAt, price, roastDate, tastingNotes, notes, photo caption/credit, and publication date. Leave unknown optional fields unset. Store a supplied USD price as integer cents; clarify ambiguous currency.
- Inspect the image locally before writing factual alt text (5-180 characters). Describe the visible bag and setting, not the flavor or the filename.
- Strip EXIF before uploading a photo. Phone photos can carry a GPS IFD, and the asset lands on a public CDN. `sips` preserves EXIF, so it is not sufficient on its own; drop the APP1/APP2 segments explicitly and verify they are gone.
- Convert unsupported images locally without changing the original. On macOS, for example: `sips -s format jpeg -Z 2000 /path/photo.HEIC --out /tmp/coffee-photo.jpg`. Verify the file type and inspect the converted image. Use a unique temporary directory to avoid collisions.
- If an attachment has no accessible local file, ask for a usable file/path. For several photos, ask which is the hero unless specified.

## Brew recipes are the part only Sergio knows

A recommendation owes at least one recipe, and `validateBrewRecipe` in `studio/schemaTypes/coffee.ts` is strict about its shape. Ask for the settings rather than deriving plausible ones; a recipe nobody actually brewed is worse than no recipe.

- `method` must match the schema list exactly: `Moka Pot`, `Filter`, `V60`, `Espresso`, `AeroPress`, `French Press`, or `Other`. Choosing `Other` also requires `methodOther`.
- `grinder` needs `name` and `system`. The `system` decides what else is required: `manual-number-rotations` requires both `number` and `rotations`, `niche-setting` requires `setting`, and `other` requires a practical `notes` string. Ask which grinder was used rather than assuming the one on a previous coffee.
- Everything else on a recipe is optional: `label`, `doseGrams`, `waterGrams`, `yieldGrams`, `waterTemperatureC`, `brewTimeSeconds`, `ratio`, `steps`, `notes`. All the numbers must be positive, and `steps` entries must be unique.
- Several recipes for one bag are normal. Give each a `label` when there is more than one, and a unique `_key`.

## CLI workflow

### 1. Check for existing content

Query matching coffees by roaster/title before uploading assets or creating documents. Use an authenticated query with API version `2021-06-07` for raw draft and published visibility:

```sh
npx sanity documents query '*[_type == "coffee" && (roaster match "*Dogwood*" || title match "*Dogwood*")]' --api-version 2021-06-07 --project-id 0vbjaawm --dataset production
```

Substitute the actual search terms, constructing queries safely instead of interpolating unescaped user text. If a likely duplicate exists, ask whether to finish/update it or create a distinct bag. Never overwrite an existing coffee without authorization. Query slug conflicts too, excluding both IDs of the document being edited.

### 2. Upload the photo

Use `npx sanity assets upload --help`, then upload the local file with explicit project/dataset flags:

```sh
npx sanity assets upload --file /tmp/<unique-directory>/coffee.jpg --type image --filename coffee-<slug>.jpg --content-type image/jpeg --project-id 0vbjaawm --dataset production
```

It prints JSON whose asset ID is nested at `.asset._id`, not at the top level. Save the output in a temporary directory and use that actual `_id` as the image reference. Do not guess asset IDs or URLs. Use a neutral filename rather than exposing the original camera filename. Reuse a verified asset from an earlier successful upload when resuming instead of uploading again.

A non-recommendation with no photo skips this step. Do not ask for one twice or hold the upload waiting on it; the detail page renders without a hero image.

### 3. Prepare and validate the draft

Prepare JSON in a unique temporary directory outside the repository. For a new coffee, generate a UUID and set `_id` to `drafts.<uuid>`, never the bare UUID. Use the exact schema shape:

- `_type: "coffee"`.
- `recommendationStatus: "recommended"` or `"notRecommended"`, always set explicitly.
- `slug: { _type: "slug", current: "..." }`.
- `bagSize: { amount: <positive number>, unit: "g" | "oz" }`.
- `heroImage: { _type: "imageWithAlt", image: { _type: "image", asset: { _type: "reference", _ref: "<uploaded asset ID>" } }, alt: "..." }`.
- `brewRecipes`: an array of objects with unique `_key` values, each satisfying `validateBrewRecipe`. A recommendation owes at least one. On a non-recommendation the array, the bag size, `boughtFrom` and the photo are all optional: include what the user actually supplied and omit the rest entirely. Never fabricate a grind setting, a dose, or a photo to fill the shape out.
- `notes`: Portable Text blocks with unique `_key` values, `_type: "block"`, `style: "normal"`, `markDefs: []`, and `children` containing `_type: "span"`, `_key`, `text`, and `marks: []`.
- `tastingNotes`: an array of unique strings.
- `price: { amountCents: <integer>, currency: "USD" }`, or omit entirely. Do not create a partial money object.

For an authorized update, fetch the latest draft (or published document if no draft exists), preserve unrelated fields, and apply only the requested changes. Do not change an existing published slug without permission. Never delete or unpublish a published document to save a draft.

CLI/API writes bypass Studio form validation. Before writing, validate the candidate against the local schema:

```sh
npx sanity documents validate --file /tmp/<unique-directory>/candidate.ndjson --yes --format json --project-id 0vbjaawm --dataset production
```

An empty `[]` means no errors. Confirm the validator is actually resolving the schema rather than passing everything, for example by checking that a deliberately bad brew recipe is rejected. Inspect validation output, not just the exit status. Resolve errors from known facts, ask if information is missing, and check the content contract too. Never claim a complete draft or publish content with unresolved required-field errors.

Do not pass `--level error`. A `requiredForRecommendations` rule on an object field, including `heroImage`, reports at warning level, so `--level error` hides a missing hero image entirely and reports `[]` on a document that is not finished. Read the warnings and treat a missing hero image on a recommendation as a blocker, not a suggestion.

### 4. Save and read back

`npx sanity documents create` parses one JSON5 document per invocation and rejects multi-line NDJSON, so write one file per coffee and loop. Use explicit project/dataset flags and no `--replace`. Retain each ID across retries and query before retrying an uncertain write.

For existing drafts, use `npx sanity api` with a JSON mutation body and a revision-guarded patch (`ifRevisionID` using the fetched `_rev`). Use `set` for supplied fields and `unset` only when explicitly needed. For a published coffee without a draft, create a draft copy with the same base ID, excluding system revision/timestamp fields. A conflict means refetch and reconcile, not blindly replace.

Authenticated mutations can be sent without exposing credentials:

```sh
npx sanity api 'data/mutate/{dataset}' --project-hosted --api-version v2021-06-07 --project-id 0vbjaawm --dataset production --method POST --input /tmp/<unique-directory>/mutation.json --header 'Content-Type: application/json'
```

Read back the exact draft using an authenticated raw query. Verify persisted title, `recommendationStatus`, boughtFrom, bag size, roaster, origin, grade, tasting notes, every brew recipe, notes, image reference, alt text, optional values, and draft ID. Check the status against what was intended before step 5 branches on it: an absent value reads as a recommendation, so a partial write would route a non-recommendation into the ranking path while the read-back looks fine. Validate the read-back document as well. Do not report success solely because the write command exited successfully.

### 5. Rank a recommendation before the upload is finished

A rank belongs to a recommendation only, so this step follows `recommendationStatus`.

**Not recommended: skip this step.** `src/lib/content-contract.ts` exempts a non-recommendation from the rank rule, `studio/deskStructure.ts` keeps it out of the orderable list, and the site sorts it by date beneath the ranking. There is nothing to drag and nothing to wait for. Go straight to step 6.

**Recommended: the upload is not finished until the coffee has a rank.** The CLI cannot safely assign a unique `orderRank`: it is assigned by the Studio's drag-and-drop collection list. After saving and verifying the draft, stop and direct the user to open **Coffee - Recommended** in the Studio and drag it into its intended position. Resume only once they confirm, then read the draft back and verify `orderRank` is present and unique among recommended coffees. If the draft already has an unchanged rank, still verify its uniqueness. An unranked or duplicate-ranked recommendation is an incomplete upload: do not publish it, and do not report it as done. Say plainly that it is waiting on a rank.

### 6. Publish only when explicitly requested

An explicit request to publish authorizes publishing after verification; do not ask redundantly. "Upload" or "add to Studio" alone means draft.

Use the CLI's authenticated API command and the currently documented Sanity document publishing action. Inspect `npx sanity openapi --help` and the relevant Actions API specification before constructing the request; do not guess the payload. Prefer the supported publish action over manually creating a published document and deleting its draft. If the supported action cannot be established, leave the verified draft and report the blocker.

Read back the published base ID and verify its content and draft state. The public site is statically built from published documents only: a draft never appears on the site, and publication and deployment are separate steps. Use `curl` or another terminal HTTP client to check the public `/coffee/<slug>` page and confirm the actual new content, not just an HTTP 200. No browser. If not verified, say "Published in Studio; public-site update not verified." Do not create hooks, change hosting, or trigger unrelated deployments without authorization.

## Finish

Reply briefly with title, grade if supplied, recommendation status, and verified draft/published status. For a recommendation, say whether it is ranked. Include the document ID and, if the Studio route can be established from repository configuration, a Studio link (never claim it was opened or verified in a browser). Report blockers, unset fields, and any place the bag contradicted the supplied notes. Do not commit/push code for a content upload.

## Invocation

- Pi: `/skill:upload-coffee`
- Claude Code: `/upload-coffee`

Example input: "Dogwood Neon Owl, 12 oz, bought at Kowalski's. Grade A-. Chocolatey, low acid. V60 on the Comandante, 22 clicks, 20g in 320g out, 94C, 3 minutes. Photo: /path/bag.HEIC. Save as draft."
