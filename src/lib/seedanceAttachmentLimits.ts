export const SEEDANCE_ATTACHMENT_LIMITS = {
  imageToVideo: {
    image: 1,
    lastImage: 1,
  },
  textToVideo: {
    referenceImages: 4,
  },
  videoEdit: {
    video: 1,
    referenceImages: 4,
  },
  videoExtend: {
    video: 1,
    lastImage: 1,
  },
} as const

const formatAttachmentCount = (maxItems: number): string => {
  if (maxItems === 1) return '1 file'
  return `${maxItems} files`
}

export const getAttachmentLimitError = (label: string, maxItems: number): string =>
  `${label} accepts at most ${formatAttachmentCount(maxItems)}.`

export const validateAttachmentLimit = (label: string, values: string[], maxItems: number): string | null => {
  if (values.length <= maxItems) return null
  return getAttachmentLimitError(label, maxItems)
}
