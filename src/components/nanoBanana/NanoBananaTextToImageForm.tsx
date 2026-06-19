import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import type {
  NanoBananaAspectRatio,
  NanoBananaOutputFormat,
  NanoBananaResolution,
  NanoBananaTextToImageInput,
} from '../../lib/types'
import type { NanoBananaConfig } from '../nanoBananaConfig'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { NanoBananaAdvancedFields } from './NanoBananaAdvancedFields'

type AspectRatioOption = NanoBananaAspectRatio | 'auto'

interface NanoBananaTextToImageFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  nanoBananaConfig?: NanoBananaConfig
  onSubmit: (input: NanoBananaTextToImageInput) => Promise<void>
}

export const NanoBananaTextToImageForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate image',
  nanoBananaConfig,
  onSubmit,
}: NanoBananaTextToImageFormProps) => {
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('auto')
  const [resolution, setResolution] = useState<NanoBananaResolution | ''>(nanoBananaConfig?.defaultResolution ?? '')
  const [outputFormat, setOutputFormat] = useState<NanoBananaOutputFormat>(nanoBananaConfig?.defaultOutputFormat ?? 'png')
  const [enableWebSearch, setEnableWebSearch] = useState(false)
  const [enableImageSearch, setEnableImageSearch] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || !nanoBananaConfig) return null

    const payload: Record<string, unknown> = {
      prompt: trimmedPrompt,
      output_format: outputFormat,
    }

    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (nanoBananaConfig.resolutionOptions && resolution) payload.resolution = resolution
    if (nanoBananaConfig.supportsWebSearch && enableWebSearch) payload.enable_web_search = true
    if (nanoBananaConfig.supportsImageSearch && enableImageSearch) payload.enable_image_search = true

    return payload
  }, [prompt, nanoBananaConfig, outputFormat, aspectRatio, resolution, enableWebSearch, enableImageSearch])

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
      setError('Please provide a prompt.')
      return
    }

    const payload: NanoBananaTextToImageInput = {
      prompt: trimmedPrompt,
      output_format: outputFormat,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (nanoBananaConfig.resolutionOptions && resolution) payload.resolution = resolution
    if (nanoBananaConfig.supportsWebSearch && enableWebSearch) payload.enable_web_search = true
    if (nanoBananaConfig.supportsImageSearch && enableImageSearch) payload.enable_image_search = true

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field label="Prompt" htmlFor="nano-banana-text-to-image-prompt" required>
        <textarea
          id="nano-banana-text-to-image-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
          placeholder="A cinematic portrait with dramatic lighting and rich color grading."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

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
          numImages=""
          onNumImagesChange={() => undefined}
        />
      ) : null}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="flex justify-end">
        <Button
          className="w-full sm:w-auto"
          type="submit"
          disabled={!prompt.trim() || !nanoBananaConfig || isSubmitting || isPricingLoading}
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
