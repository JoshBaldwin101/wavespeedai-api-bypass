export const SEEDANCE_ATTACHMENT_LIMITS = {
  imageToVideo: {
    image: 1,
    lastImage: 1,
  },
  textToVideo: {
    referenceImages: 9,
    referenceVideos: 9,
    referenceAudios: 9,
  },
  videoEdit: {
    video: 1,
    referenceImages: 9,
    referenceAudios: 9,
  },
  videoExtend: {
    video: 1,
    lastImage: 1,
  },
} as const

export { getAttachmentLimitError, validateAttachmentLimit } from './attachmentLimits'
