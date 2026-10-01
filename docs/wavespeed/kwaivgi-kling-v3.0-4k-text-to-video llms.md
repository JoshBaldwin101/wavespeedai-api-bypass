# kwaivgi/kling-v3.0-4k/text-to-video

> Kling V3.0 4K delivers top-tier 4K text-to-video generation with smooth motion, cinematic visuals, accurate prompt adherence, and optional audio. Supports flexible aspect ratios, multi-prompt, and element references. Ready-to-use REST inference API, best performance, no cold starts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/kwaivgi/kling-v3.0-4k/text-to-video`
- **Polling/result URL**: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`
- **Model ID**: `kwaivgi/kling-v3.0-4k/text-to-video`
- **Category**: text-to-video

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
The API is asynchronous: submit a prediction, then poll its result URL until it completes.

### Input Schema

The API accepts the following input parameters:

- **`prompt`** (`string`, _optional_):
  The positive prompt for the generation.

- **`negative_prompt`** (`string`, _optional_):
  The negative prompt for the generation.

- **`duration`** (`integer`, _optional_):
  The duration of the generated media in seconds.
  - Default: `5`
  - Options: 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15

- **`aspect_ratio`** (`string`, _optional_):
  The aspect ratio of the generated video.
  - Default: `"16:9"`
  - Options: "16:9", "9:16", "1:1"

- **`cfg_scale`** (`number`, _optional_):
  Flexibility in video generation; The higher the value, the lower the model's degree of flexibility, and the stronger the relevance to the user's prompt.
  - Default: `0.5`
  - Range: `0` to `1`

- **`sound`** (`boolean`, _optional_):
  Whether sound is generated simultaneously when generating a video.

- **`shot_type`** (`string`, _optional_):
  Shot type for the generation.
  - Default: `"customize"`
  - Options: "customize", "intelligence"

- **`multi_prompt`** (`array of object`, _optional_):
  List of multi-prompt elements for the generation.



**Required Parameters Example**:

```json
{}
```

**Full Example**:

```json
{
  "prompt": "A cinematic ocean wave at sunrise, highly detailed",
  "negative_prompt": "A cinematic ocean wave at sunrise, highly detailed",
  "duration": 5,
  "aspect_ratio": "16:9",
  "cfg_scale": 0.5,
  "sound": false,
  "shot_type": "customize",
  "multi_prompt": []
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
{}
JSON
)

SUBMIT_RESPONSE=$(curl --silent --show-error --fail-with-body \
  --request POST \
  --url https://api.wavespeed.ai/api/v3/kwaivgi/kling-v3.0-4k/text-to-video \
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

- [Model Playground](https://wavespeed.ai/models/kwaivgi/kling-v3.0-4k/text-to-video)
- [API Documentation](https://wavespeed.ai/docs/docs-api/kwaivgi/kwaivgi-kling-v3.0-4k-text-to-video)
