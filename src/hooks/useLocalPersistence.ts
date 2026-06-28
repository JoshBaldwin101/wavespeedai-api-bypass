import { useCallback, useState } from 'react'
import {
  createDraftInput,
  createSavedParamSet,
  loadState,
  saveState,
  type DraftInput,
  type SavedParamSet,
  wipeState,
  type PersistedState,
} from '../lib/localPersistence'

const createEmptyState = (): PersistedState => ({
  draftInputs: {},
  savedParams: {},
})

interface SaveParamSetArgs {
  workflowId: string
  model: string
  input: Record<string, unknown>
}

interface LocalPersistenceState {
  enabled: boolean
  state: PersistedState
}

const getInitialState = (): LocalPersistenceState => {
  const loaded = loadState()
  if (!loaded) {
    return {
      enabled: false,
      state: createEmptyState(),
    }
  }

  return {
    enabled: true,
    state: loaded,
  }
}

export const useLocalPersistence = () => {
  const [storage, setStorage] = useState<LocalPersistenceState>(getInitialState)

  const enabled = storage.enabled
  const savedParams = storage.state.savedParams
  const draftInputs = storage.state.draftInputs
  const lastWorkflowId = storage.state.lastWorkflowId
  const persistedApiKey = storage.state.apiKey

  const enable = useCallback(() => {
    setStorage((previous) => {
      if (previous.enabled) return previous
      const nextState = saveState(previous.state)
      if (!nextState) return previous
      return {
        enabled: true,
        state: nextState,
      }
    })
  }, [])

  const disableAndWipe = useCallback(() => {
    wipeState()
    setStorage({
      enabled: false,
      state: createEmptyState(),
    })
  }, [])

  const setLastWorkflowId = useCallback((workflowId: string) => {
    setStorage((previous) => {
      if (!previous.enabled) return previous
      const normalizedWorkflowId = workflowId.trim()
      if (!normalizedWorkflowId) return previous
      const nextState = saveState({
        ...previous.state,
        lastWorkflowId: normalizedWorkflowId,
      })
      if (!nextState) return previous
      return {
        ...previous,
        state: nextState,
      }
    })
  }, [])

  const getParamSet = useCallback(
    (predictionId: string): SavedParamSet | undefined => savedParams[predictionId],
    [savedParams],
  )

  const saveParamSet = useCallback((predictionId: string, args: SaveParamSetArgs) => {
    setStorage((previous) => {
      if (!previous.enabled) return previous

      const normalizedPredictionId = predictionId.trim()
      const normalizedWorkflowId = args.workflowId.trim()
      const normalizedModel = args.model.trim()

      if (!normalizedPredictionId || !normalizedWorkflowId || !normalizedModel) return previous

      const nextState = saveState({
        ...previous.state,
        savedParams: {
          ...previous.state.savedParams,
          [normalizedPredictionId]: createSavedParamSet(
            normalizedPredictionId,
            normalizedWorkflowId,
            normalizedModel,
            args.input,
          ),
        },
      })

      if (!nextState) return previous

      return {
        ...previous,
        state: nextState,
      }
    })
  }, [])

  const getDraftInput = useCallback(
    (workflowId: string): DraftInput | undefined => {
      const normalizedWorkflowId = workflowId.trim()
      if (!normalizedWorkflowId) return undefined
      return draftInputs[normalizedWorkflowId]
    },
    [draftInputs],
  )

  const saveDraftInput = useCallback((workflowId: string, input: Record<string, unknown>) => {
    setStorage((previous) => {
      if (!previous.enabled) return previous

      const normalizedWorkflowId = workflowId.trim()
      if (!normalizedWorkflowId) return previous

      const nextState = saveState({
        ...previous.state,
        draftInputs: {
          ...previous.state.draftInputs,
          [normalizedWorkflowId]: createDraftInput(normalizedWorkflowId, input),
        },
      })

      if (!nextState) return previous

      return {
        ...previous,
        state: nextState,
      }
    })
  }, [])

  const saveApiKey = useCallback((apiKey: string) => {
    setStorage((previous) => {
      if (!previous.enabled) return previous

      const normalizedApiKey = apiKey.trim()
      if (!normalizedApiKey) return previous

      const nextState = saveState({
        ...previous.state,
        apiKey: normalizedApiKey,
      })

      if (!nextState) return previous

      return {
        ...previous,
        state: nextState,
      }
    })
  }, [])

  const clearApiKey = useCallback(() => {
    setStorage((previous) => {
      if (!previous.enabled || !previous.state.apiKey) return previous

      const { apiKey: _removed, ...rest } = previous.state
      const nextState = saveState(rest)
      if (!nextState) return previous

      return {
        ...previous,
        state: nextState,
      }
    })
  }, [])

  return {
    enabled,
    enable,
    disableAndWipe,
    lastWorkflowId,
    persistedApiKey,
    setLastWorkflowId,
    savedParams,
    getParamSet,
    saveParamSet,
    getDraftInput,
    saveDraftInput,
    saveApiKey,
    clearApiKey,
  }
}
