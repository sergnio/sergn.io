# Testing constitution

> The more your tests resemble the way your software is used, the more confidence they can give you.
>
> [Testing Library, Guiding Principles](https://testing-library.com/docs/guiding-principles)

That is the guiding principle here, and every rule below serves it.

- MUST and MUST NOT are binding. SHOULD is a strong default that a test may depart from when it explains why.
- An exception this file lists needs no approval. Name it in a one-line comment at the call site.
- Breaking any other MUST requires a reason in the PR description, which the reviewer accepts or rejects.

## I. Tests change only when behavior changes

A test describes what a reader, a screen reader, or a crawler gets from the site. Restyling, restructuring markup, renaming a class, or refactoring a component without changing that output MUST NOT break a test.

- Tests MUST NOT find elements by CSS class, id used only for styling, tag nesting, or child order.
- Tests MUST NOT assert class names, raw HTML strings, or the order of strings inside rendered markup.
- If a refactor forces a test edit, the test is the bug. Fix it to follow these rules.

## II. Find elements the way a person does

Tests MUST use the first query in this list that can identify the element:

1. Role with an accessible name: `getByRole('link', { name: 'Coffee' })`. Labelled regions and lists are found this way too.
2. Form label: `getByLabel` in Playwright, `getByLabelText` in React Testing Library.
3. Visible text: `getByText`.
4. Alt text or title: `getByAltText`, `getByTitle`.
5. Test id: `getByTestId`. Name it for what the thing is (`data-testid="wing-rank"`), never for how it looks.

- Tests MUST narrow a search by chaining from a role or text query (`list.getByRole('listitem')`), not with CSS.
- When an element has no role, name, or text a person could find it by, the markup SHOULD be fixed before a test id is added. That is usually an accessibility bug too.

**Machine-read output is the exception.** When serialized output is the contract a crawler, browser, or feed reader consumes, tests MAY parse it directly. That covers `<head>` tags (`meta[name="description"]`, `link[rel="canonical"]`, JSON-LD), served HTML before hydration, `sitemap.xml`, `feed.xml`, `robots.txt`, headers, and redirect rules. Such tests MUST assert the attributes and values that matter, never formatting, attribute order, or unrelated markup.

## III. Assert outcomes, not implementation

- Tests MUST assert what is visible, announced, or served: text, accessible names, link targets, list positions, focus, the URL, and machine-read output.
- Tests MUST NOT reach into the DOM with `querySelector`, `evaluate`, or `getComputedStyle` to check something a query or web-first assertion (`toHaveText`, `toHaveAccessibleName`, `toBeVisible`) can check.
- Tests MUST NOT mock this repo's own modules or the router. Render inside a real router and mock only true boundaries: outbound requests, the clock, and third-party resources.
- Tests MUST NOT assert the text of a query or other source code. Run it, as `src/lib/sanity/queries.test.ts` does with `groq-js`, and assert the result.
- Integration tests MUST render with React Testing Library and query the result with its screen queries, not regex over `renderToStaticMarkup` output.
- Tests MUST work with DOM nodes, never component instances. They MUST NOT read or set a component's props, state, refs, or hook internals.
- Tests MUST interact the way a person does: click, type, and press keys through `@testing-library/user-event` or Playwright. They MUST NOT call event handlers directly or use `fireEvent`.

## IV. Test at the right level

We follow the [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications): static checks at the base, some unit tests, the bulk as integration tests, and a few end to end.

- **Static (`npm run lint`, `npm run typecheck`)**: the base. Catches typos and type errors without a test.
- **Integration (Vitest + React Testing Library)**: the bulk. Render a component with real data and use it like a reader: what it shows for a given document, empty and missing fields, links, and interactions. The simulated browser cannot do layout, so position and size belong in e2e.
- **Unit (Vitest)**: some. Pure logic only, such as ranking, formatting, slugs, the content contract, and GROQ queries.
- **End to end (Playwright, `e2e/`)**: a few. Only what needs a real browser, routing, or the prerendered build: navigation, hydration, layout at a viewport, sticky and scroll behavior, machine-read output, redirects, and security headers.

- New UI behavior MUST get an integration test first. A unit test MUST NOT stand in for one unless the code under test is pure logic with no UI.
- The full set of cases for a behavior MUST live at the lowest level that can prove it. An e2e test MUST NOT repeat cases an integration test can prove without a real browser; it SHOULD add only a few checks that the real parts work together.
- Every feature and bug fix MUST have a positive case and a negative case (the thing appears when it should, and stays away when it should not).
- Shared helpers and custom render wrappers MUST stay small enough to read at a glance, like `e2e/tracker-stub.ts`. No framework inside the framework: no page objects, builders, or DSLs that hide what a test does.

## V. Real data through fixtures

- Browser tests MUST get their content from the committed fixtures that `npm run build:fixtures` uses. A missing scenario MUST be added to the fixtures.
- Unit and integration tests MAY build small inputs inline, including invalid or edge-case documents the fixture build would reject.
- Tests MUST NOT inject, clone, or delete DOM nodes to fake a case. Hydration replaces those nodes, so the test passes locally and fails in CI.
- Tests MUST NOT depend on live Sanity data, the current date, or another test's state.
- Tests MUST NOT skip themselves when the data lacks a case. The fixtures are fixed, so add the case instead.

## VI. Accessibility is behavior

- Every page template MUST pass the axe checks in `e2e/a11y.spec.ts`.
- What a screen reader announces (list positions, headings, grades read as one phrase) MUST be asserted through roles and accessible names, or ARIA snapshots (`toMatchAriaSnapshot`).
- Role-based queries double as accessibility checks: a test that cannot find an element by role has found a bug.

## VII. Layout tests measure, they do not inspect

- When the requirement is visual (order on screen, side by side, pinned at the top), tests MUST locate the elements by role or text, then measure with `boundingBox()`.
- Tests MUST read a computed style only when that style is the requirement itself, such as a transparent bar at rest, and still locate the element semantically.
- **Whole-page audits are the exception.** Checks that sweep every control or box on a page (target size, reflow, text resize) MAY enumerate the DOM and read computed styles, because the elements they must catch are often unnamed. They MUST NOT single out an element by class.
- Tests SHOULD prefer a visual or ARIA snapshot over a stack of style reads once snapshots are adopted.

## VIII. Bugs start with a failing test

- The bug MUST be reproduced at the level closest to how a reader hits it, usually Playwright against the fixture build.
- The fix MUST come with a regression test that fails before it and passes after it.

## IX. Deterministic and quiet

- Tests MUST NOT use fixed sleeps (`waitForTimeout`). Use web-first assertions or `expect.poll`.
- Tests MUST NOT depend on live external services. Requests to the local fixture server are expected.
- Third-party resources MUST be stubbed, including scripts (as `e2e/tracker-stub.ts` does) and remote images.
- A flaky test is a failing test. Fix it or file it the day it is seen; never retry it into passing.

## Running the suites

```sh
npm test            # Vitest unit and integration tests
npm run test:e2e    # Playwright against the fixture build
```

Run both before opening a PR and report the results in it.

## Governance

- This file is the source of truth for how tests are written here. Where a test disagrees with it, the test is wrong.
- Amend it by PR. Bump the version: major for a removed or reversed rule, minor for a new rule, patch for wording.
- Reviews check new and changed tests against these principles.

**Version** 1.0.0 | **Ratified** 2026-11-14
