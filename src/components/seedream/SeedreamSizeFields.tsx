import type { ReactNode } from 'react'
import {
  fitAspectToPixelBudget,
  SEEDREAM_ASPECT_PRESETS,
  SEEDREAM_SIZE_MAX,
  SEEDREAM_SIZE_MIN,
  type SeedreamSize,
} from '../../lib/seedreamSize'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

interface SeedreamSizeFieldsProps {
  width: string
  height: string
  widthError?: ReactNode
  heightError?: ReactNode
  onWidthChange: (value: string) => void
  onHeightChange: (value: string) => void
  onApplySize: (width: number, height: number) => void
  onMatchFirstImage: () => void
  canMatchFirstImage: boolean
  sourceDimensions: SeedreamSize | null
}

const ratioMatches = (width: number, height: number, aspectWidth: number, aspectHeight: number): boolean => {
  if (width <= 0 || height <= 0) return false
  return Math.abs(width / height - aspectWidth / aspectHeight) < 0.02
}

export const SeedreamSizeFields = ({
  width,
  height,
  widthError,
  heightError,
  onWidthChange,
  onHeightChange,
  onApplySize,
  onMatchFirstImage,
  canMatchFirstImage,
  sourceDimensions,
}: SeedreamSizeFieldsProps) => {
  const parsedWidth = Number.parseInt(width, 10)
  const parsedHeight = Number.parseInt(height, 10)
  const hasParsedSize = Number.isFinite(parsedWidth) && Number.isFinite(parsedHeight)

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 sm:space-y-4 sm:p-4">
      <Field
        label="Size"
        required
        hint={
          sourceDimensions
            ? `This model does not infer size from the input image, so a size is always sent. First input image is ${sourceDimensions.width} x ${sourceDimensions.height}. The fields below target a ~2048 x 2048 pixel budget at that aspect. Type the source's exact dimensions if you want a 1:1 pixel match.`
            : 'This model does not infer size from the input image, so a size is always sent. Upload a first image to match its aspect, or pick a preset.'
        }
      >
        <div className="flex flex-wrap gap-2">
          {SEEDREAM_ASPECT_PRESETS.map((preset) => {
            const isActive = hasParsedSize && ratioMatches(parsedWidth, parsedHeight, preset.width, preset.height)
            return (
              <button
                key={preset.label}
                type="button"
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:text-sm ${
                  isActive
                    ? 'border-sky-500 bg-sky-500/15 text-sky-100'
                    : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500'
                }`}
                onClick={() => {
                  const next = fitAspectToPixelBudget(preset.width, preset.height)
                  onApplySize(next.width, next.height)
                }}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </Field>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Field label="Width" htmlFor="seedream-size-width" error={widthError} required>
          <input
            id="seedream-size-width"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            inputMode="numeric"
            placeholder={String(SEEDREAM_SIZE_MIN)}
            value={width}
            onChange={(event) => onWidthChange(event.target.value)}
          />
        </Field>
        <Field label="Height" htmlFor="seedream-size-height" error={heightError} required>
          <input
            id="seedream-size-height"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500"
            inputMode="numeric"
            placeholder={String(SEEDREAM_SIZE_MIN)}
            value={height}
            onChange={(event) => onHeightChange(event.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-300">
          {hasParsedSize ? `${parsedWidth} x ${parsedHeight} px` : 'Enter width and height'}
          <span className="ml-2 text-xs text-slate-500">
            {SEEDREAM_SIZE_MIN}-{SEEDREAM_SIZE_MAX}
          </span>
        </p>
        <Button
          className="px-3 py-1.5 text-xs sm:px-3.5 sm:py-2 sm:text-sm"
          variant="secondary"
          disabled={!canMatchFirstImage}
          onClick={onMatchFirstImage}
        >
          Match first input image
        </Button>
      </div>
    </div>
  )
}
