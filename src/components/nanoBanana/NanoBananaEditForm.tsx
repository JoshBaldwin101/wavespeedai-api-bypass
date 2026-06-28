import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { evaluateIntegerField } from '../../lib/numericField'
import type {
  NanoBananaAspectRatio,
  NanoBananaEditInput,
  NanoBananaOutputFormat,
  NanoBananaResolution,
} from '../../lib/types'
import type { NanoBananaConfig } from '../nanoBananaConfig'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { NanoBananaAdvancedFields } from './NanoBananaAdvancedFields'

type AspectRatioOption = NanoBananaAspectRatio | 'auto'

interface NanoBananaEditFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  nanoBananaConfig?: NanoBananaConfig
  onSubmit: (input: NanoBananaEditInput) => Promise<void>
}

export const NanoBananaEditForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate image',
  initialValues,
  onValuesChange,
  nanoBananaConfig,
  onSubmit,
}: NanoBananaEditFormProps) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [imageUrls, setImageUrls] = useState<string[]>(() =>
    Array.isArray(initialValues?.images) ? initialValues.images.filter((value): value is string => typeof value === 'string') : [],
  )
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(() => {
    const nextAspectRatio = initialValues?.aspect_ratio
    if (
      nextAspectRatio === '1:1' ||
      nextAspectRatio === '3:2' ||
      nextAspectRatio === '2:3' ||
      nextAspectRatio === '3:4' ||
      nextAspectRatio === '4:3' ||
      nextAspectRatio === '4:5' ||
      nextAspectRatio === '5:4' ||
      nextAspectRatio === '9:16' ||
      nextAspectRatio === '16:9' ||
      nextAspectRatio === '21:9' ||
      nextAspectRatio === '1:4' ||
      nextAspectRatio === '4:1' ||
      nextAspectRatio === '1:8' ||
      nextAspectRatio === '8:1'
    ) {
      return nextAspectRatio
    }
    return 'auto'
  })
  const [resolution, setResolution] = useState<NanoBananaResolution | ''>(() => {
    const nextResolution = initialValues?.resolution
    if (
      nextResolution === '0.5k' ||
      nextResolution === '1k' ||
      nextResolution === '2k' ||
      nextResolution === '4k' ||
      nextResolution === '8k'
    ) {
      return nextResolution
    }
    return nanoBananaConfig?.defaultResolution ?? ''
  })
  const [outputFormat, setOutputFormat] = useState<NanoBananaOutputFormat>(() => {
    const nextOutputFormat = initialValues?.output_format
    if (nextOutputFormat === 'png' || nextOutputFormat === 'jpeg' || nextOutputFormat === 'webp') {
      return nextOutputFormat
    }
    return nanoBananaConfig?.defaultOutputFormat ?? 'png'
  })
  const [enableWebSearch, setEnableWebSearch] = useState(() => initialValues?.enable_web_search === true)
  const [enableImageSearch, setEnableImageSearch] = useState(() => initialValues?.enable_image_search === true)
  const [numImages, setNumImages] = useState(() =>
    typeof initialValues?.num_images === 'number' ? String(initialValues.num_images) : '',
  )
  const [error, setError] = useState<string | null>(null)

  const maxImages = nanoBananaConfig?.maxImages ?? 14
  const hasAttachmentOverflow = imageUrls.length > maxImages

  const { value: numImagesValue, error: numImagesError } = useMemo(() => {
    if (!nanoBananaConfig?.supportsNumImages) {
      return { value: undefined, error: null }
    }

    return evaluateIntegerField(numImages, {
      label: 'Number of outputs',
      min: 1,
      max: nanoBananaConfig.maxNumImages ?? 4,
    })
  }, [numImages, nanoBananaConfig])

  const isFormValid = useMemo(
    () =>
      Boolean(prompt.trim() && imageUrls.length > 0 && !hasAttachmentOverflow && !numImagesError && nanoBananaConfig),
    [prompt, imageUrls, hasAttachmentOverflow, numImagesError, nanoBananaConfig],
  )

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || !imageUrls[0] || !nanoBananaConfig || hasAttachmentOverflow || numImagesError) return null

    const payload: Record<string, unknown> = {
      prompt: trimmedPrompt,
      images: imageUrls,
      output_format: outputFormat,
    }

    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (nanoBananaConfig.resolutionOptions && resolution) payload.resolution = resolution
    if (nanoBananaConfig.supportsWebSearch && enableWebSearch) payload.enable_web_search = true
    if (nanoBananaConfig.supportsImageSearch && enableImageSearch) payload.enable_image_search = true
    if (nanoBananaConfig.supportsNumImages && typeof numImagesValue === 'number' && numImagesValue > 1) {
      payload.num_images = numImagesValue
    }

    return payload
  }, [
    prompt,
    imageUrls,
    nanoBananaConfig,
    hasAttachmentOverflow,
    numImagesError,
    outputFormat,
    aspectRatio,
    resolution,
    enableWebSearch,
    enableImageSearch,
    numImagesValue,
  ])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      prompt,
      output_format: outputFormat,
    }

    if (imageUrls.length > 0) payload.images = imageUrls
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (nanoBananaConfig?.resolutionOptions && resolution) payload.resolution = resolution
    if (nanoBananaConfig?.supportsWebSearch && enableWebSearch) payload.enable_web_search = true
    if (nanoBananaConfig?.supportsImageSearch && enableImageSearch) payload.enable_image_search = true
    if (nanoBananaConfig?.supportsNumImages && typeof numImagesValue === 'number' && numImagesValue > 1) {
      payload.num_images = numImagesValue
    }

    return payload
  }, [
    prompt,
    imageUrls,
    outputFormat,
    aspectRatio,
    resolution,
    enableWebSearch,
    enableImageSearch,
    numImagesValue,
    nanoBananaConfig,
  ])

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

    if (!nanoBananaConfig) {
      setError('Workflow config is missing. Please choose the workflow again.')
      return
    }

    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      setError('Please provide an edit prompt.')
      return
    }
    if (!imageUrls[0]) {
      setError('Please provide at least one input image.')
      return
    }
    if (imageUrls.length > maxImages) {
      setError(`Input images accept at most ${maxImages} files.`)
      return
    }
    if (numImagesError) {
      setError(numImagesError)
      return
    }

    const payload: NanoBananaEditInput = {
      prompt: trimmedPrompt,
      images: imageUrls,
      output_format: outputFormat,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (nanoBananaConfig.resolutionOptions && resolution) payload.resolution = resolution
    if (nanoBananaConfig.supportsWebSearch && enableWebSearch) payload.enable_web_search = true
    if (nanoBananaConfig.supportsImageSearch && enableImageSearch) payload.enable_image_search = true
    if (nanoBananaConfig.supportsNumImages && typeof numImagesValue === 'number' && numImagesValue > 1) {
      payload.num_images = numImagesValue
    }

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field label="Edit prompt" htmlFor="nano-banana-edit-prompt" required>
        <textarea
          id="nano-banana-edit-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
          placeholder="Swap the background to a golden-hour city street and preserve the subject details."
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
        maxItems={maxImages}
        hint="One or more images can be used as references for the edit."
      />

      {nanoBananaConfig ? (
        <NanoBananaAdvancedFields
          config={nanoBananaConfig}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          resolution={resolution}
          onResolutionChange={setResolution}
          outputFormat={outputFormat}
          onOutputFormatChange={setOutputFormat}
          enableWebSearch={enableWebSearch}
          onEnableWebSearchChange={setEnableWebSearch}
          enableImageSearch={enableImageSearch}
          onEnableImageSearchChange={setEnableImageSearch}
          numImages={numImages}
          onNumImagesChange={setNumImages}
          numImagesError={numImagesError}
        />
      ) : null}

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
