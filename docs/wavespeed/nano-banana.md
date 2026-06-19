# Google Nano Banana workflow notes

This note consolidates the current Nano Banana endpoint schemas used by the app.

## Dropdown order

1. `google/nano-banana-pro/edit-ultra`
2. `google/nano-banana-pro/edit-multi`
3. `google/nano-banana-pro/edit`
4. `google/nano-banana-pro/text-to-image`
5. `google/nano-banana-2/text-to-image`
6. `google/nano-banana-2/text-to-image-fast`
7. `google/nano-banana-2/edit`
8. `google/nano-banana-2/edit-fast`

## Shared notes

- All endpoints require `prompt`.
- Edit endpoints also require `images[]`.
- In this app, Nano Banana edit workflows enforce `images[]` max count of 14 both in UI (`MediaUpload maxItems`) and in submit-time validation.
- In this app, optional fields are omitted from payload unless selected or enabled.
- `aspect_ratio` uses an `Auto` UI option that omits the field.

## `google/nano-banana-pro/*` models

### `google/nano-banana-pro/edit-ultra`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `resolution`, `output_format`
- `aspect_ratio` options: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- `resolution` options: `4k`, `8k` (default `4k` in app)
- `output_format` options: `png`, `jpeg`

### `google/nano-banana-pro/edit-multi`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `num_images`, `output_format`
- `aspect_ratio` options: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- `num_images` integer range in app: `1-4` (omitted unless value > 1)
- `output_format` options: `png`, `jpeg`, `webp`
- No `resolution` parameter

### `google/nano-banana-pro/edit`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `resolution`, `output_format`
- `aspect_ratio` options: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- `resolution` options: `1k`, `2k`, `4k` (default `1k` in app)
- `output_format` options: `png`, `jpeg`

### `google/nano-banana-pro/text-to-image`

- Required: `prompt`
- Optional: `aspect_ratio`, `resolution`, `output_format`
- `aspect_ratio` options: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- `resolution` options: `1k`, `2k`, `4k` (default `1k` in app)
- `output_format` options: `png`, `jpeg`

## `google/nano-banana-2/*` models

### `google/nano-banana-2/text-to-image`

- Required: `prompt`
- Optional: `aspect_ratio`, `resolution`, `enable_web_search`, `enable_image_search`, `output_format`
- `aspect_ratio` options: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, `1:4`, `4:1`, `1:8`, `8:1`
- `resolution` options: `0.5k`, `1k`, `2k`, `4k` (default `1k` in app)
- `output_format` options: `png`, `jpeg`

### `google/nano-banana-2/text-to-image-fast`

- Required: `prompt`
- Optional: `aspect_ratio`, `resolution`, `enable_web_search`, `output_format`
- `aspect_ratio` options: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, `1:4`, `4:1`, `1:8`, `8:1`
- `resolution` options: `2k`, `4k` (default `2k` in app)
- `output_format` options: `png`, `jpeg`

### `google/nano-banana-2/edit`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `resolution`, `enable_web_search`, `enable_image_search`, `output_format`
- `aspect_ratio` options: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, `1:4`, `4:1`, `1:8`, `8:1`
- `resolution` options: `0.5k`, `1k`, `2k`, `4k` (default `1k` in app)
- `output_format` options: `png`, `jpeg`

### `google/nano-banana-2/edit-fast`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `resolution`, `enable_web_search`, `output_format`
- `aspect_ratio` options: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, `1:4`, `4:1`, `1:8`, `8:1`
- `resolution` options: `2k`, `4k` (default `2k` in app)
- `output_format` options: `png`, `jpeg`
