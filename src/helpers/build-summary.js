import { getCurrentTimezone } from './account-timezone'

const formatEscapedJson = (value) => {
  try {
    let cleaned = value
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1)
    }
    cleaned = cleaned.replace(/\\"/g, '"')
    const parsed = JSON.parse(cleaned)
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    return value
  }
}

export const buildSummary = (httpResponse, shouldLimitRequestUri = false, shouldShowTs = false) => {
  const truncateRequestUri = (input) => {
    if (!shouldLimitRequestUri) return input
    if (!input) return input

    const asString = String(input)
    const limit = 50
    if (asString.length <= limit) return asString
    return `${asString.slice(0, limit)}...`
  }

  return Object.entries(httpResponse)
    .filter(([key]) => (shouldShowTs ? true : key !== 'ts'))
    .sort(([currentKey], [nextKey]) => currentKey.localeCompare(nextKey))
    .map(([key, value]) => {
      if (key === 'stacktrace' || key === 'requestData') {
        return { key, value: value ? formatEscapedJson(value) : '-' }
      }

      if (key === 'requestUri') {
        const val = value ? truncateRequestUri(value) : '-'
        return { key, value: val }
      }

      if (key === 'ts') {
        return { key, value: value ? getCurrentTimezone(value) : '-' }
      }

      return { key, value: value ? value : '-' }
    })
}
