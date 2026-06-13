# WaveSpeedAI API Bypass MVP Notes

## Getting an API key

1. Open [https://wavespeed.ai/accesskey](https://wavespeed.ai/accesskey).
2. Create or copy a key that starts with `wsk_live_`.
3. Paste it into the app and click **Test key**.

The app validates keys with `GET https://api.wavespeed.ai/api/v3/balance`, which does not create generation cost.

## CORS status

Current WaveSpeed API responses include permissive CORS headers (`Access-Control-Allow-Origin: *`), so direct browser calls are used in this MVP.

## Optional Netlify proxy fallback

If WaveSpeed changes CORS in the future, you can route API calls through Netlify with a redirect in `netlify.toml`:

```toml
[[redirects]]
  from = "/wsapi/*"
  to = "https://api.wavespeed.ai/api/v3/:splat"
  status = 200
  force = true
```

Then update the frontend base URL from:

- `https://api.wavespeed.ai/api/v3`

to:

- `/wsapi`

This keeps all client logic unchanged while moving cross-origin handling to Netlify.
