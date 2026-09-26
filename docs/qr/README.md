# QR codes

Each QR code here encodes a short `sergn.io` URL, not the final destination.
The short URL is a `302` from the Netlify Edge Function in
`netlify/edge-functions/short-links/short-links.ts`, so a printed code keeps working and can
be repointed by editing that file - no reprint, no paid QR service.

Every scan is counted in GoatCounter under the path `/ai` (titled `QR: /ai`).
That needs a `GOATCOUNTER_API_TOKEN` Netlify environment variable holding a
GoatCounter API token with the "Record pageviews" permission. Without it the
redirect still works but scans go uncounted.

| Code           | Encodes               | Redirects to                                                     |
| -------------- | --------------------- | ---------------------------------------------------------------- |
| [`ai`](ai.svg) | `https://sergn.io/ai` | Minneapolis Community Ed, _Beware the AI_ (Southwest, Fall 2026) |

The SVG scales to any print size; the PNG is 1024×1024 for quick sharing.

To add one, add its path to both `SHORT_LINKS` and `config.path` in
`short-links.ts`, then generate the images with the `qrcode` npm package:

```sh
npx qrcode -e M -m 4 -w 1024 -o docs/qr/<name>.png "https://sergn.io/<name>"
npx qrcode -e M -m 4 -t svg -o docs/qr/<name>.svg "https://sergn.io/<name>"
```
