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

## Related

- Workflow registry: `src/lib/workflows.ts`
- How to add workflows: `docs/wavespeed/adding-workflows.md`
- Official WaveSpeed docs remain authoritative when this note and live API pages disagree.
