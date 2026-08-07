import { useMemo, useState } from 'react'
import type { SeedanceAspectRatio, SeedanceResolution, SeedanceTextToVideoInput } from '../../lib/types'
import { evaluateIntegerField } from '../../lib/numericField'
import { SEEDANCE_ATTACHMENT_LIMITS, validateAttachmentLimit } from '../../lib/seedanceAttachmentLimits'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import type { WorkflowCapabilities } from '../../lib/workflows'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { SeedanceAdvancedFields } from './SeedanceAdvancedFields'

interface SeedanceTextToVideoFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  workflowCapabilities?: WorkflowCapabilities
  onSubmit: (input: SeedanceTextToVideoInput) => Promise<void>
}

type AspectRatioOption = SeedanceAspectRatio | 'auto'

const resolveResolution = (
  nextResolution: unknown,
  resolutionOptions: SeedanceResolution[],
  defaultResolution?: SeedanceResolution,
): SeedanceResolution => {
  if (typeof nextResolution === 'string' && resolutionOptions.includes(nextResolution as SeedanceResolution)) {
    return nextResolution as SeedanceResolution
  }
  return defaultResolution ?? resolutionOptions[0] ?? '720p'
}

export const SeedanceTextToVideoForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  initialValues,
  onValuesChange,
  workflowCapabilities,
  onSubmit,
}: SeedanceTextToVideoFormProps) => {
  const {
    durationMin = 4,
    durationMax = 15,
    promptRequired = true,
    resolutionOptions = ['480p', '720p', '1080p'],
    defaultResolution,
    supportsAspectRatio = true,
    supportsWebSearch = true,
    referenceLimits,
  } = workflowCapabilities ?? {}
  const maxReferenceImages = referenceLimits?.referenceImages ?? SEEDANCE_ATTACHMENT_LIMITS.textToVideo.referenceImages
  const maxReferenceVideos = referenceLimits?.referenceVideos ?? SEEDANCE_ATTACHMENT_LIMITS.textToVideo.referenceVideos
  const maxReferenceAudios = referenceLimits?.referenceAudios ?? SEEDANCE_ATTACHMENT_LIMITS.textToVideo.referenceAudios
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>(() =>
    Array.isArray(initialValues?.reference_images)
      ? initialValues.reference_images.filter((value): value is string => typeof value === 'string')
      : [],
  )
  const [referenceVideoUrls, setReferenceVideoUrls] = useState<string[]>(() =>
    Array.isArray(initialValues?.reference_videos)
      ? initialValues.reference_videos.filter((value): value is string => typeof value === 'string')
      : [],
  )
  const [referenceAudioUrls, setReferenceAudioUrls] = useState<string[]>(() =>
    Array.isArray(initialValues?.reference_audios)
      ? initialValues.reference_audios.filter((value): value is string => typeof value === 'string')
      : [],
  )
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(() => {
    const nextAspectRatio = initialValues?.aspect_ratio
    if (
      nextAspectRatio === '16:9' ||
      nextAspectRatio === '9:16' ||
      nextAspectRatio === '4:3' ||
      nextAspectRatio === '3:4' ||
      nextAspectRatio === '1:1' ||
      nextAspectRatio === '21:9'
    ) {
      return nextAspectRatio
    }
    return '16:9'
  })
  const [resolution, setResolution] = useState<SeedanceResolution>(() =>
    resolveResolution(initialValues?.resolution, resolutionOptions, defaultResolution),
  )
  const [duration, setDuration] = useState(() =>
    typeof initialValues?.duration === 'number' ? String(initialValues.duration) : '',
  )
  const [enableWebSearch, setEnableWebSearch] = useState(() => initialValues?.enable_web_search === true)
  const [generateAudio, setGenerateAudio] = useState(() =>
    typeof initialValues?.generate_audio === 'boolean' ? initialValues.generate_audio : true,
  )
  const [error, setError] = useState<string | null>(null)

  const { value: durationValue, error: durationError } = useMemo(
    () => evaluateIntegerField(duration, { label: 'Duration', min: durationMin, max: durationMax }),
    [duration, durationMin, durationMax],
  )

  const isFormValid = useMemo(() => {
    if (promptRequired && !prompt.trim()) return false
    if (durationError) return false
    return true
  }, [promptRequired, prompt, durationError])

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (promptRequired && !trimmedPrompt) return null
    if (durationError) return null
    if (referenceImageUrls.length > maxReferenceImages) return null

    const payload: SeedanceTextToVideoInput = {
      prompt: trimmedPrompt,
      resolution,
      generate_audio: generateAudio,
    }

    if (supportsWebSearch) payload.enable_web_search = enableWebSearch
    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceVideoUrls.length > 0) payload.reference_videos = referenceVideoUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (supportsAspectRatio && aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    return payload as Record<string, unknown>
  }, [
    prompt,
    promptRequired,
    durationError,
    durationValue,
    maxReferenceImages,
    resolution,
    supportsWebSearch,
    enableWebSearch,
    generateAudio,
    referenceImageUrls,
    referenceVideoUrls,
    referenceAudioUrls,
    supportsAspectRatio,
    aspectRatio,
  ])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      prompt,
      resolution,
      generate_audio: generateAudio,
    }

    if (supportsWebSearch) payload.enable_web_search = enableWebSearch
    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceVideoUrls.length > 0) payload.reference_videos = referenceVideoUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (supportsAspectRatio && aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    return payload
  }, [
    prompt,
    resolution,
    supportsWebSearch,
    enableWebSearch,
    generateAudio,
    referenceImageUrls,
    referenceVideoUrls,
    referenceAudioUrls,
    supportsAspectRatio,
    aspectRatio,
    durationValue,
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

    const trimmedPrompt = prompt.trim()
    if (promptRequired && !trimmedPrompt) {
      setError('Please provide a prompt.')
      return
    }

    if (durationError) {
      setError(durationError)
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
      generate_audio: generateAudio,
    }

    if (supportsWebSearch) payload.enable_web_search = enableWebSearch
    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceVideoUrls.length > 0) payload.reference_videos = referenceVideoUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (supportsAspectRatio && aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field label="Prompt" htmlFor="seedance-prompt" required={promptRequired}>
        <textarea
          id="seedance-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
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
        maxItems={maxReferenceVideos}
        hint="Optional."
      />

      <MediaUpload
        apiKey={apiKey}
        kind="audio"
        label="Reference audios"
        value={referenceAudioUrls}
        onChange={setReferenceAudioUrls}
        multiple
        maxItems={maxReferenceAudios}
        hint="Optional."
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
        durationError={durationError}
        durationMin={durationMin}
        durationMax={durationMax}
        showWebSearch={supportsWebSearch}
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
