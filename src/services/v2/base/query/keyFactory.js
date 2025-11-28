import { toValue, computed, isRef } from 'vue'

export function createFinalKey(queryKey) {
  if (typeof queryKey === 'function') {
    return queryKey
  }

  if (!Array.isArray(queryKey)) {
    return [queryKey]
  }

  const hasReactive = queryKey.some((value) => isRef(value) || typeof value === 'function')

  if (!hasReactive) {
    return queryKey
  }

  return computed(() => queryKey.map((item) => toValue(item)))
}
