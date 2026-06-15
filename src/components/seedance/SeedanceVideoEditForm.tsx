import { useMemo, useState } from 'react'
import type { SeedanceAspectRatio, SeedanceVideoEditInput } from '../../lib/types'
import { SEEDANCE_ATTACHMENT_LIMITS, validateAttachmentLimit } from '../../lib/seedanceAttachmentLimits'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import type { WorkflowCapabilities } from '../../lib/workflows'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { MediaUpload } from '../MediaUpload'
import { SeedanceAdvancedFields } from './SeedanceAdvancedFields'

interface SeedanceVideoEditFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  workflowCapabilities?: WorkflowCapabilities
  onSubmit: (input: SeedanceVideoEditInput) => Promise<void>
}

type AspectRatioOption = SeedanceAspectRatio | 'auto'

export const SeedanceVideoEditForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  workflowCapabilities,
  onSubmit,
}: SeedanceVideoEditFormProps) => {
  const {
    durationMin = 4,
    durationMax = 15,
    promptRequired = true,
    resolutionOptions = ['480p', '720p', '1080p'],
    supportsAspectRatio = true,
  } = workflowCapabilities ?? {}
  const limits = SEEDANCE_ATTACHMENT_LIMITS.videoEdit
  const [prompt, setPrompt] = useState('')
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([])
  const [referenceAudioUrls, setReferenceAudioUrls] = useState<string[]>([])
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('auto')
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p'>(resolutionOptions[0] ?? '720p')
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
    if (promptRequired && !prompt.trim()) return false
    if (!videoUrls[0]) return false
    if (typeof durationValue === 'number' && Number.isNaN(durationValue)) return false
    if (typeof durationValue === 'number' && (durationValue < durationMin || durationValue > durationMax)) return false
    return true
  }, [promptRequired, prompt, videoUrls, durationValue, durationMin, durationMax])

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if ((promptRequired && !trimmedPrompt) || !videoUrls[0]) return null
    if (
      typeof durationValue === 'number' &&
      (Number.isNaN(durationValue) || durationValue < durationMin || durationValue > durationMax)
    ) {
      return null
    }
    if (referenceImageUrls.length > limits.referenceImages) return null

    const payload: SeedanceVideoEditInput = {
      prompt: trimmedPrompt,
      resolution,
      video: videoUrls[0],
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    return payload as Record<string, unknown>
  }, [
    prompt,
    promptRequired,
    videoUrls,
    durationValue,
    durationMin,
    durationMax,
    limits.referenceImages,
    resolution,
    enableWebSearch,
    generateAudio,
    referenceImageUrls,
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
    if (promptRequired && !trimmedPrompt) {
      setError('Please provide an edit prompt.')
      return
    }

    if (!videoUrls[0]) {
      setError('Please upload one input video.')
      return
    }

    if (typeof durationValue === 'number' && Number.isNaN(durationValue)) {
      setError(`Duration must be a whole number from ${durationMin} to ${durationMax}.`)
      return
    }

    if (typeof durationValue === 'number' && (durationValue < durationMin || durationValue > durationMax)) {
      setError(`Duration must be in the range ${durationMin} to ${durationMax} seconds.`)
      return
    }

    const attachmentError = validateAttachmentLimit('Reference images', referenceImageUrls, limits.referenceImages)
    if (attachmentError) {
      setError(attachmentError)
      return
    }

    const payload: SeedanceVideoEditInput = {
      prompt: trimmedPrompt,
      resolution,
      video: videoUrls[0],
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field
        label="Edit prompt"
        htmlFor="seedance-prompt"
        hint='WaveSpeed prepends "Edit the input video." automatically.'
        required={promptRequired}
      >
        <textarea
          id="seedance-prompt"
          className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-28"
          placeholder="Change the time to a rainy night."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

      <MediaUpload
        apiKey={apiKey}
        kind="video"
        label="Input video"
        required
        value={videoUrls}
        onChange={setVideoUrls}
        maxItems={limits.video}
        hint="Single file. WaveSpeed trims source videos longer than 15 seconds, and turbo variants can pad very short inputs."
      />

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Reference images"
        value={referenceImageUrls}
        onChange={setReferenceImageUrls}
        multiple
        maxItems={limits.referenceImages}
      />

      <MediaUpload
        apiKey={apiKey}
        kind="audio"
        label="Reference audios"
        value={referenceAudioUrls}
        onChange={setReferenceAudioUrls}
        multiple
        maxItems={limits.referenceAudios}
        hint="Optional. Combined reference audio duration must stay within 15 seconds."
      />

      <SeedanceAdvancedFields
        showAspectRatio={supportsAspectRatio}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        resolution={resolution}
        onResolutionChange={setResolution}
        resolutionOptions={resolutionOptions}
        duration={duration}
        onDurationChange={setDuration}
        durationMin={durationMin}
        durationMax={durationMax}
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
