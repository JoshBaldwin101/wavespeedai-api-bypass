import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { evaluateIntegerField } from '../../lib/numericField'
import type { Scail2Input, Scail2Mode, Scail2Resolution } from '../../lib/types'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

interface Scail2FormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: Scail2Input) => Promise<void>
}

const MAX_IMAGE_ITEMS = 1
const MAX_VIDEO_ITEMS = 1
const DEFAULT_MODE: Scail2Mode = 'animate'
const DEFAULT_RESOLUTION: Scail2Resolution = '480p'

export const Scail2Form = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  initialValues,
  onValuesChange,
  onSubmit,
}: Scail2FormProps) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [imageUrls, setImageUrls] = useState<string[]>(() =>
    typeof initialValues?.image === 'string' ? [initialValues.image] : [],
  )
  const [videoUrls, setVideoUrls] = useState<string[]>(() =>
    typeof initialValues?.video === 'string' ? [initialValues.video] : [],
  )
  const [mode, setMode] = useState<Scail2Mode>(() => (initialValues?.mode === 'replace' ? 'replace' : DEFAULT_MODE))
  const [resolution, setResolution] = useState<Scail2Resolution>(() =>
    initialValues?.resolution === '720p' ? '720p' : DEFAULT_RESOLUTION,
  )
  const [seed, setSeed] = useState(() => (typeof initialValues?.seed === 'number' ? String(initialValues.seed) : ''))
  const [error, setError] = useState<string | null>(null)

  const { value: seedValue, error: seedError } = useMemo(
    () =>
      evaluateIntegerField(seed, {
        label: 'Seed',
        min: -1,
        max: 2147483647,
      }),
    [seed],
  )

  const hasAttachmentOverflow = imageUrls.length > MAX_IMAGE_ITEMS || videoUrls.length > MAX_VIDEO_ITEMS

  const isFormValid = useMemo(
    () => Boolean(imageUrls[0] && videoUrls[0] && !hasAttachmentOverflow && !seedError),
    [imageUrls, videoUrls, hasAttachmentOverflow, seedError],
  )

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    if (!imageUrls[0] || !videoUrls[0] || hasAttachmentOverflow || seedError) return null

    const payload: Record<string, unknown> = {
      image: imageUrls[0],
      video: videoUrls[0],
    }

    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt) payload.prompt = trimmedPrompt
    if (mode !== DEFAULT_MODE) payload.mode = mode
    if (resolution !== DEFAULT_RESOLUTION) payload.resolution = resolution
    if (typeof seedValue === 'number') payload.seed = seedValue

    return payload
  }, [imageUrls, videoUrls, hasAttachmentOverflow, seedError, prompt, mode, resolution, seedValue])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {}

    if (prompt) payload.prompt = prompt
    if (imageUrls[0]) payload.image = imageUrls[0]
    if (videoUrls[0]) payload.video = videoUrls[0]
    if (mode !== DEFAULT_MODE) payload.mode = mode
    if (resolution !== DEFAULT_RESOLUTION) payload.resolution = resolution
    if (typeof seedValue === 'number') payload.seed = seedValue

    return payload
  }, [prompt, imageUrls, videoUrls, mode, resolution, seedValue])

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

    if (!imageUrls[0]) {
      setError('Please provide one reference character image.')
      return
    }

    if (!videoUrls[0]) {
      setError('Please provide one driving video.')
      return
    }

    if (imageUrls.length > MAX_IMAGE_ITEMS) {
      setError('Reference character image accepts at most 1 file.')
      return
    }

    if (videoUrls.length > MAX_VIDEO_ITEMS) {
      setError('Driving video accepts at most 1 file.')
      return
    }

    if (seedError) {
      setError(seedError)
      return
    }

    const payload: Scail2Input = {
      image: imageUrls[0],
      video: videoUrls[0],
    }

    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt) payload.prompt = trimmedPrompt
    if (mode !== DEFAULT_MODE) payload.mode = mode
    if (resolution !== DEFAULT_RESOLUTION) payload.resolution = resolution
    if (typeof seedValue === 'number') payload.seed = seedValue

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field
        label="Prompt"
        htmlFor="scail-2-prompt"
        hint="Optional. Describe style or character details for the generated output."
      >
        <textarea
          id="scail-2-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
          placeholder="Keep identity and outfit details, cinematic lighting."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Reference character image"
        required
        value={imageUrls}
        onChange={setImageUrls}
        maxItems={MAX_IMAGE_ITEMS}
        hint="Single image. JPG/PNG is recommended; avoid WEBP when possible."
      />

      <MediaUpload
        apiKey={apiKey}
        kind="video"
        label="Driving video"
        required
        value={videoUrls}
        onChange={setVideoUrls}
        maxItems={MAX_VIDEO_ITEMS}
      />

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Field label="Mode" htmlFor="scail-2-mode">
          <select
            id="scail-2-mode"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={mode}
            onChange={(event) => setMode(event.target.value as Scail2Mode)}
          >
            <option value="animate">animate</option>
            <option value="replace">replace</option>
          </select>
        </Field>

        <Field label="Resolution" htmlFor="scail-2-resolution">
          <select
            id="scail-2-resolution"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={resolution}
            onChange={(event) => setResolution(event.target.value as Scail2Resolution)}
          >
            <option value="480p">480p</option>
            <option value="720p">720p</option>
          </select>
        </Field>
      </div>

      <Field label="Seed" htmlFor="scail-2-seed" error={seedError ?? undefined} hint="Optional. Use -1 for random output.">
        <input
          id="scail-2-seed"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          inputMode="numeric"
          placeholder="-1"
          value={seed}
          onChange={(event) => setSeed(event.target.value)}
        />
      </Field>

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
