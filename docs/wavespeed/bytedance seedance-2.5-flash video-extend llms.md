# bytedance/seedance-2.5-flash/video-extend

> Seedance 2.5 Flash Video-Extend extends an input video with a new cinematic continuation guided by the ending of the source video and a natural-language prompt. Ready-to-use REST API, best performance, no coldstarts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5-flash/video-extend`
- **Polling/result URL**: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`
- **Model ID**: `bytedance/seedance-2.5-flash/video-extend`
- **Category**: video-extend

## Pricing

Pricing is based on the combined duration of `reference duration + new segment duration`. Every second of that combined length is billed at a rate that depends on the resolution, so a longer source or a longer extension costs proportionally more.

The reference duration is rounded up to the next whole second, with a minimum of `2` seconds and a maximum of `30` seconds. The new segment duration is controlled by the `duration` parameter. Source videos longer than 30 seconds are billed as 30 seconds.

A request with default settings (720p, 5 s extension, source of 2 s or less) costs ~~$1.05~~ $0.945.

### Example Costs: Source Length + 5 s Extension

| Source video length | 480p | 720p | 1080p | 4k |
|---------------------|-----:|-----:|------:|---:|
| 2 s or shorter (minimum) | ~~$0.525~~ $0.4725 | ~~$1.05~~ $0.945 | ~~$2.625~~ $2.3625 | ~~$5.25~~ $4.725 |
| 5 s | ~~$0.75~~ $0.675 | ~~$1.50~~ $1.35 | ~~$3.75~~ $3.375 | ~~$7.50~~ $6.75 |
| 10 s | ~~$1.125~~ $1.0125 | ~~$2.25~~ $2.025 | ~~$5.625~~ $5.0625 | ~~$11.25~~ $10.125 |
| 20 s | ~~$1.875~~ $1.6875 | ~~$3.75~~ $3.375 | ~~$9.375~~ $8.4375 | ~~$18.75~~ $16.875 |
| 30 s or longer (maximum) | ~~$2.625~~ $2.3625 | ~~$5.25~~ $4.725 | ~~$13.125~~ $11.8125 | ~~$26.25~~ $23.625 |

### Example Costs: 10 s Source + Different Extension Lengths

| New segment length | 480p | 720p | 1080p | 4k |
|--------------------|-----:|-----:|------:|---:|
| 4 s | ~~$1.05~~ $0.945 | ~~$2.10~~ $1.89 | ~~$5.25~~ $4.725 | ~~$10.50~~ $9.45 |
| 5 s (default) | ~~$1.125~~ $1.0125 | ~~$2.25~~ $2.025 | ~~$5.625~~ $5.0625 | ~~$11.25~~ $10.125 |
| 10 s | ~~$1.50~~ $1.35 | ~~$3.00~~ $2.70 | ~~$7.50~~ $6.75 | ~~$15.00~~ $13.50 |
| 30 s | ~~$3.00~~ $2.70 | ~~$6.00~~ $5.40 | ~~$15.00~~ $13.50 | ~~$30.00~~ $27.00 |

### Example Costs: 30 s Source + 10 s Extension

| Resolution | Cost |
|------------|-----:|
| 480p | ~~$3.00~~ $2.70 |
| 720p | ~~$6.00~~ $5.40 |
| 1080p | ~~$15.00~~ $13.50 |
| 4k | ~~$30.00~~ $27.00 |

---

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
The API is asynchronous: submit a prediction, then poll its result URL until it completes.

### Input Schema

The API accepts the following input parameters:

- **`prompt`** (`string`, _required_):
  Describe the cinematic continuation - action, camera movement, lighting, mood.

- **`video`** (`string`, _required_):
  URL of the input video to extend. The native extension uses the last 30 seconds as context; generation continues seamlessly from the ending.

- **`resolution`** (`string`, _optional_):
  Output resolution of the new segment. 1080p and 4k are generated at 720p and upscaled.
  - Default: `"720p"`
  - Options: "480p", "720p", "1080p", "4k"

- **`duration`** (`integer`, _optional_):
  Length in seconds of the new segment to append (4-30).
  - Default: `5`
  - Range: `4` to `30`

- **`generate_audio`** (`boolean`, _optional_):
  Whether to generate native audio synchronized with the output video. Defaults to true.
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
  "prompt": "A cinematic ocean wave at sunrise, highly detailed",
  "video": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
}
JSON
)

SUBMIT_RESPONSE=$(curl --silent --show-error --fail-with-body \
  --request POST \
  --url https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5-flash/video-extend \
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

- [Model Playground](https://wavespeed.ai/models/bytedance/seedance-2.5-flash/video-extend)
- [API Documentation](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.5-flash-video-extend)
