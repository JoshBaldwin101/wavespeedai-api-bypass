import { useMemo, useState } from 'react'
import type { SeedanceAspectRatio, SeedanceTextToVideoInput } from '../../lib/types'
import { SEEDANCE_ATTACHMENT_LIMITS, validateAttachmentLimit } from '../../lib/seedanceAttachmentLimits'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { SeedanceAdvancedFields } from './SeedanceAdvancedFields'

interface SeedanceTextToVideoFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  onSubmit: (input: SeedanceTextToVideoInput) => Promise<void>
}

type AspectRatioOption = SeedanceAspectRatio | 'auto'

export const SeedanceTextToVideoForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  onSubmit,
}: SeedanceTextToVideoFormProps) => {
  const maxReferenceImages = SEEDANCE_ATTACHMENT_LIMITS.textToVideo.referenceImages
  const [prompt, setPrompt] = useState('')
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([])
  const [referenceVideoUrls, setReferenceVideoUrls] = useState<string[]>([])
  const [referenceAudioUrls, setReferenceAudioUrls] = useState<string[]>([])
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('16:9')
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
    if (!prompt.trim()) return false
    if (typeof durationValue === 'number' && Number.isNaN(durationValue)) return false
    if (typeof durationValue === 'number' && (durationValue < 4 || durationValue > 15)) return false
    return true
  }, [prompt, durationValue])

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) return null
    if (typeof durationValue === 'number' && (Number.isNaN(durationValue) || durationValue < 4 || durationValue > 15)) {
      return null
    }
    if (referenceImageUrls.length > maxReferenceImages) return null

    const payload: SeedanceTextToVideoInput = {
      prompt: trimmedPrompt,
      resolution,
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceVideoUrls.length > 0) payload.reference_videos = referenceVideoUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    return payload as Record<string, unknown>
  }, [
    prompt,
    durationValue,
    maxReferenceImages,
    resolution,
    enableWebSearch,
    generateAudio,
    referenceImageUrls,
    referenceVideoUrls,
    referenceAudioUrls,
    aspectRatio,
  ])

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

    if (typeof durationValue === 'number' && Number.isNaN(durationValue)) {
      setError('Duration must be a whole number from 4 to 15.')
      return
    }

    if (typeof durationValue === 'number' && (durationValue < 4 || durationValue > 15)) {
      setError('Duration must be in the range 4 to 15 seconds.')
      return
    }

    const attachmentError = validateAttachmentLimit('Reference images', referenceImageUrls, maxReferenceImages)
    if (attachmentError) {
      setError(attachmentError)
      return
    }

    const payload: SeedanceTextToVideoInput = {
      prompt: trimmedPrompt,
      resolution,
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceVideoUrls.length > 0) payload.reference_videos = referenceVideoUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field label="Prompt" htmlFor="seedance-prompt" required>
        <textarea
          id="seedance-prompt"
          className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-28"
          placeholder="A cinematic tracking shot through a neon city at dusk."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Reference images"
        value={referenceImageUrls}
        onChange={setReferenceImageUrls}
        multiple
        maxItems={maxReferenceImages}
      />

      <MediaUpload
        apiKey={apiKey}
        kind="video"
        label="Reference videos"
        value={referenceVideoUrls}
        onChange={setReferenceVideoUrls}
        multiple
      />

      <MediaUpload
        apiKey={apiKey}
        kind="audio"
        label="Reference audios"
        value={referenceAudioUrls}
        onChange={setReferenceAudioUrls}
        multiple
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
