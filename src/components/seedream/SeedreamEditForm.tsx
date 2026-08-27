import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { validateAttachmentLimit } from '../../lib/attachmentLimits'
import type {
  SeedreamAspectRatio,
  SeedreamEditInput,
  SeedreamOutputFormat,
  SeedreamPromptOptimizationMode,
  SeedreamResolution,
} from '../../lib/types'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { SeedreamAdvancedFields } from './SeedreamAdvancedFields'

const MAX_SEEDREAM_EDIT_IMAGES = 10

interface SeedreamEditFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: SeedreamEditInput) => Promise<void>
}

type AspectRatioOption = SeedreamAspectRatio | 'auto'

export const SeedreamEditForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate image',
  initialValues,
  onValuesChange,
  onSubmit,
}: SeedreamEditFormProps) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [imageUrls, setImageUrls] = useState<string[]>(() =>
    Array.isArray(initialValues?.images) ? initialValues.images.filter((value): value is string => typeof value === 'string') : [],
  )
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(() => {
    const nextAspectRatio = initialValues?.aspect_ratio
    if (
      nextAspectRatio === '1:1' ||
      nextAspectRatio === '1:2' ||
      nextAspectRatio === '2:1' ||
      nextAspectRatio === '1:3' ||
      nextAspectRatio === '3:1' ||
      nextAspectRatio === '2:3' ||
      nextAspectRatio === '3:2' ||
      nextAspectRatio === '3:4' ||
      nextAspectRatio === '4:3' ||
      nextAspectRatio === '4:5' ||
      nextAspectRatio === '5:4' ||
      nextAspectRatio === '9:16' ||
      nextAspectRatio === '16:9' ||
      nextAspectRatio === '9:21' ||
      nextAspectRatio === '21:9'
    ) {
      return nextAspectRatio
    }
    return 'auto'
  })
  const [resolution, setResolution] = useState<SeedreamResolution>(() => {
    const nextResolution = initialValues?.resolution
    if (nextResolution === '1k' || nextResolution === '1.5k' || nextResolution === '2k') {
      return nextResolution
    }
    return '1k'
  })
  const [outputFormat, setOutputFormat] = useState<SeedreamOutputFormat>(() => {
    const nextOutputFormat = initialValues?.output_format
    if (nextOutputFormat === 'jpeg' || nextOutputFormat === 'png') {
      return nextOutputFormat
    }
    return 'jpeg'
  })
  const [promptOptimizationMode, setPromptOptimizationMode] = useState<SeedreamPromptOptimizationMode>(() => {
    const nextMode = initialValues?.prompt_optimization_mode
    if (nextMode === 'standard' || nextMode === 'fast') {
      return nextMode
    }
    return 'standard'
  })
  const [error, setError] = useState<string | null>(null)

  const hasAttachmentOverflow = imageUrls.length > MAX_SEEDREAM_EDIT_IMAGES
  const isFormValid = Boolean(prompt.trim() && imageUrls.length > 0 && !hasAttachmentOverflow)

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || imageUrls.length < 1 || hasAttachmentOverflow) return null

    const payload: Record<string, unknown> = {
      prompt: trimmedPrompt,
      images: imageUrls,
      resolution,
      output_format: outputFormat,
      prompt_optimization_mode: promptOptimizationMode,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    return payload
  }, [prompt, imageUrls, hasAttachmentOverflow, aspectRatio, resolution, outputFormat, promptOptimizationMode])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      prompt,
      resolution,
      output_format: outputFormat,
      prompt_optimization_mode: promptOptimizationMode,
    }
    if (imageUrls.length > 0) payload.images = imageUrls
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    return payload
  }, [prompt, imageUrls, aspectRatio, resolution, outputFormat, promptOptimizationMode])

  usePersistedFormDraft(onValuesChange, draftInput)

  const { livePricing, isPricingLoading } = useLivePricing({
    apiKey,
    pricingModelId,
    pricingInput,
  })

  const liveSubmitLabel = useMemo(
    () =>
      buildSubmitLabel({
        isSubmitting,
        isPricingLoading,
        livePricing,
        submitLabel,
      }),
    [isSubmitting, isPricingLoading, livePricing, submitLabel],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      setError('Please provide an edit prompt.')
      return
    }
    if (imageUrls.length < 1) {
      setError('Please provide at least one input image.')
      return
    }

    const attachmentError = validateAttachmentLimit('Input images', imageUrls, MAX_SEEDREAM_EDIT_IMAGES)
    if (attachmentError) {
      setError(attachmentError)
      return
    }

    const payload: SeedreamEditInput = {
      prompt: trimmedPrompt,
      images: imageUrls,
      resolution,
      output_format: outputFormat,
      prompt_optimization_mode: promptOptimizationMode,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field label="Edit prompt" htmlFor="seedream-edit-prompt" required>
        <textarea
          id="seedream-edit-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
          placeholder="Keep the subject, restyle the lighting to a cinematic dusk, and add subtle film grain."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Input images"
        required
        value={imageUrls}
        onChange={setImageUrls}
        multiple
        maxItems={MAX_SEEDREAM_EDIT_IMAGES}
        hint="One or more images can be used as references for the edit."
      />

      <SeedreamAdvancedFields
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        resolution={resolution}
        onResolutionChange={setResolution}
        outputFormat={outputFormat}
        onOutputFormatChange={setOutputFormat}
        promptOptimizationMode={promptOptimizationMode}
        onPromptOptimizationModeChange={setPromptOptimizationMode}
      />

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="flex justify-end">
        <Button
          className="w-full sm:w-auto"
          type="submit"
          disabled={!isFormValid || isSubmitting || isPricingLoading}
          leadingIcon={
            isPricingLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-slate-950" /> : null
          }
        >
          {liveSubmitLabel}
        </Button>
      </div>
    </form>
  )
}
