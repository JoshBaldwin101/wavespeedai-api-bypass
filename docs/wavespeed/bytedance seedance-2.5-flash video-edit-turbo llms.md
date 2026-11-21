# bytedance/seedance-2.5-flash/video-edit-turbo

> Seedance 2.5 Flash Video Edit Turbo edits a source video using text instructions and optional image and audio references, with 720p or 1080p output. Ready-to-use REST inference API, best performance, no coldstarts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5-flash/video-edit-turbo`
- **Polling/result URL**: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`
- **Model ID**: `bytedance/seedance-2.5-flash/video-edit-turbo`
- **Category**: video-to-video

## Pricing

The price depends on the resolution and the length of the source video. The source video duration is rounded up to the next whole second, with a minimum of `4` seconds and a maximum of `30` seconds. Sources longer than 30 seconds are charged as 30 seconds.

| Source video length | 720p | 1080p |
|---------------------|-----:|------:|
| 4 s or less (minimum) | ~~$0.68~~ $0.612 | ~~$0.76~~ $0.684 |
| 5 s | ~~$0.85~~ $0.765 | ~~$0.95~~ $0.855 |
| 10 s | ~~$1.70~~ $1.53 | ~~$1.90~~ $1.71 |
| 20 s | ~~$3.40~~ $3.06 | ~~$3.80~~ $3.42 |
| 30 s or longer (maximum) | ~~$5.10~~ $4.59 | ~~$5.70~~ $5.13 |

Default settings (720p, source of 4 seconds or less): ~~$0.68~~ $0.612 per run.

Example: a 5 second source costs ~~$0.85~~ $0.765 at 720p or ~~$0.95~~ $0.855 at 1080p.

---

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
The API is asynchronous: submit a prediction, then poll its result URL until it completes.

### Input Schema

The API accepts the following input parameters:

- **`prompt`** (`string`, _required_):
  Describe the edit you want applied to the input video.

- **`video`** (`string`, _required_):
  URL of the input video to edit. Videos longer than 30s are trimmed to 30s; videos shorter than 4s are padded to 4s.

- **`reference_images`** (`array of string`, _optional_):
  Optional reference image URLs to guide the edit (subject identity, style, etc.).

- **`reference_audios`** (`array of string`, _optional_):
  Optional reference audio URLs to guide audio generation.

- **`resolution`** (`string`, _optional_):
  The output video resolution. The video is generated at 480p and upscaled.
  - Default: `"720p"`
  - Options: "720p", "1080p"

- **`generate_audio`** (`boolean`, _optional_):
  Whether to generate native audio for the edited output. Defaults to true. When set to false, the input video's audio track is preserved on the output instead.
  - Default: `true`



**Required Parameters Example**:

```json
{
  "prompt": "A cinematic ocean wave at sunrise, highly detailed",
  "video": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
}
```

**Full Example**:

```json
{
  "prompt": "A cinematic ocean wave at sunrise, highly detailed",
  "video": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "reference_images": [],
  "reference_audios": [],
  "resolution": "720p",
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
  "prompt": "A cinematic ocean wave at sunrise, highly detailed",
  "video": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
}
JSON
)

SUBMIT_RESPONSE=$(curl --silent --show-error --fail-with-body \
  --request POST \
  --url https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5-flash/video-edit-turbo \
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

- [Model Playground](https://wavespeed.ai/models/bytedance/seedance-2.5-flash/video-edit-turbo)
- [API Documentation](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.5-flash-video-edit-turbo)
