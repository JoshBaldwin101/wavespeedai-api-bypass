# Adding WaveSpeed Workflows

This project now uses a registry-first workflow architecture so new WaveSpeed workflows can be added with minimal changes.

## Architecture at a glance

- `src/lib/workflows.ts` is the source of truth for available workflows.
- `src/App.tsx` reads the active workflow from the registry and uses:
  - `activeWorkflow.model` for pricing (`/model/pricing`)
  - `activeWorkflow.model` for submission (`submitPrediction`)
  - `activeWorkflow.model` for jobs filtering (`useJobs`)
- Each workflow form lives in `src/components/seedance/` and shares:
  - `src/hooks/useLivePricing.ts`
  - `src/components/seedance/SeedanceAdvancedFields.tsx`

## How to add a new workflow

1. Add or update request input types in `src/lib/types.ts`.
2. Create a workflow form in `src/components/seedance/`:
   - Keep payload assembly explicit.
   - Validate required fields and duration range (4-15).
   - Enforce WaveSpeed attachment-count limits in the form UI and at submit time.
   - Reuse `MediaUpload`, `useLivePricing`, and `SeedanceAdvancedFields` where possible.
3. Register the workflow in `src/lib/workflows.ts`:
   - Set `id`, `label`, `submitLabel`, and `model`.
   - Assign the form component.
4. Confirm no app wiring changes are needed:
   - `src/App.tsx` should auto-pick it up from the registry.
5. Verify:
   - `npm run build`
   - `npm run lint`
   - UI sanity check: form renders, pricing preview updates, submit flow opens confirm dialog.

## Current Seedance workflow schema notes

## Attachment limit reminder

When adding or updating a Seedance workflow, check the official WaveSpeed model page for attachment-count limits and enforce them in two places:

1. Pass `maxItems` to `MediaUpload` so the picker blocks extra files and URLs immediately.
2. Re-check the same limit before building the final payload so invalid state cannot slip through submit-time changes.

Current documented limits used in this app:

- Single-value attachment fields (`image`, `last_image`, `video`) accept 1 file/URL.
- Seedance reference images are capped at 4 files.
- Seedance `reference_videos[]` and `reference_audios[]` docs currently specify total duration limits (15 seconds), not an item-count cap, so do not invent a count limit unless WaveSpeed documents one.

## `bytedance/seedance-2.0/video-edit`

- Required: `prompt`, `video`
- Optional: `reference_images[]`, `reference_audios[]`, `aspect_ratio`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Notes: Designed for editing an input video.

## `bytedance/seedance-2.0/text-to-video`

- Required: `prompt`
- Optional: `reference_images[]`, `reference_videos[]`, `reference_audios[]`, `aspect_ratio`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Notes: Pure prompt flow with optional reference media.

## `bytedance/seedance-2.0/image-to-video`

- Required: `image`
- Optional: `prompt`, `last_image`, `aspect_ratio`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Notes: Uses a start image and can optionally target a final frame.

## `bytedance/seedance-2.0/video-extend`

- Required: `video`
- Optional: `prompt`, `last_image`, `resolution`, `duration`, `enable_web_search`, `generate_audio`
- Duration: 4-15 seconds
- Notes: Extends from the last frame of an existing video. No `aspect_ratio` in the schema.

## Source of truth reminder

The `.txt` files under `docs/wavespeed/` are copied reference notes. Use official WaveSpeed docs as authoritative whenever there is any discrepancy.
