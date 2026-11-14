# Brand guide

How sergn.io looks and why. The tokens live at the top of `src/styles.css`;
colors come from `docs/color-palette.md`. When a rule here and the stylesheet
disagree, fix whichever is wrong rather than adding an exception.

## Typefaces

Three families, all self-hosted (see "Fonts" in `README.md`). No other family
ships, and no page loads a font from a third party.

| Token     | Family     | Weights    | Used for                                                                                   |
| --------- | ---------- | ---------- | ------------------------------------------------------------------------------------------ |
| `--serif` | Newsreader | 400, 650   | Headlines (650) and everything you read: leads, body, card summaries of posts, pull quotes |
| `--sans`  | Onest      | 400 to 600 | Interface text: buttons, place and maker names, captions, fact values, tags, sub-heads     |
| `--mono`  | DM Mono    | 400, 500   | Data and chrome: wordmark, nav, eyebrows, counts, dates, meta lines, skip link             |

- Sans weights: 400 for text, 500 for nav and tags, 600 for buttons. Never 700 or more.
- Mono weights: 400 for meta, 500 for the wordmark and eyebrows.
- Headlines use `--weight-headline` (650); grade letters use `--weight-grade` (600).

## Type scale

| Role     | Token             | Family | Size                            | Weight  | Line height | Tracking |
| -------- | ----------------- | ------ | ------------------------------- | ------- | ----------- | -------- |
| Display  | `--text-display`  | Serif  | `clamp(2.75rem, 9vw, 6.5rem)`   | 650     | 0.92        | -0.035em |
| H2       | `--text-h2`       | Serif  | `clamp(2rem, 5vw, 3.3rem)`      | 650     | 0.98        | -0.035em |
| H3       | `--text-h3`       | Serif  | 1.55rem                         | 650     | 1.02        | -0.035em |
| UI title | `--text-ui-title` | Sans   | 1.125rem                        | 600     | 1.25        | -0.01em  |
| Lead     | `--text-lead`     | Serif  | `clamp(1.15rem, 3.5vw, 1.4rem)` | 400     | 1.45        | 0        |
| UI       | `--text-ui`       | Sans   | 0.9rem                          | 400/500 | 1.45        | 0        |
| Small    | `--text-small`    | Sans   | 0.85rem                         | 400     | 1.4         | 0        |
| Eyebrow  | `--text-eyebrow`  | Mono   | 0.72rem, uppercase              | 500     | 1.2 to 1.4  | +0.06em  |
| Meta     | -                 | Mono   | 0.62 to 0.72rem                 | 400     | 1.3         | -0.02em  |

## Color roles

Every rule reaches for a semantic token, never a ramp step.

| Token           | Step        | Role                                                   |
| --------------- | ----------- | ------------------------------------------------------ |
| `--ink`         | Mauve 900   | Body text and links (links are ink plus an underline)  |
| `--brand`       | Mauve 900   | Headlines, wordmark, the dark end of the no-photo fill |
| `--accent`      | Mauve 700   | Ranks, "see all" links, hover                          |
| `--highlight`   | Red 600     | Grade letters and the "not recommended" warning        |
| `--muted`       | Neutral 600 | Secondary text on paper and card only                  |
| `--wash-ink`    | Mauve 700   | Text on the mauve wash (side notes, recipes)           |
| `--focus`       | Red 700     | Focus ring                                             |
| `--first-place` | Gold 700    | The #1 wing's border, and nothing else                 |

## Contrast

Measured against WCAG 2.2. Body text needs 4.5:1, borders and large text 3:1.

| Pair                       | Ratio           |
| -------------------------- | --------------- |
| Ink on paper               | 12.70:1         |
| Accent on paper            | 7.47:1          |
| Highlight on paper         | 6.24:1          |
| Muted on paper             | 5.66:1          |
| Muted on the mauve wash    | 4.58:1          |
| Gold 700 on card / paper   | 5.13 / 4.98:1   |
| Focus ring on paper        | 8.27:1          |
| White on the no-photo fill | at least 6.31:1 |

## Rules

- Grades use the one red, `--highlight`; only the #1 wing gets the gold border.
- On the mauve wash, set text in `--wash-ink`, never `--muted`.
- The no-photo fill runs from brand to Mauve 600 so its label can be solid white.
- One shadow, `--shadow-card`, a hard offset with no blur.
- Links stay ink with an underline; there is no link blue.

## Spacing and radius

| Token       | Value   |     | Token           | Value                            |
| ----------- | ------- | --- | --------------- | -------------------------------- |
| `--space-1` | 0.25rem |     | `--radius-xs`   | 0.15rem                          |
| `--space-2` | 0.5rem  |     | `--radius-sm`   | 0.2rem                           |
| `--space-3` | 0.75rem |     | `--radius-md`   | 0.25rem (cards, with the shadow) |
| `--space-4` | 1rem    |     | `--radius-pill` | 10rem (tags)                     |
| `--space-5` | 1.5rem  |     |                 |                                  |
| `--space-6` | 2rem    |     |                 |                                  |
| `--space-7` | 3rem    |     |                 |                                  |
| `--space-8` | 4rem    |     |                 |                                  |
| `--space-9` | 6rem    |     |                 |                                  |

The page is `min(100% - 2rem, 72rem)` wide and reading columns stop near 41rem.
