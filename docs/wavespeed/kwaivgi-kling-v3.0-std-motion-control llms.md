# kwaivgi/kling-v3.0-std/motion-control

> Kling 3.0 Standard Motion Control transfers motion from reference videos to animate still images. Upload a character image and a motion clip (dance, action, gesture), and the model extracts the movement to generate smooth, realistic video. Ready-to-use REST inference API, best performance, no cold starts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/kwaivgi/kling-v3.0-std/motion-control`
- **Polling/result URL**: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`
- **Model ID**: `kwaivgi/kling-v3.0-std/motion-control`
- **Category**: motion-control

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
The API is asynchronous: submit a prediction, then poll its result URL until it completes.

### Input Schema

The API accepts the following input parameters:

- **`image`** (`string`, _required_):
  Supported image formats:.jpg /.jpeg /.png The size of the image file should not exceed 10MB, the width and height of the image should be no less than 300px, and the aspect ratio of the image should be between 1:2.5 and 2.5:1

- **`video`** (`string`, _required_):
  The motion reference video. Supported formats: .mp4/.mov, up to 100MB, width and height between 340px and 3850px. Duration 3-30 seconds when character_orientation is "video", 3-10 seconds when it is "image"; longer videos are trimmed. The generated video length follows the reference video.

- **`element_list`** (`array of object`, _optional_):
  Element reference list.

- **`character_orientation`** (`string`, _optional_):
  Generate the orientation of the characters in the video, which can be selected to match the image or the video.
  - Default: `"video"`
  - Options: "image", "video"

- **`prompt`** (`string`, _optional_):
  The positive prompt for the generation.

- **`negative_prompt`** (`string`, _optional_):
  The negative prompt for the generation.

- **`keep_original_sound`** (`boolean`, _optional_):
  Whether to retain the original video sound
  - Default: `true`



**Required Parameters Example**:

```json
{
  "image": "https://interactive-examples.mdn.mozilla.net/media/cc0-images/painted-hand-298-332.jpg",
  "video": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
}
```

**Full Example**:

```json
{
  "image": "https://interactive-examples.mdn.mozilla.net/media/cc0-images/painted-hand-298-332.jpg",
  "video": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "element_list": [],
  "character_orientation": "video",
  "prompt": "A cinematic ocean wave at sunrise, highly detailed",
  "negative_prompt": "A cinematic ocean wave at sunrise, highly detailed",
  "keep_original_sound": true
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
  "image": "https://interactive-examples.mdn.mozilla.net/media/cc0-images/painted-hand-298-332.jpg",
  "video": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
}
JSON
)

SUBMIT_RESPONSE=$(curl --silent --show-error --fail-with-body \
  --request POST \
  --url https://api.wavespeed.ai/api/v3/kwaivgi/kling-v3.0-std/motion-control \
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

- [Model Playground](https://wavespeed.ai/models/kwaivgi/kling-v3.0-std/motion-control)
- [API Documentation](https://wavespeed.ai/docs/docs-api/kwaivgi/kwaivgi-kling-v3.0-std-motion-control)
