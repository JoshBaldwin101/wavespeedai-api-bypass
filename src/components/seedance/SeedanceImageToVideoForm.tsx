import { useMemo, useState } from 'react'
import type { SeedanceAspectRatio, SeedanceImageToVideoInput } from '../../lib/types'
import { evaluateIntegerField } from '../../lib/numericField'
import { SEEDANCE_ATTACHMENT_LIMITS } from '../../lib/seedanceAttachmentLimits'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import type { WorkflowCapabilities } from '../../lib/workflows'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { SeedanceAdvancedFields } from './SeedanceAdvancedFields'

interface SeedanceImageToVideoFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  workflowCapabilities?: WorkflowCapabilities
  onSubmit: (input: SeedanceImageToVideoInput) => Promise<void>
}

type AspectRatioOption = SeedanceAspectRatio | 'auto'

export const SeedanceImageToVideoForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  workflowCapabilities,
  onSubmit,
}: SeedanceImageToVideoFormProps) => {
  const limits = SEEDANCE_ATTACHMENT_LIMITS.imageToVideo
  const {
    durationMin = 4,
    durationMax = 15,
    promptRequired = true,
    resolutionOptions = ['480p', '720p', '1080p'],
    supportsSeed = false,
    supportsAspectRatio = true,
  } = workflowCapabilities ?? {}
  const [prompt, setPrompt] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [lastImageUrls, setLastImageUrls] = useState<string[]>([])
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('auto')
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p'>(resolutionOptions[0] ?? '720p')
  const [duration, setDuration] = useState('')
  const [seed, setSeed] = useState('')
  const [enableWebSearch, setEnableWebSearch] = useState(false)
  const [generateAudio, setGenerateAudio] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { value: durationValue, error: durationError } = useMemo(
    () => evaluateIntegerField(duration, { label: 'Duration', min: durationMin, max: durationMax }),
    [duration, durationMin, durationMax],
  )

  const { value: seedValue, error: seedError } = useMemo(() => {
    if (!supportsSeed) {
      return { value: undefined, error: null }
    }

    return evaluateIntegerField(seed, {
      label: 'Seed',
      min: -1,
      max: 2147483647,
    })
  }, [seed, supportsSeed])

  const isFormValid = useMemo(() => {
    if (promptRequired && !prompt.trim()) return false
    if (!imageUrls[0]) return false
    if (durationError) return false
    if (seedError) return false
    return true
  }, [promptRequired, prompt, imageUrls, durationError, seedError])

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (promptRequired && !trimmedPrompt) return null
    if (!imageUrls[0]) return null
    if (durationError || seedError) return null

    const payload: SeedanceImageToVideoInput = {
      image: imageUrls[0],
      resolution,
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    if (trimmedPrompt) payload.prompt = trimmedPrompt
    if (lastImageUrls[0]) payload.last_image = lastImageUrls[0]
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue
    if (typeof seedValue === 'number') payload.seed = seedValue

    return payload as Record<string, unknown>
  }, [
    prompt,
    promptRequired,
    imageUrls,
    durationError,
    durationValue,
    seedError,
    seedValue,
    resolution,
    enableWebSearch,
    generateAudio,
    lastImageUrls,
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
      setError('Please provide a prompt.')
      return
    }

    if (!imageUrls[0]) {
      setError('Please provide a start image.')
      return
    }

    if (durationError) {
      setError(durationError)
      return
    }

    if (seedError) {
      setError(seedError)
      return
    }

    const payload: SeedanceImageToVideoInput = {
      image: imageUrls[0],
      resolution,
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    if (trimmedPrompt) payload.prompt = trimmedPrompt
    if (lastImageUrls[0]) payload.last_image = lastImageUrls[0]
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue
    if (typeof seedValue === 'number') payload.seed = seedValue

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field
        label="Prompt"
        htmlFor="seedance-prompt"
        required={promptRequired}
        hint={
          promptRequired
            ? 'Required. Describe the scene motion, camera movement, and mood.'
            : 'Optional. Describe the scene motion, camera movement, and mood.'
        }
      >
        <textarea
          id="seedance-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
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

      {supportsSeed ? (
        <Field
          label="Seed"
          htmlFor="seedance-seed"
          error={seedError ?? undefined}
          hint="Optional. Set -1 for random output, or a fixed value for repeatability."
        >
          <input
            id="seedance-seed"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            inputMode="numeric"
            placeholder="-1"
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
          />
        </Field>
      ) : null}

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
