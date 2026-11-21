# bytedance/seedream-v5.5

> Seedream 5.5 Text to Image by ByteDance generates images from text prompts with improved photographic realism and aesthetics, native transparent-background output, aspect ratio selection, and 1K, 1.5K and 2K output tiers. Ready-to-use REST inference API, best performance, no coldstarts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/bytedance/seedream-v5.5`
- **Polling/result URL**: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`
- **Model ID**: `bytedance/seedream-v5.5`
- **Category**: text-to-image

## Pricing

Pricing is based on selected `resolution`.

| Resolution | Cost |
|------------|-----:|
| 1k | ~~$0.02~~ $0.019 |
| 1.5k | ~~$0.02~~ $0.019 |
| 2k | ~~$0.035~~ $0.03325 |

---

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
The API is asynchronous: submit a prediction, then poll its result URL until it completes.

### Input Schema

The API accepts the following input parameters:

- **`prompt`** (`string`, _required_):
  The positive prompt for the generation.

- **`aspect_ratio`** (`string`, _optional_):
  The aspect ratio of the generated image. Defaults to 1:1.
  - Default: `"1:1"`
  - Options: "1:1", "1:2", "2:1", "1:3", "3:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "9:21", "21:9"

- **`resolution`** (`string`, _optional_):
  The output resolution tier. 1k and 1.5k cost the same; 2k is the highest.
  - Default: `"1k"`
  - Options: "1k", "1.5k", "2k"

- **`output_format`** (`string`, _optional_):
  The format of the output image. PNG is the default; a transparent background is always returned as PNG.
  - Default: `"png"`
  - Options: "jpeg", "png"

- **`background`** (`string`, _optional_):
  Whether the image has a transparent background. 'auto' lets the model decide from your prompt and output format; 'transparent' returns a PNG with an alpha channel, whatever output_format is; 'opaque' always returns a solid background.
  - Default: `"auto"`
  - Options: "auto", "transparent", "opaque"



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
  "aspect_ratio": "1:1",
  "resolution": "1k",
  "output_format": "png",
  "background": "auto"
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
  --url https://api.wavespeed.ai/api/v3/bytedance/seedream-v5.5 \
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

- [Model Playground](https://wavespeed.ai/models/bytedance/seedream-v5.5)
- [API Documentation](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedream-v5.5)
