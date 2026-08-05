const formatAttachmentCount = (maxItems: number): string => {
  if (maxItems === 1) return '1 file'
  return `${maxItems} files`
}

export const getAttachmentLimitError = (label: string, maxItems: number): string =>
  `${label} accepts at most ${formatAttachmentCount(maxItems)}.`

export const validateAttachmentLimit = (label: string, values: string[], maxItems: number): string | null => {
  if (values.length <= maxItems) return null
  return getAttachmentLimitError(label, maxItems)
}
