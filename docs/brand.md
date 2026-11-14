# Brand guide

How sergn.io looks and why. The tokens live at the top of `src/styles.css`;
colors come from `docs/color-palette.md`. When a rule here and the stylesheet
disagree, fix whichever is wrong rather than adding an exception.

## Principles

- Reading comes first: prose is a calm serif at a comfortable size and measure.
- Every grade is content, so it is set in the serif and the one red.
- Interface text is a quiet sans; data and chrome are mono. No role borrows another's face.
- Nothing decorative is allowed to cost contrast.

## Typefaces

Three families, all self-hosted (see "Fonts" in `README.md`). No other family
ships, and no page loads a font from a third party.

| Token     | Family     | Weights       | Used for                                                                                         |
| --------- | ---------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `--serif` | Newsreader | 400, 600, 650 | Headlines (650), grades (600), and everything you read: leads, body, post excerpts, quotes       |
| `--sans`  | Onest      | 400 to 600    | Interface text: buttons, place and maker names, captions, fact values, side notes, forms, tables |
| `--mono`  | DM Mono    | 400, 500      | Data and chrome: wordmark, nav, eyebrows, counts, dates, meta lines, skip link                   |

- Sans weights: 400 for text, 500 for tags and place names, 600 for buttons and small headings. Never 700 or more.
- Mono weights: 400 for meta and nav links, 500 for the wordmark, eyebrows and the current nav link. DM Mono ships only these two, and font synthesis is off, so never ask for more.
- Headlines use `--weight-headline` (650); grade letters use `--weight-grade` (600).

### Licenses

All three families are under the SIL Open Font License 1.1. Each family's full
license text, with its copyright line, lives beside the font files in
`public/fonts/` and is served next to them on the site:
[`/fonts/LICENSE-newsreader.txt`](../public/fonts/LICENSE-newsreader.txt),
[`/fonts/LICENSE-onest.txt`](../public/fonts/LICENSE-onest.txt) and
[`/fonts/LICENSE-dm-mono.txt`](../public/fonts/LICENSE-dm-mono.txt).
`scripts/generate-fonts.mjs` keeps them and refuses to run without one per
family, and the build fails if any shipped family lacks its license.

## Type scale

| Role     | Token             | Family | Size                            | Weight  | Line height | Tracking |
| -------- | ----------------- | ------ | ------------------------------- | ------- | ----------- | -------- |
| Display  | `--text-display`  | Serif  | `clamp(2.75rem, 9vw, 6.5rem)`   | 650     | 0.92        | -0.035em |
| H2       | `--text-h2`       | Serif  | `clamp(2rem, 5vw, 3.3rem)`      | 650     | 0.98        | -0.035em |
| H3       | `--text-h3`       | Serif  | 1.55rem                         | 650     | 1.02        | -0.035em |
| Grade    | -                 | Serif  | 1.6 to 2.6rem                   | 600     | 1           | -0.02em  |
| UI title | `--text-ui-title` | Sans   | 1.125rem                        | 600     | 1.25        | -0.01em  |
| Lead     | `--text-lead`     | Serif  | `clamp(1.15rem, 3.5vw, 1.4rem)` | 400     | 1.45        | 0        |
| Body     | `--text-body`     | Serif  | 1.125rem                        | 400     | 1.6         | 0        |
| UI       | `--text-ui`       | Sans   | 0.9 to 1rem                     | 400/500 | 1.45        | 0        |
| Small    | `--text-small`    | Sans   | 0.85rem                         | 400     | 1.4         | 0        |
| Eyebrow  | `--text-eyebrow`  | Mono   | 0.72rem, uppercase, red         | 500     | 1.2         | +0.06em  |
| Nav      | -                 | Mono   | 0.85rem, gap 0.7rem             | 400/500 | -           | 0        |
| Meta     | -                 | Mono   | 0.62 to 0.72rem                 | 400     | 1.3         | -0.02em  |

A grade that sits inside a meta line or a sibling chip keeps the serif and 600
but takes that line's size, so the line does not jump.

## Color roles

Every rule reaches for a semantic token, never a ramp step.

| Token           | Step        | Role                                                       |
| --------------- | ----------- | ---------------------------------------------------------- |
| `--ink`         | Mauve 900   | Body text and links (links are ink plus an underline)      |
| `--brand`       | Mauve 900   | Headlines, wordmark, the dark end of the no-photo fill     |
| `--accent`      | Mauve 700   | Ranks, "see all" links, the current nav link, hover        |
| `--highlight`   | Red 600     | Grade letters, eyebrows, and the "not recommended" warning |
| `--muted`       | Neutral 600 | Secondary text on paper and card only                      |
| `--wash-ink`    | Mauve 700   | Text on the mauve wash (side notes, recipes)               |
| `--focus`       | Red 700     | Focus ring                                                 |
| `--first-place` | Gold 700    | The #1 wing's border, and nothing else                     |

## Contrast

Measured against WCAG 2.2. Text needs 4.5:1; borders, focus rings and large
text need 3:1. Hairline dividers (`--line`) are decorative and have no minimum,
so they are never the only edge of a button or field.

| Foreground             | Paper   | Card    | Mauve wash |
| ---------------------- | ------- | ------- | ---------- |
| Ink                    | 12.70:1 | 12.32:1 | 10.29:1    |
| Accent                 | 7.47:1  | 7.24:1  | 6.05:1     |
| Highlight              | 6.24:1  | 6.05:1  | 5.06:1     |
| Muted                  | 5.66:1  | 5.49:1  | 4.58:1     |
| Focus ring             | 8.27:1  | 8.02:1  | 6.71:1     |
| Gold 700 (border only) | 5.13:1  | 4.98:1  | not used   |

White on the blog's no-photo fill is at least 6.31:1, measured at its lightest end,
Mauve 600. The wings drumette's Mauve 700 caption is at least 6.18:1 on its pale fill.
`e2e/brand.spec.ts` guards both no-photo labels and the gold border.

## Rules

Do:

- Set every grade in the serif at 600 and in `--highlight`; give only the #1 wing the gold border.
- Set side notes in the sans on the mauve wash, in `--wash-ink`.
- Use the one shadow, `--shadow-card`: a hard offset with no blur, on cards and the open mobile menu.
- Keep links ink with an underline.
- Let full-bleed images run square (radius 0); round everything else with a radius token.

Don't:

- Set prose in mono, or a grade in mono or sans.
- Use `--muted` on the mauve wash, or `--tint`, `--placeholder` or gold as text.
- Add a color outside `docs/color-palette.md`, including any link blue.
- Ask DM Mono for 600 or 700, or Onest for 700 or more.

## Spacing and radius

| Token       | Value   |     | Token           | Value                                 |
| ----------- | ------- | --- | --------------- | ------------------------------------- |
| `--space-1` | 0.25rem |     | `--radius-xs`   | 0.15rem (inline code)                 |
| `--space-2` | 0.5rem  |     | `--radius-sm`   | 0.2rem (buttons, callouts, skip link) |
| `--space-3` | 0.75rem |     | `--radius-md`   | 0.25rem (cards, with the shadow)      |
| `--space-4` | 1rem    |     | `--radius-pill` | 10rem (tags)                          |
| `--space-5` | 1.5rem  |     |                 |                                       |
| `--space-6` | 2rem    |     |                 |                                       |
| `--space-7` | 3rem    |     |                 |                                       |
| `--space-8` | 4rem    |     |                 |                                       |
| `--space-9` | 6rem    |     |                 |                                       |

The page is `min(100% - 2rem, 72rem)` wide and reading columns stop near 41rem.
