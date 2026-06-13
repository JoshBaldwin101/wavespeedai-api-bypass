export type PredictionStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type SeedanceAspectRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1' | '21:9'
export type SeedanceResolution = '480p' | '720p' | '1080p'

export interface SeedanceVideoEditInput {
  prompt?: string
  video?: string
  reference_images?: string[]
  reference_audios?: string[]
  aspect_ratio?: SeedanceAspectRatio
  resolution?: SeedanceResolution
  duration?: number
  enable_web_search?: boolean
  generate_audio?: boolean
}

export interface UploadedMedia {
  type: 'image' | 'video' | 'audio' | string
  download_url: string
  filename: string
  size: number
}

export interface PredictionUrls {
  get?: string
}

export interface PredictionResult {
  id: string
  status: PredictionStatus
  model?: string
  input?: Record<string, unknown>
  outputs?: string[]
  urls?: PredictionUrls
  created_at?: string
  error?: string | null
}

export interface BalanceResponseData {
  [key: string]: unknown
}

export interface WavespeedEnvelope<T> {
  code: number
  message: string
  data: T
}
