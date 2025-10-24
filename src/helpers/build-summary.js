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

export const buildSummary = (httpResponse) => {
  return Object.entries(httpResponse)
    .filter(([key]) => key !== 'ts')
    .sort(([currentKey], [nextKey]) => currentKey.localeCompare(nextKey))
    .map(([key, value]) => {
      if (key === 'stacktrace' || key === 'requestData') {
        return { key, value: value ? formatEscapedJson(value) : '-' }
      }

      return { key, value: value ? value : '-' }
    })
}
