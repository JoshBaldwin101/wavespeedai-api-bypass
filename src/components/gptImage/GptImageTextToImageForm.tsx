import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
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
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: GptImageTextToImageInput) => Promise<void>
}

type AspectRatioOption = GptImageAspectRatio | 'auto'

export const GptImageTextToImageForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate image',
  initialValues,
  onValuesChange,
  onSubmit,
}: GptImageTextToImageFormProps) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
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
  const [resolution, setResolution] = useState<GptImageResolution>(() => {
    const nextResolution = initialValues?.resolution
    if (nextResolution === '1k' || nextResolution === '2k' || nextResolution === '4k') {
      return nextResolution
    }
    return '1k'
  })
  const [quality, setQuality] = useState<GptImageQuality>(() => {
    const nextQuality = initialValues?.quality
    if (nextQuality === 'low' || nextQuality === 'medium' || nextQuality === 'high') {
      return nextQuality
    }
    return 'medium'
  })
  const [outputFormat, setOutputFormat] = useState<GptImageOutputFormat>(() => {
    const nextOutputFormat = initialValues?.output_format
    if (nextOutputFormat === 'png' || nextOutputFormat === 'jpeg' || nextOutputFormat === 'webp') {
      return nextOutputFormat
    }
    return 'png'
  })
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

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      prompt,
      resolution,
      quality,
      output_format: outputFormat,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    return payload
  }, [prompt, aspectRatio, resolution, quality, outputFormat])

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
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
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
