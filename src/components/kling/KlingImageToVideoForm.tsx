import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { KLING_ELEMENT_LIST_LIMIT, validateAttachmentLimit } from '../../lib/attachmentLimits'
import { evaluateIntegerField, evaluateNumberField } from '../../lib/numericField'
import type { KlingImageToVideoInput, KlingPromptMode, KlingShotType } from '../../lib/types'
import {
  KLING_CFG_MAX,
  KLING_CFG_MIN,
  KLING_DEFAULT_CFG,
  KLING_DEFAULT_DURATION,
  KLING_DURATION_MAX,
  KLING_DURATION_MIN,
  type KlingConfig,
} from '../klingConfig'
import { MediaUpload } from '../MediaUpload'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { KlingAdvancedFields } from './KlingAdvancedFields'
import { KlingElementIdsField } from './KlingElementIdsField'
import { KlingMultiShotEditor } from './KlingMultiShotEditor'
import { createKlingShotDraft, evaluateKlingShots, readKlingElementIds, readKlingShotDrafts, toKlingElementRefs } from './klingFormShared'

interface KlingImageToVideoFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: KlingImageToVideoInput) => Promise<void>
  klingConfig?: KlingConfig
}

const MAX_IMAGE_ITEMS = 1

const controlClassName =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500'

const resolveShotType = (value: unknown): KlingShotType => (value === 'intelligence' ? 'intelligence' : 'customize')

const resolvePromptMode = (value: unknown, multiPrompt: unknown): KlingPromptMode => {
  if (value === 'multi' || value === 'single') return value
  return Array.isArray(multiPrompt) && multiPrompt.length > 0 ? 'multi' : 'single'
}

const readUrlList = (value: unknown): string[] => (typeof value === 'string' && value ? [value] : [])

export const KlingImageToVideoForm = (props: KlingImageToVideoFormProps) => {
  if (!props.klingConfig) {
    return <p className="text-sm text-rose-300">This Kling workflow is missing its form config.</p>
  }

  return <KlingImageToVideoFormBody {...props} klingConfig={props.klingConfig} />
}

const KlingImageToVideoFormBody = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  initialValues,
  onValuesChange,
  onSubmit,
  klingConfig,
}: KlingImageToVideoFormProps & { klingConfig: KlingConfig }) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [promptMode, setPromptMode] = useState<KlingPromptMode>(() =>
    resolvePromptMode(initialValues?.prompt_mode, initialValues?.multi_prompt),
  )
  const [shots, setShots] = useState(() => readKlingShotDrafts(initialValues?.shots ?? initialValues?.multi_prompt) ?? [createKlingShotDraft()])
  const [imageUrls, setImageUrls] = useState<string[]>(() => readUrlList(initialValues?.image))
  const [endImageUrls, setEndImageUrls] = useState<string[]>(() => readUrlList(initialValues?.end_image))
  const [duration, setDuration] = useState(() =>
    typeof initialValues?.duration === 'number' ? String(initialValues.duration) : String(KLING_DEFAULT_DURATION),
  )
  const [cfgScale, setCfgScale] = useState(() =>
    typeof initialValues?.cfg_scale === 'number' ? String(initialValues.cfg_scale) : String(KLING_DEFAULT_CFG),
  )
  const [negativePrompt, setNegativePrompt] = useState(() =>
    typeof initialValues?.negative_prompt === 'string' ? initialValues.negative_prompt : '',
  )
  const [sound, setSound] = useState(() => initialValues?.sound === true)
  const [shotType, setShotType] = useState<KlingShotType>(() => resolveShotType(initialValues?.shot_type))
  const [elementIds, setElementIds] = useState<string[]>(() => {
    const restored = readKlingElementIds(initialValues?.element_list)
    return restored.length > 0 ? restored : ['']
  })
  const [error, setError] = useState<string | null>(null)

  const effectiveMode: KlingPromptMode = klingConfig.supportsShotType && shotType === 'intelligence' ? 'single' : promptMode
  const promptRequired = klingConfig.supportsShotType && shotType === 'intelligence'
  const imageHint = `jpg, jpeg, or png. Max ${klingConfig.imageMaxMb}MB. At least 300px per side. Aspect ratio between 1:2.5 and 2.5:1.`

  const { value: durationValue, error: durationError } = useMemo(
    () => evaluateIntegerField(duration, { label: 'Duration', min: KLING_DURATION_MIN, max: KLING_DURATION_MAX }),
    [duration],
  )
  const { value: cfgValue, error: cfgError } = useMemo(
    () => evaluateNumberField(cfgScale, { label: 'CFG scale', min: KLING_CFG_MIN, max: KLING_CFG_MAX }),
    [cfgScale],
  )
  const shotEvaluation = useMemo(() => evaluateKlingShots(shots, durationValue), [shots, durationValue])
  const elementRefs = useMemo(() => toKlingElementRefs(elementIds), [elementIds])
  const elementError = klingConfig.supportsElements
    ? validateAttachmentLimit(
        'Element IDs',
        elementIds.map((id) => id.trim()).filter((id) => id.length > 0),
        KLING_ELEMENT_LIST_LIMIT,
      )
    : null
  const imageError = validateAttachmentLimit('First-frame image', imageUrls, MAX_IMAGE_ITEMS)
  const endImageError =
    klingConfig.supportsEndImage && effectiveMode === 'single'
      ? validateAttachmentLimit('End image', endImageUrls, MAX_IMAGE_ITEMS)
      : null

  const payload = useMemo<KlingImageToVideoInput | null>(() => {
    if (durationError || cfgError || typeof durationValue !== 'number' || typeof cfgValue !== 'number') return null
    if (!imageUrls[0] || imageError || endImageError || elementError) return null

    const next: KlingImageToVideoInput = {
      image: imageUrls[0],
      duration: durationValue,
      cfg_scale: cfgValue,
    }

    if (klingConfig.supportsShotType) next.shot_type = shotType
    if (klingConfig.supportsSound) next.sound = sound

    const trimmedNegative = negativePrompt.trim()
    if (klingConfig.supportsNegativePrompt && trimmedNegative) next.negative_prompt = trimmedNegative
    if (klingConfig.supportsElements && elementRefs.length > 0) next.element_list = elementRefs

    if (effectiveMode === 'multi') {
      if (klingConfig.supportsEndImage && endImageUrls[0]) return null
      if (!shotEvaluation.shots) return null
      next.multi_prompt = shotEvaluation.shots
      return next
    }

    const trimmedPrompt = prompt.trim()
    if (promptRequired && !trimmedPrompt) return null
    if (trimmedPrompt) next.prompt = trimmedPrompt
    if (klingConfig.supportsEndImage && endImageUrls[0]) next.end_image = endImageUrls[0]
    return next
  }, [
    cfgError,
    cfgValue,
    durationError,
    durationValue,
    effectiveMode,
    elementError,
    elementRefs,
    endImageError,
    endImageUrls,
    imageError,
    imageUrls,
    klingConfig,
    negativePrompt,
    prompt,
    promptRequired,
    shotEvaluation.shots,
    shotType,
    sound,
  ])

  const isFormValid = payload !== null
  const pricingInput = payload as unknown as Record<string, unknown> | null

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const draft: Record<string, unknown> = {
      prompt,
      prompt_mode: promptMode,
      shots: shots.map(({ prompt: shotPrompt, duration: shotDuration }) => ({ prompt: shotPrompt, duration: shotDuration })),
      negative_prompt: negativePrompt,
      sound,
      shot_type: shotType,
    }
    if (imageUrls[0]) draft.image = imageUrls[0]
    if (endImageUrls[0]) draft.end_image = endImageUrls[0]
    if (typeof durationValue === 'number') draft.duration = durationValue
    if (typeof cfgValue === 'number') draft.cfg_scale = cfgValue
    if (elementRefs.length > 0) draft.element_list = elementRefs
    return draft
  }, [cfgValue, durationValue, elementRefs, endImageUrls, imageUrls, negativePrompt, prompt, promptMode, shotType, shots, sound])

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
      setError('Please provide a first-frame image.')
      return
    }
    if (imageError || endImageError || elementError) {
      setError(imageError ?? endImageError ?? elementError)
      return
    }
    if (durationError || typeof durationValue !== 'number') {
      setError(durationError ?? 'Please provide a duration.')
      return
    }
    if (cfgError || typeof cfgValue !== 'number') {
      setError(cfgError ?? 'Please provide a CFG scale.')
      return
    }
    if (effectiveMode === 'multi') {
      if (klingConfig.supportsEndImage && endImageUrls[0]) {
        setError('End image cannot be used with multi-shot. Remove the end image or switch back to a single prompt.')
        return
      }
      if (shotEvaluation.error || !shotEvaluation.shots) {
        setError(shotEvaluation.error ?? 'Check the multi-shot storyboard.')
        return
      }
    } else if (promptRequired && !prompt.trim()) {
      setError('Intelligence mode needs a prompt.')
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
        label="First-frame image"
        required
        value={imageUrls}
        onChange={setImageUrls}
        maxItems={MAX_IMAGE_ITEMS}
        hint={imageHint}
      />

      {klingConfig.supportsShotType && shotType === 'intelligence' ? null : (
        <Field
          label="Prompt mode"
          htmlFor="kling-i2v-prompt-mode"
          hint="Single prompt and multi-shot cannot be sent together. An end image cannot be used with multi-shot."
        >
          <select
            id="kling-i2v-prompt-mode"
            className={controlClassName}
            value={promptMode}
            onChange={(event) => setPromptMode(event.target.value as KlingPromptMode)}
          >
            <option value="single">Single prompt</option>
            <option value="multi">Multi-shot</option>
          </select>
        </Field>
      )}

      {effectiveMode === 'single' ? (
        <Field
          label="Prompt"
          htmlFor="kling-i2v-prompt"
          required={promptRequired}
          hint={promptRequired ? 'Intelligence mode builds the storyboard from this prompt.' : 'Optional. Describe the motion you want from the first frame.'}
        >
          <textarea
            id="kling-i2v-prompt"
            className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
            placeholder="A cinematic ocean wave at sunrise, highly detailed"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
        </Field>
      ) : (
        <>
          {klingConfig.supportsEndImage && endImageUrls[0] ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2.5">
              <p className="text-sm text-amber-100">End image cannot be used with multi-shot.</p>
              <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => setEndImageUrls([])}>
                Remove end image
              </Button>
            </div>
          ) : null}
          <KlingMultiShotEditor idPrefix="kling-i2v" shots={shots} onChange={setShots} totalDuration={durationValue} />
        </>
      )}

      {klingConfig.supportsEndImage && effectiveMode === 'single' ? (
        <MediaUpload
          apiKey={apiKey}
          kind="image"
          label="End image"
          value={endImageUrls}
          onChange={setEndImageUrls}
          maxItems={MAX_IMAGE_ITEMS}
          hint="Optional. The video moves toward this frame. Not available with multi-shot."
        />
      ) : null}

      <KlingAdvancedFields
        idPrefix="kling-i2v"
        config={klingConfig}
        showAspectRatio={false}
        aspectRatio="16:9"
        onAspectRatioChange={() => undefined}
        duration={duration}
        onDurationChange={setDuration}
        durationError={durationError}
        cfgScale={cfgScale}
        onCfgScaleChange={setCfgScale}
        cfgScaleError={cfgError}
        negativePrompt={negativePrompt}
        onNegativePromptChange={setNegativePrompt}
        sound={sound}
        onSoundChange={setSound}
        shotType={shotType}
        onShotTypeChange={setShotType}
      />

      {klingConfig.supportsElements ? <KlingElementIdsField idPrefix="kling-i2v" value={elementIds} onChange={setElementIds} /> : null}

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
