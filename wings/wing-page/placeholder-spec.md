## Final spec
The classes are new, builder-ready names (`wing-ph`). The colors use the site's existing tokens from `src/styles.css`, so no new tokens are needed.

### Markup (one element per slot)
```html
<div class="wing-ph" role="img" aria-label="No photo yet">
  <svg class="wing-ph__art" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><g transform="rotate(-35 60 60)"><path d="M75 55C63 52 59 36 37 36C19 36 11 48 11 60C11 74 21 84 37 84C57 84 63 68 75 65L96 64.5C96 72 108 72 107 63C104 60.5 104 59.5 107 57C108 48 96 48 96 55.5Z"/></g></svg>
  <span class="wing-ph__caption">No photo yet</span>
</div>
```
- The `d` path is the drumette and its bone knuckle, drawn in a 120 x 120 box and tilted -35 degrees around the center.
- The slot owns the size and corner radius; the placeholder fills it.
- Add `wing-ph--hero` on the wing page slot, `wing-ph--thumb` on "Also tried" thumbnails, and `wing-ph--thumb wing-ph--tiny` at 32px. List cards use the base class only.
- Don't also give it a class that sets its own `background` or `display` (such as the mockup's `.top__img` or `.hero__img`). They override the fade and the centering, so put sizing on a parent selector instead (`.top .wing-ph`, `.hero .wing-ph`, `.sib .wing-ph`).

### CSS
```css
.wing-ph {
  --wing-ph-ink: var(--wash-ink);
  --wing-ph-stroke: 2.25px;
  --wing-ph-size: 54%;
  container-type: inline-size;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--wing-ph-ink);
  background: linear-gradient(160deg, color-mix(in srgb, var(--wash) 90%, var(--paper)), var(--paper) 85%);
  border: 1px dashed var(--placeholder);
}
.wing-ph__art {
  width: var(--wing-ph-size);
  height: auto;
  aspect-ratio: 1;
  overflow: visible;
  fill: none;
  stroke: currentColor;
  stroke-width: var(--wing-ph-stroke);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: calc(var(--wing-ph-stroke) * 2.4) calc(var(--wing-ph-stroke) * 2.2);
}
.wing-ph__art * { vector-effect: non-scaling-stroke; }
.wing-ph__caption {
  display: none;
  position: absolute;
  bottom: 9%;
  left: 0;
  right: 0;
  margin: 0;
  color: var(--wing-ph-ink);
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
}
@container (min-width: 15rem) {
  .wing-ph__caption { display: block; }
  .wing-ph__art { transform: translateY(-6%); }
}
.wing-ph--hero { --wing-ph-stroke: 3px; --wing-ph-size: 42%; }
.wing-ph--thumb { --wing-ph-stroke: 1.5px; --wing-ph-size: 92%; }
.wing-ph--tiny { --wing-ph-stroke: 1.25px; }
```

### Values in plain numbers
- Background (every size): `linear-gradient(160deg, ...)` from `color-mix(in srgb, var(--wash) 90%, var(--paper))` = about rgb(224 219 222) at 0%, to `var(--paper)` = hsl(36 16% 94%) = rgb(242 240 237) at 85%, then flat paper.
- Line and label color: `var(--wash-ink)` = hsl(321 14% 32%) = rgb(93 70 85).
- Border: 1px dashed `var(--placeholder)` = hsl(323 15% 76%) = rgb(203 185 196).
- Dash pattern: dash = 2.4 x line width, gap = 2.2 x line width, round caps and joins. The line keeps its width at any size (`vector-effect: non-scaling-stroke`).
- Label: "No photo yet", DM Mono 400, 0.7rem (11.2px), letter-spacing 0.06em, uppercase, centered, 9% up from the bottom. It shows only when the slot is at least 15rem (240px) wide, and then the drawing moves up 6%.

### Per size
| Slot | Real size | Class | Line | Dash / gap | Drawing width | Label | Radius |
|---|---|---|---|---|---|---|---|
| List card, desktop | 325 x 244 | `wing-ph` | 2.25px | 5.4 / 4.95px | 54% | shows | 0 (card clips it) |
| List card, mobile | 170 x 128 | `wing-ph` | 2.25px | 5.4 / 4.95px | 54% | hidden | 0 (card clips it) |
| Wing page slot, desktop | 578 x 433 | `wing-ph wing-ph--hero` | 3px | 7.2 / 6.6px | 42% | shows | 0.25rem |
| Wing page slot, mobile | 358 x 269 | `wing-ph wing-ph--hero` | 3px | 7.2 / 6.6px | 42% | shows | 0.25rem |
| Also tried card (real slot) | 60 x 60 | `wing-ph wing-ph--thumb` | 1.5px | 3.6 / 3.3px | 92% | hidden | 0.15rem |
| Thumbnail, 52px | 52 x 52 | `wing-ph wing-ph--thumb` | 1.5px | 3.6 / 3.3px | 92% | hidden | 0.15rem |
| Tiny, 32px | 32 x 32 | `wing-ph wing-ph--thumb wing-ph--tiny` | 1.25px | 3 / 2.75px | 92% | hidden | 0.15rem |

- Real sizes come from the mockups: the 72rem page, the three-up list on desktop and two-up under 42rem, and the current wing page's 3.75rem "Also tried" thumbnail.
- Desktop sizes were measured in the browser at 1280px. Mobile sizes are worked out from the layout rules (Chrome here can't shrink below 500px) and match the 390px frames.
- On mobile (under 56rem) the wing page slot sits above the title, and the "Also tried" cards stack; on desktop they sit three across.

