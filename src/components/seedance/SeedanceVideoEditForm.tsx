import { useMemo, useState } from 'react'
import type { SeedanceAspectRatio, SeedanceResolution, SeedanceVideoEditInput } from '../../lib/types'
import { evaluateIntegerField } from '../../lib/numericField'
import { SEEDANCE_ATTACHMENT_LIMITS, validateAttachmentLimit } from '../../lib/seedanceAttachmentLimits'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
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
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  workflowCapabilities?: WorkflowCapabilities
  onSubmit: (input: SeedanceVideoEditInput) => Promise<void>
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

export const SeedanceVideoEditForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  initialValues,
  onValuesChange,
  workflowCapabilities,
  onSubmit,
}: SeedanceVideoEditFormProps) => {
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
  const limits = SEEDANCE_ATTACHMENT_LIMITS.videoEdit
  const maxReferenceImages = referenceLimits?.referenceImages ?? limits.referenceImages
  const maxReferenceAudios = referenceLimits?.referenceAudios ?? limits.referenceAudios
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [videoUrls, setVideoUrls] = useState<string[]>(() =>
    typeof initialValues?.video === 'string' ? [initialValues.video] : [],
  )
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>(() =>
    Array.isArray(initialValues?.reference_images)
      ? initialValues.reference_images.filter((value): value is string => typeof value === 'string')
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
    return 'auto'
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
    if (!videoUrls[0]) return false
    if (durationError) return false
    return true
  }, [promptRequired, prompt, videoUrls, durationError])

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if ((promptRequired && !trimmedPrompt) || !videoUrls[0]) return null
    if (durationError) return null
    if (referenceImageUrls.length > maxReferenceImages) return null

    const payload: SeedanceVideoEditInput = {
      prompt: trimmedPrompt,
      resolution,
      video: videoUrls[0],
      generate_audio: generateAudio,
    }

    if (supportsWebSearch) payload.enable_web_search = enableWebSearch
    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    return payload as Record<string, unknown>
  }, [
    prompt,
    promptRequired,
    videoUrls,
    durationError,
    durationValue,
    maxReferenceImages,
    resolution,
    supportsWebSearch,
    enableWebSearch,
    generateAudio,
    referenceImageUrls,
    referenceAudioUrls,
    aspectRatio,
  ])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      prompt,
      resolution,
      generate_audio: generateAudio,
    }

    if (supportsWebSearch) payload.enable_web_search = enableWebSearch
    if (videoUrls[0]) payload.video = videoUrls[0]
    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    return payload
  }, [
    prompt,
    videoUrls,
    resolution,
    supportsWebSearch,
    enableWebSearch,
    generateAudio,
    referenceImageUrls,
    referenceAudioUrls,
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
      setError('Please provide an edit prompt.')
      return
    }

    if (!videoUrls[0]) {
      setError('Please upload one input video.')
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

    const payload: SeedanceVideoEditInput = {
      prompt: trimmedPrompt,
      resolution,
      video: videoUrls[0],
      generate_audio: generateAudio,
    }

    if (supportsWebSearch) payload.enable_web_search = enableWebSearch
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
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
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
        maxItems={maxReferenceImages}
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
