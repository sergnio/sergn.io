---
name: prepare-photo
description: Make a local photo safe and correct to upload to Sergio's public Sanity CDN - turned upright, every bit of metadata (GPS included) removed, colors converted to sRGB, resized, and saved as JPEG. Use before uploading any photo or image to Sanity, including from the upload-* skills, or when asked to prepare, clean, fix the rotation of, or strip location from a photo.
---

# Prepare photo

Turn one local image into an upright, metadata-free sRGB JPEG ready for `npx --no sanity assets upload`. Never modify the original file.

## Why each step exists

- Phone photos store pixels unrotated and record the rotation in an EXIF orientation tag. Stripping metadata without first applying that tag leaves the photo sideways on the site.
- Phone photos carry a GPS location, and the uploaded asset lands on a public CDN, so every metadata segment goes.
- iPhone photos are Display P3. Stripping the embedded color profile without converting first leaves colors washed out, so convert to sRGB before stripping.
- `sips` keeps EXIF and does not apply the orientation tag, so it is not enough on its own here.

Requires macOS with ImageMagick and the system sRGB profile shown below.

## Steps

1. Create a unique temporary directory with `mktemp -d /tmp/prepare-photo-XXXX`, outside the repository.
2. Run ImageMagick (`magick`, installed with HEIC support) on the original:

   ```sh
   magick "/path/to/original.HEIC" -auto-orient -profile "/System/Library/ColorSync/Profiles/sRGB Profile.icc" -strip -resize '2400x2400>' -quality 85 "$DIR/photo.jpg"
   ```

   The order matters: orient, then convert color, then strip. `-resize '2400x2400>'` only ever shrinks.

3. Verify the output, not the exit status:

   ```sh
   magick identify -format '%m %wx%h orientation=%[orientation]\n' "$DIR/photo.jpg"
   magick identify -verbose "$DIR/photo.jpg" | grep -ciE 'exif:|gps|icc'
   ```

   Expect `JPEG`, the long edge at most 2400, `orientation=Undefined`, and a count of `0`.

4. Look at a small preview (`magick "$DIR/photo.jpg" -resize 800x800 "$DIR/check.jpg"`, then view it). Image viewers apply EXIF orientation on their own, so only the stripped output shows what the site will show. If it is still sideways, fix it with `-rotate` and say so; do not pick a rotation for looks when the camera's own orientation is upright.
5. Hand `$DIR/photo.jpg` to the upload step. Upload it under a neutral filename such as `wing-review.jpg`, never the camera filename.

If `magick` is missing or fails, stop and report it rather than falling back to `sips` or uploading the original.

## Invocation

- Pi coding agent (on macOS): `/skill:prepare-photo`
- Claude Code: `/prepare-photo`

Example input: "Prepare ~/Downloads/IMG_4321.HEIC for upload."
