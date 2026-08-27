export type OutputMediaKind = 'image' | 'video' | 'audio'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v', 'avi', 'mkv'])
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'])

const getExtension = (url: string): string | null => {
  const sanitized = url.split('#')[0]?.split('?')[0] ?? ''
  const lastSegment = sanitized.split('/').pop() ?? ''
  const extension = lastSegment.includes('.') ? lastSegment.split('.').pop() : null
  return extension?.toLowerCase() ?? null
}

export const inferOutputMediaKind = (url: string, model?: string): OutputMediaKind => {
  const extension = getExtension(url)
  if (extension) {
    if (IMAGE_EXTENSIONS.has(extension)) return 'image'
    if (VIDEO_EXTENSIONS.has(extension)) return 'video'
    if (AUDIO_EXTENSIONS.has(extension)) return 'audio'
  }

  const normalizedModel = model?.toLowerCase() ?? ''
  if (normalizedModel.includes('gpt-image')) return 'image'
  if (normalizedModel.includes('nano-banana')) return 'image'
  if (normalizedModel.includes('seedream')) return 'image'
  if (normalizedModel.includes('audio')) return 'audio'
  return 'video'
}
