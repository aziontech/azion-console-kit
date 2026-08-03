import { computed } from 'vue'
import { useTableDefinitionsStore } from '@/stores/table-definitions'

export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export const coerceTablePageSize = (value, options = TABLE_PAGE_SIZE_OPTIONS) => {
  const supported = Array.isArray(options) && options.length ? options : TABLE_PAGE_SIZE_OPTIONS
  const requested = Number(value)

  if (!Number.isFinite(requested) || requested <= 0) return supported[0]
  if (supported.includes(requested)) return requested

  return supported.reduce((closest, option) =>
    Math.abs(option - requested) < Math.abs(closest - requested) ? option : closest
  )
}

export function useTablePageSize(options = TABLE_PAGE_SIZE_OPTIONS) {
  const tableDefinitions = useTableDefinitionsStore()

  const pageSize = computed(() =>
    coerceTablePageSize(tableDefinitions.getNumberOfLinesPerPage, options)
  )

  const setPageSize = (rows) => {
    tableDefinitions.setNumberOfLinesPerPage(coerceTablePageSize(rows, options))
  }

  return { pageSize, setPageSize }
}
