import { toValue, computed, isRef } from 'vue'

export function createFinalKey(queryKey) {
  if (queryKey === null || queryKey === undefined) {
    // eslint-disable-next-line no-console
    console.error(
      '[TanStack Query] Invalid queryKey: received null or undefined. Using fallback key.'
    )
    return ['__invalid_key__', Date.now()]
  }

  if (typeof queryKey === 'function') {
    return queryKey
  }

  if (!Array.isArray(queryKey)) {
    return [queryKey]
  }

  const hasInvalidValues = queryKey.some((value) => value === null || value === undefined)
  if (hasInvalidValues) {
    // eslint-disable-next-line no-console
    console.warn('[TanStack Query] QueryKey contains null or undefined values:', queryKey)
  }

  const hasReactive = queryKey.some((value) => isRef(value) || typeof value === 'function')

  if (!hasReactive) {
    return queryKey
  }

  return computed(() => queryKey.map((item) => toValue(item)))
}
