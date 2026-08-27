import type {
  SeedreamAspectRatio,
  SeedreamOutputFormat,
  SeedreamPromptOptimizationMode,
  SeedreamResolution,
} from '../../lib/types'
import { Field } from '../ui/Field'

type AspectRatioOption = SeedreamAspectRatio | 'auto'

const aspectRatioOptions: AspectRatioOption[] = [
  'auto',
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
]

const resolutionOptions: SeedreamResolution[] = ['1k', '1.5k', '2k']
const outputFormatOptions: SeedreamOutputFormat[] = ['jpeg', 'png']
const promptOptimizationModeOptions: SeedreamPromptOptimizationMode[] = ['standard', 'fast']

interface SeedreamAdvancedFieldsProps {
  aspectRatio: AspectRatioOption
  onAspectRatioChange: (value: AspectRatioOption) => void
  resolution: SeedreamResolution
  onResolutionChange: (value: SeedreamResolution) => void
  outputFormat: SeedreamOutputFormat
  onOutputFormatChange: (value: SeedreamOutputFormat) => void
  promptOptimizationMode: SeedreamPromptOptimizationMode
  onPromptOptimizationModeChange: (value: SeedreamPromptOptimizationMode) => void
}

export const SeedreamAdvancedFields = ({
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  outputFormat,
  onOutputFormatChange,
  promptOptimizationMode,
  onPromptOptimizationModeChange,
}: SeedreamAdvancedFieldsProps) => {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      <Field
        label="Aspect ratio"
        htmlFor="seedream-aspect-ratio"
        hint="Optional. Auto uses the closest supported ratio from the first input image."
      >
        <select
          id="seedream-aspect-ratio"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          value={aspectRatio}
          onChange={(event) => onAspectRatioChange(event.target.value as AspectRatioOption)}
        >
          {aspectRatioOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'auto' ? 'Auto' : option}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Resolution" htmlFor="seedream-resolution">
        <select
          id="seedream-resolution"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          value={resolution}
          onChange={(event) => onResolutionChange(event.target.value as SeedreamResolution)}
        >
          {resolutionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Output format" htmlFor="seedream-output-format">
        <select
          id="seedream-output-format"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          value={outputFormat}
          onChange={(event) => onOutputFormatChange(event.target.value as SeedreamOutputFormat)}
        >
          {outputFormatOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Prompt optimization"
        htmlFor="seedream-prompt-optimization-mode"
        hint="Fast rewrites less thoroughly and follows long prompts less closely, but generates several times quicker."
      >
        <select
          id="seedream-prompt-optimization-mode"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          value={promptOptimizationMode}
          onChange={(event) =>
            onPromptOptimizationModeChange(event.target.value as SeedreamPromptOptimizationMode)
          }
        >
          {promptOptimizationModeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}
