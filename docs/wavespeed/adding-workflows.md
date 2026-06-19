# Adding WaveSpeed Workflows

This project now uses a registry-first workflow architecture so new WaveSpeed workflows can be added with minimal changes.

## Architecture at a glance

- `src/lib/workflows.ts` is the source of truth for available workflows.
- `src/App.tsx` reads the active workflow from the registry and uses:
  - `activeWorkflow.model` for pricing (`/model/pricing`)
  - `activeWorkflow.model` for submission (`submitPrediction`)
  - `activeWorkflow.model` for jobs filtering (`useJobs`)
- Workflow forms live by model family:
  - Seedance forms in `src/components/seedance/`
  - GPT Image forms in `src/components/gptImage/`
  - Nano Banana forms in `src/components/nanoBanana/`
- Shared per-workflow Nano Banana field behavior lives in `src/components/nanoBananaConfig.ts` and is passed through `activeWorkflow.nanoBananaConfig`.
- Form pricing previews share `src/hooks/useLivePricing.ts`.
- Job output rendering in `src/components/JobsPanel.tsx` is media-kind aware through `src/lib/outputMedia.ts`.

## How to add a new workflow

1. Add or update request input types in `src/lib/types.ts`.
2. Create a workflow form in the proper folder (`src/components/seedance/`, `src/components/gptImage/`, or `src/components/nanoBanana/`):
   - Keep payload assembly explicit.
   - Validate required fields and any model-specific ranges/options.
   - Validate integer range fields with `evaluateIntegerField` from `src/lib/numericField.ts`, and pass the returned `error` into `Field error={...}` for inline feedback.
   - Enforce documented WaveSpeed attachment-count limits in both UI and submit-time validation.
   - Reuse `MediaUpload`, `useLivePricing`, and shared advanced-fields components where possible.
3. Register the workflow in `src/lib/workflows.ts`:
   - Set `id`, `label`, `submitLabel`, and `model`.
   - Assign the form component.
   - Use `capabilities` only for workflows that rely on it (Seedance currently does; GPT Image does not).
   - Use `nanoBananaConfig` for Nano Banana endpoints so form field support/options stay registry-driven.
4. Confirm app wiring:
   - `src/App.tsx` should auto-pick registry changes.
   - If the form uses registry-scoped options (for example Nano Banana), ensure the registry-specific prop (for example `nanoBananaConfig`) is passed through.
5. Verify:
   - `npm run build`
   - `npm run lint`
   - UI sanity check: form renders, pricing preview updates, submit flow opens confirm dialog, and outputs render with the correct media element.

## Attachment limit reminder

When adding or updating a workflow with media arrays, check the official WaveSpeed model page for attachment-count limits and enforce them in two places:

1. Pass `maxItems` to `MediaUpload` so the picker blocks extra files and URLs immediately.
2. Re-check the same limit before building the final payload so invalid state cannot slip through submit-time changes.

Current documented limits used in this app:

- Single-value attachment fields (`image`, `last_image`, `video`) accept 1 file/URL.
- Seedance reference images are capped at 4 files.
- Seedance `reference_videos[]` and `reference_audios[]` docs currently specify total duration limits (15 seconds), not an item-count cap, so do not invent a count limit unless WaveSpeed documents one.
- GPT Image 2 `images[]` requires one or more images, but current docs do not define a hard max item count.
- Nano Banana edit endpoints currently documented in this app use up to 14 input images (`images[]`).

## Numeric field validation

For optional integer fields with known ranges (for example `duration` or `seed`), use `evaluateIntegerField` from `src/lib/numericField.ts` as the single source of truth.

- Use the helper to derive `{ value, error }` from the raw input string.
- Pass `error` to the corresponding `Field` via `error={...}` so users immediately see what is invalid.
- Gate `isFormValid`, `pricingInput`, and submit-time checks from the same `error` value instead of duplicating number parsing logic.
- Use `value` when building payloads only when it is a number.

## Current workflow schema notes (dropdown order)

### `seedance-2.0/image-to-video`

- Required: `image`
- Optional: `prompt`, `last_image`, `aspect_ratio`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Notes: Uses a start image and can optionally target a final frame.

### `seedance-2.0/image-to-video-spicy`

- Required/optional fields follow `seedance-2.0/image-to-video`.
- Notes: Adds `seed` support in this app.

### `seedance-2.0/image-to-video-turbo`

- Required/optional fields follow `seedance-2.0/image-to-video`.

### `seedance-2.0/text-to-video`

- Required: `prompt`
- Optional: `reference_images[]`, `reference_videos[]`, `reference_audios[]`, `aspect_ratio`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Notes: Pure prompt flow with optional reference media.

### `seedance-2.0/text-to-video-turbo`

- Required/optional fields follow `seedance-2.0/text-to-video`.

### `seedance-2.0/video-edit`

- Required: `prompt`, `video`
- Optional: `reference_images[]`, `reference_audios[]`, `aspect_ratio`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Notes: Designed for editing an input video.

### `seedance-2.0/video-edit-turbo`

- Required/optional fields follow `seedance-2.0/video-edit`.

### `seedance-2.0/video-extend`

- Required: `video`
- Optional: `prompt`, `last_image`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Notes: Extends from the last frame of an existing video. No `aspect_ratio` in the schema.

### `seedance-2.0-fast/image-to-video`

- Required/optional fields follow `seedance-2.0/image-to-video`.

### `seedance-2.0-fast/image-to-video-spicy`

- Required/optional fields follow `seedance-2.0/image-to-video-spicy`.

### `seedance-2.0-fast/image-to-video-turbo`

- Required/optional fields follow `seedance-2.0/image-to-video-turbo`.

### `seedance-2.0-fast/text-to-video`

- Required/optional fields follow `seedance-2.0/text-to-video`.

### `seedance-2.0-fast/text-to-video-turbo`

- Required/optional fields follow `seedance-2.0/text-to-video-turbo`.

### `seedance-2.0-fast/video-edit`

- Required/optional fields follow `seedance-2.0/video-edit`.

### `seedance-2.0-fast/video-edit-turbo`

- Required/optional fields follow `seedance-2.0/video-edit-turbo`.

### `seedance-2.0-fast/video-extend`

- Required/optional fields follow `seedance-2.0/video-extend`.

### `openai/gpt-image-2/edit`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `resolution`, `quality`, `output_format`
- Options:
  - `aspect_ratio`: `1:1`, `1:2`, `2:1`, `1:3`, `3:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `9:21`, `21:9`
  - `resolution`: `1k`, `2k`, `4k`
  - `quality`: `low`, `medium`, `high`
  - `output_format`: `png`, `jpeg`, `webp`
- Notes: Image edit workflow with one or more source images. Use `submitLabel: Generate image`.

### `openai/gpt-image-2/text-to-image`

- Required: `prompt`
- Optional: `aspect_ratio`, `resolution`, `quality`, `output_format`
- Options:
  - `aspect_ratio`: `1:1`, `1:2`, `2:1`, `1:3`, `3:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `9:21`, `21:9`
  - `resolution`: `1k`, `2k`, `4k`
  - `quality`: `low`, `medium`, `high`
  - `output_format`: `png`, `jpeg`, `webp`
- Notes: Prompt-only image generation workflow. Use `submitLabel: Generate image`.

### `google/nano-banana-pro/edit-ultra`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `resolution`, `output_format`
- Options:
  - `aspect_ratio`: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
  - `resolution`: `4k`, `8k`
  - `output_format`: `png`, `jpeg`
- Notes: Image edit endpoint with high-resolution tiers. Input image list is capped at 14 in this app.

### `google/nano-banana-pro/edit-multi`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `num_images`, `output_format`
- Options:
  - `aspect_ratio`: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
  - `output_format`: `png`, `jpeg`, `webp`
  - `num_images`: integer range `1-4` in this app
- Notes: Multi-output image edit endpoint. No `resolution` parameter in this model schema.

### `google/nano-banana-pro/edit`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `resolution`, `output_format`
- Options:
  - `aspect_ratio`: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
  - `resolution`: `1k`, `2k`, `4k`
  - `output_format`: `png`, `jpeg`
- Notes: Standard pro image edit endpoint. Input image list is capped at 14 in this app.

### `google/nano-banana-pro/text-to-image`

- Required: `prompt`
- Optional: `aspect_ratio`, `resolution`, `output_format`
- Options:
  - `aspect_ratio`: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
  - `resolution`: `1k`, `2k`, `4k`
  - `output_format`: `png`, `jpeg`
- Notes: Prompt-only pro text-to-image endpoint.

### `google/nano-banana-2/text-to-image`

- Required: `prompt`
- Optional: `aspect_ratio`, `resolution`, `enable_web_search`, `enable_image_search`, `output_format`
- Options:
  - `aspect_ratio`: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, `1:4`, `4:1`, `1:8`, `8:1`
  - `resolution`: `0.5k`, `1k`, `2k`, `4k`
  - `output_format`: `png`, `jpeg`
- Notes: Supports both web and image search enrichment toggles.

### `google/nano-banana-2/text-to-image-fast`

- Required: `prompt`
- Optional: `aspect_ratio`, `resolution`, `enable_web_search`, `output_format`
- Options:
  - `aspect_ratio`: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, `1:4`, `4:1`, `1:8`, `8:1`
  - `resolution`: `2k`, `4k`
  - `output_format`: `png`, `jpeg`
- Notes: Fast text-to-image variant. Supports `enable_web_search`, but not `enable_image_search`.

### `google/nano-banana-2/edit`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `resolution`, `enable_web_search`, `enable_image_search`, `output_format`
- Options:
  - `aspect_ratio`: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, `1:4`, `4:1`, `1:8`, `8:1`
  - `resolution`: `0.5k`, `1k`, `2k`, `4k`
  - `output_format`: `png`, `jpeg`
- Notes: Standard nano-banana-2 edit endpoint. Input image list is capped at 14 in this app.

### `google/nano-banana-2/edit-fast`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `resolution`, `enable_web_search`, `output_format`
- Options:
  - `aspect_ratio`: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, `1:4`, `4:1`, `1:8`, `8:1`
  - `resolution`: `2k`, `4k`
  - `output_format`: `png`, `jpeg`
- Notes: Fast edit variant. Supports `enable_web_search`, but not `enable_image_search`. Input image list is capped at 14 in this app.

## Source of truth reminder

The `.txt` files under `docs/wavespeed/` are copied reference notes. Use official WaveSpeed docs as authoritative whenever there is any discrepancy.
