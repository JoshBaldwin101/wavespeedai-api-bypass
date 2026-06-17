# wavespeed-ai/scail-2 

> SCAIL-2 is a fast AI character animation and subject replacement model that preserves identity and motion from a single reference image and a driving video. It supports both Animation mode and Replacement mode at 480p or 720p. Ready-to-use REST inference API for character animation, motion transfer, subject replacement, social media clips, creative video editing, and professional image-to-video workflows with simple integration, no coldstarts, and affordable pricing.


## Overview

- **Endpoint**: `https://api.wavespeed.ai/api/v3/wavespeed-ai/scail-2`
- **Model ID**: `wavespeed-ai/scail-2`
- **Category**: motion-control 
**Tags**: 



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:

- **`image`** (`string`, _required_):
  Reference character image (JPG/PNG recommended; avoid WEBP).

- **`video`** (`string`, _required_):
  Driving video providing the motion.

- **`prompt`** (`string`, _optional_):
  Optional positive prompt describing the desired output.
  - Default: `""`

- **`mode`** (`string`, _optional_):
  Generation mode. animate: drive the reference character with the input video's motion. replace: swap the input video's subject with the reference character.
  - Default: `"animate"`
  - Options: "animate", "replace"

- **`resolution`** (`string`, _optional_):
  Output resolution tier (the reference image is rescaled to ~0.5 MP for 480p or ~1.0 MP for 720p).
  - Default: `"480p"`
  - Options: "480p", "720p"

- **`seed`** (`integer`, _optional_):
  Random seed. -1 for a random seed.
  - Default: `-1`




**Required Parameters Example**:

```json
{
  "image": "",
  "video": ""
}
```


**Full Example**:

```json
{
  "image": "",
  "mode": "animate",
  "prompt": "",
  "resolution": "480p",
  "seed": -1,
  "video": ""
}
```


### Output Schema

The API returns the following output format:


- **`has_nsfw_contents`** (`array of boolean`, _optional_):
  Array of boolean values indicating NSFW detection for each output.

- **`id`** (`string`, _optional_):
  Unique identifier for the prediction, the ID of the prediction to get.

- **`model`** (`string`, _optional_):
  Model ID used for the prediction.

- **`outputs`** (`array of string`, _optional_):
  Array of URLs to the generated content (empty when status is not completed).

- **`status`** (`string`, _optional_):
  Status of the task: created, processing, completed, or failed.

- **`urls`** (`object`, _optional_):
  Object containing related API endpoints.

- **`created_at`** (`string (date-time)`, _optional_):
  ISO timestamp of when the request was created.





**Example Response**:

```json
{
  "created_at": "",
  "has_nsfw_contents": [],
  "id": "",
  "model": "",
  "outputs": [],
  "status": "",
  "urls": {}
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://api.wavespeed.ai/api/v3/wavespeed-ai/scail-2 \
  --header "Authorization: Bearer ${WAVESPEED_API_KEY}" \
  --header "Content-Type: application/json" \
  --data '{
  "image": "",
  "video": ""
}'
```

## Additional Resources

### Documentation

- [Model Playground](https://wavespeed.ai/models/wavespeed-ai/scail-2)
- [API Documentation](https://wavespeed.ai/docs/docs-api/wavespeed-ai/scail-2)
- [Blog](https://wavespeed.ai/blog)