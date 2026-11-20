// Small models often write the string "null" (or a placeholder like "-") instead of leaving a field out.
// Fix that before validation, in one place for all providers.
const PLACEHOLDER = /^(null|n\/a|none|[-–—]+)$/i
const isNullString = (value: unknown) => typeof value === 'string' && PLACEHOLDER.test(value.trim())

const isTextPair = (value: object) => {
  const keys = Object.keys(value)
  return keys.length > 0 && keys.every((key) => key === 'pl' || key === 'en')
}

export const normalizeLlmOutput = (value: unknown): unknown => {
  if (isNullString(value)) return null
  if (Array.isArray(value)) return value.map(normalizeLlmOutput)
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, item]) => [key, normalizeLlmOutput(item)] as const)
    // A { pl, en } text whose values are all null means "no text"
    if (isTextPair(value) && entries.every(([, item]) => item === null)) return null
    return Object.fromEntries(entries)
  }
  return value
}
