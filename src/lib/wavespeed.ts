import type {
  BalanceResponseData,
  ModelPricing,
  PredictionListResponse,
  PredictionResult,
  UploadedMedia,
  WavespeedEnvelope,
} from './types'

export const BASE_URL = 'https://api.wavespeed.ai/api/v3'
const DEFAULT_POLL_INTERVAL_MS = 5000

export class WavespeedError extends Error {
  status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'WavespeedError'
    this.status = status
  }
}

const createAuthHeaders = (apiKey: string): HeadersInit => ({
  Authorization: `Bearer ${apiKey}`,
})

const parseMaybeJson = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

const extractApiMessage = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined
  }

  const maybeMessage = Reflect.get(payload, 'message')
  if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
    return maybeMessage
  }

  const maybeError = Reflect.get(payload, 'error')
  if (typeof maybeError === 'string' && maybeError.trim()) {
    return maybeError
  }

  return undefined
}

const mapStatusToMessage = (status: number): string => {
  if (status === 0) return 'Network error while contacting WaveSpeed.'
  if (status === 401) return 'Invalid or expired API key.'
  if (status === 402) return 'Insufficient balance or payment required.'
  if (status === 403) return 'This key is not allowed for this action.'
  if (status === 404) return 'Endpoint not found.'
  if (status === 413) return 'Uploaded file is too large.'
  if (status === 429) return 'Rate limit reached. Please retry shortly.'
  if (status >= 500) return 'WaveSpeed service is temporarily unavailable.'
  return `WaveSpeed request failed (${status}).`
}

const requestJson = async <T>(
  url: string,
  init: RequestInit,
): Promise<WavespeedEnvelope<T>> => {
  const response = await fetch(url, init)
  const payload = await parseMaybeJson(response)

  if (!response.ok) {
    const apiMessage = extractApiMessage(payload)
    const fallback = mapStatusToMessage(response.status)
    throw new WavespeedError(apiMessage ?? fallback, response.status)
  }

  if (!payload || typeof payload !== 'object') {
    throw new WavespeedError('Unexpected non-JSON response from WaveSpeed.')
  }

  return payload as WavespeedEnvelope<T>
}

const wait = (ms: number, signal?: AbortSignal): Promise<void> => {
  if (!signal) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms)
    })
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('Polling aborted.', 'AbortError'))
    }

    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export const validateKey = async (apiKey: string): Promise<BalanceResponseData> => {
  const envelope = await requestJson<BalanceResponseData>(`${BASE_URL}/balance`, {
    method: 'GET',
    headers: createAuthHeaders(apiKey),
  })
  return envelope.data
}

export const getModelPricing = async (
  apiKey: string,
  modelId: string,
  inputs: Record<string, unknown>,
): Promise<ModelPricing> => {
  const envelope = await requestJson<ModelPricing>(`${BASE_URL}/model/pricing`, {
    method: 'POST',
    headers: {
      ...createAuthHeaders(apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model_id: modelId, inputs }),
  })
  return envelope.data
}

export const uploadFile = async (
  apiKey: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<UploadedMedia> => {
  onProgress?.(15)
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/media/upload/binary`, {
    method: 'POST',
    headers: createAuthHeaders(apiKey),
    body: formData,
  })
  onProgress?.(85)

  const payload = await parseMaybeJson(response)
  if (!response.ok) {
    const apiMessage = extractApiMessage(payload)
    throw new WavespeedError(apiMessage ?? mapStatusToMessage(response.status), response.status)
  }

  if (!payload || typeof payload !== 'object') {
    throw new WavespeedError('Upload returned an invalid response.')
  }

  const envelope = payload as WavespeedEnvelope<UploadedMedia>
  onProgress?.(100)
  return envelope.data
}

export const submitPrediction = async (
  apiKey: string,
  model: string,
  input: unknown,
): Promise<PredictionResult> => {
  const envelope = await requestJson<PredictionResult>(`${BASE_URL}/${model}`, {
    method: 'POST',
    headers: {
      ...createAuthHeaders(apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  return envelope.data
}

export const getPredictionResult = async (
  apiKey: string,
  predictionId: string,
): Promise<PredictionResult> => {
  const envelope = await requestJson<PredictionResult>(`${BASE_URL}/predictions/${predictionId}/result`, {
    method: 'GET',
    headers: createAuthHeaders(apiKey),
  })
  return envelope.data
}

export const listPredictions = async (
  apiKey: string,
  options?: {
    page?: number
    page_size?: number
    model?: string
    status?: 'completed' | 'failed' | 'processing'
    created_after?: string
    created_before?: string
  },
): Promise<PredictionListResponse> => {
  const payload = {
    page: options?.page ?? 1,
    page_size: options?.page_size ?? 100,
    ...(options?.model ? { model: options.model } : {}),
    ...(options?.status ? { status: options.status } : {}),
    ...(options?.created_after ? { created_after: options.created_after } : {}),
    ...(options?.created_before ? { created_before: options.created_before } : {}),
  }

  const envelope = await requestJson<PredictionListResponse>(`${BASE_URL}/predictions`, {
    method: 'POST',
    headers: {
      ...createAuthHeaders(apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return envelope.data
}

export const pollPrediction = async (
  apiKey: string,
  predictionUrlOrId: string,
  signal?: AbortSignal,
  onUpdate?: (prediction: PredictionResult) => void,
): Promise<PredictionResult> => {
  const getUrl = predictionUrlOrId.startsWith('http')
    ? predictionUrlOrId
    : `${BASE_URL}/predictions/${predictionUrlOrId}`

  while (true) {
    if (signal?.aborted) {
      throw new DOMException('Polling aborted.', 'AbortError')
    }

    const envelope = await requestJson<PredictionResult>(getUrl, {
      method: 'GET',
      headers: createAuthHeaders(apiKey),
      signal,
    })

    onUpdate?.(envelope.data)

    const status = envelope.data.status
    if (status === 'completed' || status === 'failed') {
      return envelope.data
    }

    await wait(DEFAULT_POLL_INTERVAL_MS, signal)
  }
}
