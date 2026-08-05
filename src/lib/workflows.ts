import type { ComponentType } from 'react'
import { GptImageEditForm } from '../components/gptImage/GptImageEditForm'
import { GptImageTextToImageForm } from '../components/gptImage/GptImageTextToImageForm'
import { MinimaxH3ImageToVideoForm } from '../components/minimaxH3/MinimaxH3ImageToVideoForm'
import { MinimaxH3ReferenceToVideoForm } from '../components/minimaxH3/MinimaxH3ReferenceToVideoForm'
import { MinimaxH3TextToVideoForm } from '../components/minimaxH3/MinimaxH3TextToVideoForm'
import { NanoBananaEditForm } from '../components/nanoBanana/NanoBananaEditForm'
import { NanoBananaTextToImageForm } from '../components/nanoBanana/NanoBananaTextToImageForm'
import { nanoBananaConfigs, type NanoBananaConfig } from '../components/nanoBananaConfig'
import { Scail2Form } from '../components/scail/Scail2Form'
import { SeedanceImageToVideoForm } from '../components/seedance/SeedanceImageToVideoForm'
import { SeedanceTextToVideoForm } from '../components/seedance/SeedanceTextToVideoForm'
import { SeedanceVideoEditForm } from '../components/seedance/SeedanceVideoEditForm'
import { SeedanceVideoExtendForm } from '../components/seedance/SeedanceVideoExtendForm'
import { SeedVr2VideoForm } from '../components/seedvr2/SeedVr2VideoForm'
import type { SeedanceResolution } from './types'

export interface WorkflowFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: unknown) => Promise<void>
  workflowCapabilities?: WorkflowCapabilities
  nanoBananaConfig?: NanoBananaConfig
}

export type WorkflowGroupId =
  | 'seedance-2.0-fast'
  | 'seedance-2.0'
  | 'seedance-2.0-mini'
  | 'wavespeed-ai'
  | 'minimax-h3'
  | 'gpt-image-2'
  | 'nano-banana-pro'
  | 'nano-banana-2'

export interface WorkflowGroupDefinition {
  id: WorkflowGroupId
  label: string
}

export interface WorkflowCapabilities {
  promptRequired: boolean
  supportsAspectRatio: boolean
  supportsSeed: boolean
  durationMin: number
  durationMax: number
  resolutionOptions: SeedanceResolution[]
  defaultResolution?: SeedanceResolution
  supportsWebSearch?: boolean
  referenceLimits?: {
    referenceImages?: number
    referenceVideos?: number
    referenceAudios?: number
  }
}

export interface WorkflowDefinition {
  id: string
  label: string
  group: WorkflowGroupId
  submitLabel: string
  model: string
  capabilities?: WorkflowCapabilities
  nanoBananaConfig?: NanoBananaConfig
  form: ComponentType<WorkflowFormProps>
}

export const workflowGroups: WorkflowGroupDefinition[] = [
  { id: 'seedance-2.0', label: 'seedance-2.0' },
  { id: 'seedance-2.0-fast', label: 'seedance-2.0-fast' },
  { id: 'seedance-2.0-mini', label: 'seedance-2.0-mini' },
  { id: 'wavespeed-ai', label: 'wavespeed-ai' },
  { id: 'minimax-h3', label: 'wavespeed-ai/minimax-h3' },
  { id: 'gpt-image-2', label: 'openai/gpt-image-2' },
  { id: 'nano-banana-pro', label: 'google/nano-banana-pro' },
  { id: 'nano-banana-2', label: 'google/nano-banana-2' },
]

const standardResolutions: SeedanceResolution[] = ['480p', '720p', '1080p']
const turboResolutions: SeedanceResolution[] = ['720p', '1080p']
const miniResolutions: SeedanceResolution[] = ['480p', '720p', '1080p', '4k']
const miniTurboResolutions: SeedanceResolution[] = ['720p', '1080p']

const miniReferenceLimits = {
  referenceImages: 9,
  referenceVideos: 3,
  referenceAudios: 3,
} as const

const imageToVideoCapabilities: WorkflowCapabilities = {
  promptRequired: true,
  supportsAspectRatio: true,
  supportsSeed: false,
  durationMin: 4,
  durationMax: 15,
  resolutionOptions: standardResolutions,
}

const imageToVideoTurboCapabilities: WorkflowCapabilities = {
  ...imageToVideoCapabilities,
  resolutionOptions: turboResolutions,
}

const imageToVideoSpicyCapabilities: WorkflowCapabilities = {
  ...imageToVideoCapabilities,
  supportsSeed: true,
}

const textToVideoCapabilities: WorkflowCapabilities = {
  promptRequired: true,
  supportsAspectRatio: true,
  supportsSeed: false,
  durationMin: 4,
  durationMax: 15,
  resolutionOptions: standardResolutions,
}

const textToVideoTurboCapabilities: WorkflowCapabilities = {
  ...textToVideoCapabilities,
  resolutionOptions: turboResolutions,
}

const videoEditCapabilities: WorkflowCapabilities = {
  promptRequired: true,
  supportsAspectRatio: true,
  supportsSeed: false,
  durationMin: 4,
  durationMax: 15,
  resolutionOptions: standardResolutions,
}

const videoEditTurboCapabilities: WorkflowCapabilities = {
  ...videoEditCapabilities,
  resolutionOptions: turboResolutions,
}

const videoExtendCapabilities: WorkflowCapabilities = {
  promptRequired: true,
  supportsAspectRatio: false,
  supportsSeed: false,
  durationMin: 4,
  durationMax: 15,
  resolutionOptions: standardResolutions,
}

const miniImageToVideoCapabilities: WorkflowCapabilities = {
  ...imageToVideoCapabilities,
  resolutionOptions: miniResolutions,
  defaultResolution: '720p',
}

const miniImageToVideoTurboCapabilities: WorkflowCapabilities = {
  ...imageToVideoCapabilities,
  resolutionOptions: miniTurboResolutions,
  defaultResolution: '720p',
}

const miniImageToVideoSpicyCapabilities: WorkflowCapabilities = {
  ...imageToVideoCapabilities,
  promptRequired: false,
  supportsSeed: true,
  supportsWebSearch: false,
  resolutionOptions: miniResolutions,
  defaultResolution: '720p',
}

const miniTextToVideoCapabilities: WorkflowCapabilities = {
  ...textToVideoCapabilities,
  resolutionOptions: miniResolutions,
  defaultResolution: '720p',
  referenceLimits: miniReferenceLimits,
}

const miniTextToVideoTurboCapabilities: WorkflowCapabilities = {
  ...textToVideoCapabilities,
  resolutionOptions: miniTurboResolutions,
  defaultResolution: '720p',
  referenceLimits: miniReferenceLimits,
}

const miniVideoEditCapabilities: WorkflowCapabilities = {
  ...videoEditCapabilities,
  resolutionOptions: miniResolutions,
  defaultResolution: '720p',
  referenceLimits: {
    referenceImages: 9,
    referenceAudios: 3,
  },
}

const miniVideoEditTurboCapabilities: WorkflowCapabilities = {
  ...videoEditCapabilities,
  resolutionOptions: miniTurboResolutions,
  defaultResolution: '720p',
  referenceLimits: {
    referenceImages: 9,
    referenceAudios: 3,
  },
}

const miniVideoExtendCapabilities: WorkflowCapabilities = {
  ...videoExtendCapabilities,
  resolutionOptions: miniResolutions,
  defaultResolution: '720p',
}

export const workflows: WorkflowDefinition[] = [
  {
    id: 'seedance-2.0/image-to-video',
    label: 'seedance-2.0/image-to-video',
    group: 'seedance-2.0',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/image-to-video',
    capabilities: imageToVideoCapabilities,
    form: SeedanceImageToVideoForm,
  },
  {
    id: 'seedance-2.0/image-to-video-spicy',
    label: 'seedance-2.0/image-to-video-spicy',
    group: 'seedance-2.0',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/image-to-video-spicy',
    capabilities: imageToVideoSpicyCapabilities,
    form: SeedanceImageToVideoForm,
  },
  {
    id: 'seedance-2.0/image-to-video-turbo',
    label: 'seedance-2.0/image-to-video-turbo',
    group: 'seedance-2.0',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/image-to-video-turbo',
    capabilities: imageToVideoTurboCapabilities,
    form: SeedanceImageToVideoForm,
  },
  {
    id: 'seedance-2.0/text-to-video',
    label: 'seedance-2.0/text-to-video',
    group: 'seedance-2.0',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/text-to-video',
    capabilities: textToVideoCapabilities,
    form: SeedanceTextToVideoForm,
  },
  {
    id: 'seedance-2.0/text-to-video-turbo',
    label: 'seedance-2.0/text-to-video-turbo',
    group: 'seedance-2.0',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/text-to-video-turbo',
    capabilities: textToVideoTurboCapabilities,
    form: SeedanceTextToVideoForm,
  },
  {
    id: 'seedance-2.0/video-edit',
    label: 'seedance-2.0/video-edit',
    group: 'seedance-2.0',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/video-edit',
    capabilities: videoEditCapabilities,
    form: SeedanceVideoEditForm,
  },
  {
    id: 'seedance-2.0/video-edit-turbo',
    label: 'seedance-2.0/video-edit-turbo',
    group: 'seedance-2.0',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/video-edit-turbo',
    capabilities: videoEditTurboCapabilities,
    form: SeedanceVideoEditForm,
  },
  {
    id: 'seedance-2.0/video-extend',
    label: 'seedance-2.0/video-extend',
    group: 'seedance-2.0',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/video-extend',
    capabilities: videoExtendCapabilities,
    form: SeedanceVideoExtendForm,
  },
  {
    id: 'seedance-2.0-fast/image-to-video',
    label: 'seedance-2.0-fast/image-to-video',
    group: 'seedance-2.0-fast',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-fast/image-to-video',
    capabilities: imageToVideoCapabilities,
    form: SeedanceImageToVideoForm,
  },
  {
    id: 'seedance-2.0-fast/image-to-video-spicy',
    label: 'seedance-2.0-fast/image-to-video-spicy',
    group: 'seedance-2.0-fast',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-fast/image-to-video-spicy',
    capabilities: imageToVideoSpicyCapabilities,
    form: SeedanceImageToVideoForm,
  },
  {
    id: 'seedance-2.0-fast/image-to-video-turbo',
    label: 'seedance-2.0-fast/image-to-video-turbo',
    group: 'seedance-2.0-fast',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-fast/image-to-video-turbo',
    capabilities: imageToVideoTurboCapabilities,
    form: SeedanceImageToVideoForm,
  },
  {
    id: 'seedance-2.0-fast/text-to-video',
    label: 'seedance-2.0-fast/text-to-video',
    group: 'seedance-2.0-fast',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-fast/text-to-video',
    capabilities: textToVideoCapabilities,
    form: SeedanceTextToVideoForm,
  },
  {
    id: 'seedance-2.0-fast/text-to-video-turbo',
    label: 'seedance-2.0-fast/text-to-video-turbo',
    group: 'seedance-2.0-fast',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-fast/text-to-video-turbo',
    capabilities: textToVideoTurboCapabilities,
    form: SeedanceTextToVideoForm,
  },
  {
    id: 'seedance-2.0-fast/video-edit',
    label: 'seedance-2.0-fast/video-edit',
    group: 'seedance-2.0-fast',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-fast/video-edit',
    capabilities: videoEditCapabilities,
    form: SeedanceVideoEditForm,
  },
  {
    id: 'seedance-2.0-fast/video-edit-turbo',
    label: 'seedance-2.0-fast/video-edit-turbo',
    group: 'seedance-2.0-fast',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-fast/video-edit-turbo',
    capabilities: videoEditTurboCapabilities,
    form: SeedanceVideoEditForm,
  },
  {
    id: 'seedance-2.0-fast/video-extend',
    label: 'seedance-2.0-fast/video-extend',
    group: 'seedance-2.0-fast',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-fast/video-extend',
    capabilities: videoExtendCapabilities,
    form: SeedanceVideoExtendForm,
  },
  {
    id: 'seedance-2.0-mini/image-to-video',
    label: 'seedance-2.0-mini/image-to-video',
    group: 'seedance-2.0-mini',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-mini/image-to-video',
    capabilities: miniImageToVideoCapabilities,
    form: SeedanceImageToVideoForm,
  },
  {
    id: 'seedance-2.0-mini/image-to-video-spicy',
    label: 'seedance-2.0-mini/image-to-video-spicy',
    group: 'seedance-2.0-mini',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-mini/image-to-video-spicy',
    capabilities: miniImageToVideoSpicyCapabilities,
    form: SeedanceImageToVideoForm,
  },
  {
    id: 'seedance-2.0-mini/image-to-video-turbo',
    label: 'seedance-2.0-mini/image-to-video-turbo',
    group: 'seedance-2.0-mini',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-mini/image-to-video-turbo',
    capabilities: miniImageToVideoTurboCapabilities,
    form: SeedanceImageToVideoForm,
  },
  {
    id: 'seedance-2.0-mini/text-to-video',
    label: 'seedance-2.0-mini/text-to-video',
    group: 'seedance-2.0-mini',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-mini/text-to-video',
    capabilities: miniTextToVideoCapabilities,
    form: SeedanceTextToVideoForm,
  },
  {
    id: 'seedance-2.0-mini/text-to-video-turbo',
    label: 'seedance-2.0-mini/text-to-video-turbo',
    group: 'seedance-2.0-mini',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-mini/text-to-video-turbo',
    capabilities: miniTextToVideoTurboCapabilities,
    form: SeedanceTextToVideoForm,
  },
  {
    id: 'seedance-2.0-mini/video-edit',
    label: 'seedance-2.0-mini/video-edit',
    group: 'seedance-2.0-mini',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-mini/video-edit',
    capabilities: miniVideoEditCapabilities,
    form: SeedanceVideoEditForm,
  },
  {
    id: 'seedance-2.0-mini/video-edit-turbo',
    label: 'seedance-2.0-mini/video-edit-turbo',
    group: 'seedance-2.0-mini',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-mini/video-edit-turbo',
    capabilities: miniVideoEditTurboCapabilities,
    form: SeedanceVideoEditForm,
  },
  {
    id: 'seedance-2.0-mini/video-extend',
    label: 'seedance-2.0-mini/video-extend',
    group: 'seedance-2.0-mini',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0-mini/video-extend',
    capabilities: miniVideoExtendCapabilities,
    form: SeedanceVideoExtendForm,
  },
  {
    id: 'wavespeed-ai/seedvr2/video',
    label: 'wavespeed-ai/seedvr2/video',
    group: 'wavespeed-ai',
    submitLabel: 'Generate video',
    model: 'wavespeed-ai/seedvr2/video',
    form: SeedVr2VideoForm,
  },
  {
    id: 'wavespeed-ai/scail-2',
    label: 'wavespeed-ai/scail-2',
    group: 'wavespeed-ai',
    submitLabel: 'Generate video',
    model: 'wavespeed-ai/scail-2',
    form: Scail2Form,
  },
  {
    id: 'wavespeed-ai/minimax-h3/text-to-video',
    label: 'wavespeed-ai/minimax-h3/text-to-video',
    group: 'minimax-h3',
    submitLabel: 'Generate video',
    model: 'wavespeed-ai/minimax-h3/text-to-video',
    form: MinimaxH3TextToVideoForm,
  },
  {
    id: 'wavespeed-ai/minimax-h3/reference-to-video',
    label: 'wavespeed-ai/minimax-h3/reference-to-video',
    group: 'minimax-h3',
    submitLabel: 'Generate video',
    model: 'wavespeed-ai/minimax-h3/reference-to-video',
    form: MinimaxH3ReferenceToVideoForm,
  },
  {
    id: 'wavespeed-ai/minimax-h3/image-to-video',
    label: 'wavespeed-ai/minimax-h3/image-to-video',
    group: 'minimax-h3',
    submitLabel: 'Generate video',
    model: 'wavespeed-ai/minimax-h3/image-to-video',
    form: MinimaxH3ImageToVideoForm,
  },
  {
    id: 'openai/gpt-image-2/edit',
    label: 'openai/gpt-image-2/edit',
    group: 'gpt-image-2',
    submitLabel: 'Generate image',
    model: 'openai/gpt-image-2/edit',
    form: GptImageEditForm,
  },
  {
    id: 'openai/gpt-image-2/text-to-image',
    label: 'openai/gpt-image-2/text-to-image',
    group: 'gpt-image-2',
    submitLabel: 'Generate image',
    model: 'openai/gpt-image-2/text-to-image',
    form: GptImageTextToImageForm,
  },
  {
    id: 'google/nano-banana-pro/edit-ultra',
    label: 'google/nano-banana-pro/edit-ultra',
    group: 'nano-banana-pro',
    submitLabel: 'Generate image',
    model: 'google/nano-banana-pro/edit-ultra',
    nanoBananaConfig: nanoBananaConfigs['google/nano-banana-pro/edit-ultra'],
    form: NanoBananaEditForm,
  },
  {
    id: 'google/nano-banana-pro/edit-multi',
    label: 'google/nano-banana-pro/edit-multi',
    group: 'nano-banana-pro',
    submitLabel: 'Generate image',
    model: 'google/nano-banana-pro/edit-multi',
    nanoBananaConfig: nanoBananaConfigs['google/nano-banana-pro/edit-multi'],
    form: NanoBananaEditForm,
  },
  {
    id: 'google/nano-banana-pro/edit',
    label: 'google/nano-banana-pro/edit',
    group: 'nano-banana-pro',
    submitLabel: 'Generate image',
    model: 'google/nano-banana-pro/edit',
    nanoBananaConfig: nanoBananaConfigs['google/nano-banana-pro/edit'],
    form: NanoBananaEditForm,
  },
  {
    id: 'google/nano-banana-pro/text-to-image',
    label: 'google/nano-banana-pro/text-to-image',
    group: 'nano-banana-pro',
    submitLabel: 'Generate image',
    model: 'google/nano-banana-pro/text-to-image',
    nanoBananaConfig: nanoBananaConfigs['google/nano-banana-pro/text-to-image'],
    form: NanoBananaTextToImageForm,
  },
  {
    id: 'google/nano-banana-2/text-to-image',
    label: 'google/nano-banana-2/text-to-image',
    group: 'nano-banana-2',
    submitLabel: 'Generate image',
    model: 'google/nano-banana-2/text-to-image',
    nanoBananaConfig: nanoBananaConfigs['google/nano-banana-2/text-to-image'],
    form: NanoBananaTextToImageForm,
  },
  {
    id: 'google/nano-banana-2/text-to-image-fast',
    label: 'google/nano-banana-2/text-to-image-fast',
    group: 'nano-banana-2',
    submitLabel: 'Generate image',
    model: 'google/nano-banana-2/text-to-image-fast',
    nanoBananaConfig: nanoBananaConfigs['google/nano-banana-2/text-to-image-fast'],
    form: NanoBananaTextToImageForm,
  },
  {
    id: 'google/nano-banana-2/edit',
    label: 'google/nano-banana-2/edit',
    group: 'nano-banana-2',
    submitLabel: 'Generate image',
    model: 'google/nano-banana-2/edit',
    nanoBananaConfig: nanoBananaConfigs['google/nano-banana-2/edit'],
    form: NanoBananaEditForm,
  },
  {
    id: 'google/nano-banana-2/edit-fast',
    label: 'google/nano-banana-2/edit-fast',
    group: 'nano-banana-2',
    submitLabel: 'Generate image',
    model: 'google/nano-banana-2/edit-fast',
    nanoBananaConfig: nanoBananaConfigs['google/nano-banana-2/edit-fast'],
    form: NanoBananaEditForm,
  },
]

export const defaultWorkflowId = 'seedance-2.0/text-to-video'

export const defaultWorkflow =
  workflows.find((workflow) => workflow.id === defaultWorkflowId) ?? workflows[0]
