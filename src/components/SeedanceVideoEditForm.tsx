import { useEffect, useMemo, useState } from 'react'
import type { ModelPricing, SeedanceAspectRatio, SeedanceVideoEditInput } from '../lib/types'
import { getModelPricing, WavespeedError } from '../lib/wavespeed'
import { Button } from './ui/Button'
import { Field } from './ui/Field'
import { Toggle } from './ui/Toggle'
import { MediaUpload } from './MediaUpload'

interface SeedanceVideoEditFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  onSubmit: (input: SeedanceVideoEditInput) => Promise<void>
}

type AspectRatioOption = SeedanceAspectRatio | 'auto'

const aspectRatioOptions: AspectRatioOption[] = ['auto', '16:9', '9:16', '4:3', '3:4', '1:1', '21:9']

export const SeedanceVideoEditForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  onSubmit,
}: SeedanceVideoEditFormProps) => {
  const [prompt, setPrompt] = useState('')
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([])
  const [referenceAudioUrls, setReferenceAudioUrls] = useState<string[]>([])
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('auto')
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p'>('720p')
  const [duration, setDuration] = useState('')
  const [enableWebSearch, setEnableWebSearch] = useState(false)
  const [generateAudio, setGenerateAudio] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [livePricing, setLivePricing] = useState<ModelPricing | null>(null)
  const [isPricingLoading, setIsPricingLoading] = useState(false)

  const durationValue = useMemo(() => {
    if (!duration.trim()) return undefined
    const parsed = Number.parseInt(duration.trim(), 10)
    if (!Number.isFinite(parsed)) return Number.NaN
    return parsed
  }, [duration])

  const isFormValid = useMemo(() => {
    if (!prompt.trim()) return false
    if (!videoUrls[0]) return false
    if (typeof durationValue === 'number' && Number.isNaN(durationValue)) return false
    if (typeof durationValue === 'number' && (durationValue < 4 || durationValue > 15)) return false
    return true
  }, [prompt, videoUrls, durationValue])

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || !videoUrls[0]) return null
    if (typeof durationValue === 'number' && (Number.isNaN(durationValue) || durationValue < 4 || durationValue > 15)) {
      return null
    }

    const payload: SeedanceVideoEditInput = {
      prompt: trimmedPrompt,
      resolution,
      video: videoUrls[0],
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    // Preserve reference order exactly as entered/uploaded by the user.
    if (referenceImageUrls.length > 0) payload.reference_images = referenceImageUrls
    if (referenceAudioUrls.length > 0) payload.reference_audios = referenceAudioUrls
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof durationValue === 'number') payload.duration = durationValue

    return payload as Record<string, unknown>
  }, [
    prompt,
    videoUrls,
    durationValue,
    resolution,
    enableWebSearch,
    generateAudio,
    referenceImageUrls,
    referenceAudioUrls,
    aspectRatio,
  ])

  useEffect(() => {
    if (!pricingInput) {
      setLivePricing(null)
      setIsPricingLoading(false)
      return
    }

    let cancelled = false
    setIsPricingLoading(true)

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const pricing = await getModelPricing(apiKey, pricingModelId, pricingInput)
          if (!cancelled) {
            setLivePricing(pricing)
          }
        } catch (caughtError) {
          if (cancelled) return
          if (!(caughtError instanceof WavespeedError || caughtError instanceof Error)) {
            setLivePricing(null)
            return
          }
          setLivePricing(null)
        } finally {
          if (!cancelled) {
            setIsPricingLoading(false)
          }
        }
      })()
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [apiKey, pricingModelId, pricingInput])

  const formatLivePrice = (value: number, currency: string): string => {
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    })
    return currency === 'USD' ? `$${formatted}` : `${formatted} ${currency}`
  }

  const liveSubmitLabel = useMemo(() => {
    if (isSubmitting) return 'Submitting...'
    if (isPricingLoading) return 'Calculating price...'
    if (livePricing) return `Generate ${formatLivePrice(livePricing.unit_price, livePricing.currency)}`
    return submitLabel
  }, [isSubmitting, isPricingLoading, livePricing, submitLabel])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      setError('Please provide an edit prompt.')
      return
    }

    if (!videoUrls[0]) {
      setError('Please upload one input video.')
      return
    }

    if (typeof durationValue === 'number' && Number.isNaN(durationValue)) {
      setError('Duration must be a whole number from 4 to 15.')
      return
    }

    if (typeof durationValue === 'number' && (durationValue < 4 || durationValue > 15)) {
      setError('Duration must be in the range 4 to 15 seconds.')
      return
    }

    const payload: SeedanceVideoEditInput = {
      prompt: trimmedPrompt,
      resolution,
      video: videoUrls[0],
      enable_web_search: enableWebSearch,
      generate_audio: generateAudio,
    }

    // Preserve reference order exactly as entered/uploaded by the user.
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
        required
      >
        <textarea
          id="seedance-prompt"
          className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-28"
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
        hint="Single file. WaveSpeed trims source videos longer than 15 seconds."
      />

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Reference images (optional)"
        value={referenceImageUrls}
        onChange={setReferenceImageUrls}
        multiple
      />

      <MediaUpload
        apiKey={apiKey}
        kind="audio"
        label="Reference audios (optional)"
        value={referenceAudioUrls}
        onChange={setReferenceAudioUrls}
        multiple
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <Field label="Aspect ratio" htmlFor="seedance-aspect-ratio" hint="Leave as Adapt to input to let WaveSpeed decide.">
          <select
            id="seedance-aspect-ratio"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={aspectRatio}
            onChange={(event) => setAspectRatio(event.target.value as AspectRatioOption)}
          >
            {aspectRatioOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'auto' ? 'Adapt to input' : option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Resolution" htmlFor="seedance-resolution">
          <select
            id="seedance-resolution"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={resolution}
            onChange={(event) => setResolution(event.target.value as '480p' | '720p' | '1080p')}
          >
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
        </Field>

        <Field
          className="col-span-2 md:col-span-1"
          label="Duration (seconds)"
          htmlFor="seedance-duration"
          hint="Optional. Allowed range: 4-15."
        >
          <input
            id="seedance-duration"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            inputMode="numeric"
            placeholder="Auto"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
        <Toggle
          id="seedance-web-search"
          checked={enableWebSearch}
          onChange={setEnableWebSearch}
          label="Enable web search"
          description="Include real-time web context in the generation call."
        />
        <Toggle
          id="seedance-generate-audio"
          checked={generateAudio}
          onChange={setGenerateAudio}
          label="Generate audio"
          description="Turn off to preserve the original input audio track."
        />
      </div>

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
