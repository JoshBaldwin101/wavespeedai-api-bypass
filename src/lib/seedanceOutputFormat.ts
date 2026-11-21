import type { SeedanceOutputFormat, SeedanceResolution } from './types'

export const resolveSeedanceOutputFormat = (value: unknown): SeedanceOutputFormat =>
  value === 'mov' ? 'mov' : 'mp4'

export const seedanceMovAvailable = (resolution: SeedanceResolution): boolean =>
  resolution !== '1080p' && resolution !== '4k'

export const seedanceOutputFormatForResolution = (
  format: SeedanceOutputFormat,
  resolution: SeedanceResolution,
): SeedanceOutputFormat => (seedanceMovAvailable(resolution) ? format : 'mp4')
