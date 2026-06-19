import type { NanoBananaAspectRatio, NanoBananaOutputFormat, NanoBananaResolution } from '../lib/types'

export type NanoBananaWorkflowKind = 'edit' | 'text-to-image'

export interface NanoBananaConfig {
  kind: NanoBananaWorkflowKind
  aspectRatioOptions: NanoBananaAspectRatio[]
  resolutionOptions?: NanoBananaResolution[]
  defaultResolution?: NanoBananaResolution
  outputFormatOptions: NanoBananaOutputFormat[]
  defaultOutputFormat: NanoBananaOutputFormat
  supportsWebSearch: boolean
  supportsImageSearch: boolean
  supportsNumImages: boolean
  maxImages?: number
  maxNumImages?: number
}

const MAX_EDIT_IMAGES = 14

const proAspectRatioOptions: NanoBananaAspectRatio[] = ['1:1', '3:2', '2:3', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']
const nanoBanana2AspectRatioOptions: NanoBananaAspectRatio[] = [
  ...proAspectRatioOptions,
  '1:4',
  '4:1',
  '1:8',
  '8:1',
]

const proOutputFormats: NanoBananaOutputFormat[] = ['png', 'jpeg']
const proMultiOutputFormats: NanoBananaOutputFormat[] = ['png', 'jpeg', 'webp']
const nanoBanana2OutputFormats: NanoBananaOutputFormat[] = ['png', 'jpeg']

export const nanoBananaConfigs: Record<string, NanoBananaConfig> = {
  'google/nano-banana-pro/edit-ultra': {
    kind: 'edit',
    aspectRatioOptions: proAspectRatioOptions,
    resolutionOptions: ['4k', '8k'],
    defaultResolution: '4k',
    outputFormatOptions: proOutputFormats,
    defaultOutputFormat: 'png',
    supportsWebSearch: false,
    supportsImageSearch: false,
    supportsNumImages: false,
    maxImages: MAX_EDIT_IMAGES,
  },
  'google/nano-banana-pro/edit-multi': {
    kind: 'edit',
    aspectRatioOptions: proAspectRatioOptions,
    outputFormatOptions: proMultiOutputFormats,
    defaultOutputFormat: 'png',
    supportsWebSearch: false,
    supportsImageSearch: false,
    supportsNumImages: true,
    maxImages: MAX_EDIT_IMAGES,
    maxNumImages: 4,
  },
  'google/nano-banana-pro/edit': {
    kind: 'edit',
    aspectRatioOptions: proAspectRatioOptions,
    resolutionOptions: ['1k', '2k', '4k'],
    defaultResolution: '1k',
    outputFormatOptions: proOutputFormats,
    defaultOutputFormat: 'png',
    supportsWebSearch: false,
    supportsImageSearch: false,
    supportsNumImages: false,
    maxImages: MAX_EDIT_IMAGES,
  },
  'google/nano-banana-pro/text-to-image': {
    kind: 'text-to-image',
    aspectRatioOptions: proAspectRatioOptions,
    resolutionOptions: ['1k', '2k', '4k'],
    defaultResolution: '1k',
    outputFormatOptions: proOutputFormats,
    defaultOutputFormat: 'png',
    supportsWebSearch: false,
    supportsImageSearch: false,
    supportsNumImages: false,
  },
  'google/nano-banana-2/text-to-image': {
    kind: 'text-to-image',
    aspectRatioOptions: nanoBanana2AspectRatioOptions,
    resolutionOptions: ['0.5k', '1k', '2k', '4k'],
    defaultResolution: '1k',
    outputFormatOptions: nanoBanana2OutputFormats,
    defaultOutputFormat: 'png',
    supportsWebSearch: true,
    supportsImageSearch: true,
    supportsNumImages: false,
  },
  'google/nano-banana-2/text-to-image-fast': {
    kind: 'text-to-image',
    aspectRatioOptions: nanoBanana2AspectRatioOptions,
    resolutionOptions: ['2k', '4k'],
    defaultResolution: '2k',
    outputFormatOptions: nanoBanana2OutputFormats,
    defaultOutputFormat: 'png',
    supportsWebSearch: true,
    supportsImageSearch: false,
    supportsNumImages: false,
  },
  'google/nano-banana-2/edit': {
    kind: 'edit',
    aspectRatioOptions: nanoBanana2AspectRatioOptions,
    resolutionOptions: ['0.5k', '1k', '2k', '4k'],
    defaultResolution: '1k',
    outputFormatOptions: nanoBanana2OutputFormats,
    defaultOutputFormat: 'png',
    supportsWebSearch: true,
    supportsImageSearch: true,
    supportsNumImages: false,
    maxImages: MAX_EDIT_IMAGES,
  },
  'google/nano-banana-2/edit-fast': {
    kind: 'edit',
    aspectRatioOptions: nanoBanana2AspectRatioOptions,
    resolutionOptions: ['2k', '4k'],
    defaultResolution: '2k',
    outputFormatOptions: nanoBanana2OutputFormats,
    defaultOutputFormat: 'png',
    supportsWebSearch: true,
    supportsImageSearch: false,
    supportsNumImages: false,
    maxImages: MAX_EDIT_IMAGES,
  },
}
