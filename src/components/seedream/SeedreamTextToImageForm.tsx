import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import type {
  SeedreamAspectRatio,
  SeedreamBackground,
  SeedreamOutputFormat,
  SeedreamResolution,
  SeedreamTextToImageInput,
} from '../../lib/types'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

const aspectRatioOptions: SeedreamAspectRatio[] = [
  '1:1',
  '1:2',
  '2:1',
  '1:3',
  '3:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '9:21',
  '21:9',
]
const resolutionOptions: SeedreamResolution[] = ['1k', '1.5k', '2k']
const outputFormatOptions: SeedreamOutputFormat[] = ['png', 'jpeg']
const backgroundOptions: SeedreamBackground[] = ['auto', 'transparent', 'opaque']

const isAspectRatio = (value: unknown): value is SeedreamAspectRatio =>
  typeof value === 'string' && (aspectRatioOptions as readonly string[]).includes(value)

const isResolution = (value: unknown): value is SeedreamResolution =>
  value === '1k' || value === '1.5k' || value === '2k'

const isOutputFormat = (value: unknown): value is SeedreamOutputFormat => value === 'png' || value === 'jpeg'

const isBackground = (value: unknown): value is SeedreamBackground =>
  value === 'auto' || value === 'transparent' || value === 'opaque'

interface SeedreamTextToImageFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: SeedreamTextToImageInput) => Promise<void>
}

export const SeedreamTextToImageForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate image',
  initialValues,
  onValuesChange,
  onSubmit,
}: SeedreamTextToImageFormProps) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [aspectRatio, setAspectRatio] = useState<SeedreamAspectRatio>(() =>
    isAspectRatio(initialValues?.aspect_ratio) ? initialValues.aspect_ratio : '1:1',
  )
  const [resolution, setResolution] = useState<SeedreamResolution>(() =>
    isResolution(initialValues?.resolution) ? initialValues.resolution : '1k',
  )
  const [outputFormat, setOutputFormat] = useState<SeedreamOutputFormat>(() =>
    isOutputFormat(initialValues?.output_format) ? initialValues.output_format : 'png',
  )
  const [background, setBackground] = useState<SeedreamBackground>(() =>
    isBackground(initialValues?.background) ? initialValues.background : 'auto',
  )
  const [error, setError] = useState<string | null>(null)

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) return null

    return {
      prompt: trimmedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      output_format: outputFormat,
      background,
    }
  }, [prompt, aspectRatio, resolution, outputFormat, background])

  const draftInput = useMemo<Record<string, unknown>>(
    () => ({
      prompt,
      aspect_ratio: aspectRatio,
      resolution,
      output_format: outputFormat,
      background,
    }),
    [prompt, aspectRatio, resolution, outputFormat, background],
  )

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

    const payload: SeedreamTextToImageInput = {
      prompt: trimmedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      output_format: outputFormat,
      background,
    }

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field label="Prompt" htmlFor="seedream-v55-prompt" required>
        <textarea
          id="seedream-v55-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
          placeholder="A cinematic ocean wave at sunrise, highly detailed."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Field label="Aspect ratio" htmlFor="seedream-v55-aspect-ratio">
          <select
            id="seedream-v55-aspect-ratio"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={aspectRatio}
            onChange={(event) => {
              if (isAspectRatio(event.target.value)) setAspectRatio(event.target.value)
            }}
          >
            {aspectRatioOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Resolution"
          htmlFor="seedream-v55-resolution"
          hint="1k and 1.5k cost the same. 2k costs more."
        >
          <select
            id="seedream-v55-resolution"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={resolution}
            onChange={(event) => {
              if (isResolution(event.target.value)) setResolution(event.target.value)
            }}
          >
            {resolutionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Output format" htmlFor="seedream-v55-output-format">
          <select
            id="seedream-v55-output-format"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={outputFormat}
            onChange={(event) => {
              if (isOutputFormat(event.target.value)) setOutputFormat(event.target.value)
            }}
          >
            {outputFormatOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Background"
          htmlFor="seedream-v55-background"
          hint="Auto follows the prompt and output format. Transparent always returns a PNG with an alpha channel. Opaque keeps a solid background."
        >
          <select
            id="seedream-v55-background"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={background}
            onChange={(event) => {
              if (isBackground(event.target.value)) setBackground(event.target.value)
            }}
          >
            {backgroundOptions.map((option) => (
              <option key={option} value={option}>
                {option}
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
          disabled={!prompt.trim() || isSubmitting || isPricingLoading}
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
