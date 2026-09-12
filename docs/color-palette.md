# Color palette reference

Four ramps - Mauve, Blue, Red, Neutral - each with ten steps from `50` (lightest)
to `900` (darkest). This is a reference sheet transcribed from the palette design;
it is not yet wired into `src/styles.css`, which still uses the evergreen/gold
tokens. Use these values when a design calls for a palette step by name
(e.g. "Blue 900" -> `hsl(206 40% 17%)`).

Values are given in HSL, which makes the ramps easy to read - within a ramp the hue
and saturation stay roughly fixed and only the lightness moves. The hex column is the
source of truth: HSL channels are rounded to whole numbers, so converting back can
land a point or two off.

## Mauve

| Step | HSL                | Hex       |
| ---- | ------------------ | --------- |
| 50   | `hsl(300 7% 97%)`  | `#F8F7F8` |
| 100  | `hsl(320 9% 93%)`  | `#EFECEE` |
| 200  | `hsl(320 8% 86%)`  | `#DED8DC` |
| 300  | `hsl(323 15% 76%)` | `#CBB9C4` |
| 400  | `hsl(321 14% 64%)` | `#B096A7` |
| 500  | `hsl(321 15% 50%)` | `#926D85` |
| 600  | `hsl(322 15% 40%)` | `#75576A` |
| 700  | `hsl(321 14% 32%)` | `#5D4655` |
| 800  | `hsl(320 15% 24%)` | `#463440` |
| 900  | `hsl(320 10% 17%)` | `#30272D` |

## Blue

| Step | HSL                | Hex       |
| ---- | ------------------ | --------- |
| 50   | `hsl(204 33% 97%)` | `#F5F8FA` |
| 100  | `hsl(205 33% 93%)` | `#E7EEF3` |
| 200  | `hsl(207 33% 86%)` | `#CFDCE7` |
| 300  | `hsl(208 56% 76%)` | `#9FC4E4` |
| 400  | `hsl(208 57% 64%)` | `#6FA7D7` |
| 500  | `hsl(208 56% 50%)` | `#3885C7` |
| 600  | `hsl(208 57% 40%)` | `#2C6AA0` |
| 700  | `hsl(208 56% 32%)` | `#245580` |
| 800  | `hsl(208 56% 24%)` | `#1B4060` |
| 900  | `hsl(206 40% 17%)` | `#1A2D3C` |

## Red

| Step | HSL              | Hex       |
| ---- | ---------------- | --------- |
| 50   | `hsl(0 20% 97%)` | `#F9F6F6` |
| 100  | `hsl(0 20% 93%)` | `#F1EAEA` |
| 200  | `hsl(0 19% 86%)` | `#E2D4D4` |
| 300  | `hsl(0 33% 76%)` | `#D6ADAD` |
| 400  | `hsl(0 33% 64%)` | `#C28585` |
| 500  | `hsl(0 33% 50%)` | `#AA5555` |
| 600  | `hsl(0 33% 40%)` | `#884444` |
| 700  | `hsl(0 34% 32%)` | `#6D3636` |
| 800  | `hsl(0 33% 24%)` | `#522929` |
| 900  | `hsl(0 23% 17%)` | `#352121` |

## Neutral

| Step | HSL               | Hex       |
| ---- | ----------------- | --------- |
| 50   | `hsl(60 23% 97%)` | `#FAFAF7` |
| 100  | `hsl(36 16% 94%)` | `#F2F0ED` |
| 200  | `hsl(38 12% 87%)` | `#E3E0DB` |
| 300  | `hsl(48 8% 77%)`  | `#C9C7BF` |
| 400  | `hsl(48 5% 62%)`  | `#A3A199` |
| 500  | `hsl(37 3% 49%)`  | `#807D78` |
| 600  | `hsl(24 3% 37%)`  | `#615E5C` |
| 700  | `hsl(0 1% 27%)`   | `#474545` |
| 800  | `hsl(60 3% 19%)`  | `#333330` |
| 900  | `hsl(0 3% 15%)`   | `#262424` |

## As CSS custom properties

```css
:root {
  --mauve-50: hsl(300 7% 97%);
  --mauve-100: hsl(320 9% 93%);
  --mauve-200: hsl(320 8% 86%);
  --mauve-300: hsl(323 15% 76%);
  --mauve-400: hsl(321 14% 64%);
  --mauve-500: hsl(321 15% 50%);
  --mauve-600: hsl(322 15% 40%);
  --mauve-700: hsl(321 14% 32%);
  --mauve-800: hsl(320 15% 24%);
  --mauve-900: hsl(320 10% 17%);

  --blue-50: hsl(204 33% 97%);
  --blue-100: hsl(205 33% 93%);
  --blue-200: hsl(207 33% 86%);
  --blue-300: hsl(208 56% 76%);
  --blue-400: hsl(208 57% 64%);
  --blue-500: hsl(208 56% 50%);
  --blue-600: hsl(208 57% 40%);
  --blue-700: hsl(208 56% 32%);
  --blue-800: hsl(208 56% 24%);
  --blue-900: hsl(206 40% 17%);

  --red-50: hsl(0 20% 97%);
  --red-100: hsl(0 20% 93%);
  --red-200: hsl(0 19% 86%);
  --red-300: hsl(0 33% 76%);
  --red-400: hsl(0 33% 64%);
  --red-500: hsl(0 33% 50%);
  --red-600: hsl(0 33% 40%);
  --red-700: hsl(0 34% 32%);
  --red-800: hsl(0 33% 24%);
  --red-900: hsl(0 23% 17%);

  --neutral-50: hsl(60 23% 97%);
  --neutral-100: hsl(36 16% 94%);
  --neutral-200: hsl(38 12% 87%);
  --neutral-300: hsl(48 8% 77%);
  --neutral-400: hsl(48 5% 62%);
  --neutral-500: hsl(37 3% 49%);
  --neutral-600: hsl(24 3% 37%);
  --neutral-700: hsl(0 1% 27%);
  --neutral-800: hsl(60 3% 19%);
  --neutral-900: hsl(0 3% 15%);
}
```
