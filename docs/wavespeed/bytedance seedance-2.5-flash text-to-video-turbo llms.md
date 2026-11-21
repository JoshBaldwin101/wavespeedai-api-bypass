# bytedance/seedance-2.5-flash/text-to-video-turbo

> Seedance 2.5 Flash Text-to-Video Turbo creates videos from text prompts and optional image, video, and audio references, with 720p or 1080p output and optional generated audio. Ready-to-use REST inference API, best performance, no coldstarts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5-flash/text-to-video-turbo`
- **Polling/result URL**: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`
- **Model ID**: `bytedance/seedance-2.5-flash/text-to-video-turbo`
- **Category**: text-to-video

## Pricing

### Output only

Without reference videos, you pay per second of generated video, and the rate depends on the resolution. The "Per second" column is the rate for a 10-second video (duration 10 s).

| Resolution | Per second (duration 10 s) | 5 seconds | 10 seconds | 30 seconds |
|------------|-----------:|----------:|-----------:|-----------:|
| 720p | ~~$0.14~~ $0.126 | ~~$0.70~~ $0.63 | ~~$1.40~~ $1.26 | ~~$4.20~~ $3.78 |
| 1080p | ~~$0.16~~ $0.144 | ~~$0.80~~ $0.72 | ~~$1.60~~ $1.44 | ~~$4.80~~ $4.32 |

Pricing is based on the selected generation duration, from 4 to 30 whole seconds. A request with default settings (5 seconds, 720p) costs ~~$0.70~~ $0.63 per run.

### With reference videos

With reference videos, the reference-video duration and the generation duration are charged at the same rate per second, and an upscale fee is added for each generated second. The upscale fee is higher at 1080p than at 720p. Each reference video is counted as at least 2 seconds, each clip and the combined input are capped at 30 seconds, and the combined input duration is rounded up to a whole second.

Each additional second of reference video (4 seconds of reference video minus 3 seconds of reference video) adds ~~$0.075~~ $0.0675.

Price of a 5-second video (duration 5 s) by total reference-video length:

| Reference video length | 720p | 1080p |
|------------------------|-----:|------:|
| 2 seconds | ~~$0.625~~ $0.5625 | ~~$0.725~~ $0.6525 |
| 5 seconds | ~~$0.85~~ $0.765 | ~~$0.95~~ $0.855 |
| 10 seconds | ~~$1.225~~ $1.1025 | ~~$1.325~~ $1.1925 |
| 30 seconds (maximum counted) | ~~$2.725~~ $2.4525 | ~~$2.825~~ $2.5425 |

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
  The output video resolution. The video is generated at 480p and upscaled.
  - Default: `"720p"`
  - Options: "720p", "1080p"

- **`duration`** (`integer`, _optional_):
  The duration of the generated video in seconds (4-30s).
  - Default: `5`
  - Range: `4` to `30`

- **`generate_audio`** (`boolean`, _optional_):
  Whether to generate native audio synchronized with the output video. Defaults to true.
  - Default: `true`



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
  "generate_audio": true
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
  --url https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5-flash/text-to-video-turbo \
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

- [Model Playground](https://wavespeed.ai/models/bytedance/seedance-2.5-flash/text-to-video-turbo)
- [API Documentation](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.5-flash-text-to-video-turbo)
