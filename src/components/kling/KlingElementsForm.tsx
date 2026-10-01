import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { KLING_ELEMENT_REFERENCE_IMAGE_LIMIT, validateAttachmentLimit } from '../../lib/attachmentLimits'
import type { KlingElementsInput } from '../../lib/types'
import { KLING_DESCRIPTION_MAX, KLING_NAME_MAX } from '../klingConfig'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

interface KlingElementsFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: KlingElementsInput) => Promise<void>
}

const MAX_FRONT_IMAGES = 1

const controlClassName =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500'

const readStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : []

const lengthError = (label: string, value: string, max: number): string | null => {
  if (value.length > max) return `${label} must be ${max} characters or fewer.`
  return null
}

export const KlingElementsForm = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Create element',
  initialValues,
  onValuesChange,
  onSubmit,
}: KlingElementsFormProps) => {
  const [name, setName] = useState(() => (typeof initialValues?.name === 'string' ? initialValues.name : ''))
  const [description, setDescription] = useState(() =>
    typeof initialValues?.description === 'string' ? initialValues.description : '',
  )
  const [imageUrls, setImageUrls] = useState<string[]>(() =>
    typeof initialValues?.image === 'string' && initialValues.image ? [initialValues.image] : [],
  )
  const [referenceUrls, setReferenceUrls] = useState<string[]>(() => readStringList(initialValues?.element_refer_list))
  const [voiceId, setVoiceId] = useState(() => (typeof initialValues?.voice_id === 'string' ? initialValues.voice_id : ''))
  const [error, setError] = useState<string | null>(null)

  const trimmedName = name.trim()
  const trimmedDescription = description.trim()
  const nameError = lengthError('Name', trimmedName, KLING_NAME_MAX)
  const descriptionError = lengthError('Description', trimmedDescription, KLING_DESCRIPTION_MAX)
  const imageError = validateAttachmentLimit('Front image', imageUrls, MAX_FRONT_IMAGES)
  const referenceError = validateAttachmentLimit('Reference images', referenceUrls, KLING_ELEMENT_REFERENCE_IMAGE_LIMIT)

  const payload = useMemo<KlingElementsInput | null>(() => {
    if (!trimmedName || !trimmedDescription || !imageUrls[0]) return null
    if (nameError || descriptionError || imageError || referenceError) return null

    const next: KlingElementsInput = {
      name: trimmedName,
      description: trimmedDescription,
      image: imageUrls[0],
      element_refer_list: referenceUrls,
    }
    const trimmedVoice = voiceId.trim()
    if (trimmedVoice) next.voice_id = trimmedVoice
    return next
  }, [descriptionError, imageError, imageUrls, nameError, referenceError, referenceUrls, trimmedDescription, trimmedName, voiceId])

  const isFormValid = payload !== null
  const pricingInput = payload as unknown as Record<string, unknown> | null

  const draftInput = useMemo<Record<string, unknown>>(
    () => ({
      name,
      description,
      ...(imageUrls[0] ? { image: imageUrls[0] } : {}),
      element_refer_list: referenceUrls,
      voice_id: voiceId,
    }),
    [description, imageUrls, name, referenceUrls, voiceId],
  )

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

    if (!trimmedName) {
      setError('Please provide an element name.')
      return
    }
    if (nameError) {
      setError(nameError)
      return
    }
    if (!trimmedDescription) {
      setError('Please provide an element description.')
      return
    }
    if (descriptionError) {
      setError(descriptionError)
      return
    }
    if (!imageUrls[0]) {
      setError('Please provide a front reference image.')
      return
    }
    if (imageError || referenceError) {
      setError(imageError ?? referenceError)
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
      <Field
        label={`Name (${trimmedName.length}/${KLING_NAME_MAX})`}
        htmlFor="kling-elements-name"
        required
        error={nameError}
        hint="A short name you can mention in later Kling prompts."
      >
        <input
          id="kling-elements-name"
          className={controlClassName}
          maxLength={KLING_NAME_MAX + 20}
          placeholder="Main character"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>

      <Field
        label={`Description (${trimmedDescription.length}/${KLING_DESCRIPTION_MAX})`}
        htmlFor="kling-elements-description"
        required
        error={descriptionError}
        hint="Colors, clothing, and other details that should stay consistent."
      >
        <textarea
          id="kling-elements-description"
          className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          placeholder="A person in a dark work suit, short black hair, front-facing"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Front image"
        required
        value={imageUrls}
        onChange={setImageUrls}
        maxItems={MAX_FRONT_IMAGES}
        hint="jpg, jpeg, or png. Max 10MB. At least 300px per side."
      />

      <MediaUpload
        apiKey={apiKey}
        kind="image"
        label="Other reference images"
        value={referenceUrls}
        onChange={setReferenceUrls}
        multiple
        maxItems={KLING_ELEMENT_REFERENCE_IMAGE_LIMIT}
        hint="Optional. Extra angles of the same element. Sent as an empty list when omitted."
      />

      <Field label="Voice ID" htmlFor="kling-elements-voice" hint="Optional. Binds this element to a voice from the tone library.">
        <input
          id="kling-elements-voice"
          className={controlClassName}
          placeholder="Voice ID"
          value={voiceId}
          onChange={(event) => setVoiceId(event.target.value)}
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
