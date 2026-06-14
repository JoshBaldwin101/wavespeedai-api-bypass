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
    id: 'seedance-2.0/image-to-video',
    label: 'seedance-2.0/image-to-video',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/image-to-video',
    form: SeedanceImageToVideoForm,
  },
  {
    id: 'seedance-2.0/text-to-video',
    label: 'seedance-2.0/text-to-video',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/text-to-video',
    form: SeedanceTextToVideoForm,
  },
  {
    id: 'seedance-2.0/video-edit',
    label: 'seedance-2.0/video-edit',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/video-edit',
    form: SeedanceVideoEditForm,
  },
  {
    id: 'seedance-2.0/video-extend',
    label: 'seedance-2.0/video-extend',
    submitLabel: 'Generate video',
    model: 'bytedance/seedance-2.0/video-extend',
    form: SeedanceVideoExtendForm,
  },
]
