import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { validateAttachmentLimit } from '../../lib/attachmentLimits'
import { evaluateIntegerField } from '../../lib/numericField'
import type {
  QwenImageAspectRatio,
  QwenImageEditInput,
  QwenImageOutputFormat,
  QwenImageResolution,
} from '../../lib/types'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

const MAX_QWEN_IMAGE_EDIT_IMAGES = 10

const aspectRatioOptions = [
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
] as const satisfies readonly QwenImageAspectRatio[]

const resolutionOptions: QwenImageResolution[] = ['1k', '1.5k', '2k']
const outputFormatOptions: QwenImageOutputFormat[] = ['jpeg', 'png', 'webp']

type AspectRatioOption = QwenImageAspectRatio | 'auto'

const isAspectRatio = (value: unknown): value is QwenImageAspectRatio =>
  typeof value === 'string' && (aspectRatioOptions as readonly string[]).includes(value)

interface QwenImageEditFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: QwenImageEditInput) => Promise<void>
}

export const QwenImageEditForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate image',
  initialValues,
  onValuesChange,
  onSubmit,
}: QwenImageEditFormProps) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [imageUrls, setImageUrls] = useState<string[]>(() =>
    Array.isArray(initialValues?.images) ? initialValues.images.filter((value): value is string => typeof value === 'string') : [],
  )
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(() =>
    isAspectRatio(initialValues?.aspect_ratio) ? initialValues.aspect_ratio : 'auto',
  )
  const [resolution, setResolution] = useState<QwenImageResolution>(() => {
    const nextResolution = initialValues?.resolution
    if (nextResolution === '1k' || nextResolution === '1.5k' || nextResolution === '2k') {
      return nextResolution
    }
    return '1k'
  })
  const [outputFormat, setOutputFormat] = useState<QwenImageOutputFormat>(() => {
    const nextOutputFormat = initialValues?.output_format
    if (nextOutputFormat === 'jpeg' || nextOutputFormat === 'png' || nextOutputFormat === 'webp') {
      return nextOutputFormat
    }
    return 'jpeg'
  })
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

  const hasAttachmentOverflow = imageUrls.length > MAX_QWEN_IMAGE_EDIT_IMAGES
  const isFormValid = Boolean(prompt.trim() && imageUrls.length > 0 && !hasAttachmentOverflow && !seedError)

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || imageUrls.length < 1 || hasAttachmentOverflow || seedError) return null

    const payload: Record<string, unknown> = {
      prompt: trimmedPrompt,
      images: imageUrls,
      resolution,
      output_format: outputFormat,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof seedValue === 'number') payload.seed = seedValue
    return payload
  }, [prompt, imageUrls, hasAttachmentOverflow, seedError, aspectRatio, resolution, outputFormat, seedValue])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      prompt,
      resolution,
      output_format: outputFormat,
    }
    if (imageUrls.length > 0) payload.images = imageUrls
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof seedValue === 'number') payload.seed = seedValue
    return payload
  }, [prompt, imageUrls, aspectRatio, resolution, outputFormat, seedValue])

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
    if (imageUrls.length < 1) {
      setError('Please provide at least one input image.')
      return
    }

    const attachmentError = validateAttachmentLimit('Input images', imageUrls, MAX_QWEN_IMAGE_EDIT_IMAGES)
    if (attachmentError) {
      setError(attachmentError)
      return
    }
    if (seedError) {
      setError(seedError)
      return
    }

    const payload: QwenImageEditInput = {
      prompt: trimmedPrompt,
      images: imageUrls,
      resolution,
      output_format: outputFormat,
    }
    if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio
    if (typeof seedValue === 'number') payload.seed = seedValue

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field
        label="Edit prompt"
        htmlFor="qwen-image-edit-prompt"
        required
        hint="Refer to input images as <Picture 1> through <Picture 10>."
      >
        <textarea
          id="qwen-image-edit-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
          placeholder="Keep the subject from <Picture 1>, restyle the lighting to a cinematic dusk, and add subtle film grain."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Input images"
        required
        value={imageUrls}
        onChange={setImageUrls}
        multiple
        maxItems={MAX_QWEN_IMAGE_EDIT_IMAGES}
        hint="The first image sets the output aspect ratio when Aspect ratio is Auto."
      />

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Field
          label="Aspect ratio"
          htmlFor="qwen-image-aspect-ratio"
          hint="Optional. Auto uses the first input image."
        >
          <select
            id="qwen-image-aspect-ratio"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={aspectRatio}
            onChange={(event) => setAspectRatio(event.target.value as AspectRatioOption)}
          >
            <option value="auto">Auto</option>
            {aspectRatioOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Resolution" htmlFor="qwen-image-resolution">
          <select
            id="qwen-image-resolution"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={resolution}
            onChange={(event) => setResolution(event.target.value as QwenImageResolution)}
          >
            {resolutionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Output format" htmlFor="qwen-image-output-format">
          <select
            id="qwen-image-output-format"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={outputFormat}
            onChange={(event) => setOutputFormat(event.target.value as QwenImageOutputFormat)}
          >
            {outputFormatOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Seed" htmlFor="qwen-image-seed" error={seedError ?? undefined} hint="Optional. Use -1 for random output.">
          <input
            id="qwen-image-seed"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            inputMode="numeric"
            placeholder="-1"
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
          />
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
