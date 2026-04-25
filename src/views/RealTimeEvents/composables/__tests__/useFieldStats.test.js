import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useFieldStats } from '../useFieldStats'

const makeRow = (summaryEntries) => ({
  summary: Object.entries(summaryEntries).map(([key, value]) => ({ key, value }))
})

const defaultFields = [
  { label: 'host', value: 'host' },
  { label: 'status', value: 'status' },
  { label: 'method', value: 'method' }
]

const setup = (rows = []) => {
  const data = ref(rows)
  const availableFields = ref(defaultFields)
  const searchQuery = ref('')
  const selectedFields = ref([])

  const result = useFieldStats({ data, availableFields, searchQuery, selectedFields })
  return { data, availableFields, searchQuery, selectedFields, ...result }
}

describe('useFieldStats', () => {
  describe('fieldStats — incremental counting', () => {
    it('returns empty object when data is empty', () => {
      const { fieldStats } = setup([])
      expect(fieldStats.value).toEqual({})
    })

    it('counts field values from row summaries', async () => {
      const { fieldStats } = setup([
        makeRow({ status: '200', host: 'a.com' }),
        makeRow({ status: '200', host: 'b.com' }),
        makeRow({ status: '404', host: 'a.com' })
      ])
      await nextTick()

      expect(fieldStats.value.status.total).toBe(3)
      expect(fieldStats.value.status.uniqueCount).toBe(2)
      expect(fieldStats.value.host.total).toBe(3)
      expect(fieldStats.value.host.uniqueCount).toBe(2)
    })

    it('produces correct topValues with percentages', async () => {
      const { fieldStats } = setup([
        makeRow({ status: '200' }),
        makeRow({ status: '200' }),
        makeRow({ status: '200' }),
        makeRow({ status: '404' })
      ])
      await nextTick()

      const stats = fieldStats.value.status
      expect(stats.topValues[0].value).toBe('200')
      expect(stats.topValues[0].count).toBe(3)
      expect(stats.topValues[0].percent).toBe(75)
      expect(stats.topValues[1].value).toBe('404')
      expect(stats.topValues[1].count).toBe(1)
      expect(stats.topValues[1].percent).toBe(25)
    })

    it('incrementally processes new rows on append', async () => {
      const { data, fieldStats } = setup([makeRow({ status: '200' })])
      await nextTick()

      expect(fieldStats.value.status.total).toBe(1)

      // Simulate loadMore — append new rows
      data.value = [...data.value, makeRow({ status: '404' }), makeRow({ status: '200' })]
      await nextTick()

      expect(fieldStats.value.status.total).toBe(3)
      expect(fieldStats.value.status.uniqueCount).toBe(2)
    })

    it('fully rebuilds when data shrinks (new query)', async () => {
      const { data, fieldStats } = setup([
        makeRow({ status: '200' }),
        makeRow({ status: '200' }),
        makeRow({ status: '404' })
      ])
      await nextTick()

      expect(fieldStats.value.status.total).toBe(3)

      // Simulate new query — data shrinks
      data.value = [makeRow({ status: '500' })]
      await nextTick()

      expect(fieldStats.value.status.total).toBe(1)
      expect(fieldStats.value.status.uniqueCount).toBe(1)
      expect(fieldStats.value.status.topValues[0].value).toBe('500')
    })

    it('ignores dash values', async () => {
      const { fieldStats } = setup([makeRow({ status: '-', host: 'a.com' })])
      await nextTick()

      expect(fieldStats.value.host.total).toBe(1)
      // The status key exists but has no counted values
      expect(fieldStats.value.status.total).toBe(0)
      expect(fieldStats.value.status.uniqueCount).toBe(0)
    })

    it('skips rows without summary array', async () => {
      const data = ref([{ id: '1' }, makeRow({ status: '200' })])
      const { fieldStats } = setup()
      // Replace data in the setup
      const result = useFieldStats({
        data,
        availableFields: ref(defaultFields),
        searchQuery: ref(''),
        selectedFields: ref([])
      })
      await nextTick()

      expect(result.fieldStats.value.status.total).toBe(1)
    })

    it('limits topValues to 5 entries', async () => {
      const rows = []
      for (let i = 0; i < 10; i++) {
        rows.push(makeRow({ code: `val_${i}` }))
      }
      const { fieldStats } = setup(rows)
      await nextTick()

      expect(fieldStats.value.code.topValues).toHaveLength(5)
      expect(fieldStats.value.code.uniqueCount).toBe(10)
    })

    it('resets to empty when data is cleared', async () => {
      const { data, fieldStats } = setup([makeRow({ status: '200' })])
      await nextTick()

      expect(fieldStats.value.status).toBeDefined()

      data.value = []
      await nextTick()

      expect(fieldStats.value).toEqual({})
    })
  })
})
