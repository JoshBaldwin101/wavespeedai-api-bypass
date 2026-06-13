import { createContext } from 'react'

export interface ApiKeyContextValue {
  apiKey: string
  isValidated: boolean
  setApiKey: (value: string) => void
  setValidated: (value: boolean) => void
  reset: () => void
}

export const ApiKeyContext = createContext<ApiKeyContextValue | null>(null)
