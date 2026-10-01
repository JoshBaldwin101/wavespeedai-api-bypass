import { useMemo, useState } from 'react'
import { buildSubmitLabel, useLivePricing } from '../../hooks/useLivePricing'
import { usePersistedFormDraft } from '../../hooks/usePersistedFormDraft'
import { evaluateIntegerField, evaluateNumberField } from '../../lib/numericField'
import type { KlingAspectRatio, KlingPromptMode, KlingShotType, KlingTextToVideoInput } from '../../lib/types'
import {
  KLING_CFG_MAX,
  KLING_CFG_MIN,
  KLING_DEFAULT_CFG,
  KLING_DEFAULT_DURATION,
  KLING_DURATION_MAX,
  KLING_DURATION_MIN,
  type KlingConfig,
} from '../klingConfig'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { KlingAdvancedFields } from './KlingAdvancedFields'
import { KlingMultiShotEditor } from './KlingMultiShotEditor'
import { createKlingShotDraft, evaluateKlingShots, readKlingShotDrafts } from './klingFormShared'

interface KlingTextToVideoFormProps {
  apiKey: string
  pricingModelId: string
  isSubmitting: boolean
  submitLabel?: string
  initialValues?: Record<string, unknown>
  onValuesChange?: (input: Record<string, unknown>) => void
  onSubmit: (input: KlingTextToVideoInput) => Promise<void>
  klingConfig?: KlingConfig
}

const controlClassName =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500'

const resolveAspectRatio = (value: unknown): KlingAspectRatio =>
  value === '16:9' || value === '9:16' || value === '1:1' ? value : '16:9'

const resolveShotType = (value: unknown): KlingShotType => (value === 'intelligence' ? 'intelligence' : 'customize')

const resolvePromptMode = (value: unknown, multiPrompt: unknown): KlingPromptMode => {
  if (value === 'multi' || value === 'single') return value
  return Array.isArray(multiPrompt) && multiPrompt.length > 0 ? 'multi' : 'single'
}

export const KlingTextToVideoForm = (props: KlingTextToVideoFormProps) => {
  if (!props.klingConfig) {
    return <p className="text-sm text-rose-300">This Kling workflow is missing its form config.</p>
  }

  return <KlingTextToVideoFormBody {...props} klingConfig={props.klingConfig} />
}

const KlingTextToVideoFormBody = ({
  apiKey,
  pricingModelId,
  isSubmitting,
  submitLabel = 'Generate video',
  initialValues,
  onValuesChange,
  onSubmit,
  klingConfig,
}: KlingTextToVideoFormProps & { klingConfig: KlingConfig }) => {
  const [prompt, setPrompt] = useState(() => (typeof initialValues?.prompt === 'string' ? initialValues.prompt : ''))
  const [promptMode, setPromptMode] = useState<KlingPromptMode>(() =>
    resolvePromptMode(initialValues?.prompt_mode, initialValues?.multi_prompt),
  )
  const [shots, setShots] = useState(() => readKlingShotDrafts(initialValues?.shots ?? initialValues?.multi_prompt) ?? [createKlingShotDraft()])
  const [aspectRatio, setAspectRatio] = useState<KlingAspectRatio>(() => resolveAspectRatio(initialValues?.aspect_ratio))
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
  const [error, setError] = useState<string | null>(null)

  const effectiveMode: KlingPromptMode = klingConfig.supportsShotType && shotType === 'intelligence' ? 'single' : promptMode
  const promptRequired = effectiveMode === 'single'

  const { value: durationValue, error: durationError } = useMemo(
    () => evaluateIntegerField(duration, { label: 'Duration', min: KLING_DURATION_MIN, max: KLING_DURATION_MAX }),
    [duration],
  )
  const { value: cfgValue, error: cfgError } = useMemo(
    () => evaluateNumberField(cfgScale, { label: 'CFG scale', min: KLING_CFG_MIN, max: KLING_CFG_MAX }),
    [cfgScale],
  )
  const shotEvaluation = useMemo(() => evaluateKlingShots(shots, durationValue), [shots, durationValue])

  const payload = useMemo<KlingTextToVideoInput | null>(() => {
    if (durationError || cfgError || typeof durationValue !== 'number' || typeof cfgValue !== 'number') return null

    const next: KlingTextToVideoInput = {
      aspect_ratio: aspectRatio,
      duration: durationValue,
      cfg_scale: cfgValue,
    }

    if (klingConfig.supportsShotType) next.shot_type = shotType
    if (klingConfig.supportsSound) next.sound = sound

    const trimmedNegative = negativePrompt.trim()
    if (klingConfig.supportsNegativePrompt && trimmedNegative) next.negative_prompt = trimmedNegative

    if (effectiveMode === 'multi') {
      if (!shotEvaluation.shots) return null
      next.multi_prompt = shotEvaluation.shots
      return next
    }

    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) return null
    next.prompt = trimmedPrompt
    return next
  }, [
    aspectRatio,
    cfgError,
    cfgValue,
    durationError,
    durationValue,
    effectiveMode,
    klingConfig,
    negativePrompt,
    prompt,
    shotEvaluation.shots,
    shotType,
    sound,
  ])

  const isFormValid = payload !== null
  const pricingInput = payload as unknown as Record<string, unknown> | null

  const draftInput = useMemo<Record<string, unknown>>(() => {
    const payload: Record<string, unknown> = {
      prompt,
      prompt_mode: promptMode,
      shots: shots.map(({ prompt: shotPrompt, duration: shotDuration }) => ({ prompt: shotPrompt, duration: shotDuration })),
      aspect_ratio: aspectRatio,
      negative_prompt: negativePrompt,
      sound,
      shot_type: shotType,
    }
    if (typeof durationValue === 'number') payload.duration = durationValue
    if (typeof cfgValue === 'number') payload.cfg_scale = cfgValue
    return payload
  }, [aspectRatio, cfgValue, durationValue, negativePrompt, prompt, promptMode, shotType, shots, sound])

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

    if (durationError || typeof durationValue !== 'number') {
      setError(durationError ?? 'Please provide a duration.')
      return
    }
    if (cfgError || typeof cfgValue !== 'number') {
      setError(cfgError ?? 'Please provide a CFG scale.')
      return
    }
    if (effectiveMode === 'multi') {
      if (shotEvaluation.error || !shotEvaluation.shots) {
        setError(shotEvaluation.error ?? 'Check the multi-shot storyboard.')
        return
      }
    } else if (!prompt.trim()) {
      setError('Please provide a prompt.')
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
      {klingConfig.supportsShotType && shotType === 'intelligence' ? null : (
        <Field
          label="Prompt mode"
          htmlFor="kling-t2v-prompt-mode"
          hint="Single prompt and multi-shot cannot be sent together. Shot durations must add up to the total duration."
        >
          <select
            id="kling-t2v-prompt-mode"
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
          htmlFor="kling-t2v-prompt"
          required={promptRequired}
          hint="Describe the scene, motion, and style."
        >
          <textarea
            id="kling-t2v-prompt"
            className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:min-h-44"
            placeholder="A cinematic ocean wave at sunrise, highly detailed"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
        </Field>
      ) : (
        <KlingMultiShotEditor idPrefix="kling-t2v" shots={shots} onChange={setShots} totalDuration={durationValue} />
      )}

      <KlingAdvancedFields
        idPrefix="kling-t2v"
        config={klingConfig}
        showAspectRatio
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
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
