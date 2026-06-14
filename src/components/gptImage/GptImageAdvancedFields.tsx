import type { GptImageAspectRatio, GptImageOutputFormat, GptImageQuality, GptImageResolution } from '../../lib/types'
import { Field } from '../ui/Field'

type AspectRatioOption = GptImageAspectRatio | 'auto'

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

const resolutionOptions: GptImageResolution[] = ['1k', '2k', '4k']
const qualityOptions: GptImageQuality[] = ['low', 'medium', 'high']
const outputFormatOptions: GptImageOutputFormat[] = ['png', 'jpeg', 'webp']

interface GptImageAdvancedFieldsProps {
  aspectRatio: AspectRatioOption
  onAspectRatioChange: (value: AspectRatioOption) => void
  resolution: GptImageResolution
  onResolutionChange: (value: GptImageResolution) => void
  quality: GptImageQuality
  onQualityChange: (value: GptImageQuality) => void
  outputFormat: GptImageOutputFormat
  onOutputFormatChange: (value: GptImageOutputFormat) => void
}

export const GptImageAdvancedFields = ({
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  quality,
  onQualityChange,
  outputFormat,
  onOutputFormatChange,
}: GptImageAdvancedFieldsProps) => {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      <Field label="Aspect ratio" htmlFor="gpt-image-aspect-ratio" hint="Optional. Auto uses model defaults.">
        <select
          id="gpt-image-aspect-ratio"
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

      <Field label="Resolution" htmlFor="gpt-image-resolution">
        <select
          id="gpt-image-resolution"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          value={resolution}
          onChange={(event) => onResolutionChange(event.target.value as GptImageResolution)}
        >
          {resolutionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Quality" htmlFor="gpt-image-quality">
        <select
          id="gpt-image-quality"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          value={quality}
          onChange={(event) => onQualityChange(event.target.value as GptImageQuality)}
        >
          {qualityOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Output format" htmlFor="gpt-image-output-format">
        <select
          id="gpt-image-output-format"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
          value={outputFormat}
          onChange={(event) => onOutputFormatChange(event.target.value as GptImageOutputFormat)}
        >
          {outputFormatOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}
