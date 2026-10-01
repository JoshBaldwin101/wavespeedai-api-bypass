import { KLING_ELEMENT_LIST_LIMIT, KLING_MULTI_PROMPT_SHOT_LIMIT } from '../../lib/attachmentLimits'
import { evaluateIntegerField } from '../../lib/numericField'
import type { KlingElementRef, KlingMultiPromptShot } from '../../lib/types'
import { KLING_DURATION_MAX, KLING_DURATION_MIN } from '../klingConfig'

export interface KlingShotDraft {
  key: string
  prompt: string
  duration: string
}

export const createKlingShotDraft = (duration = ''): KlingShotDraft => ({
  key: crypto.randomUUID(),
  prompt: '',
  duration,
})

export const readKlingShotDrafts = (value: unknown): KlingShotDraft[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null

  const drafts = value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const prompt = typeof record.prompt === 'string' ? record.prompt : ''
    const duration =
      typeof record.duration === 'number' || typeof record.duration === 'string' ? String(record.duration) : ''
    return [{ ...createKlingShotDraft(duration), prompt }]
  })

  return drafts.length > 0 ? drafts.slice(0, KLING_MULTI_PROMPT_SHOT_LIMIT) : null
}

interface KlingShotEvaluation {
  shots: KlingMultiPromptShot[] | undefined
  error: string | null
  sum: number
}

export const evaluateKlingShots = (drafts: KlingShotDraft[], totalDuration: number | undefined): KlingShotEvaluation => {
  if (drafts.length < 1 || drafts.length > KLING_MULTI_PROMPT_SHOT_LIMIT) {
    return { shots: undefined, error: `Use between 1 and ${KLING_MULTI_PROMPT_SHOT_LIMIT} shots.`, sum: 0 }
  }

  const parsedShots = drafts.map((draft) => ({
    prompt: draft.prompt.trim(),
    duration: evaluateIntegerField(draft.duration, {
      label: 'Shot duration',
      min: 1,
      max: KLING_DURATION_MAX,
    }),
  }))
  const sum = parsedShots.reduce(
    (total, shot) => total + (typeof shot.duration.value === 'number' && !shot.duration.error ? shot.duration.value : 0),
    0,
  )

  for (const shot of parsedShots) {
    if (!shot.prompt) {
      return { shots: undefined, error: 'Each shot needs a prompt.', sum }
    }
    if (shot.duration.error || typeof shot.duration.value !== 'number') {
      return {
        shots: undefined,
        error: shot.duration.error ?? 'Each shot needs a duration of at least 1 second.',
        sum,
      }
    }
  }

  const shots: KlingMultiPromptShot[] = parsedShots.flatMap((shot) =>
    typeof shot.duration.value === 'number' ? [{ prompt: shot.prompt, duration: shot.duration.value }] : [],
  )

  if (typeof totalDuration !== 'number' || totalDuration < KLING_DURATION_MIN || totalDuration > KLING_DURATION_MAX) {
    return { shots: undefined, error: 'Set a total duration before using multi-shot.', sum }
  }

  if (sum !== totalDuration) {
    return {
      shots: undefined,
      error: `Shot durations must add up to ${totalDuration} seconds (currently ${sum}).`,
      sum,
    }
  }

  return { shots, error: null, sum }
}

export const toKlingElementRefs = (ids: string[]): KlingElementRef[] =>
  ids
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map((element_id) => ({ element_id }))

export const readKlingElementIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .flatMap((item) => {
      if (typeof item === 'string') return [item]
      if (item && typeof item === 'object' && 'element_id' in item) {
        const elementId = item.element_id
        if (typeof elementId === 'string') return [elementId]
        if (typeof elementId === 'number' && Number.isFinite(elementId)) return [String(elementId)]
      }
      return []
    })
    .slice(0, KLING_ELEMENT_LIST_LIMIT)
}
