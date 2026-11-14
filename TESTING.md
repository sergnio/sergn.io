# Testing constitution

The rules every test in this repo follows. MUST and MUST NOT are binding; a PR that breaks one says why in its description.

## I. Tests change only when behavior changes

A test describes what a reader, a screen reader, or a crawler gets from the site. Restyling, restructuring markup, renaming a class, or refactoring a component without changing that output MUST NOT break a test.

- Tests MUST NOT find elements by CSS class, id used only for styling, tag nesting, or child order.
- Tests MUST NOT assert class names, raw HTML strings, or the order of strings inside rendered markup.
- If a refactor forces a test edit, treat the test as the bug and fix it to follow these rules.

## II. Find elements the way a person does

Use the first query that works, in this order:

1. Role with an accessible name: `getByRole('link', { name: 'Coffee' })`.
2. Label: `getByLabel`, for form fields and labelled regions.
3. Visible text: `getByText`, scoped inside a role when the text repeats.
4. Alt text or title: `getByAltText`, `getByTitle`.
5. Test id: `getByTestId`, only when nothing above can identify the element. Name it for what the thing is (`data-testid="wing-rank"`), never for how it looks.

- Narrow a search by chaining from a role (`list.getByRole('listitem')`), not with CSS.
- If an element has no role, name, or text a person could find it by, fix the markup before reaching for a test id. That is usually an accessibility bug too.
- Machine-read output is the one exception: `<head>` tags (`meta[name="description"]`, `link[rel="canonical"]`, JSON-LD) MAY be found by their attributes, because those attributes are the contract crawlers read.

## III. Assert outcomes, not implementation

- Assert what is visible or announced: text, accessible names, link targets, list positions, focus, and the URL.
- Tests MUST NOT reach into the DOM with `querySelector`, `evaluate`, or `getComputedStyle` to check something a query or web-first assertion (`toHaveText`, `toHaveAccessibleName`, `toBeVisible`) can check.
- Tests MUST NOT mock this repo's own modules or the router. Render inside a real router and mock only true boundaries: the network, the clock, and third-party scripts.
- Tests MUST NOT assert the text of a query or other source code. Run it, as `src/lib/sanity/queries.test.ts` does with `groq-js`, and assert the result.
- Component tests MUST render with React Testing Library and query the result with its screen queries, not regex over `renderToStaticMarkup` output.

## IV. Test at the right level

- **Unit (Vitest, `src/lib`)**: pure logic such as ranking, formatting, slugs, the content contract, and GROQ queries. Fast and exhaustive.
- **Component (Vitest + React Testing Library)**: what a component renders for a given document, including empty and missing fields.
- **End to end (Playwright, `e2e/`)**: anything that needs a real browser or the real build: routing, navigation, hydration, layout at a viewport, sticky and scroll behavior, `<head>` output, redirects, and security headers.
- Each behavior MUST be covered once at the lowest level that can prove it. Do not repeat a unit check in e2e.
- Every feature and bug fix MUST have a positive case and a negative case (the thing appears when it should, and stays away when it should not).

## V. Real data through fixtures

- Test data MUST come from the committed fixtures that `npm run build:fixtures` uses.
- Tests MUST NOT inject, clone, or delete DOM nodes to fake a case. Hydration replaces those nodes, so the test passes locally and fails in CI. Add the case to the fixtures instead.
- Tests MUST NOT depend on live Sanity data, the current date, or another test's state.
- Tests MUST NOT skip themselves when the data lacks a case. The fixtures are fixed, so add the case instead.

## VI. Accessibility is behavior

- Every page template MUST pass the axe checks in `e2e/a11y.spec.ts`.
- What a screen reader announces (list positions, headings, grades read as one phrase) MUST be asserted through roles and accessible names, or ARIA snapshots (`toMatchAriaSnapshot`).
- Role-based queries double as accessibility checks: a test that cannot find an element by role has found a bug.

## VII. Layout tests measure, they do not inspect

- When the requirement is visual (order on screen, side by side, pinned at the top), locate the elements by role or text, then measure with `boundingBox()`.
- Read a computed style only when that style is the requirement itself, such as a transparent bar at rest. Still locate the element semantically.
- Prefer a visual or ARIA snapshot over a stack of style reads once snapshots are adopted.

## VIII. Bugs start with a failing test

- Reproduce the bug at the level closest to how a reader hits it, usually Playwright against the fixture build.
- Add a regression test that fails before the fix and passes after it.

## IX. Deterministic and quiet

- Tests MUST NOT use fixed sleeps (`waitForTimeout`). Use web-first assertions or `expect.poll`.
- Tests MUST NOT call the real network. Stub third-party scripts as `e2e/tracker-stub.ts` does.
- A flaky test is a failing test. Fix it or file it the day it is seen; never retry it into passing.

## Running the suites

```sh
npm test            # Vitest unit and component tests
npm run test:e2e    # Playwright against the fixture build
```

Run both before opening a PR and report the results in it.

## Governance

- This file is the source of truth for how tests are written here. Where a test disagrees with it, the test is wrong.
- Amend it by PR. Bump the version: major for a removed or reversed rule, minor for a new rule, patch for wording.
- Reviews check new and changed tests against these principles.

**Version** 1.0.0 | **Ratified** 2026-11-14
