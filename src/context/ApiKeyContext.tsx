import { useMemo, useState, type ReactNode } from 'react'
import { loadState } from '../lib/localPersistence'
import { ApiKeyContext, type ApiKeyContextValue } from './apiKeyStore'

const getInitialApiKeyState = () => {
  const persisted = loadState()
  if (persisted?.apiKey) {
    return { apiKey: persisted.apiKey, isValidated: true }
  }
  return { apiKey: '', isValidated: false }
}

export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const initialState = useMemo(() => getInitialApiKeyState(), [])
  const [apiKey, setApiKey] = useState(initialState.apiKey)
  const [isValidated, setIsValidated] = useState(initialState.isValidated)

  const value = useMemo<ApiKeyContextValue>(
    () => ({
      apiKey,
      isValidated,
      setApiKey: (next) => {
        setApiKey(next)
        setIsValidated(false)
      },
      setValidated: setIsValidated,
      reset: () => {
        setApiKey('')
        setIsValidated(false)
      },
    }),
    [apiKey, isValidated],
  )

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>
}
