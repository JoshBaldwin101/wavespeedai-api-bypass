import { useContext } from 'react'
import { ApiKeyContext } from './apiKeyStore'

export const useApiKey = () => {
  const context = useContext(ApiKeyContext)
  if (!context) {
    throw new Error('useApiKey must be used inside ApiKeyProvider.')
  }
  return context
}
