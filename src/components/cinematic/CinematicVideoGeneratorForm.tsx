import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { validateAttachmentLimit } from '../../lib/attachmentLimits'
import type { CinematicAspectRatio, CinematicDuration, CinematicVideoGeneratorInput } from '../../lib/types'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

interface CinematicVideoGeneratorFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: CinematicVideoGeneratorInput) => Promise<void>
}

const MAX_REFERENCE_IMAGES = 4
const ASPECT_RATIO_OPTIONS: CinematicAspectRatio[] = ['16:9', '9:16', '4:3', '3:4']
const DURATION_OPTIONS: CinematicDuration[] = [5, 10, 15]
const DEFAULT_ASPECT_RATIO: CinematicAspectRatio = '16:9'
const DEFAULT_DURATION: CinematicDuration = 5

const resolveAspectRatio = (value: unknown): CinematicAspectRatio => {
  if (value === '16:9' || value === '9:16' || value === '4:3' || value === '3:4') return value
  return DEFAULT_ASPECT_RATIO
}

const resolveDuration = (value: unknown): CinematicDuration => {
  if (value === 5 || value === 10 || value === 15) return value
  return DEFAULT_DURATION
}

const readImageUrls = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

export const CinematicVideoGeneratorForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  initialValues,
  onValuesChange,
  onSubmit,
}: CinematicVideoGeneratorFormProps) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [imageUrls, setImageUrls] = useState<string[]>(() => readImageUrls(initialValues?.images))
  const [aspectRatio, setAspectRatio] = useState<CinematicAspectRatio>(() => resolveAspectRatio(initialValues?.aspect_ratio))
  const [duration, setDuration] = useState<CinematicDuration>(() => resolveDuration(initialValues?.duration))
  const [error, setError] = useState<string | null>(null)

  const attachmentError = validateAttachmentLimit('Reference images', imageUrls, MAX_REFERENCE_IMAGES)

  const payload = useMemo<CinematicVideoGeneratorInput | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || attachmentError) return null

    const next: CinematicVideoGeneratorInput = {
      prompt: trimmedPrompt,
      aspect_ratio: aspectRatio,
      duration,
    }

    if (imageUrls.length > 0) next.images = imageUrls
    return next
  }, [prompt, attachmentError, aspectRatio, duration, imageUrls])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const next: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio,
      duration,
    }

    if (imageUrls.length > 0) next.images = imageUrls
    return next
  }, [prompt, aspectRatio, duration, imageUrls])

  usePersistedFormDraft(onValuesChange, draftInput)

  const { livePricing, isPricingLoading } = useLivePricing({
    apiKey,
    pricingModelId,
    pricingInput: payload as unknown as Record<string, unknown> | null,
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

    if (!prompt.trim()) {
      setError('Please provide a prompt.')
      return
    }

    if (attachmentError) {
      setError(attachmentError)
      return
    }

    if (!payload) {
      setError('Please complete the required fields.')
      return
    }

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field
        label="Prompt"
        htmlFor="cinematic-prompt"
        required
        hint="Describe the scene, action, camera movement, and mood for the video."
      >
        <textarea
          id="cinematic-prompt"
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
        value={imageUrls}
        onChange={setImageUrls}
        multiple
        maxItems={MAX_REFERENCE_IMAGES}
        hint="Optional. Guide visual style, characters, or scene composition."
      />

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Field label="Aspect ratio" htmlFor="cinematic-aspect-ratio">
          <select
            id="cinematic-aspect-ratio"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={aspectRatio}
            onChange={(event) => setAspectRatio(resolveAspectRatio(event.target.value))}
          >
            {ASPECT_RATIO_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Duration" htmlFor="cinematic-duration" hint="Length of the generated video in seconds.">
          <select
            id="cinematic-duration"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={duration}
            onChange={(event) => setDuration(resolveDuration(Number(event.target.value)))}
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}s
              </option>
            ))}
          </select>
        </Field>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="flex justify-end">
        <Button
          className="w-full sm:w-auto"
          type="submit"
          disabled={!payload || isSubmitting || isPricingLoading}
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
