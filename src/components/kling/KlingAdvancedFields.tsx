import type { ReactNode } from 'react'
import {
  KLING_CFG_MAX,
  KLING_CFG_MIN,
  KLING_DURATION_MAX,
  KLING_DURATION_MIN,
  type KlingConfig,
} from '../klingConfig'
import type { KlingAspectRatio, KlingShotType } from '../../lib/types'
import { Field } from '../ui/Field'
import { Toggle } from '../ui/Toggle'

const aspectRatioOptions: KlingAspectRatio[] = ['16:9', '9:16', '1:1']
const shotTypeOptions: KlingShotType[] = ['customize', 'intelligence']

const controlClassName =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500'

interface KlingAdvancedFieldsProps {
  idPrefix: string
  config: KlingConfig
  showAspectRatio: boolean
  aspectRatio: KlingAspectRatio
  onAspectRatioChange: (value: KlingAspectRatio) => void
  duration: string
  onDurationChange: (value: string) => void
  durationError?: ReactNode
  cfgScale: string
  onCfgScaleChange: (value: string) => void
  cfgScaleError?: ReactNode
  negativePrompt: string
  onNegativePromptChange: (value: string) => void
  sound: boolean
  onSoundChange: (value: boolean) => void
  shotType: KlingShotType
  onShotTypeChange: (value: KlingShotType) => void
}

export const KlingAdvancedFields = ({
  idPrefix,
  config,
  showAspectRatio,
  aspectRatio,
  onAspectRatioChange,
  duration,
  onDurationChange,
  durationError,
  cfgScale,
  onCfgScaleChange,
  cfgScaleError,
  negativePrompt,
  onNegativePromptChange,
  sound,
  onSoundChange,
  shotType,
  onShotTypeChange,
}: KlingAdvancedFieldsProps) => {
  const columnCount = 2 + (showAspectRatio ? 1 : 0)

  return (
    <>
      <div className={`grid gap-3 sm:gap-4 ${columnCount === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
        {showAspectRatio ? (
          <Field label="Aspect ratio" htmlFor={`${idPrefix}-aspect-ratio`}>
            <select
              id={`${idPrefix}-aspect-ratio`}
              className={controlClassName}
              value={aspectRatio}
              onChange={(event) => onAspectRatioChange(event.target.value as KlingAspectRatio)}
            >
              {aspectRatioOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field
          className={showAspectRatio ? 'col-span-1' : undefined}
          label="Duration (seconds)"
          htmlFor={`${idPrefix}-duration`}
          error={durationError}
          hint={`Allowed range: ${KLING_DURATION_MIN}-${KLING_DURATION_MAX}.`}
        >
          <input
            id={`${idPrefix}-duration`}
            className={controlClassName}
            inputMode="numeric"
            placeholder="5"
            value={duration}
            onChange={(event) => onDurationChange(event.target.value)}
          />
        </Field>

        <Field
          label="CFG scale"
          htmlFor={`${idPrefix}-cfg-scale`}
          error={cfgScaleError}
          hint={`Prompt guidance from ${KLING_CFG_MIN} to ${KLING_CFG_MAX}. Higher follows the prompt more closely.`}
        >
          <input
            id={`${idPrefix}-cfg-scale`}
            className={controlClassName}
            inputMode="decimal"
            placeholder="0.5"
            value={cfgScale}
            onChange={(event) => onCfgScaleChange(event.target.value)}
          />
        </Field>
      </div>

      {config.supportsNegativePrompt ? (
        <Field label="Negative prompt" htmlFor={`${idPrefix}-negative-prompt`} hint="Optional. Describe what to keep out of the video.">
          <textarea
            id={`${idPrefix}-negative-prompt`}
            className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            placeholder="blurry faces, extra limbs, watermark"
            value={negativePrompt}
            onChange={(event) => onNegativePromptChange(event.target.value)}
          />
        </Field>
      ) : null}

      {config.supportsShotType ? (
        <Field
          label="Shot type"
          htmlFor={`${idPrefix}-shot-type`}
          hint="Customize uses your storyboard. Intelligence builds shots from the prompt and ignores multi-shot."
        >
          <select
            id={`${idPrefix}-shot-type`}
            className={controlClassName}
            value={shotType}
            onChange={(event) => onShotTypeChange(event.target.value as KlingShotType)}
          >
            {shotTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {config.supportsSound ? (
        <Toggle
          id={`${idPrefix}-sound`}
          checked={sound}
          label="Sound"
          description="Generate audio with the video. Sound increases the price."
          onChange={onSoundChange}
        />
      ) : null}
    </>
  )
}
