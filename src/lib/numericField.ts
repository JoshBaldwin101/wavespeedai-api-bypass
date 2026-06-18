interface EvaluateIntegerFieldOptions {
  label: string
  min: number
  max: number
}

interface EvaluateIntegerFieldResult {
  value: number | undefined
  error: string | null
}

export const evaluateIntegerField = (
  rawValue: string,
  { label, min, max }: EvaluateIntegerFieldOptions,
): EvaluateIntegerFieldResult => {
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return { value: undefined, error: null }
  }

  if (!/^-?\d+$/.test(trimmed)) {
    return {
      value: Number.NaN,
      error: `${label} must be a whole number from ${min} to ${max}.`,
    }
  }

  const value = Number.parseInt(trimmed, 10)
  if (value < min || value > max) {
    return {
      value,
      error: `${label} must be from ${min} to ${max}.`,
    }
  }

  return { value, error: null }
}
