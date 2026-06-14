import { useMemo, useState } from 'react'
import type { SeedanceAspectRatio, SeedanceVideoExtendInput } from '../../lib/types'
import { SEEDANCE_ATTACHMENT_LIMITS } from '../../lib/seedanceAttachmentLimits'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import type { WorkflowCapabilities } from '../../lib/workflows'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { SeedanceAdvancedFields } from './SeedanceAdvancedFields'

interface SeedanceVideoExtendFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  workflowCapabilities: WorkflowCapabilities
  onSubmit: (input: SeedanceVideoExtendInput) => Promise<void>
}

type AspectRatioOption = SeedanceAspectRatio | 'auto'

export const SeedanceVideoExtendForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  workflowCapabilities,
  onSubmit,
}: SeedanceVideoExtendFormProps) => {
  const { durationMin, durationMax, promptRequired, resolutionOptions } = workflowCapabilities
  const limits = SEEDANCE_ATTACHMENT_LIMITS.videoExtend
  const [prompt, setPrompt] = useState('')
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  const [lastImageUrls, setLastImageUrls] = useState<string[]>([])
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
    if (promptRequired && !trimmedPrompt) return null
    if (!videoUrls[0]) return null
    if (
      typeof durationValue === 'number' &&
      (Number.isNaN(durationValue) || durationValue < durationMin || durationValue > durationMax)
    ) {
      return null
    }

    const payload: SeedanceVideoExtendInput = {
      video: videoUrls[0],
      resolution,
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    if (trimmedPrompt) payload.prompt = trimmedPrompt
    if (lastImageUrls[0]) payload.last_image = lastImageUrls[0]
    if (typeof durationValue === 'number') payload.duration = durationValue

    return payload as Record<string, unknown>
  }, [
    prompt,
    promptRequired,
    videoUrls,
    durationValue,
    durationMin,
    durationMax,
    resolution,
    enableWebSearch,
    generateAudio,
    lastImageUrls,
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
      setError('Please provide a continuation prompt.')
      return
    }

    if (!videoUrls[0]) {
      setError('Please provide one input video.')
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

    const payload: SeedanceVideoExtendInput = {
      video: videoUrls[0],
      resolution,
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    if (trimmedPrompt) payload.prompt = trimmedPrompt
    if (lastImageUrls[0]) payload.last_image = lastImageUrls[0]
    if (typeof durationValue === 'number') payload.duration = durationValue

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field
        label="Continuation prompt"
        htmlFor="seedance-prompt"
        required={promptRequired}
        hint="Describe how the scene should continue from the last frame."
      >
        <textarea
          id="seedance-prompt"
          className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-28"
          placeholder="Continue seamlessly as the camera pans to reveal the city skyline."
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
        hint="Single video. The extension starts from its last frame."
      />

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Target last frame image"
        value={lastImageUrls}
        onChange={setLastImageUrls}
        maxItems={limits.lastImage}
        hint="Optional target final frame for the generated extension."
      />

      <SeedanceAdvancedFields
        showAspectRatio={workflowCapabilities.supportsAspectRatio}
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
