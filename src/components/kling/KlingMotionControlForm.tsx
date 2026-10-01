import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { KLING_ELEMENT_LIST_LIMIT, validateAttachmentLimit } from '../../lib/attachmentLimits'
import type { KlingCharacterOrientation, KlingMotionControlInput } from '../../lib/types'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Toggle } from '../ui/Toggle'
import { KlingElementIdsField } from './KlingElementIdsField'
import { readKlingElementIds, toKlingElementRefs } from './klingFormShared'

interface KlingMotionControlFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: KlingMotionControlInput) => Promise<void>
}

const MAX_MEDIA_ITEMS = 1

const controlClassName =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500'

const resolveOrientation = (value: unknown): KlingCharacterOrientation => (value === 'image' ? 'image' : 'video')

const readUrlList = (value: unknown): string[] => (typeof value === 'string' && value ? [value] : [])

export const KlingMotionControlForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  initialValues,
  onValuesChange,
  onSubmit,
}: KlingMotionControlFormProps) => {
  const [imageUrls, setImageUrls] = useState<string[]>(() => readUrlList(initialValues?.image))
  const [videoUrls, setVideoUrls] = useState<string[]>(() => readUrlList(initialValues?.video))
  const [orientation, setOrientation] = useState<KlingCharacterOrientation>(() =>
    resolveOrientation(initialValues?.character_orientation),
  )
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [negativePrompt, setNegativePrompt] = useState(() =>
    typeof initialValues?.negative_prompt === 'string' ? initialValues.negative_prompt : '',
  )
  const [keepOriginalSound, setKeepOriginalSound] = useState(() => initialValues?.keep_original_sound !== false)
  const [elementIds, setElementIds] = useState<string[]>(() => {
    const restored = readKlingElementIds(initialValues?.element_list)
    return restored.length > 0 ? restored : ['']
  })
  const [error, setError] = useState<string | null>(null)

  const elementRefs = useMemo(() => toKlingElementRefs(elementIds), [elementIds])
  const elementError = validateAttachmentLimit(
    'Element IDs',
    elementIds.map((id) => id.trim()).filter((id) => id.length > 0),
    KLING_ELEMENT_LIST_LIMIT,
  )
  const imageError = validateAttachmentLimit('Character image', imageUrls, MAX_MEDIA_ITEMS)
  const videoError = validateAttachmentLimit('Driving video', videoUrls, MAX_MEDIA_ITEMS)
  const orientationHint =
    orientation === 'image'
      ? 'The character follows the image. Driving videos longer than 10 seconds are trimmed.'
      : 'The character follows the video. Driving videos longer than 30 seconds are trimmed.'

  const payload = useMemo<KlingMotionControlInput | null>(() => {
    if (!imageUrls[0] || !videoUrls[0] || imageError || videoError || elementError) return null

    const next: KlingMotionControlInput = {
      image: imageUrls[0],
      video: videoUrls[0],
      character_orientation: orientation,
      keep_original_sound: keepOriginalSound,
    }

    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt) next.prompt = trimmedPrompt
    const trimmedNegative = negativePrompt.trim()
    if (trimmedNegative) next.negative_prompt = trimmedNegative
    if (elementRefs.length > 0) next.element_list = elementRefs
    return next
  }, [elementError, elementRefs, imageError, imageUrls, keepOriginalSound, negativePrompt, orientation, prompt, videoError, videoUrls])

  const isFormValid = payload !== null
  const pricingInput = payload as unknown as Record<string, unknown> | null

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const draft: Record<string, unknown> = {
      prompt,
      negative_prompt: negativePrompt,
      character_orientation: orientation,
      keep_original_sound: keepOriginalSound,
    }
    if (imageUrls[0]) draft.image = imageUrls[0]
    if (videoUrls[0]) draft.video = videoUrls[0]
    if (elementRefs.length > 0) draft.element_list = elementRefs
    return draft
  }, [elementRefs, imageUrls, keepOriginalSound, negativePrompt, orientation, prompt, videoUrls])

  usePersistedFormDraft(onValuesChange, draftInput)

  const { livePricing, isPricingLoading } = useLivePricing({
    apiKey,
    pricingModelId,
    pricingInput,
  })

  const liveSubmitLabel = useMemo(
    () => buildSubmitLabel({ isSubmitting, isPricingLoading, livePricing, submitLabel }),
    [isSubmitting, isPricingLoading, livePricing, submitLabel],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!imageUrls[0]) {
      setError('Please provide a character image.')
      return
    }
    if (!videoUrls[0]) {
      setError('Please provide a driving video.')
      return
    }
    if (imageError || videoError || elementError) {
      setError(imageError ?? videoError ?? elementError)
      return
    }
    if (!payload) {
      setError('Check the form and try again.')
      return
    }

    await onSubmit(payload)
  }

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Character image"
        required
        value={imageUrls}
        onChange={setImageUrls}
        maxItems={MAX_MEDIA_ITEMS}
        hint="jpg, jpeg, or png. Max 10MB. At least 300px per side. Aspect ratio between 1:2.5 and 2.5:1."
      />

      <MediaUpload
        apiKey={apiKey}
        kind="video"
        label="Driving video"
        required
        value={videoUrls}
        onChange={setVideoUrls}
        maxItems={MAX_MEDIA_ITEMS}
        hint="mp4 or mov, up to 100MB. Width and height between 340px and 3850px. Output length follows the motion the model keeps from this clip."
      />

      <Field label="Character orientation" htmlFor="kling-motion-orientation" hint={orientationHint}>
        <select
          id="kling-motion-orientation"
          className={controlClassName}
          value={orientation}
          onChange={(event) => setOrientation(event.target.value as KlingCharacterOrientation)}
        >
          <option value="video">video</option>
          <option value="image">image</option>
        </select>
      </Field>

      <Field label="Prompt" htmlFor="kling-motion-prompt" hint="Optional. Guide style or motion.">
        <textarea
          id="kling-motion-prompt"
          className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          placeholder="A cinematic ocean wave at sunrise, highly detailed"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>

      <Field label="Negative prompt" htmlFor="kling-motion-negative-prompt" hint="Optional. Describe what to keep out of the video.">
        <textarea
          id="kling-motion-negative-prompt"
          className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          placeholder="blurry faces, extra limbs, watermark"
          value={negativePrompt}
          onChange={(event) => setNegativePrompt(event.target.value)}
        />
      </Field>

      <Toggle
        id="kling-motion-keep-sound"
        checked={keepOriginalSound}
        label="Keep original sound"
        description="Keep the audio from the driving video."
        onChange={setKeepOriginalSound}
      />

      <KlingElementIdsField idPrefix="kling-motion" value={elementIds} onChange={setElementIds} />

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
