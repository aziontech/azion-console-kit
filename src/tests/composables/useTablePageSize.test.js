import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTableDefinitionsStore } from '@/stores/table-definitions'
import {
  useTablePageSize,
  coerceTablePageSize,
  TABLE_PAGE_SIZE_OPTIONS
} from '@/composables/useTablePageSize'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('coerceTablePageSize', () => {
  it('keeps a value that is already a supported option', () => {
    expect(coerceTablePageSize(50)).toBe(50)
    expect(coerceTablePageSize(100)).toBe(100)
  })

  it('snaps an unsupported value to the nearest option', () => {
    expect(coerceTablePageSize(25)).toBe(20)
    expect(coerceTablePageSize(60)).toBe(50)
    expect(coerceTablePageSize(90)).toBe(100)
  })

  it('clamps a value above every option down to the largest one', () => {
    expect(coerceTablePageSize(2500)).toBe(100)
  })

  it('falls back to the smallest option for junk input', () => {
    expect(coerceTablePageSize(0)).toBe(10)
    expect(coerceTablePageSize(-5)).toBe(10)
    expect(coerceTablePageSize(undefined)).toBe(10)
    expect(coerceTablePageSize('abc')).toBe(10)
  })

  it('honours a custom option set', () => {
    expect(coerceTablePageSize(100, [10, 20, 50])).toBe(50)
    expect(coerceTablePageSize(25, [10, 25, 50])).toBe(25)
  })

  it('ignores an empty option set and uses the defaults', () => {
    expect(coerceTablePageSize(50, [])).toBe(50)
  })
})

describe('useTablePageSize', () => {
  it('exposes the store value as the page size', () => {
    const store = useTableDefinitionsStore()
    store.setNumberOfLinesPerPage(100)

    const { pageSize } = useTablePageSize()

    expect(pageSize.value).toBe(100)
  })

  it('defaults to the store default when nothing was ever chosen', () => {
    const { pageSize } = useTablePageSize()

    expect(pageSize.value).toBe(50)
  })

  it('coerces a stored value that is not in the supported options', () => {
    const store = useTableDefinitionsStore()
    store.setNumberOfLinesPerPage(25)

    const { pageSize } = useTablePageSize()

    expect(pageSize.value).toBe(20)
  })

  it('writes the chosen size back to the shared store', () => {
    const store = useTableDefinitionsStore()
    const { pageSize, setPageSize } = useTablePageSize()

    setPageSize(100)

    expect(store.getNumberOfLinesPerPage).toBe(100)
    expect(pageSize.value).toBe(100)
  })

  it('coerces on write so the store never holds an unrepresentable size', () => {
    const store = useTableDefinitionsStore()
    const { setPageSize } = useTablePageSize([10, 20, 50])

    setPageSize(100)

    expect(store.getNumberOfLinesPerPage).toBe(50)
  })

  it('reacts to a size chosen by another listing', () => {
    const store = useTableDefinitionsStore()
    const { pageSize } = useTablePageSize()

    expect(pageSize.value).toBe(50)
    store.setNumberOfLinesPerPage(10)

    expect(pageSize.value).toBe(10)
  })

  it('never yields a size outside the supported options', () => {
    const store = useTableDefinitionsStore()
    const { pageSize } = useTablePageSize()

    store.setNumberOfLinesPerPage(2500)

    expect(TABLE_PAGE_SIZE_OPTIONS).toContain(pageSize.value)
  })
})
