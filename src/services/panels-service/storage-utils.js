const isDomExceptionLike = (error) => {
  return typeof DOMException !== 'undefined' && error instanceof DOMException
}

export const hasStorageAccessError = (error) => {
  return isDomExceptionLike(error) || error?.name === 'SecurityError'
}

export const getItem = (key) => {
  return localStorage.getItem(key)
}

export const setItem = (key, value) => {
  localStorage.setItem(key, value)
}

export const reportPanelsStorageIssue = () => {
  // no-op by design: keeps API surface for future telemetry without console noise
}

export const safeEncodeBase64Json = (payload) => {
  const encodedUtf8 = encodeURIComponent(JSON.stringify(payload))
  return btoa(encodedUtf8)
}

export const safeDecodeBase64Json = (encoded) => {
  try {
    const decodedUtf8 = atob(encoded)
    return JSON.parse(decodeURIComponent(decodedUtf8))
  } catch {
    try {
      return JSON.parse(atob(encoded))
    } catch {
      return null
    }
  }
}
