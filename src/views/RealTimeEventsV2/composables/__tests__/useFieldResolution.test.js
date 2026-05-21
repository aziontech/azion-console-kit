import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useFieldResolution } from '../useFieldResolution'

const makeRow = (keys) => ({
  summary: keys.map((k) => ({ key: k, value: 'v' }))
})

describe('useFieldResolution', () => {
  const setup = (overrides = {}) => {
    const filterFields = ref(overrides.filterFields ?? [])
    const liveDatasetFields = ref(overrides.liveDatasetFields ?? [])
    const selectedFields = ref(overrides.selectedFields ?? [])
    const tableData = ref(overrides.tableData ?? [])

    const { availableFieldOptions } = useFieldResolution({
      filterFields,
      liveDatasetFields,
      selectedFields,
      tableData
    })

    return { availableFieldOptions, filterFields, liveDatasetFields, selectedFields, tableData }
  }

  it('returns empty array when all sources are empty', () => {
    const { availableFieldOptions } = setup()
    expect(availableFieldOptions.value).toEqual([])
  })

  it('merges fields from all 4 sources', () => {
    const { availableFieldOptions } = setup({
      filterFields: [{ value: 'host' }],
      liveDatasetFields: ['status'],
      selectedFields: ['requestUri'],
      tableData: [makeRow(['remoteAddr'])]
    })

    const labels = availableFieldOptions.value.map((o) => o.label)
    expect(labels).toContain('host')
    expect(labels).toContain('status')
    expect(labels).toContain('requestUri')
    expect(labels).toContain('remoteAddr')
  })

  it('deduplicates case-insensitively, preferring row-discovered casing', () => {
    const { availableFieldOptions } = setup({
      filterFields: [{ value: 'SessionId' }],
      tableData: [makeRow(['sessionid'])]
    })

    const labels = availableFieldOptions.value.map((o) => o.label)
    // Row-discovered name wins
    expect(labels).toContain('sessionid')
    expect(labels).not.toContain('SessionId')
    expect(labels.length).toBe(1)
  })

  it('filters out aggregation operators', () => {
    const { availableFieldOptions } = setup({
      liveDatasetFields: ['count', 'sum', 'host', 'avg']
    })

    const labels = availableFieldOptions.value.map((o) => o.label)
    expect(labels).toEqual(['host'])
  })

  it('sorts results alphabetically', () => {
    const { availableFieldOptions } = setup({
      liveDatasetFields: ['zeta', 'alpha', 'mid']
    })

    const labels = availableFieldOptions.value.map((o) => o.label)
    expect(labels).toEqual(['alpha', 'mid', 'zeta'])
  })

  it('returns objects with label and value properties', () => {
    const { availableFieldOptions } = setup({
      liveDatasetFields: ['host']
    })

    expect(availableFieldOptions.value).toEqual([{ label: 'host', value: 'host' }])
  })

  describe('incremental field tracking', () => {
    it('scans only new rows when tableData grows', async () => {
      const { availableFieldOptions, tableData } = setup({
        tableData: [makeRow(['host'])]
      })

      expect(availableFieldOptions.value.map((o) => o.label)).toEqual(['host'])

      // Append new rows
      tableData.value = [...tableData.value, makeRow(['status'])]
      await nextTick()

      const labels = availableFieldOptions.value.map((o) => o.label)
      expect(labels).toContain('host')
      expect(labels).toContain('status')
    })

    it('resets tracking when tableData shrinks (new query)', async () => {
      const { availableFieldOptions, tableData } = setup({
        tableData: [makeRow(['host']), makeRow(['status'])]
      })

      expect(availableFieldOptions.value.map((o) => o.label)).toContain('host')
      expect(availableFieldOptions.value.map((o) => o.label)).toContain('status')

      // Reset to new data (simulates new query)
      tableData.value = [makeRow(['newField'])]
      await nextTick()

      const labels = availableFieldOptions.value.map((o) => o.label)
      expect(labels).toEqual(['newField'])
    })

    it('handles rows with data array instead of summary', async () => {
      const row = { data: [{ key: 'myField', value: 'v' }] }
      const { availableFieldOptions } = setup({ tableData: [row] })

      expect(availableFieldOptions.value.map((o) => o.label)).toContain('myField')
    })
  })

  it('handles filterFields with object shape { value }', () => {
    const { availableFieldOptions } = setup({
      filterFields: [{ value: 'host' }, { value: 'status' }]
    })

    const labels = availableFieldOptions.value.map((o) => o.label)
    expect(labels).toContain('host')
    expect(labels).toContain('status')
  })

  it('ignores null/undefined field values', () => {
    const { availableFieldOptions } = setup({
      filterFields: [{ value: null }, { value: undefined }, { value: 'host' }],
      liveDatasetFields: [null, 'status']
    })

    const labels = availableFieldOptions.value.map((o) => o.label)
    expect(labels).toEqual(['host', 'status'])
  })
})
