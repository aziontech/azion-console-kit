import { ref } from 'vue'

const STORAGE_KEY = 'rte-page-size'

export const PAGE_SIZE_OPTIONS = [
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: '1,000', value: 1000 },
  { label: '2,000', value: 2000 }
]

function loadPersistedSize() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const value = Number(stored)
      if (PAGE_SIZE_OPTIONS.some((option) => option.value === value)) return value
    }
  } catch {
    /* noop */
  }
  return 50
}

/**
 * Composable for persisted page size selection.
 */
export function usePageSize() {
  const pageSize = ref(loadPersistedSize())

  const setPageSize = (val) => {
    pageSize.value = val
    try {
      localStorage.setItem(STORAGE_KEY, String(val))
    } catch {
      /* noop */
    }
  }

  return { pageSize, setPageSize, PAGE_SIZE_OPTIONS }
}
