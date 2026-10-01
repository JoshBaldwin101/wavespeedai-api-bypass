# kwaivgi/kling-elements

> Kling Elements creates custom AI elements from reference images for video generation. Ready-to-use REST inference API, best performance, no coldstarts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/kwaivgi/kling-elements`
- **Polling/result URL**: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`
- **Model ID**: `kwaivgi/kling-elements`
- **Category**: image-to-text

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
The API is asynchronous: submit a prediction, then poll its result URL until it completes.

### Input Schema

The API accepts the following input parameters:

- **`name`** (`string`, _required_):
  Element name, It cannot exceed 20 characters.

- **`description`** (`string`, _required_):
  Element description, It cannot exceed 100 characters.

- **`image`** (`string`, _required_):
  Front reference image, The size of the image file should not exceed 10MB, and the width and height dimensions of the image should be no less than 300px.

- **`element_refer_list`** (`array of string (uri)`, _required_):
  Other reference list of the element.

- **`voice_id`** (`string`, _optional_):
  The voice ID of element can be bound to existing tone colors in the tone library.

- **`tag_list`** (`array of object`, _optional_):
  Configure tags for the element.



**Required Parameters Example**:

```json
{
  "name": "example",
  "description": "example",
  "image": "https://interactive-examples.mdn.mozilla.net/media/cc0-images/painted-hand-298-332.jpg",
  "element_refer_list": []
}
```

**Full Example**:

```json
{
  "name": "example",
  "description": "example",
  "image": "https://interactive-examples.mdn.mozilla.net/media/cc0-images/painted-hand-298-332.jpg",
  "element_refer_list": [],
  "voice_id": "example",
  "tag_list": []
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
  "name": "example",
  "description": "example",
  "image": "https://interactive-examples.mdn.mozilla.net/media/cc0-images/painted-hand-298-332.jpg",
  "element_refer_list": []
}
JSON
)

SUBMIT_RESPONSE=$(curl --silent --show-error --fail-with-body \
  --request POST \
  --url https://api.wavespeed.ai/api/v3/kwaivgi/kling-elements \
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

- [Model Playground](https://wavespeed.ai/models/kwaivgi/kling-elements)
- [API Documentation](https://wavespeed.ai/docs/docs-api/kwaivgi/kwaivgi-kling-elements)
