# google/nano-banana-2.1/edit

> Google Nano Banana 2.1 Edit is the latest Nano Banana image editing model, with gains in visual design, subject consistency and prompt adherence, up to 14 reference images and 1K to 4K output. Ready-to-use REST inference API, best performance, no coldstarts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/google/nano-banana-2.1/edit`
- **Polling/result URL**: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`
- **Model ID**: `google/nano-banana-2.1/edit`
- **Category**: image-to-image

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
The API is asynchronous: submit a prediction, then poll its result URL until it completes.

### Input Schema

The API accepts the following input parameters:

- **`prompt`** (`string`, _required_):
  The positive prompt for the generation.

- **`images`** (`array of string`, _required_):
  List of URLs of input images for editing. The maximum number of images is 14.

- **`aspect_ratio`** (`string`, _optional_):
  The aspect ratio of the generated media.
  - Options: "1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9", "1:4", "4:1", "1:8", "8:1"

- **`resolution`** (`string`, _optional_):
  The resolution of the output image.
  - Default: `"1k"`
  - Options: "1k", "2k", "4k"

- **`enable_web_search`** (`boolean`, _optional_):
  If enabled, the model will use web search to enhance the generation with real-time information.
  - Default: `false`

- **`enable_image_search`** (`boolean`, _optional_):
  If enabled, the model will use image search to enhance the generation with real-time information.
  - Default: `false`

- **`output_format`** (`string`, _optional_):
  The format of the output image.
  - Default: `"png"`
  - Options: "png", "jpeg"

- **`enable_sync_mode`** (`boolean`, _optional_):
  If set to `true`, the request attempts to wait for the generated result and return outputs in the same response. If the result is not ready within the sync wait window, the API can return a timeout body while the task continues processing. This option is only available via the API and is supported only by some models.
  - Default: `false`

- **`enable_base64_output`** (`boolean`, _optional_):
  If set to `true`, the prediction's `output` strings are returned as **naked base64** (no `data:<mime>;base64,` prefix). When `false` (default), outputs are returned as URLs pointing to our CDN.
  - Default: `false`



**Required Parameters Example**:

```json
{
  "prompt": "A cinematic ocean wave at sunrise, highly detailed",
  "images": []
}
```

**Full Example**:

```json
{
  "prompt": "A cinematic ocean wave at sunrise, highly detailed",
  "images": [],
  "aspect_ratio": "1:1",
  "resolution": "1k",
  "enable_web_search": false,
  "enable_image_search": false,
  "output_format": "png"
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
  "images": []
}
JSON
)

SUBMIT_RESPONSE=$(curl --silent --show-error --fail-with-body \
  --request POST \
  --url https://api.wavespeed.ai/api/v3/google/nano-banana-2.1/edit \
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

- [Model Playground](https://wavespeed.ai/models/google/nano-banana-2.1/edit)
- [API Documentation](https://wavespeed.ai/docs/docs-api/google/google-nano-banana-2.1-edit)
