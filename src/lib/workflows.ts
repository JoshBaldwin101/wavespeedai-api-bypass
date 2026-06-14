import type { ComponentType } from 'react'
import { SeedanceImageToVideoForm } from '../components/seedance/SeedanceImageToVideoForm'
import { SeedanceTextToVideoForm } from '../components/seedance/SeedanceTextToVideoForm'
import { SeedanceVideoEditForm } from '../components/seedance/SeedanceVideoEditForm'
import { SeedanceVideoExtendForm } from '../components/seedance/SeedanceVideoExtendForm'

export interface WorkflowFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  onSubmit: (input: unknown) => Promise<void>
}

export interface WorkflowDefinition {
  id: string
  label: string
  submitLabel: string
  model: string
  form: ComponentType<WorkflowFormProps>
}

export const workflows: WorkflowDefinition[] = [
  {
    id: 'bytedance-seedance-2-image-to-video',
    label: 'Bytedance Seedance 2.0 Image to Video',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/image-to-video',
    form: SeedanceImageToVideoForm,
  },
  {
    id: 'bytedance-seedance-2-text-to-video',
    label: 'Bytedance Seedance 2.0 Text to Video',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/text-to-video',
    form: SeedanceTextToVideoForm,
  },
  {
    id: 'bytedance-seedance-2-video-edit',
    label: 'Bytedance Seedance 2.0 Video Edit',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/video-edit',
    form: SeedanceVideoEditForm,
  },
  {
    id: 'bytedance-seedance-2-video-extend',
    label: 'Bytedance Seedance 2.0 Video Extend',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/video-extend',
    form: SeedanceVideoExtendForm,
  },
]
