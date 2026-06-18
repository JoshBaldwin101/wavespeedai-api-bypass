import type { ReactNode } from 'react'
import type { SeedanceAspectRatio, SeedanceResolution } from '../../lib/types'
import { Field } from '../ui/Field'
import { Toggle } from '../ui/Toggle'

type AspectRatioOption = SeedanceAspectRatio | 'auto'

const aspectRatioOptions: AspectRatioOption[] = ['auto', '16:9', '9:16', '4:3', '3:4', '1:1', '21:9']

interface SeedanceAdvancedFieldsProps {
  showAspectRatio?: boolean
  aspectRatio: AspectRatioOption
  onAspectRatioChange: (value: AspectRatioOption) => void
  resolution: SeedanceResolution
  onResolutionChange: (value: SeedanceResolution) => void
  resolutionOptions?: SeedanceResolution[]
  duration: string
  onDurationChange: (value: string) => void
  durationError?: ReactNode
  durationMin?: number
  durationMax?: number
  enableWebSearch: boolean
  onEnableWebSearchChange: (value: boolean) => void
  generateAudio: boolean
  onGenerateAudioChange: (value: boolean) => void
}

export const SeedanceAdvancedFields = ({
  showAspectRatio = true,
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  resolutionOptions = ['480p', '720p', '1080p'],
  duration,
  onDurationChange,
  durationError,
  durationMin = 4,
  durationMax = 15,
  enableWebSearch,
  onEnableWebSearchChange,
  generateAudio,
  onGenerateAudioChange,
}: SeedanceAdvancedFieldsProps) => {
  return (
    <>
      <div className={`grid gap-3 sm:gap-4 ${showAspectRatio ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
        {showAspectRatio ? (
          <Field label="Aspect ratio" htmlFor="seedance-aspect-ratio" hint="Leave as Adapt to input to let WaveSpeed decide.">
            <select
              id="seedance-aspect-ratio"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
              value={aspectRatio}
              onChange={(event) => onAspectRatioChange(event.target.value as AspectRatioOption)}
            >
              {aspectRatioOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'auto' ? 'Adapt to input' : option}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Resolution" htmlFor="seedance-resolution">
          <select
            id="seedance-resolution"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={resolution}
            onChange={(event) => onResolutionChange(event.target.value as SeedanceResolution)}
          >
            {resolutionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field
          className={showAspectRatio ? 'col-span-2 md:col-span-1' : 'col-span-2 md:col-span-1'}
          label="Duration (seconds)"
          htmlFor="seedance-duration"
          error={durationError}
          hint={`Optional. Allowed range: ${durationMin}-${durationMax}.`}
        >
          <input
            id="seedance-duration"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            inputMode="numeric"
            placeholder="Auto"
            value={duration}
            onChange={(event) => onDurationChange(event.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
        <Toggle
          id="seedance-web-search"
          checked={enableWebSearch}
          onChange={onEnableWebSearchChange}
          label="Enable web search"
          description="Include real-time web context in the generation call."
        />
        <Toggle
          id="seedance-generate-audio"
          checked={generateAudio}
          onChange={onGenerateAudioChange}
          label="Generate audio"
          description="Turn off to preserve the original input audio track."
        />
      </div>
    </>
  )
}
