import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import type { SeedVr2Resolution, SeedVr2VideoInput } from '../../lib/types'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

interface SeedVr2VideoFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: SeedVr2VideoInput) => Promise<void>
}

const MAX_VIDEO_ITEMS = 1
const DEFAULT_TARGET_RESOLUTION: SeedVr2Resolution = '1080p'
const TARGET_RESOLUTION_OPTIONS: SeedVr2Resolution[] = ['720p', '1080p', '2k', '4k']

const resolveTargetResolution = (value: unknown): SeedVr2Resolution => {
  if (typeof value === 'string' && TARGET_RESOLUTION_OPTIONS.includes(value as SeedVr2Resolution)) {
    return value as SeedVr2Resolution
  }
  return DEFAULT_TARGET_RESOLUTION
}

export const SeedVr2VideoForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  initialValues,
  onValuesChange,
  onSubmit,
}: SeedVr2VideoFormProps) => {
  const [videoUrls, setVideoUrls] = useState<string[]>(() =>
    typeof initialValues?.video === 'string' ? [initialValues.video] : [],
  )
  const [targetResolution, setTargetResolution] = useState<SeedVr2Resolution>(() =>
    resolveTargetResolution(initialValues?.target_resolution),
  )
  const [error, setError] = useState<string | null>(null)

  const isFormValid = useMemo(() => Boolean(videoUrls[0] && videoUrls.length <= MAX_VIDEO_ITEMS), [videoUrls])

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    if (!videoUrls[0] || videoUrls.length > MAX_VIDEO_ITEMS) return null

    return {
      video: videoUrls[0],
      target_resolution: targetResolution,
    }
  }, [videoUrls, targetResolution])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      target_resolution: targetResolution,
    }
    if (videoUrls[0]) payload.video = videoUrls[0]
    return payload
  }, [videoUrls, targetResolution])

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

    if (!videoUrls[0]) {
      setError('Please provide one video to upscale.')
      return
    }

    if (videoUrls.length > MAX_VIDEO_ITEMS) {
      setError('Input video accepts at most 1 file.')
      return
    }

    await onSubmit({
      video: videoUrls[0],
      target_resolution: targetResolution,
    })
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <MediaUpload
        apiKey={apiKey}
        kind="video"
        label="Input video"
        required
        value={videoUrls}
        onChange={setVideoUrls}
        maxItems={MAX_VIDEO_ITEMS}
        hint="Single video to upscale with SeedVR2."
      />

      <Field label="Target resolution" htmlFor="seedvr2-target-resolution">
        <select
          id="seedvr2-target-resolution"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          value={targetResolution}
          onChange={(event) => setTargetResolution(event.target.value as SeedVr2Resolution)}
        >
          {TARGET_RESOLUTION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
