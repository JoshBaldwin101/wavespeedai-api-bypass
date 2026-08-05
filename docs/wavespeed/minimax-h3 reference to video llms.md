# wavespeed-ai/minimax-h3/reference-to-video

> MiniMax H3 Open Weights Reference to Video generates coherent 480P / 768P videos from prompts and multimodal references, guided by up to 9 reference images, 3 reference videos, and 3 reference audios, with native stereo audio and flexible reference-based video generation on WaveSpeedAI infrastructure. Ready-to-use REST inference API, best performance, no coldstarts, affordable pricing.

## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/wavespeed-ai/minimax-h3/reference-to-video`
- **Polling/result URL**: returned in `urls.get` (fallback: `https://api.wavespeed.ai/api/v3/predictions/${PREDICTION_ID}/result`)
- **Model ID**: `wavespeed-ai/minimax-h3/reference-to-video`
- **Category**: image-to-video

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
The API is asynchronous: submit a prediction, then poll its result URL until it completes.

### Input Schema

The API accepts the following input parameters:

- **`prompt`** (`string`, _required_):
  Text description of the desired video. Refer to reference inputs as <Picture 1>..<Picture 9>, <Video 1>..<Video 3>, and <Audio 1>..<Audio 3>. Audio is generated natively together with the video.

- **`reference_images`** (`array of string`, _optional_):
  Reference image URLs (up to 9). At least one reference input is required.

- **`reference_videos`** (`array of string`, _optional_):
  Reference video URLs (up to 3, only supported at 480p resolution). Their soundtracks are used automatically. Total reference video duration is budgeted to 15 seconds; longer inputs are truncated fairly.

- **`reference_audios`** (`array of string`, _optional_):
  Standalone reference audio URLs (up to 3, trimmed to 15 seconds each).

- **`aspect_ratio`** (`string`, _optional_):
  Output aspect ratio.
  - Default: `"16:9"`
  - Options: "16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"

- **`resolution`** (`string`, _optional_):
  Output video resolution. 768p is the model's native canvas; 480p is a faster, lower-cost tier.
  - Default: `"480p"`
  - Options: "480p", "768p"

- **`duration`** (`integer`, _optional_):
  Output video duration in seconds.
  - Default: `5`
  - Options: 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15

- **`seed`** (`integer`, _optional_):
  The random seed to use for the generation. -1 means a random seed will be used.
  - Default: `-1`



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
  "resolution": "480p",
  "duration": 5,
  "seed": -1
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
  "prompt": "A cinematic ocean wave at sunrise, highly detailed"
}
JSON
)

SUBMIT_RESPONSE=$(curl --silent --show-error --fail \
  --request POST \
  --url https://api.wavespeed.ai/api/v3/wavespeed-ai/minimax-h3/reference-to-video \
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

- [Model Playground](https://wavespeed.ai/models/wavespeed-ai/minimax-h3/reference-to-video)
- [API Documentation](https://wavespeed.ai/docs/docs-api/wavespeed-ai/minimax-h3/reference-to-video)
- [Blog](https://wavespeed.ai/blog)
