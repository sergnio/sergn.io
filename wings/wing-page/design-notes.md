# Wing list design notes ([#83](https://github.com/sergnio/sergn.io/issues/83))

Sergio's feedback on the main list, round 2 (2026-11-14). Rules live in the [wings constitution](https://github.com/sergnio/sergn.io/blob/main/docs/wings-constitution.md).

## Preferences
- A is his favorite direction overall.
- The top three need photos and must clearly stand out, the way A's podium does.
- B's simplicity works on desktop and mobile. It may be his favorite list, and he likes its big rank numbers.
- C's main list is too busy as a whole, but keep two ideas from it:
  - The tier letter stays pinned while you scroll, with its wing count ("S - 4 wings").
  - The top 1-3 are highlighted.
- In every direction, the place name is the big text and the wing type is smaller and secondary. Every row saying "Buffalo" adds nothing.

## Combined direction (now in a-evolved.html, main list only)
- A is the base, with the photo podium for #1-3. #1 has a red rank and a red-tinted border.
- Below the podium, rows use B's ledger style: big serif rank numbers, the place name, the wing type underneath, dotted leaders on desktop, and a large red grade.
- Wings are grouped under C's tier letters with a wing count.
  - Desktop: the letter sits in a left rail and stays pinned while its tier scrolls by.
  - Mobile: the letter and count become a bar pinned to the top of the screen until the next tier pushes it off.
- The Monte Carlo asterisk and footnote stay, and so does the [#90](https://github.com/sergnio/sergn.io/issues/90) placeholder.
- Mobile: #1 gets a full-width card and #2 and #3 sit side by side.

## Round 3 (all screens)
- The title is just "Wings", with no "Ranked".
- The intro says only "Flavor, crunch, juiciness, and size matter."
- Cut filler labels and eyebrows that add nothing ("best first", "the buffalo list"). When in doubt, cut it.
- #1 shows a crown instead of the number, as big as the number was.

## Wing page feedback, round 5 (2026-11-14)
- A: liked overall, and the desktop layout stays as is for now.
  - Mobile: the photo goes above the text block.
  - With no website on file, show no website row at all.
  - Remove the "All 4 wings at Steve O's" button.
  - He doesn't really like A's location card.
  - He likes "Also tried" a lot, so keep it.
- B: he doesn't like the page overall.
  - He likes the little round S- grade badge, which is fun.
  - He dislikes how the photo is cropped and the "everything else I've tried" menu card.
- C: the photo should be a highlight, like on A.
  - He likes C's Steve O's box a lot: the other wings, visits and location together.
- The combined wing page (`wing-combined.html`) uses A's page and photo, C's box in place of A's location card, and B's grade badge.

## Combined wing page, round 7 (2026-11-14)
- The place details move up under the wing name:
  - Line 1: "at Steve O's, 4900 W Broadway Ave, Crystal".
  - Line 2: the round grade badge, visits and rank.
  - Line 3: "Last visit Nov 10, 2026".
- The dark box holds only "Also tried at <place>", with the other wings and nothing about the place.
- A place with only one wing (8 of 11, like Monte Carlo and Northbound) shows no box at all.
- Round 6's single-wing options (`wing-single.html`) were stopped unfinished, since this replaces them.

## Still open
- Should the wing line be hidden when it just says "Buffalo", so only real variations ("Spicy Buffalo", "Big Boy Buffalo") show?
- Should the pinned header sit below a sticky site header if the site ever gets one?
