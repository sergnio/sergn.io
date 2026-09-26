# QR codes

Each QR code here encodes a short `sergn.io` URL, not the final destination.
The short URL is a `302` redirect in `netlify.toml`, so a printed code keeps
working and can be repointed by editing that rule — no reprint, no paid QR
service.

| Code           | Encodes               | Redirects to                                                     |
| -------------- | --------------------- | ---------------------------------------------------------------- |
| [`ai`](ai.svg) | `https://sergn.io/ai` | Minneapolis Community Ed, _Beware the AI_ (Southwest, Fall 2026) |

The SVG scales to any print size; the PNG is 1024×1024 for quick sharing.

To add one, add a `[[redirects]]` rule above the `/*` 404 rule in
`netlify.toml`, then generate the images with the `qrcode` npm package:

```sh
npx qrcode -e M -m 4 -w 1024 -o docs/qr/<name>.png "https://sergn.io/<name>"
npx qrcode -e M -m 4 -t svg -o docs/qr/<name>.svg "https://sergn.io/<name>"
```
