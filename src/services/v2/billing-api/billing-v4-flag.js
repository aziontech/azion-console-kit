export const BILLING_V4_STORAGE_KEY = 'billing_v4_override'

const TRUTHY = Object.freeze(['1', 'true', 'on', 'enabled'])
const FALSY = Object.freeze(['0', 'false', 'off', 'disabled'])

const normalize = (value) => {
  if (value === null || value === undefined || value === '') return undefined
  const normalized = String(value).trim().toLowerCase()
  if (TRUTHY.includes(normalized)) return true
  if (FALSY.includes(normalized)) return false
  return undefined
}

const readStoredFlag = () => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(BILLING_V4_STORAGE_KEY)
  } catch {
    return null
  }
}

export const isBillingV4Enabled = () => {
  const sources = [import.meta.env.VITE_BILLING_V4, readStoredFlag()]

  for (const source of sources) {
    const resolved = normalize(source)
    if (resolved !== undefined) return resolved
  }

  return false
}
