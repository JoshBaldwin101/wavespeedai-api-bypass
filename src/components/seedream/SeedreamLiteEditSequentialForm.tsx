import { useEffect, useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { validateAttachmentLimit } from '../../lib/attachmentLimits'
import { evaluateIntegerField } from '../../lib/numericField'
import {
  fitAspectToPixelBudget,
  formatSeedreamSize,
  loadImageDimensions,
  parseSeedreamSize,
  SEEDREAM_DEFAULT_HEIGHT,
  SEEDREAM_DEFAULT_WIDTH,
  SEEDREAM_SIZE_MAX,
  SEEDREAM_SIZE_MIN,
  type SeedreamSize,
} from '../../lib/seedreamSize'
import type { SeedreamLiteEditSequentialInput, SeedreamOutputFormat } from '../../lib/types'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { SeedreamSizeFields } from './SeedreamSizeFields'

const MAX_SEEDREAM_EDIT_IMAGES = 10
const MAX_OUTPUT_IMAGES = 15
const DEFAULT_MAX_IMAGES = 1
const STABILITY_RECOMMENDED_MAX = 4
const maxImagesOptions = Array.from({ length: MAX_OUTPUT_IMAGES }, (_, index) => index + 1)
const outputFormatOptions: SeedreamOutputFormat[] = ['jpeg', 'png']

interface SeedreamLiteEditSequentialFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: SeedreamLiteEditSequentialInput) => Promise<void>
}

const parseMaxImages = (value: unknown): number => {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_OUTPUT_IMAGES) {
    return value
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value, 10)
    if (parsed >= 1 && parsed <= MAX_OUTPUT_IMAGES) return parsed
  }
  return DEFAULT_MAX_IMAGES
}

export const SeedreamLiteEditSequentialForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate images',
  initialValues,
  onValuesChange,
  onSubmit,
}: SeedreamLiteEditSequentialFormProps) => {
  const initialSize = parseSeedreamSize(initialValues?.size)

  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [imageUrls, setImageUrls] = useState<string[]>(() =>
    Array.isArray(initialValues?.images) ? initialValues.images.filter((value): value is string => typeof value === 'string') : [],
  )
  const [width, setWidth] = useState(() => String(initialSize?.width ?? SEEDREAM_DEFAULT_WIDTH))
  const [height, setHeight] = useState(() => String(initialSize?.height ?? SEEDREAM_DEFAULT_HEIGHT))
  const [hasManualSizeEdit, setHasManualSizeEdit] = useState(() => initialSize !== null)
  const [sourceDimensions, setSourceDimensions] = useState<SeedreamSize | null>(null)
  const [maxImages, setMaxImages] = useState(() => parseMaxImages(initialValues?.max_images))
  const [outputFormat, setOutputFormat] = useState<SeedreamOutputFormat>(() => {
    const nextOutputFormat = initialValues?.output_format
    if (nextOutputFormat === 'jpeg' || nextOutputFormat === 'png') {
      return nextOutputFormat
    }
    return 'jpeg'
  })
  const [error, setError] = useState<string | null>(null)

  const firstImageUrl = imageUrls[0]
  const { value: widthValue, error: widthError } = useMemo(
    () => evaluateIntegerField(width, { label: 'Width', min: SEEDREAM_SIZE_MIN, max: SEEDREAM_SIZE_MAX }),
    [width],
  )
  const { value: heightValue, error: heightError } = useMemo(
    () => evaluateIntegerField(height, { label: 'Height', min: SEEDREAM_SIZE_MIN, max: SEEDREAM_SIZE_MAX }),
    [height],
  )
  const sizeValue =
    typeof widthValue === 'number' && typeof heightValue === 'number' ? formatSeedreamSize(widthValue, heightValue) : null
  const hasAttachmentOverflow = imageUrls.length > MAX_SEEDREAM_EDIT_IMAGES
  const isFormValid = Boolean(prompt.trim() && imageUrls.length > 0 && !hasAttachmentOverflow && sizeValue)

  useEffect(() => {
    if (!firstImageUrl) return

    let cancelled = false
    void loadImageDimensions(firstImageUrl).then((dimensions) => {
      if (cancelled || !dimensions) return
      setSourceDimensions(dimensions)
      if (hasManualSizeEdit) return
      const fitted = fitAspectToPixelBudget(dimensions.width, dimensions.height)
      setWidth(String(fitted.width))
      setHeight(String(fitted.height))
    })

    return () => {
      cancelled = true
    }
  }, [firstImageUrl, hasManualSizeEdit])

  const applySize = (nextWidth: number, nextHeight: number, manual: boolean) => {
    setWidth(String(nextWidth))
    setHeight(String(nextHeight))
    setHasManualSizeEdit(manual)
  }

  const handleMatchFirstImage = () => {
    if (!firstImageUrl) return
    setHasManualSizeEdit(false)
    void loadImageDimensions(firstImageUrl).then((dimensions) => {
      if (!dimensions) return
      setSourceDimensions(dimensions)
      const fitted = fitAspectToPixelBudget(dimensions.width, dimensions.height)
      applySize(fitted.width, fitted.height, false)
    })
  }

  const pricingInput = useMemo<Record<string, unknown> | null>(() => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || imageUrls.length < 1 || hasAttachmentOverflow || !sizeValue) return null

    return {
      prompt: trimmedPrompt,
      images: imageUrls,
      size: sizeValue,
      max_images: maxImages,
      output_format: outputFormat,
    }
  }, [prompt, imageUrls, hasAttachmentOverflow, sizeValue, maxImages, outputFormat])

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const parsedDraftSize = parseSeedreamSize(`${width.trim()}*${height.trim()}`)
    const payload: Record<string, unknown> = {
      prompt,
      size: parsedDraftSize
        ? formatSeedreamSize(parsedDraftSize.width, parsedDraftSize.height)
        : (sizeValue ?? formatSeedreamSize(SEEDREAM_DEFAULT_WIDTH, SEEDREAM_DEFAULT_HEIGHT)),
      max_images: maxImages,
      output_format: outputFormat,
    }
    if (imageUrls.length > 0) payload.images = imageUrls
    return payload
  }, [prompt, imageUrls, width, height, sizeValue, maxImages, outputFormat])

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

    const attachmentError = validateAttachmentLimit('Input images', imageUrls, MAX_SEEDREAM_EDIT_IMAGES)
    if (attachmentError) {
      setError(attachmentError)
      return
    }
    if (widthError) {
      setError(widthError)
      return
    }
    if (heightError) {
      setError(heightError)
      return
    }
    if (!sizeValue) {
      setError(`Width and height must be whole numbers from ${SEEDREAM_SIZE_MIN} to ${SEEDREAM_SIZE_MAX}.`)
      return
    }

    const payload: SeedreamLiteEditSequentialInput = {
      prompt: trimmedPrompt,
      images: imageUrls,
      size: sizeValue,
      max_images: maxImages,
      output_format: outputFormat,
    }

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Field label="Edit prompt" htmlFor="seedream-lite-edit-sequential-prompt" required>
        <textarea
          id="seedream-lite-edit-sequential-prompt"
          className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
          placeholder="I want to generate 1 image. Keep the subject, restyle the lighting to a cinematic dusk, and add subtle film grain."
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
        onChange={(next) => {
          setImageUrls(next)
          if (!next[0]) setSourceDimensions(null)
        }}
        multiple
        maxItems={MAX_SEEDREAM_EDIT_IMAGES}
        hint="One or more images can be used as references for the sequential edit."
      />

      <SeedreamSizeFields
        width={width}
        height={height}
        widthError={widthError}
        heightError={heightError}
        onWidthChange={(value) => {
          setHasManualSizeEdit(true)
          setWidth(value)
        }}
        onHeightChange={(value) => {
          setHasManualSizeEdit(true)
          setHeight(value)
        }}
        onApplySize={(nextWidth, nextHeight) => applySize(nextWidth, nextHeight, true)}
        onMatchFirstImage={handleMatchFirstImage}
        canMatchFirstImage={Boolean(firstImageUrl)}
        sourceDimensions={sourceDimensions}
      />

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Field
          label="Max images"
          htmlFor="seedream-lite-edit-sequential-max-images"
          hint="Always sent. Cost is this many times the base price even if fewer images come back."
        >
          <select
            id="seedream-lite-edit-sequential-max-images"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={maxImages}
            onChange={(event) => setMaxImages(Number.parseInt(event.target.value, 10))}
          >
            {maxImagesOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Output format" htmlFor="seedream-lite-edit-sequential-output-format">
          <select
            id="seedream-lite-edit-sequential-output-format"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={outputFormat}
            onChange={(event) => setOutputFormat(event.target.value as SeedreamOutputFormat)}
          >
            {outputFormatOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {maxImages > 1 ? (
        <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs leading-5 text-slate-400">
          WaveSpeed expects the prompt to ask for {maxImages} images. Name that count in the prompt so it matches this
          setting.
          {maxImages > STABILITY_RECOMMENDED_MAX
            ? ' Larger batches can be less stable; 2-4 images is the recommended range.'
            : null}
        </p>
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
