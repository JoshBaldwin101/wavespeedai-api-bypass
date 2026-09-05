export const SEEDREAM_SIZE_MIN = 512
export const SEEDREAM_SIZE_MAX = 8192
export const SEEDREAM_TARGET_PIXELS = 2048 * 2048
export const SEEDREAM_SIZE_STEP = 16
export const SEEDREAM_DEFAULT_WIDTH = 2048
export const SEEDREAM_DEFAULT_HEIGHT = 2048

export interface SeedreamSize {
  width: number
  height: number
}

export const SEEDREAM_ASPECT_PRESETS = [
  { label: '1:1', width: 1, height: 1 },
  { label: '16:9', width: 16, height: 9 },
  { label: '9:16', width: 9, height: 16 },
  { label: '4:3', width: 4, height: 3 },
  { label: '3:4', width: 3, height: 4 },
  { label: '3:2', width: 3, height: 2 },
  { label: '2:3', width: 2, height: 3 },
] as const

export const formatSeedreamSize = (width: number, height: number): string => `${width}*${height}`

export const parseSeedreamSize = (value: unknown): SeedreamSize | null => {
  if (typeof value !== 'string') return null
  const match = value.trim().match(/^(\d+)\s*[xX*]\s*(\d+)$/)
  if (!match) return null

  const width = Number.parseInt(match[1], 10)
  const height = Number.parseInt(match[2], 10)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null
  }

  return { width, height }
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

const roundToStep = (value: number, step: number): number => Math.round(value / step) * step

export const fitAspectToPixelBudget = (
  aspectWidth: number,
  aspectHeight: number,
  targetPixels = SEEDREAM_TARGET_PIXELS,
): SeedreamSize => {
  if (!(aspectWidth > 0) || !(aspectHeight > 0) || !(targetPixels > 0)) {
    return { width: SEEDREAM_DEFAULT_WIDTH, height: SEEDREAM_DEFAULT_HEIGHT }
  }

  const ratio = aspectWidth / aspectHeight
  let width = Math.sqrt(targetPixels * ratio)
  let height = width / ratio

  if (width > SEEDREAM_SIZE_MAX) {
    width = SEEDREAM_SIZE_MAX
    height = width / ratio
  }
  if (height > SEEDREAM_SIZE_MAX) {
    height = SEEDREAM_SIZE_MAX
    width = height * ratio
  }
  if (width < SEEDREAM_SIZE_MIN) {
    width = SEEDREAM_SIZE_MIN
    height = width / ratio
  }
  if (height < SEEDREAM_SIZE_MIN) {
    height = SEEDREAM_SIZE_MIN
    width = height * ratio
  }

  width = clamp(width, SEEDREAM_SIZE_MIN, SEEDREAM_SIZE_MAX)
  height = clamp(height, SEEDREAM_SIZE_MIN, SEEDREAM_SIZE_MAX)

  return {
    width: clamp(roundToStep(width, SEEDREAM_SIZE_STEP), SEEDREAM_SIZE_MIN, SEEDREAM_SIZE_MAX),
    height: clamp(roundToStep(height, SEEDREAM_SIZE_STEP), SEEDREAM_SIZE_MIN, SEEDREAM_SIZE_MAX),
  }
}

export const loadImageDimensions = (url: string): Promise<SeedreamSize | null> =>
  new Promise((resolve) => {
    const trimmed = url.trim()
    if (!trimmed) {
      resolve(null)
      return
    }

    const image = new Image()
    let settled = false
    const settle = (result: SeedreamSize | null) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const readDimensions = () => {
      const width = image.naturalWidth
      const height = image.naturalHeight
      if (width > 0 && height > 0) {
        settle({ width, height })
        return
      }
      settle(null)
    }

    image.onload = readDimensions
    image.onerror = () => settle(null)
    image.src = trimmed

    if (image.complete) {
      readDimensions()
    }
  })
