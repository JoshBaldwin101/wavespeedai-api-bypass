export interface KlingConfig {
  supportsNegativePrompt: boolean
  supportsSound: boolean
  supportsShotType: boolean
  supportsEndImage: boolean
  supportsElements: boolean
  /** Documented upload size, shown as hint text. The shared uploader still caps local image files at 20MB. */
  imageMaxMb: number
}

export const KLING_DURATION_MIN = 3
export const KLING_DURATION_MAX = 15
export const KLING_DEFAULT_DURATION = 5
export const KLING_CFG_MIN = 0
export const KLING_CFG_MAX = 1
export const KLING_DEFAULT_CFG = 0.5
export const KLING_NAME_MAX = 20
export const KLING_DESCRIPTION_MAX = 100

export const kling30ImageConfig: KlingConfig = {
  supportsNegativePrompt: true,
  supportsSound: true,
  supportsShotType: true,
  supportsEndImage: true,
  supportsElements: true,
  imageMaxMb: 10,
}

export const kling30TextConfig: KlingConfig = {
  supportsNegativePrompt: true,
  supportsSound: true,
  supportsShotType: true,
  supportsEndImage: false,
  supportsElements: false,
  imageMaxMb: 10,
}

export const klingTurboImageConfig: KlingConfig = {
  supportsNegativePrompt: false,
  supportsSound: false,
  supportsShotType: false,
  supportsEndImage: false,
  supportsElements: false,
  imageMaxMb: 50,
}

export const klingTurboTextConfig: KlingConfig = {
  supportsNegativePrompt: false,
  supportsSound: false,
  supportsShotType: false,
  supportsEndImage: false,
  supportsElements: false,
  imageMaxMb: 50,
}
