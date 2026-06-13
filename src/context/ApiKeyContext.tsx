import { useMemo, useState, type ReactNode } from 'react'
import { ApiKeyContext, type ApiKeyContextValue } from './apiKeyStore'

export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKey] = useState('')
  const [isValidated, setIsValidated] = useState(false)

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
