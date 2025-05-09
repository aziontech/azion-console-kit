const formatEscapedJson = (value) => {
  try {
    const cleaned = value.replace(/\\"/g, '"')
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
