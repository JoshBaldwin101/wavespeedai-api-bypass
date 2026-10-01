# Existing Seedance endpoint schema discrepancies

This note records differences between the **official WaveSpeed schemas** and what this app currently sends for the older `seedance-2.0` and `seedance-2.0-fast` registry entries.

**Scope decision:** When Seedance 2.0 Mini / SeedVR2 / MiniMax H3 were added, these older entries were intentionally left behaviorally untouched. New mini workflows follow the official schemas below. Use this file when deciding whether to align the legacy entries later.

## `image-to-video-spicy` (`seedance-2.0` and `seedance-2.0-fast`)

| Field / behavior | Official docs | App today |
| --- | --- | --- |
| `prompt` | Optional | Treated as required (`promptRequired: true`) |
| `enable_web_search` | Not in schema | UI toggle shown; payload always includes `enable_web_search` |
| `resolution` | `480p`, `720p`, `1080p`, `4k` | `480p`, `720p`, `1080p` only |
| `seed` | Supported | Supported (`supportsSeed: true`) |

Official mini spicy endpoint matches the docs column (optional prompt, no web search, includes `4k`).

## `video-extend` (`seedance-2.0` and `seedance-2.0-fast`)

| Field / behavior | Official docs | App today |
| --- | --- | --- |
| `resolution` | Includes `4k` on current Seedance 2.0 Mini docs (and likely full 2.0) | `480p`, `720p`, `1080p` only |
| `aspect_ratio` | Not in schema | Correctly omitted (`supportsAspectRatio: false`) |

Mini `video-extend` in this app now includes `4k`.

## Text-to-video / video-edit reference attachment caps

| Limit | Official docs (Seedance text-to-video / video-edit) | App shared constant (`SEEDANCE_ATTACHMENT_LIMITS`) |
| --- | --- | --- |
| `reference_images[]` | Up to 9 | 9 |
| `reference_videos[]` | Up to 3 (plus ~15s total duration) | 9 |
| `reference_audios[]` | Up to 3 (plus ~15s total duration) | 9 |

Mini workflows override these via `WorkflowCapabilities.referenceLimits` to `9 / 3 / 3`. Legacy 2.0 / 2.0-fast entries still use the shared 9/9/9 constants.

## Seedance 2.5 reference attachment caps

Official Seedance 2.5 text-to-video / video-edit docs do **not** publish per-array item counts. They only state that reference videos/audios must not exceed 30 seconds total length.

This app therefore applies the same `9 / 3 / 3` (images / videos / audios) caps used by Seedance 2.0 Mini via `WorkflowCapabilities.referenceLimits`. Revisit if WaveSpeed publishes explicit item limits later.

## Kling 3.0 / V3 Turbo / Elements

No WaveSpeed API key was available in the environment that added these workflows, so `element_list` and the Kling Elements result were not confirmed with a live call. The shapes below follow WaveSpeed's written instructions. Re-check with one Kling Elements job (about $0.01) and one short Kling 3.0 Std image-to-video job if a submission is rejected.

| Field / behavior | Official docs | App today |
| --- | --- | --- |
| Kling 3.0 image-to-video `prompt` | Request table says either `prompt` or `multi_prompt` must be provided. Notes and the required-parameters example require only `image`. | Prompt is optional. `image` is the only required field, except `shot_type: intelligence`, which requires a prompt. |
| `element_list` item shape | Undocumented. Prose says to put the element ID in `element_list`. | Sent as `{ element_id: string }`, max 3. Numeric IDs from a reloaded job are coerced to strings. |
| Kling Elements `outputs` | Documented only as string or object. Prose says the result includes an element ID. | Non-URL outputs render as copyable text. An `element_id` string or number on the output object (or a plain string from `kwaivgi/kling-elements`) is shown as Element ID. |
| `tag_list` | Present in the llms reference, absent from the official API parameter table, shape undocumented. | Not sent. |
| Kling Elements `element_refer_list` | Parameter table marks it required with range `0 ~ 3`. The llms example sends `[]`. The official request example includes one image URL. A live submit of `[]` returns `field "element_refer_list" is required and must not be empty`. | Required. At least 1 and at most 3 image URLs. The form labels this Other reference images (element_refer_list). |
| Motion-control `character_orientation` | Summary calls it required. Parameter table marks it optional, default `video`. | Optional, default `video`, always sent. |
| Pro motion-control description | The model page title says Pro, but the opening sentence says "Kling 3.0 Standard Motion Control". | Treated as the Pro endpoint `kwaivgi/kling-v3.0-pro/motion-control`. |
| Turbo image upload size | Turbo image-to-video docs allow up to 50MB. | Hint text says 50MB. The shared uploader still rejects local image files over 20MB. Paste a URL for a larger file. |
| `end_image` with `multi_prompt` | "multi_shot is not supported with end image." | Multi-shot mode hides the upload and blocks submit until the end image is removed. Switching back to a single prompt restores it if it was not removed. |

## Related

- Workflow registry: `src/lib/workflows.ts`
- How to add workflows: `docs/wavespeed/adding-workflows.md`
- Official WaveSpeed docs remain authoritative when this note and live API pages disagree.
