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
  - SeedVR2 forms in `src/components/seedvr2/`
  - MiniMax H3 forms in `src/components/minimaxH3/`
  - GPT Image forms in `src/components/gptImage/`
  - Nano Banana forms in `src/components/nanoBanana/`
  - Seedream forms in `src/components/seedream/`
  - Scail forms in `src/components/scail/`
- Shared per-workflow Nano Banana field behavior lives in `src/components/nanoBananaConfig.ts` and is passed through `activeWorkflow.nanoBananaConfig`.
- Form pricing previews share `src/hooks/useLivePricing.ts`.
- Job output rendering in `src/components/JobsPanel.tsx` is media-kind aware through `src/lib/outputMedia.ts`.

## How to add a new workflow

1. Add or update request input types in `src/lib/types.ts`.
2. Create a workflow form in the proper folder (`src/components/seedance/`, `src/components/seedvr2/`, `src/components/minimaxH3/`, `src/components/gptImage/`, `src/components/nanoBanana/`, `src/components/seedream/`, or `src/components/scail/`):
  - Keep payload assembly explicit.
  - Validate required fields and any model-specific ranges/options.
  - Validate integer range fields with `evaluateIntegerField` from `src/lib/numericField.ts`, and pass the returned `error` into `Field error={...}` for inline feedback.
  - Enforce documented WaveSpeed attachment-count limits in both UI and submit-time validation.
  - Reuse `MediaUpload`, `useLivePricing`, and shared advanced-fields components where possible.
3. Register the workflow in `src/lib/workflows.ts`:
  - Set `id`, `label`, `submitLabel`, and `model`.
  - Assign the form component.
  - Use `capabilities` only for workflows that rely on it (Seedance currently does; GPT Image / MiniMax H3 / SeedVR2 / Seedream do not).
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
- Seedance 2.0 / 2.0-fast shared limits currently use 9 reference images / 9 videos / 9 audios (see `existing-endpoint-schema-discrepancies.md` for official vs app differences).
- Seedance 2.0 Mini text-to-video / video-edit reference caps are 9 images / 3 videos / 3 audios.
- Seedance 2.5 text-to-video / video-edit reference caps in this app are 9 images / 3 videos / 3 audios (official docs only document a 30s total-duration cap).
- MiniMax H3 reference-to-video caps are 9 images / 3 videos / 3 audios; at least one reference input is required; reference videos are only supported at `480p`.
- GPT Image 2 `images[]` requires one or more images, but current docs do not define a hard max item count.
- Nano Banana edit endpoints currently documented in this app use up to 14 input images (`images[]`).
- Seedream v5.0 Pro edit `images[]` is capped at 10 per official docs.

Generic attachment helpers live in `src/lib/attachmentLimits.ts`. Seedance-specific constants stay in `src/lib/seedanceAttachmentLimits.ts`.

## WorkflowCapabilities notes (Seedance family)

Optional fields on `WorkflowCapabilities` (defaults preserve existing 2.0 / 2.0-fast behavior):

- `defaultResolution` — preferred default when draft/initial resolution is missing or not in `resolutionOptions` (falls back to `resolutionOptions[0]`).
- `supportsWebSearch` — defaults to `true`. When `false`, the web-search toggle is hidden and `enable_web_search` is omitted from the payload.
- `supportsDuration` — defaults to `true`. When `false`, the duration field is hidden and `duration` is omitted from the payload (used by Seedance 2.5 video-edit).
- `supportsLastImage` — defaults to `true`. When `false`, the last-frame image upload is hidden and `last_image` is omitted from the payload (used by Seedance 2.5 video-extend).
- `referenceLimits` — overrides Seedance attachment caps for `reference_images` / `reference_videos` / `reference_audios` when present.

## Numeric field validation

For optional integer fields with known ranges (for example `duration` or `seed`), use `evaluateIntegerField` from `src/lib/numericField.ts` as the single source of truth.

- Use the helper to derive `{ value, error }` from the raw input string.
- Pass `error` to the corresponding `Field` via `error={...}` so users immediately see what is invalid.
- Gate `isFormValid`, `pricingInput`, and submit-time checks from the same `error` value instead of duplicating number parsing logic.
- Use `value` when building payloads only when it is a number.

## Current workflow schema notes (dropdown order)

### `seedance-2.5/image-to-video`

- Required: `image`, `prompt`
- Optional: `last_image`, `resolution`, `duration`, `generate_audio`
- Duration: 4-30 seconds
- Resolution: `480p`, `720p` (default), `1080p`, `4k`
- Notes: No `aspect_ratio` and no `enable_web_search` in the official schema.

### `seedance-2.5/image-to-video-spicy`

- Required: `image`
- Optional: `prompt`, `last_image`, `resolution`, `duration`, `generate_audio`, `seed`
- Duration: 4-30 seconds
- Resolution: `480p`, `720p` (default), `1080p`, `4k`
- Notes: Prompt is optional. No `aspect_ratio` and no `enable_web_search`.

### `seedance-2.5/image-to-video-turbo`

- Required/optional fields follow `seedance-2.5/image-to-video`.
- Resolution: `720p` (default), `1080p` only.

### `seedance-2.5/text-to-video`

- Required: `prompt`
- Optional: `reference_images[]`, `reference_videos[]`, `reference_audios[]`, `aspect_ratio`, `resolution`, `duration`, `generate_audio`
- Duration: 4-30 seconds
- Resolution: `480p`, `720p` (default), `1080p`, `4k`
- Aspect ratio: `16:9` (default), `9:16`, `4:3`, `3:4`, `1:1`, `21:9`
- Notes: No `enable_web_search`. App enforces reference caps of 9 images / 3 videos / 3 audios (docs only state a 30s total-duration cap).

### `seedance-2.5/text-to-video-turbo`

- Required/optional fields follow `seedance-2.5/text-to-video`.
- Resolution: `720p` (default), `1080p` only.

### `seedance-2.5/video-edit`

- Required: `prompt`, `video`
- Optional: `reference_images[]`, `reference_audios[]`, `resolution`, `generate_audio`
- Resolution: `480p`, `720p` (default), `1080p`, `4k`
- Notes: No `aspect_ratio`, no `duration`, and no `enable_web_search`. App enforces reference caps of 9 images / 3 audios.

### `seedance-2.5/video-edit-turbo`

- Required/optional fields follow `seedance-2.5/video-edit`.
- Resolution: `720p` (default), `1080p` only.

### `seedance-2.5/video-extend`

- Required: `prompt`, `video`
- Optional: `resolution`, `duration`, `generate_audio`
- Duration: 4-30 seconds
- Resolution: `480p`, `720p` (default), `1080p`, `4k`
- Notes: No `aspect_ratio`, no `last_image`, and no `enable_web_search`.

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

### `seedance-2.0-mini/image-to-video`

- Required: `image`, `prompt`
- Optional: `last_image`, `aspect_ratio`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Resolution: `480p`, `720p` (default), `1080p`, `4k`

### `seedance-2.0-mini/image-to-video-spicy`

- Required: `image`
- Optional: `prompt`, `last_image`, `aspect_ratio`, `resolution`, `duration`, `generate_audio`, `seed`
- Duration: 4-15 seconds
- Resolution: `480p`, `720p` (default), `1080p`, `4k`
- Notes: Prompt is optional. No `enable_web_search` in the official schema.

### `seedance-2.0-mini/image-to-video-turbo`

- Required/optional fields follow `seedance-2.0-mini/image-to-video`.
- Resolution: `720p` (default), `1080p` only.

### `seedance-2.0-mini/text-to-video`

- Required: `prompt`
- Optional: `reference_images[]` (max 9), `reference_videos[]` (max 3), `reference_audios[]` (max 3), `aspect_ratio`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Resolution: `480p`, `720p` (default), `1080p`, `4k`

### `seedance-2.0-mini/text-to-video-turbo`

- Required/optional fields follow `seedance-2.0-mini/text-to-video`.
- Resolution: `720p` (default), `1080p` only.

### `seedance-2.0-mini/video-edit`

- Required: `prompt`, `video`
- Optional: `reference_images[]` (max 9), `reference_audios[]` (max 3), `aspect_ratio`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Resolution: `480p`, `720p` (default), `1080p`, `4k`

### `seedance-2.0-mini/video-edit-turbo`

- Required/optional fields follow `seedance-2.0-mini/video-edit`.
- Resolution: `720p` (default), `1080p` only.

### `seedance-2.0-mini/video-extend`

- Required: `prompt`, `video`
- Optional: `last_image`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Resolution: `480p`, `720p` (default), `1080p`, `4k`
- Notes: No `aspect_ratio` in the schema.

### `wavespeed-ai/seedvr2/video`

- Required: `video`
- Optional: `target_resolution`
- Options: `target_resolution`: `720p`, `1080p` (default), `2k`, `4k`
- Notes: Video upscaler. No prompt field. Use `submitLabel: Generate video`.

### `wavespeed-ai/scail-2`

- Required: `image`, `video`
- Optional: `prompt`, `mode`, `resolution`, `seed`
- Options:
  - `mode`: `animate`, `replace`
  - `resolution`: `480p`, `720p`
- Notes: Character animation / replace workflow. Use `submitLabel: Generate video`.

### `wavespeed-ai/minimax-h3/text-to-video`

- Required: `prompt`
- Optional: `aspect_ratio`, `resolution`, `duration`, `seed`
- Options:
  - `aspect_ratio`: `16:9` (default), `9:16`, `1:1`, `4:3`, `3:4`, `21:9`, `9:21`
  - `resolution`: `480p` (default), `768p`
  - `duration`: integer 5-15 (default 5)
  - `seed`: integer, `-1` means random
- Notes: Native stereo audio is always generated with the video.

### `wavespeed-ai/minimax-h3/reference-to-video`

- Required: `prompt`, plus at least one of `reference_images[]` / `reference_videos[]` / `reference_audios[]`
- Optional: `aspect_ratio`, `resolution`, `duration`, `seed`
- Attachment caps: 9 images / 3 videos / 3 audios
- Notes: Reference videos are only supported at `480p`. Same aspect/resolution/duration/seed options as text-to-video.

### `wavespeed-ai/minimax-h3/image-to-video`

- Required: `prompt`, `image`
- Optional: `last_image`, `resolution`, `duration`, `seed`
- Options:
  - `resolution`: `480p` (default), `768p`
  - `duration`: integer 5-15 (default 5)
- Notes: No `aspect_ratio` — output canvas follows the first-frame image.

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

### `bytedance/seedream-v5.0-pro/edit`

- Required: `prompt`, `images[]`
- Optional: `aspect_ratio`, `resolution`, `output_format`, `prompt_optimization_mode`
- Options:
  - `aspect_ratio`: `1:1`, `1:2`, `2:1`, `1:3`, `3:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `9:21`, `21:9`
  - `resolution`: `1k` (default), `1.5k`, `2k`
  - `output_format`: `jpeg` (default), `png`
  - `prompt_optimization_mode`: `standard` (default), `fast`
- Notes: Image edit workflow with up to 10 reference images. Leave `aspect_ratio` empty to auto-derive from the first input image. Use `submitLabel: Generate image`. `enable_sync_mode` and `enable_base64_output` are intentionally unsupported (this app polls asynchronously and renders output URLs).

## Source of truth reminder

The `.txt` files under `docs/wavespeed/` are copied reference notes. Use official WaveSpeed docs as authoritative whenever there is any discrepancy.
