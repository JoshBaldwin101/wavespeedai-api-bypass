const STORAGE_KEY = 'wavespeed-tool:v1'
const TTL_MS = 14 * 24 * 60 * 60 * 1000
const MAX_SAVED_PARAM_SETS = 200

export interface SavedParamSet {
  predictionId: string
  workflowId: string
  model: string
  input: Record<string, unknown>
  savedAt: number
  expiresAt: number
}

export interface PersistedState {
  lastWorkflowId?: string
  savedParams: Record<string, SavedParamSet>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const emptyState = (): PersistedState => ({
  savedParams: {},
})

const sanitizeSavedParamSet = (
  predictionId: string,
  value: unknown,
  now: number,
): SavedParamSet | null => {
  if (!isRecord(value)) return null

  const workflowId = typeof value.workflowId === 'string' ? value.workflowId.trim() : ''
  const model = typeof value.model === 'string' ? value.model.trim() : ''
  const input = isRecord(value.input) ? value.input : {}
  const savedAt = typeof value.savedAt === 'number' && Number.isFinite(value.savedAt) ? value.savedAt : now
  const expiresAt =
    typeof value.expiresAt === 'number' && Number.isFinite(value.expiresAt) ? value.expiresAt : savedAt + TTL_MS

  if (!workflowId || !model || expiresAt <= now) return null

  return {
    predictionId,
    workflowId,
    model,
    input,
    savedAt,
    expiresAt,
  }
}

const pruneSavedParams = (
  savedParams: Record<string, SavedParamSet>,
  now: number,
): Record<string, SavedParamSet> => {
  const validEntries = Object.entries(savedParams).filter(([, item]) => item.expiresAt > now)
  validEntries.sort((a, b) => b[1].savedAt - a[1].savedAt)
  return Object.fromEntries(validEntries.slice(0, MAX_SAVED_PARAM_SETS))
}

const sanitizeState = (value: unknown, now: number): PersistedState => {
  if (!isRecord(value)) return emptyState()

  const rawSavedParams = isRecord(value.savedParams) ? value.savedParams : {}
  const normalizedSavedParams: Record<string, SavedParamSet> = {}

  for (const [rawPredictionId, item] of Object.entries(rawSavedParams)) {
    const predictionId = rawPredictionId.trim()
    if (!predictionId) continue
    const normalizedItem = sanitizeSavedParamSet(predictionId, item, now)
    if (!normalizedItem) continue
    normalizedSavedParams[predictionId] = normalizedItem
  }

  const lastWorkflowId = typeof value.lastWorkflowId === 'string' ? value.lastWorkflowId.trim() : undefined

  return {
    ...(lastWorkflowId ? { lastWorkflowId } : {}),
    savedParams: pruneSavedParams(normalizedSavedParams, now),
  }
}

export const isStorageAvailable = (): boolean => {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    const probe = `${STORAGE_KEY}:probe`
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export const loadState = (): PersistedState | null => {
  if (!isStorageAvailable()) return null

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as unknown
    const now = Date.now()
    const normalized = sanitizeState(parsed, now)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    return normalized
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export const saveState = (state: PersistedState): PersistedState | null => {
  if (!isStorageAvailable()) return null
  const normalized = sanitizeState(state, Date.now())
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export const wipeState = (): void => {
  if (!isStorageAvailable()) return
  window.localStorage.removeItem(STORAGE_KEY)
}

export const createSavedParamSet = (
  predictionId: string,
  workflowId: string,
  model: string,
  input: Record<string, unknown>,
): SavedParamSet => {
  const savedAt = Date.now()
  return {
    predictionId,
    workflowId,
    model,
    input,
    savedAt,
    expiresAt: savedAt + TTL_MS,
  }
}
