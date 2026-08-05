import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { evaluateIntegerField } from '../../lib/numericField'
import type { MinimaxH3AspectRatio, MinimaxH3Resolution, MinimaxH3TextToVideoInput } from '../../lib/types'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { MinimaxH3AdvancedFields } from './MinimaxH3AdvancedFields'

interface MinimaxH3TextToVideoFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: MinimaxH3TextToVideoInput) => Promise<void>
}

const DURATION_MIN = 5
const DURATION_MAX = 15
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

export const MinimaxH3TextToVideoForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  initialValues,
  onValuesChange,
  onSubmit,
}: MinimaxH3TextToVideoFormProps) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
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

  const isFormValid = useMemo(
    () => Boolean(prompt.trim() && !durationError && !seedError && typeof durationValue === 'number'),
    [prompt, durationError, seedError, durationValue],
  )

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || durationError || seedError || typeof durationValue !== 'number') return null

    const payload: MinimaxH3TextToVideoInput = {
      prompt: trimmedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      duration: durationValue,
    }

    if (typeof seedValue === 'number') payload.seed = seedValue

    return payload as unknown as Record<string, unknown>
  }, [prompt, durationError, seedError, durationValue, aspectRatio, resolution, seedValue])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio,
      resolution,
    }

    if (typeof durationValue === 'number') payload.duration = durationValue
    if (typeof seedValue === 'number') payload.seed = seedValue

    return payload
  }, [prompt, aspectRatio, resolution, durationValue, seedValue])

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

    const payload: MinimaxH3TextToVideoInput = {
      prompt: trimmedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      duration: durationValue,
    }

    if (typeof seedValue === 'number') payload.seed = seedValue

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field
        label="Prompt"
        htmlFor="minimax-h3-prompt"
        required
        hint="Describe the scene, action, camera movement, and desired soundtrack. Audio is generated natively."
      >
        <textarea
          id="minimax-h3-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
          placeholder="A cinematic ocean wave at sunrise, highly detailed"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

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
