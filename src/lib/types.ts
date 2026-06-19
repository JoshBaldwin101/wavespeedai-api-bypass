export type PredictionStatus = 'created' | 'queued' | 'pending' | 'processing' | 'completed' | 'failed'

export type SeedanceAspectRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1' | '21:9'
export type SeedanceResolution = '480p' | '720p' | '1080p'
export type GptImageAspectRatio =
  | '1:1'
  | '1:2'
  | '2:1'
  | '1:3'
  | '3:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '9:16'
  | '16:9'
  | '9:21'
  | '21:9'
export type GptImageResolution = '1k' | '2k' | '4k'
export type GptImageQuality = 'low' | 'medium' | 'high'
export type GptImageOutputFormat = 'png' | 'jpeg' | 'webp'
export type NanoBananaAspectRatio =
  | '1:1'
  | '3:2'
  | '2:3'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '9:16'
  | '16:9'
  | '21:9'
  | '1:4'
  | '4:1'
  | '1:8'
  | '8:1'
export type NanoBananaResolution = '0.5k' | '1k' | '2k' | '4k' | '8k'
export type NanoBananaOutputFormat = 'png' | 'jpeg' | 'webp'
export type Scail2Mode = 'animate' | 'replace'
export type Scail2Resolution = '480p' | '720p'

export interface SeedanceCommonInput {
  prompt?: string
  resolution?: SeedanceResolution
  duration?: number
  enable_web_search?: boolean
  generate_audio?: boolean
}

export interface SeedanceVideoEditInput extends SeedanceCommonInput {
  video?: string
  reference_images?: string[]
  reference_audios?: string[]
  aspect_ratio?: SeedanceAspectRatio
}

export interface SeedanceTextToVideoInput extends SeedanceCommonInput {
  aspect_ratio?: SeedanceAspectRatio
  reference_images?: string[]
  reference_videos?: string[]
  reference_audios?: string[]
}

export interface SeedanceImageToVideoInput extends SeedanceCommonInput {
  image?: string
  last_image?: string
  aspect_ratio?: SeedanceAspectRatio
  seed?: number
}

export interface SeedanceVideoExtendInput extends SeedanceCommonInput {
  video?: string
  last_image?: string
}

export interface GptImageCommonInput {
  prompt: string
  aspect_ratio?: GptImageAspectRatio
  resolution?: GptImageResolution
  quality?: GptImageQuality
  output_format?: GptImageOutputFormat
}

export interface GptImageEditInput extends GptImageCommonInput {
  images: string[]
}

export type GptImageTextToImageInput = GptImageCommonInput

export interface NanoBananaCommonInput {
  prompt: string
  aspect_ratio?: NanoBananaAspectRatio
  resolution?: NanoBananaResolution
  output_format?: NanoBananaOutputFormat
  enable_web_search?: boolean
  enable_image_search?: boolean
  num_images?: number
}

export interface NanoBananaEditInput extends NanoBananaCommonInput {
  images: string[]
}

export type NanoBananaTextToImageInput = NanoBananaCommonInput

export interface Scail2Input {
  image: string
  video: string
  prompt?: string
  mode?: Scail2Mode
  resolution?: Scail2Resolution
  seed?: number
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
  executionTime?: number
  timings?: Record<string, unknown>
}

export interface PredictionListItem {
  id: string
  status: PredictionStatus
  model?: string
  outputs?: string[]
  urls?: PredictionUrls
  created_at?: string
  error?: string | null
  executionTime?: number
  timings?: Record<string, unknown>
}

export interface PredictionListResponse {
  page: number
  items: PredictionListItem[]
}

export interface ModelPricing {
  model_id: string
  unit_price: number
  currency: string
}

export interface BalanceResponseData {
  [key: string]: unknown
}

export interface WavespeedEnvelope<T> {
  code: number
  message: string
  data: T
}
