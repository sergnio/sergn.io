# Color palette reference

Four ramps - Mauve, Blue, Red, Neutral - each with ten steps from `50` (lightest)
to `900` (darkest). This is a reference sheet transcribed from the palette design;
it is not yet wired into `src/styles.css`, which still uses the evergreen/gold
tokens. Use these values when a design calls for a palette step by name
(e.g. "Blue 900" -> `#1A2D3C`).

## Mauve

| Step | Hex       |
| ---- | --------- |
| 50   | `#F8F7F8` |
| 100  | `#EFECEE` |
| 200  | `#DED8DC` |
| 300  | `#CBB9C4` |
| 400  | `#B096A7` |
| 500  | `#926D85` |
| 600  | `#75576A` |
| 700  | `#5D4655` |
| 800  | `#463440` |
| 900  | `#30272D` |

## Blue

| Step | Hex       |
| ---- | --------- |
| 50   | `#F5F8FA` |
| 100  | `#E7EEF3` |
| 200  | `#CFDCE7` |
| 300  | `#9FC4E4` |
| 400  | `#6FA7D7` |
| 500  | `#3885C7` |
| 600  | `#2C6AA0` |
| 700  | `#245580` |
| 800  | `#1B4060` |
| 900  | `#1A2D3C` |

## Red

| Step | Hex       |
| ---- | --------- |
| 50   | `#F9F6F6` |
| 100  | `#F1EAEA` |
| 200  | `#E2D4D4` |
| 300  | `#D6ADAD` |
| 400  | `#C28585` |
| 500  | `#AA5555` |
| 600  | `#884444` |
| 700  | `#6D3636` |
| 800  | `#522929` |
| 900  | `#352121` |

## Neutral

| Step | Hex       |
| ---- | --------- |
| 50   | `#FAFAF7` |
| 100  | `#F2F0ED` |
| 200  | `#E3E0DB` |
| 300  | `#C9C7BF` |
| 400  | `#A3A199` |
| 500  | `#807D78` |
| 600  | `#615E5C` |
| 700  | `#474545` |
| 800  | `#333330` |
| 900  | `#262424` |

## As CSS custom properties

```css
:root {
  --mauve-50: #f8f7f8;
  --mauve-100: #efecee;
  --mauve-200: #ded8dc;
  --mauve-300: #cbb9c4;
  --mauve-400: #b096a7;
  --mauve-500: #926d85;
  --mauve-600: #75576a;
  --mauve-700: #5d4655;
  --mauve-800: #463440;
  --mauve-900: #30272d;

  --blue-50: #f5f8fa;
  --blue-100: #e7eef3;
  --blue-200: #cfdce7;
  --blue-300: #9fc4e4;
  --blue-400: #6fa7d7;
  --blue-500: #3885c7;
  --blue-600: #2c6aa0;
  --blue-700: #245580;
  --blue-800: #1b4060;
  --blue-900: #1a2d3c;

  --red-50: #f9f6f6;
  --red-100: #f1eaea;
  --red-200: #e2d4d4;
  --red-300: #d6adad;
  --red-400: #c28585;
  --red-500: #aa5555;
  --red-600: #884444;
  --red-700: #6d3636;
  --red-800: #522929;
  --red-900: #352121;

  --neutral-50: #fafaf7;
  --neutral-100: #f2f0ed;
  --neutral-200: #e3e0db;
  --neutral-300: #c9c7bf;
  --neutral-400: #a3a199;
  --neutral-500: #807d78;
  --neutral-600: #615e5c;
  --neutral-700: #474545;
  --neutral-800: #333330;
  --neutral-900: #262424;
}
```
