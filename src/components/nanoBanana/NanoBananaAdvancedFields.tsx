import type { ReactNode } from 'react'
import type { NanoBananaAspectRatio, NanoBananaOutputFormat, NanoBananaResolution } from '../../lib/types'
import type { NanoBananaConfig } from '../nanoBananaConfig'
import { Field } from '../ui/Field'
import { Toggle } from '../ui/Toggle'

type AspectRatioOption = NanoBananaAspectRatio | 'auto'

interface NanoBananaAdvancedFieldsProps {
  config: NanoBananaConfig
  aspectRatio: AspectRatioOption
  onAspectRatioChange: (value: AspectRatioOption) => void
  resolution: NanoBananaResolution | ''
  onResolutionChange: (value: NanoBananaResolution) => void
  outputFormat: NanoBananaOutputFormat
  onOutputFormatChange: (value: NanoBananaOutputFormat) => void
  enableWebSearch: boolean
  onEnableWebSearchChange: (value: boolean) => void
  enableImageSearch: boolean
  onEnableImageSearchChange: (value: boolean) => void
  numImages: string
  onNumImagesChange: (value: string) => void
  numImagesError?: ReactNode
}

export const NanoBananaAdvancedFields = ({
  config,
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  outputFormat,
  onOutputFormatChange,
  enableWebSearch,
  onEnableWebSearchChange,
  enableImageSearch,
  onEnableImageSearchChange,
  numImages,
  onNumImagesChange,
  numImagesError,
}: NanoBananaAdvancedFieldsProps) => {
  return (
    <>
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Field label="Aspect ratio" htmlFor="nano-banana-aspect-ratio" hint="Optional. Auto uses model defaults.">
          <select
            id="nano-banana-aspect-ratio"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={aspectRatio}
            onChange={(event) => onAspectRatioChange(event.target.value as AspectRatioOption)}
          >
            <option value="auto">Auto</option>
            {config.aspectRatioOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        {config.resolutionOptions ? (
          <Field label="Resolution" htmlFor="nano-banana-resolution">
            <select
              id="nano-banana-resolution"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
              value={resolution}
              onChange={(event) => onResolutionChange(event.target.value as NanoBananaResolution)}
            >
              {config.resolutionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Output format" htmlFor="nano-banana-output-format">
          <select
            id="nano-banana-output-format"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            value={outputFormat}
            onChange={(event) => onOutputFormatChange(event.target.value as NanoBananaOutputFormat)}
          >
            {config.outputFormatOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        {config.supportsNumImages ? (
          <Field
            label="Number of outputs"
            htmlFor="nano-banana-num-images"
            error={numImagesError}
            hint={`Optional. Allowed range: 1-${config.maxNumImages ?? 4}.`}
          >
            <input
              id="nano-banana-num-images"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
              inputMode="numeric"
              placeholder="1"
              value={numImages}
              onChange={(event) => onNumImagesChange(event.target.value)}
            />
          </Field>
        ) : null}
      </div>

      {config.supportsWebSearch || config.supportsImageSearch ? (
        <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
          {config.supportsWebSearch ? (
            <Toggle
              id="nano-banana-web-search"
              checked={enableWebSearch}
              onChange={onEnableWebSearchChange}
              label="Enable web search"
              description="Use real-time web context during generation."
            />
          ) : null}
          {config.supportsImageSearch ? (
            <Toggle
              id="nano-banana-image-search"
              checked={enableImageSearch}
              onChange={onEnableImageSearchChange}
              label="Enable image search"
              description="Use real-time image references during generation."
            />
          ) : null}
        </div>
      ) : null}
    </>
  )
}
