import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { evaluateIntegerField } from '../../lib/numericField'
import type { MinimaxH3AspectRatio, MinimaxH3ImageToVideoInput, MinimaxH3Resolution } from '../../lib/types'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { MinimaxH3AdvancedFields } from './MinimaxH3AdvancedFields'

interface MinimaxH3ImageToVideoFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: MinimaxH3ImageToVideoInput) => Promise<void>
}

const DURATION_MIN = 5
const DURATION_MAX = 15
const MAX_IMAGE_ITEMS = 1
const DEFAULT_RESOLUTION: MinimaxH3Resolution = '480p'
const DEFAULT_DURATION = 5
const DEFAULT_ASPECT_RATIO: MinimaxH3AspectRatio = '16:9'

const resolveResolution = (value: unknown): MinimaxH3Resolution => {
  if (value === '480p' || value === '768p') return value
  return DEFAULT_RESOLUTION
}

export const MinimaxH3ImageToVideoForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  initialValues,
  onValuesChange,
  onSubmit,
}: MinimaxH3ImageToVideoFormProps) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [imageUrls, setImageUrls] = useState<string[]>(() =>
    typeof initialValues?.image === 'string' ? [initialValues.image] : [],
  )
  const [lastImageUrls, setLastImageUrls] = useState<string[]>(() =>
    typeof initialValues?.last_image === 'string' ? [initialValues.last_image] : [],
  )
  const [aspectRatio] = useState<MinimaxH3AspectRatio>(DEFAULT_ASPECT_RATIO)
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

  const isFormValid = useMemo(
    () => Boolean(prompt.trim() && imageUrls[0] && !durationError && !seedError && typeof durationValue === 'number'),
    [prompt, imageUrls, durationError, seedError, durationValue],
  )

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || !imageUrls[0] || durationError || seedError || typeof durationValue !== 'number') return null

    const payload: MinimaxH3ImageToVideoInput = {
      prompt: trimmedPrompt,
      image: imageUrls[0],
      resolution,
      duration: durationValue,
    }

    if (lastImageUrls[0]) payload.last_image = lastImageUrls[0]
    if (typeof seedValue === 'number') payload.seed = seedValue

    return payload as unknown as Record<string, unknown>
  }, [prompt, imageUrls, lastImageUrls, durationError, seedError, durationValue, resolution, seedValue])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      prompt,
      resolution,
    }

    if (imageUrls[0]) payload.image = imageUrls[0]
    if (lastImageUrls[0]) payload.last_image = lastImageUrls[0]
    if (typeof durationValue === 'number') payload.duration = durationValue
    if (typeof seedValue === 'number') payload.seed = seedValue

    return payload
  }, [prompt, imageUrls, lastImageUrls, resolution, durationValue, seedValue])

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

    if (!imageUrls[0]) {
      setError('Please provide a first-frame image.')
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

    const payload: MinimaxH3ImageToVideoInput = {
      prompt: trimmedPrompt,
      image: imageUrls[0],
      resolution,
      duration: durationValue,
    }

    if (lastImageUrls[0]) payload.last_image = lastImageUrls[0]
    if (typeof seedValue === 'number') payload.seed = seedValue

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field
        label="Prompt"
        htmlFor="minimax-h3-prompt"
        required
        hint="Describe the desired motion, scene, and soundtrack. Audio is generated natively."
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
        label="First-frame image"
        required
        value={imageUrls}
        onChange={setImageUrls}
        maxItems={MAX_IMAGE_ITEMS}
        hint="Output canvas follows this image's aspect ratio."
      />

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Last-frame image"
        value={lastImageUrls}
        onChange={setLastImageUrls}
        maxItems={MAX_IMAGE_ITEMS}
        hint="Optional. When provided, the video interpolates toward this frame."
      />

      <MinimaxH3AdvancedFields
        showAspectRatio={false}
        aspectRatio={aspectRatio}
        onAspectRatioChange={() => undefined}
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
