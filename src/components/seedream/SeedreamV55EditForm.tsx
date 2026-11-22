import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { validateAttachmentLimit } from '../../lib/attachmentLimits'
import type {
  SeedreamAspectRatio,
  SeedreamBackground,
  SeedreamOutputFormat,
  SeedreamResolution,
  SeedreamV55EditInput,
} from '../../lib/types'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

const MAX_SEEDREAM_V55_EDIT_IMAGES = 10

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

type AspectRatioOption = SeedreamAspectRatio | 'auto'

const isAspectRatio = (value: unknown): value is SeedreamAspectRatio =>
  typeof value === 'string' && (aspectRatioOptions as readonly string[]).includes(value)

const isResolution = (value: unknown): value is SeedreamResolution =>
  value === '1k' || value === '1.5k' || value === '2k'

const isOutputFormat = (value: unknown): value is SeedreamOutputFormat => value === 'png' || value === 'jpeg'

const isBackground = (value: unknown): value is SeedreamBackground =>
  value === 'auto' || value === 'transparent' || value === 'opaque'

const readImageUrls = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

interface SeedreamV55EditFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: SeedreamV55EditInput) => Promise<void>
}

export const SeedreamV55EditForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate image',
  initialValues,
  onValuesChange,
  onSubmit,
}: SeedreamV55EditFormProps) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [imageUrls, setImageUrls] = useState<string[]>(() => readImageUrls(initialValues?.images))
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(() =>
    isAspectRatio(initialValues?.aspect_ratio) ? initialValues.aspect_ratio : 'auto',
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

  const attachmentError = validateAttachmentLimit('Input images', imageUrls, MAX_SEEDREAM_V55_EDIT_IMAGES)
  const isFormValid = Boolean(prompt.trim() && !attachmentError)

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || attachmentError) return null

    const payload: Record<string, unknown> = {
      prompt: trimmedPrompt,
      images: imageUrls,
      resolution,
      output_format: outputFormat,
      background,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    return payload
  }, [prompt, imageUrls, attachmentError, aspectRatio, resolution, outputFormat, background])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      prompt,
      images: imageUrls,
      resolution,
      output_format: outputFormat,
      background,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    return payload
  }, [prompt, imageUrls, aspectRatio, resolution, outputFormat, background])

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
      setError('Please provide an edit prompt.')
      return
    }
    if (attachmentError) {
      setError(attachmentError)
      return
    }

    const payload: SeedreamV55EditInput = {
      prompt: trimmedPrompt,
      images: imageUrls,
      resolution,
      output_format: outputFormat,
      background,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field label="Edit prompt" htmlFor="seedream-v55-edit-prompt" required>
        <textarea
          id="seedream-v55-edit-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
          placeholder="Keep the subject, restyle the lighting to a cinematic dusk, and add subtle film grain."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Input images"
        value={imageUrls}
        onChange={setImageUrls}
        multiple
        maxItems={MAX_SEEDREAM_V55_EDIT_IMAGES}
        hint="Up to 10 reference images. Leave this empty to generate from the prompt alone. Each extra image adds to the price."
      />

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Field
          label="Aspect ratio"
          htmlFor="seedream-v55-edit-aspect-ratio"
          hint="Optional. Auto follows the first input image."
        >
          <select
            id="seedream-v55-edit-aspect-ratio"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={aspectRatio}
            onChange={(event) => {
              const next = event.target.value
              if (next === 'auto' || isAspectRatio(next)) setAspectRatio(next)
            }}
          >
            <option value="auto">Auto</option>
            {aspectRatioOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Resolution"
          htmlFor="seedream-v55-edit-resolution"
          hint="1k and 1.5k cost the same. 2k costs more."
        >
          <select
            id="seedream-v55-edit-resolution"
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

        <Field label="Output format" htmlFor="seedream-v55-edit-output-format">
          <select
            id="seedream-v55-edit-output-format"
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
          htmlFor="seedream-v55-edit-background"
          hint="Auto follows the prompt and output format. Transparent always returns a PNG with an alpha channel. Opaque keeps a solid background."
        >
          <select
            id="seedream-v55-edit-background"
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
