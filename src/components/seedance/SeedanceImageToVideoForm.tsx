import { useMemo, useState } from 'react'
import type { SeedanceAspectRatio, SeedanceImageToVideoInput } from '../../lib/types'
import { SEEDANCE_ATTACHMENT_LIMITS } from '../../lib/seedanceAttachmentLimits'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { SeedanceAdvancedFields } from './SeedanceAdvancedFields'

interface SeedanceImageToVideoFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  onSubmit: (input: SeedanceImageToVideoInput) => Promise<void>
}

type AspectRatioOption = SeedanceAspectRatio | 'auto'

export const SeedanceImageToVideoForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  onSubmit,
}: SeedanceImageToVideoFormProps) => {
  const limits = SEEDANCE_ATTACHMENT_LIMITS.imageToVideo
  const [prompt, setPrompt] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [lastImageUrls, setLastImageUrls] = useState<string[]>([])
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('auto')
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p'>('720p')
  const [duration, setDuration] = useState('')
  const [enableWebSearch, setEnableWebSearch] = useState(false)
  const [generateAudio, setGenerateAudio] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const durationValue = useMemo(() => {
    if (!duration.trim()) return undefined
    const parsed = Number.parseInt(duration.trim(), 10)
    if (!Number.isFinite(parsed)) return Number.NaN
    return parsed
  }, [duration])

  const isFormValid = useMemo(() => {
    if (!imageUrls[0]) return false
    if (typeof durationValue === 'number' && Number.isNaN(durationValue)) return false
    if (typeof durationValue === 'number' && (durationValue < 4 || durationValue > 15)) return false
    return true
  }, [imageUrls, durationValue])

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    if (!imageUrls[0]) return null
    if (typeof durationValue === 'number' && (Number.isNaN(durationValue) || durationValue < 4 || durationValue > 15)) {
      return null
    }

    const payload: SeedanceImageToVideoInput = {
      image: imageUrls[0],
      resolution,
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt) payload.prompt = trimmedPrompt
    if (lastImageUrls[0]) payload.last_image = lastImageUrls[0]
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    return payload as Record<string, unknown>
  }, [imageUrls, durationValue, resolution, enableWebSearch, generateAudio, prompt, lastImageUrls, aspectRatio])

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

    if (!imageUrls[0]) {
      setError('Please provide a start image.')
      return
    }

    if (typeof durationValue === 'number' && Number.isNaN(durationValue)) {
      setError('Duration must be a whole number from 4 to 15.')
      return
    }

    if (typeof durationValue === 'number' && (durationValue < 4 || durationValue > 15)) {
      setError('Duration must be in the range 4 to 15 seconds.')
      return
    }

    const payload: SeedanceImageToVideoInput = {
      image: imageUrls[0],
      resolution,
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt) payload.prompt = trimmedPrompt
    if (lastImageUrls[0]) payload.last_image = lastImageUrls[0]
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field
        label="Prompt"
        htmlFor="seedance-prompt"
        hint="Optional. Describe the scene motion, camera movement, and mood."
      >
        <textarea
          id="seedance-prompt"
          className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-28"
          placeholder="The camera slowly pushes in as the wind lifts the subject's hair."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Start image"
        required
        value={imageUrls}
        onChange={setImageUrls}
        maxItems={limits.image}
        hint="Single image used as the starting frame."
      />

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Last frame image"
        value={lastImageUrls}
        onChange={setLastImageUrls}
        maxItems={limits.lastImage}
        hint="Optional target frame for continuation."
      />

      <SeedanceAdvancedFields
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        resolution={resolution}
        onResolutionChange={setResolution}
        duration={duration}
        onDurationChange={setDuration}
        enableWebSearch={enableWebSearch}
        onEnableWebSearchChange={setEnableWebSearch}
        generateAudio={generateAudio}
        onGenerateAudioChange={setGenerateAudio}
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
