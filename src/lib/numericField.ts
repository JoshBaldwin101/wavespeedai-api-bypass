interface EvaluateNumericFieldOptions {
  label: string
  min: number
  max: number
}

interface EvaluateNumericFieldResult {
  value: number | undefined
  error: string | null
}

export const evaluateIntegerField = (
  rawValue: string,
  { label, min, max }: EvaluateNumericFieldOptions,
): EvaluateNumericFieldResult => {
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

export const evaluateNumberField = (
  rawValue: string,
  { label, min, max }: EvaluateNumericFieldOptions,
): EvaluateNumericFieldResult => {
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return { value: undefined, error: null }
  }

  if (!/^-?(?:\d+|\d+\.\d+)$/.test(trimmed)) {
    return {
      value: Number.NaN,
      error: `${label} must be a number from ${min} to ${max}.`,
    }
  }

  const value = Number.parseFloat(trimmed)
  if (value < min || value > max) {
    return {
      value,
      error: `${label} must be from ${min} to ${max}.`,
    }
  }

  return { value, error: null }
}
