import { KLING_DURATION_MAX } from '../klingConfig'
import { KLING_MULTI_PROMPT_SHOT_LIMIT } from '../../lib/attachmentLimits'
import { evaluateIntegerField } from '../../lib/numericField'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { createKlingShotDraft, evaluateKlingShots, type KlingShotDraft } from './klingFormShared'

const controlClassName =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500'

interface KlingMultiShotEditorProps {
  idPrefix: string
  shots: KlingShotDraft[]
  onChange: (shots: KlingShotDraft[]) => void
  totalDuration: number | undefined
}

export const KlingMultiShotEditor = ({ idPrefix, shots, onChange, totalDuration }: KlingMultiShotEditorProps) => {
  const evaluation = evaluateKlingShots(shots, totalDuration)
  const totalLabel = typeof totalDuration === 'number' ? `${totalDuration}s` : 'the total duration'
  const atShotLimit = shots.length >= KLING_MULTI_PROMPT_SHOT_LIMIT

  const updateShot = (key: string, patch: Partial<Pick<KlingShotDraft, 'prompt' | 'duration'>>) => {
    onChange(shots.map((shot) => (shot.key === key ? { ...shot, ...patch } : shot)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-200">Shots</p>
        <p className={`text-xs ${evaluation.error ? 'text-rose-300' : 'text-slate-400'}`}>
          Shots total {evaluation.sum}s of {totalLabel}
        </p>
      </div>

      {shots.map((shot, index) => {
        const durationField = evaluateIntegerField(shot.duration, {
          label: 'Shot duration',
          min: 1,
          max: KLING_DURATION_MAX,
        })
        return (
          <div key={shot.key} className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">Shot {index + 1}</p>
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                disabled={shots.length <= 1}
                onClick={() => onChange(shots.filter((item) => item.key !== shot.key))}
              >
                Remove
              </Button>
            </div>
            <Field label="Prompt" htmlFor={`${idPrefix}-shot-${index}-prompt`} required>
              <textarea
                id={`${idPrefix}-shot-${index}-prompt`}
                className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
                placeholder="Describe this shot"
                value={shot.prompt}
                onChange={(event) => updateShot(shot.key, { prompt: event.target.value })}
              />
            </Field>
            <Field
              label="Duration (seconds)"
              htmlFor={`${idPrefix}-shot-${index}-duration`}
              required
              error={shot.duration.trim() ? durationField.error : null}
              hint="At least 1 second. All shot durations must add up to the total duration."
            >
              <input
                id={`${idPrefix}-shot-${index}-duration`}
                className={controlClassName}
                inputMode="numeric"
                placeholder="3"
                value={shot.duration}
                onChange={(event) => updateShot(shot.key, { duration: event.target.value })}
              />
            </Field>
          </div>
        )
      })}

      {evaluation.error ? <p className="text-xs text-rose-300">{evaluation.error}</p> : null}

      <Button
        variant="secondary"
        disabled={atShotLimit}
        onClick={() => onChange([...shots, createKlingShotDraft()])}
      >
        Add shot
      </Button>
    </div>
  )
}
