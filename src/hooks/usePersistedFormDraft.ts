import { useEffect } from 'react'

export const usePersistedFormDraft = (
  onValuesChange: ((input: Record<string, unknown>) => void) | undefined,
  draftInput: Record<string, unknown>,
) => {
  useEffect(() => {
    onValuesChange?.(draftInput)
  }, [draftInput, onValuesChange])
}
