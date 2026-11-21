# bytedance/seedance-2.5-flash/text-to-video

> Seedance 2.5 Flash Text-to-Video creates videos from text prompts and optional image, video, and audio references, with 480p to 4K output and optional generated audio. Ready-to-use REST inference API, best performance, no coldstarts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5-flash/text-to-video`
- **Polling/result URL**: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`
- **Model ID**: `bytedance/seedance-2.5-flash/text-to-video`
- **Category**: text-to-video

## Pricing

Default settings (720p, 5 seconds) cost ~~$1.20~~ $1.08 per run.

### Output only

| Resolution | Per second (duration 5 seconds) | 5 seconds | 10 seconds | 30 seconds |
|------------|-----------:|----------:|-----------:|-----------:|
| 480p | ~~$0.12~~ $0.108 | ~~$0.60~~ $0.54 | ~~$1.20~~ $1.08 | ~~$3.60~~ $3.24 |
| 720p | ~~$0.24~~ $0.216 | ~~$1.20~~ $1.08 | ~~$2.40~~ $2.16 | ~~$7.20~~ $6.48 |
| 1080p | ~~$0.60~~ $0.54 | ~~$3.00~~ $2.70 | ~~$6.00~~ $5.40 | ~~$18.00~~ $16.20 |
| 4k | ~~$1.20~~ $1.08 | ~~$6.00~~ $5.40 | ~~$12.00~~ $10.80 | ~~$36.00~~ $32.40 |

Pricing is based on the selected generation duration, from 4 to 30 whole seconds.

### With reference videos

Reference-video duration and the selected generation duration use the same per-second rate, so the price is for the reference input plus the generated video:

| Resolution | 5 seconds of reference video + 5 seconds duration | 10 seconds of reference video + 5 seconds duration |
|------------|-----------:|-----------:|
| 480p | ~~$0.75~~ $0.675 | ~~$1.125~~ $1.0125 |
| 720p | ~~$1.50~~ $1.35 | ~~$2.25~~ $2.025 |
| 1080p | ~~$3.75~~ $3.375 | ~~$5.625~~ $5.0625 |
| 4k | ~~$7.50~~ $6.75 | ~~$11.25~~ $10.125 |

Each reference video is counted as at least 2 seconds, each clip and the combined input are capped at 30 seconds, and the combined input duration is rounded up to a whole second.

Example: 5 seconds of reference input plus a selected generation duration of 5 seconds costs ~~$0.75~~ $0.675 at 480p or ~~$1.50~~ $1.35 at 720p.

---

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
The API is asynchronous: submit a prediction, then poll its result URL until it completes.

### Input Schema

The API accepts the following input parameters:

- **`prompt`** (`string`, _required_):
  Describe the scene, action, camera movement, and mood for the video.

- **`reference_images`** (`array of string`, _optional_):
  Reference image URLs to guide visual style, characters, or scene composition.

- **`reference_videos`** (`array of string`, _optional_):
  Reference video URLs (total length must not exceed 30 seconds).

- **`reference_audios`** (`array of string`, _optional_):
  Reference audio URLs (total length must not exceed 30 seconds).

- **`aspect_ratio`** (`string`, _optional_):
  The aspect ratio of the generated video.
  - Default: `"16:9"`
  - Options: "16:9", "9:16", "4:3", "3:4", "1:1", "21:9"

- **`resolution`** (`string`, _optional_):
  The output video resolution. 1080p and 4k are generated at 720p and upscaled.
  - Default: `"720p"`
  - Options: "480p", "720p", "1080p", "4k"

- **`duration`** (`integer`, _optional_):
  The duration of the generated video in seconds (4-30s).
  - Default: `5`
  - Range: `4` to `30`

- **`generate_audio`** (`boolean`, _optional_):
  Whether to generate native audio synchronized with the output video. Defaults to true.
  - Default: `true`

- **`output_format`** (`string`, _optional_):
  The container of the output video. mov is a QuickTime file with H.264 4:4:4 video and uncompressed audio, intended for post-production; some browsers and players cannot play it. mov is not available at 1080p or 4k.
  - Default: `"mp4"`
  - Options: "mp4", "mov"



**Required Parameters Example**:

```json
{
  "prompt": "A cinematic ocean wave at sunrise, highly detailed"
}
```

**Full Example**:

```json
{
  "prompt": "A cinematic ocean wave at sunrise, highly detailed",
  "reference_images": [],
  "reference_videos": [],
  "reference_audios": [],
  "aspect_ratio": "16:9",
  "resolution": "720p",
  "duration": 5,
  "generate_audio": true,
  "output_format": "mp4"
}
```

### Result Data Schema

The `data` object returned by the API has the following fields:

- **`created_at`** (`string (date-time)`, _optional_):
  ISO timestamp of when the request was created (e.g., "2023-04-01T12:34:56.789Z").

- **`id`** (`string`, _optional_):
  Unique identifier for the prediction, the ID of the prediction to get.

- **`model`** (`string`, _optional_):
  Model ID used for the prediction.

- **`outputs`** (`array of string | object`, _optional_):
  Array of generated outputs (empty when status is not completed). Items are usually URL strings, but may be text strings or structured result objects, depending on the model.

- **`status`** (`string`, _optional_):
  Status of the task: created, processing, completed, or failed.

- **`urls`** (`object`, _optional_):
  Object containing related API endpoints.



**Example `data` Object**:

```json
{
  "created_at": "example",
  "id": "example",
  "model": "example",
  "outputs": [],
  "status": "example",
  "urls": {}
}
```

## Usage Examples

The examples use `jq` to read JSON. Set your API key first:

```bash
set -euo pipefail
export WAVESPEED_API_KEY="your-api-key"
```

### 1. Submit a prediction

```bash
REQUEST_BODY=$(cat <<'JSON'
{
  "prompt": "A cinematic ocean wave at sunrise, highly detailed"
}
JSON
)

SUBMIT_RESPONSE=$(curl --silent --show-error --fail-with-body \
  --request POST \
  --url https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5-flash/text-to-video \
  --header "Authorization: Bearer ${WAVESPEED_API_KEY}" \
  --header "Content-Type: application/json" \
  --data "${REQUEST_BODY}")

printf '%s\n' "${SUBMIT_RESPONSE}" | jq .
```

The response contains the prediction ID in `data.id`.

### 2. Poll until complete and read `outputs`

```bash
PREDICTION_ID=$(printf '%s' "${SUBMIT_RESPONSE}" | jq -r '.data.id')
if [ -z "${PREDICTION_ID}" ] || [ "${PREDICTION_ID}" = "null" ]; then
  printf 'Submission response did not contain data.id\n' >&2
  exit 1
fi
RESULT_URL="https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result"

while true; do
  RESPONSE=$(curl --silent --show-error --fail-with-body \
    --request GET \
    --url "${RESULT_URL}" \
    --header "Authorization: Bearer ${WAVESPEED_API_KEY}")

  RESULT=$(printf '%s' "${RESPONSE}" | jq -e '.data')
  STATUS=$(printf '%s' "${RESULT}" | jq -er '.status')
  case "${STATUS}" in
    completed)
      # Generated files are returned in the outputs array.
      printf '%s\n' "${RESULT}" | jq '.outputs'
      break
      ;;
    failed|cancelled|timeout|deleted)
      printf '%s\n' "${RESULT}" | jq '{status, error, code}'
      exit 1
      ;;
    *)
      sleep 2
      ;;
  esac
done
```

## Additional Resources

### Documentation

- [Model Playground](https://wavespeed.ai/models/bytedance/seedance-2.5-flash/text-to-video)
- [API Documentation](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.5-flash-text-to-video)
