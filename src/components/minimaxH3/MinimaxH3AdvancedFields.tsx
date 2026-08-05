import type { ReactNode } from 'react'
import type { MinimaxH3AspectRatio, MinimaxH3Resolution } from '../../lib/types'
import { Field } from '../ui/Field'

const aspectRatioOptions: MinimaxH3AspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', '9:21']
const resolutionOptions: MinimaxH3Resolution[] = ['480p', '768p']

interface MinimaxH3AdvancedFieldsProps {
  showAspectRatio?: boolean
  aspectRatio: MinimaxH3AspectRatio
  onAspectRatioChange: (value: MinimaxH3AspectRatio) => void
  resolution: MinimaxH3Resolution
  onResolutionChange: (value: MinimaxH3Resolution) => void
  duration: string
  onDurationChange: (value: string) => void
  durationError?: ReactNode
  durationMin?: number
  durationMax?: number
  seed: string
  onSeedChange: (value: string) => void
  seedError?: ReactNode
}

export const MinimaxH3AdvancedFields = ({
  showAspectRatio = true,
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  duration,
  onDurationChange,
  durationError,
  durationMin = 5,
  durationMax = 15,
  seed,
  onSeedChange,
  seedError,
}: MinimaxH3AdvancedFieldsProps) => {
  return (
    <>
      <div className={`grid gap-3 sm:gap-4 ${showAspectRatio ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
        {showAspectRatio ? (
          <Field label="Aspect ratio" htmlFor="minimax-h3-aspect-ratio">
            <select
              id="minimax-h3-aspect-ratio"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
              value={aspectRatio}
              onChange={(event) => onAspectRatioChange(event.target.value as MinimaxH3AspectRatio)}
            >
              {aspectRatioOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Resolution" htmlFor="minimax-h3-resolution" hint="768p is native; 480p is faster and lower cost.">
          <select
            id="minimax-h3-resolution"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={resolution}
            onChange={(event) => onResolutionChange(event.target.value as MinimaxH3Resolution)}
          >
            {resolutionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field
          className={showAspectRatio ? 'col-span-2 md:col-span-1' : undefined}
          label="Duration (seconds)"
          htmlFor="minimax-h3-duration"
          error={durationError}
          hint={`Allowed range: ${durationMin}-${durationMax}.`}
        >
          <input
            id="minimax-h3-duration"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            inputMode="numeric"
            placeholder="5"
            value={duration}
            onChange={(event) => onDurationChange(event.target.value)}
          />
        </Field>
      </div>

      <Field label="Seed" htmlFor="minimax-h3-seed" error={seedError ?? undefined} hint="Optional. Use -1 for random output.">
        <input
          id="minimax-h3-seed"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          inputMode="numeric"
          placeholder="-1"
          value={seed}
          onChange={(event) => onSeedChange(event.target.value)}
        />
      </Field>
    </>
  )
}
