import type { ComponentType } from 'react'
import { GptImageEditForm } from '../components/gptImage/GptImageEditForm'
import { GptImageTextToImageForm } from '../components/gptImage/GptImageTextToImageForm'
import { Scail2Form } from '../components/scail/Scail2Form'
import { SeedanceImageToVideoForm } from '../components/seedance/SeedanceImageToVideoForm'
import { SeedanceTextToVideoForm } from '../components/seedance/SeedanceTextToVideoForm'
import { SeedanceVideoEditForm } from '../components/seedance/SeedanceVideoEditForm'
import { SeedanceVideoExtendForm } from '../components/seedance/SeedanceVideoExtendForm'
import type { SeedanceResolution } from './types'

export interface WorkflowFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  onSubmit: (input: unknown) => Promise<void>
  workflowCapabilities?: WorkflowCapabilities
}

export type WorkflowGroupId = 'seedance-2.0-fast' | 'seedance-2.0' | 'wavespeed-ai' | 'gpt-image-2'

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
}

export interface WorkflowDefinition {
  id: string
  label: string
  group: WorkflowGroupId
  submitLabel: string
  model: string
  capabilities?: WorkflowCapabilities
  form: ComponentType<WorkflowFormProps>
}

export const workflowGroups: WorkflowGroupDefinition[] = [
  { id: 'seedance-2.0', label: 'seedance-2.0' },
  { id: 'seedance-2.0-fast', label: 'seedance-2.0-fast' },
  { id: 'wavespeed-ai', label: 'wavespeed-ai' },
  { id: 'gpt-image-2', label: 'openai/gpt-image-2' },
]

const standardResolutions: SeedanceResolution[] = ['480p', '720p', '1080p']
const turboResolutions: SeedanceResolution[] = ['720p', '1080p']

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
    id: 'wavespeed-ai/scail-2',
    label: 'wavespeed-ai/scail-2',
    group: 'wavespeed-ai',
    submitLabel: 'Generate video',
    model: 'wavespeed-ai/scail-2',
    form: Scail2Form,
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
]

export const defaultWorkflowId = 'seedance-2.0/text-to-video'

export const defaultWorkflow =
  workflows.find((workflow) => workflow.id === defaultWorkflowId) ?? workflows[0]
