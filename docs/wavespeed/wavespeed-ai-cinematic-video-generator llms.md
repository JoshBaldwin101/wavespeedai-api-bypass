# wavespeed-ai/cinematic-video-generator

> WaveSpeed Cinematic Video Generator creates Hollywood-quality videos from text prompts and optional reference images with native audio, director-level camera control, and real-world physics. Ready-to-use REST inference API, best performance, no cold starts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/wavespeed-ai/cinematic-video-generator`
- **Polling/result URL**: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`
- **Model ID**: `wavespeed-ai/cinematic-video-generator`
- **Category**: text-to-video

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
The API is asynchronous: submit a prediction, then poll its result URL until it completes.

### Input Schema

The API accepts the following input parameters:

- **`prompt`** (`string`, _required_):
  Describe the scene, action, camera movement, and mood for the video.

- **`images`** (`array of string`, _optional_):
  Optional reference images (up to 4) to guide the visual style, characters, or scene composition.

- **`aspect_ratio`** (`string`, _optional_):
  The aspect ratio of the generated video.
  - Default: `"16:9"`
  - Options: "16:9", "9:16", "4:3", "3:4"

- **`duration`** (`integer`, _optional_):
  The duration of the generated video in seconds.
  - Default: `5`
  - Options: 5, 10, 15



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
  "images": [],
  "aspect_ratio": "16:9",
  "duration": 5
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
  --url https://api.wavespeed.ai/api/v3/wavespeed-ai/cinematic-video-generator \
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

- [Model Playground](https://wavespeed.ai/models/wavespeed-ai/cinematic-video-generator)
- [API Documentation](https://wavespeed.ai/docs/docs-api/wavespeed-ai/cinematic-video-generator)
