# bytedance/seedance-2.5/video-extend

> Seedance 2.5 (Video-Extend) extends an input video with a new cinematic continuation generated from its last frame and a natural-language prompt. Ready-to-use REST API, best performance, no coldstarts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5/video-extend`
- **Polling/result URL**: returned in `urls.get` (fallback: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`)
- **Model ID**: `bytedance/seedance-2.5/video-extend`
- **Category**: video-extend

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
  Output resolution of the new segment.
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

### Output Schema

The API returns the following output format:

- **`created_at`** (`string (date-time)`, _optional_):
  ISO timestamp of when the request was created (e.g., "2023-04-01T12:34:56.789Z").

- **`id`** (`string`, _optional_):
  Unique identifier for the prediction, the ID of the prediction to get.

- **`model`** (`string`, _optional_):
  Model ID used for the prediction.

- **`outputs`** (`array of object`, _optional_):
  Array of generated outputs (empty when status is not completed). Items are usually URL strings, but may be text strings or structured result objects, depending on the model.

- **`status`** (`string`, _optional_):
  Status of the task: created, processing, completed, or failed.

- **`urls`** (`object`, _optional_):
  Object containing related API endpoints.



**Example Response**:

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

SUBMIT_RESPONSE=$(curl --silent --show-error --fail \
  --request POST \
  --url https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5/video-extend \
  --header "Authorization: Bearer ${WAVESPEED_API_KEY}" \
  --header "Content-Type: application/json" \
  --data "${REQUEST_BODY}")

printf '%s\n' "${SUBMIT_RESPONSE}" | jq .
```

The response contains the prediction ID in `id`. When available, `urls.get` is the authoritative URL for checking that prediction.

### 2. Poll until complete and read `outputs`

```bash
PREDICTION_ID=$(printf '%s' "${SUBMIT_RESPONSE}" | jq -r '.id')
RESULT_URL=$(printf '%s' "${SUBMIT_RESPONSE}" | jq -r '.urls.get // empty')

# Older responses may omit urls.get, so fall back to the model's result route.
if [ -z "${RESULT_URL}" ]; then
  RESULT_URL="https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result"
fi

while true; do
  RESULT=$(curl --silent --show-error --fail \
    --request GET \
    --url "${RESULT_URL}" \
    --header "Authorization: Bearer ${WAVESPEED_API_KEY}")

  STATUS=$(printf '%s' "${RESULT}" | jq -r '.status')
  case "${STATUS}" in
    completed|succeeded)
      # Generated files are returned in the outputs array.
      printf '%s\n' "${RESULT}" | jq '.outputs'
      break
      ;;
    failed|cancelled)
      printf '%s\n' "${RESULT}" | jq '{status, error, code}'
      exit 1
      ;;
    created|queued|processing|starting)
      sleep 2
      ;;
    *)
      printf 'Unexpected status: %s\n' "${STATUS}" >&2
      printf '%s\n' "${RESULT}" | jq . >&2
      exit 1
      ;;
  esac
done
```

## Additional Resources

### Documentation

- [Model Playground](https://wavespeed.ai/models/bytedance/seedance-2.5/video-extend)
- [API Documentation](https://wavespeed.ai/docs/docs-api/bytedance/seedance-2.5/video-extend)
- [Blog](https://wavespeed.ai/blog)
