import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { validateAttachmentLimit } from '../../lib/attachmentLimits'
import { evaluateIntegerField } from '../../lib/numericField'
import type {
  MinimaxH3AspectRatio,
  MinimaxH3ReferenceToVideoInput,
  MinimaxH3Resolution,
} from '../../lib/types'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { MinimaxH3AdvancedFields } from './MinimaxH3AdvancedFields'

interface MinimaxH3ReferenceToVideoFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: MinimaxH3ReferenceToVideoInput) => Promise<void>
}

const DURATION_MIN = 5
const DURATION_MAX = 15
const MAX_REFERENCE_IMAGES = 9
const MAX_REFERENCE_VIDEOS = 3
const MAX_REFERENCE_AUDIOS = 3
const DEFAULT_ASPECT_RATIO: MinimaxH3AspectRatio = '16:9'
const DEFAULT_RESOLUTION: MinimaxH3Resolution = '480p'
const DEFAULT_DURATION = 5

const resolveAspectRatio = (value: unknown): MinimaxH3AspectRatio => {
  if (
    value === '16:9' ||
    value === '9:16' ||
    value === '1:1' ||
    value === '4:3' ||
    value === '3:4' ||
    value === '21:9' ||
    value === '9:21'
  ) {
    return value
  }
  return DEFAULT_ASPECT_RATIO
}

const resolveResolution = (value: unknown): MinimaxH3Resolution => {
  if (value === '480p' || value === '768p') return value
  return DEFAULT_RESOLUTION
}

export const MinimaxH3ReferenceToVideoForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  initialValues,
  onValuesChange,
  onSubmit,
}: MinimaxH3ReferenceToVideoFormProps) => {
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
  const [aspectRatio, setAspectRatio] = useState<MinimaxH3AspectRatio>(() => resolveAspectRatio(initialValues?.aspect_ratio))
  const [resolution, setResolution] = useState<MinimaxH3Resolution>(() => resolveResolution(initialValues?.resolution))
  const [duration, setDuration] = useState(() =>
    typeof initialValues?.duration === 'number' ? String(initialValues.duration) : String(DEFAULT_DURATION),
  )
  const [seed, setSeed] = useState(() => (typeof initialValues?.seed === 'number' ? String(initialValues.seed) : ''))
  const [error, setError] = useState<string | null>(null)

  const { value: durationValue, error: durationError } = useMemo(
    () => evaluateIntegerField(duration, { label: 'Duration', min: DURATION_MIN, max: DURATION_MAX }),
    [duration],
  )

  const { value: seedValue, error: seedError } = useMemo(
    () =>
      evaluateIntegerField(seed, {
        label: 'Seed',
        min: -1,
        max: 2147483647,
      }),
    [seed],
  )

  const hasAnyReference =
    referenceImageUrls.length > 0 || referenceVideoUrls.length > 0 || referenceAudioUrls.length > 0
  const referenceVideosRequire480p = referenceVideoUrls.length > 0 && resolution !== '480p'

  const isFormValid = useMemo(
    () =>
      Boolean(
        prompt.trim() &&
          hasAnyReference &&
          !referenceVideosRequire480p &&
          !durationError &&
          !seedError &&
          typeof durationValue === 'number' &&
          referenceImageUrls.length <= MAX_REFERENCE_IMAGES &&
          referenceVideoUrls.length <= MAX_REFERENCE_VIDEOS &&
          referenceAudioUrls.length <= MAX_REFERENCE_AUDIOS,
      ),
    [
      prompt,
      hasAnyReference,
      referenceVideosRequire480p,
      durationError,
      seedError,
      durationValue,
      referenceImageUrls,
      referenceVideoUrls,
      referenceAudioUrls,
    ],
  )

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (
      !trimmedPrompt ||
      !hasAnyReference ||
      referenceVideosRequire480p ||
      durationError ||
      seedError ||
      typeof durationValue !== 'number'
    ) {
      return null
    }
    if (referenceImageUrls.length > MAX_REFERENCE_IMAGES) return null
    if (referenceVideoUrls.length > MAX_REFERENCE_VIDEOS) return null
    if (referenceAudioUrls.length > MAX_REFERENCE_AUDIOS) return null

    const payload: MinimaxH3ReferenceToVideoInput = {
      prompt: trimmedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      duration: durationValue,
    }

    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceVideoUrls.length > 0) payload.reference_videos = referenceVideoUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (typeof seedValue === 'number') payload.seed = seedValue

    return payload as unknown as Record<string, unknown>
  }, [
    prompt,
    hasAnyReference,
    referenceVideosRequire480p,
    durationError,
    seedError,
    durationValue,
    aspectRatio,
    resolution,
    referenceImageUrls,
    referenceVideoUrls,
    referenceAudioUrls,
    seedValue,
  ])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio,
      resolution,
    }

    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceVideoUrls.length > 0) payload.reference_videos = referenceVideoUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (typeof durationValue === 'number') payload.duration = durationValue
    if (typeof seedValue === 'number') payload.seed = seedValue

    return payload
  }, [
    prompt,
    aspectRatio,
    resolution,
    referenceImageUrls,
    referenceVideoUrls,
    referenceAudioUrls,
    durationValue,
    seedValue,
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
    if (!trimmedPrompt) {
      setError('Please provide a prompt.')
      return
    }

    if (!hasAnyReference) {
      setError('Provide at least one reference image, video, or audio.')
      return
    }

    if (referenceVideosRequire480p) {
      setError('Reference videos are only supported at 480p resolution.')
      return
    }

    const imageLimitError = validateAttachmentLimit('Reference images', referenceImageUrls, MAX_REFERENCE_IMAGES)
    if (imageLimitError) {
      setError(imageLimitError)
      return
    }

    const videoLimitError = validateAttachmentLimit('Reference videos', referenceVideoUrls, MAX_REFERENCE_VIDEOS)
    if (videoLimitError) {
      setError(videoLimitError)
      return
    }

    const audioLimitError = validateAttachmentLimit('Reference audios', referenceAudioUrls, MAX_REFERENCE_AUDIOS)
    if (audioLimitError) {
      setError(audioLimitError)
      return
    }

    if (durationError) {
      setError(durationError)
      return
    }

    if (typeof durationValue !== 'number') {
      setError('Please provide a duration.')
      return
    }

    if (seedError) {
      setError(seedError)
      return
    }

    const payload: MinimaxH3ReferenceToVideoInput = {
      prompt: trimmedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      duration: durationValue,
    }

    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceVideoUrls.length > 0) payload.reference_videos = referenceVideoUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (typeof seedValue === 'number') payload.seed = seedValue

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field
        label="Prompt"
        htmlFor="minimax-h3-prompt"
        required
        hint="Refer to inputs as <Picture 1>..<Picture 9>, <Video 1>..<Video 3>, and <Audio 1>..<Audio 3>."
      >
        <textarea
          id="minimax-h3-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
          placeholder="A cinematic ocean wave at sunrise, highly detailed"
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
        maxItems={MAX_REFERENCE_IMAGES}
        hint="At least one reference input is required."
      />

      <MediaUpload
        apiKey={apiKey}
        kind="video"
        label="Reference videos"
        value={referenceVideoUrls}
        onChange={setReferenceVideoUrls}
        multiple
        maxItems={MAX_REFERENCE_VIDEOS}
        hint="Only supported at 480p. Total reference video duration is budgeted to 15 seconds."
      />

      <MediaUpload
        apiKey={apiKey}
        kind="audio"
        label="Reference audios"
        value={referenceAudioUrls}
        onChange={setReferenceAudioUrls}
        multiple
        maxItems={MAX_REFERENCE_AUDIOS}
        hint="Optional standalone audio references, trimmed to 15 seconds each."
      />

      <MinimaxH3AdvancedFields
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        resolution={resolution}
        onResolutionChange={setResolution}
        duration={duration}
        onDurationChange={setDuration}
        durationError={durationError}
        durationMin={DURATION_MIN}
        durationMax={DURATION_MAX}
        seed={seed}
        onSeedChange={setSeed}
        seedError={seedError}
      />

      {referenceVideosRequire480p ? (
        <p className="text-sm text-amber-300">Reference videos require 480p. Switch resolution to 480p or remove the videos.</p>
      ) : null}
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
