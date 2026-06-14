import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import type {
  GptImageAspectRatio,
  GptImageOutputFormat,
  GptImageQuality,
  GptImageResolution,
  GptImageTextToImageInput,
} from '../../lib/types'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { GptImageAdvancedFields } from './GptImageAdvancedFields'

interface GptImageTextToImageFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  onSubmit: (input: GptImageTextToImageInput) => Promise<void>
}

type AspectRatioOption = GptImageAspectRatio | 'auto'

export const GptImageTextToImageForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate image',
  onSubmit,
}: GptImageTextToImageFormProps) => {
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('auto')
  const [resolution, setResolution] = useState<GptImageResolution>('1k')
  const [quality, setQuality] = useState<GptImageQuality>('medium')
  const [outputFormat, setOutputFormat] = useState<GptImageOutputFormat>('png')
  const [error, setError] = useState<string | null>(null)

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) return null

    const payload: Record<string, unknown> = {
      prompt: trimmedPrompt,
      resolution,
      quality,
      output_format: outputFormat,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    return payload
  }, [prompt, aspectRatio, resolution, quality, outputFormat])

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
      setError('Please provide a prompt.')
      return
    }

    const payload: GptImageTextToImageInput = {
      prompt: trimmedPrompt,
      resolution,
      quality,
      output_format: outputFormat,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field label="Prompt" htmlFor="gpt-image-prompt" required>
        <textarea
          id="gpt-image-prompt"
          className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-28"
          placeholder="A cinematic portrait of a robot painter in a neon studio."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

      <GptImageAdvancedFields
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        resolution={resolution}
        onResolutionChange={setResolution}
        quality={quality}
        onQualityChange={setQuality}
        outputFormat={outputFormat}
        onOutputFormatChange={setOutputFormat}
      />

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="flex justify-end">
        <Button
          className="w-full sm:w-auto"
          type="submit"
          disabled={!prompt.trim() || isSubmitting || isPricingLoading}
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
