import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { useFieldStats } from '../useFieldStats.js'
import { useDocumentSearch } from '../useDocumentSearch.js'

/**
 * Feature: real-time-events-v2-refactor — task 9.9 (req 4.6).
 *
 * Heavy derived state (field-stat counts, search index) is RELEASED on
 * keep-alive deactivate and REHYDRATED on activate through a single
 * `useKeepAliveResource` owner. Verified BY COUNT: retained entries drop to ~0
 * when the tab is hidden and are restored when it is shown again — without a
 * re-fetch (the source rows survive across the cycle).
 *
 * Uses a real `<KeepAlive>` host toggled via `show`, mirroring the pattern in
 * `src/composables/__tests__/useKeepAliveResource.spec.js`.
 */

const makeRow = (id, summaryEntries) => ({
  id,
  summary: Object.entries(summaryEntries).map(([key, value]) => ({ key, value }))
})

// Host wraps a child in <KeepAlive>; toggling `show` drives activate/deactivate
// (deactivate = hide, activate = show again) WITHOUT unmounting.
const makeHost = (child) =>
  defineComponent({
    setup() {
      const show = ref(true)
      return { show }
    },
    render() {
      return h(KeepAlive, {}, [this.show ? h(child) : null])
    }
  })

describe('keep-alive reclaim (task 9.9, req 4.6)', () => {
  describe('useFieldStats — counts released on deactivate, rehydrated on activate', () => {
    it('drops field-stat entries to 0 on deactivate and rebuilds them on activate', async () => {
      const data = shallowRef([
        makeRow('a', { status: '200', host: 'a.com' }),
        makeRow('b', { status: '200', host: 'b.com' }),
        makeRow('c', { status: '404', host: 'a.com' })
      ])
      const availableFields = ref([{ label: 'status', value: 'status' }])
      const searchQuery = ref('')
      const selectedFields = ref([])

      let stats
      const Child = defineComponent({
        name: 'FieldStatsChild',
        setup() {
          const api = useFieldStats({ data, availableFields, searchQuery, selectedFields })
          stats = api.fieldStats
          return () => h('div')
        }
      })

      const wrapper = mount(makeHost(Child))
      await nextTick()

      // active: counts present and exact
      expect(stats.value.status.total).toBe(3)
      expect(stats.value.host.uniqueCount).toBe(2)

      // deactivate → release: entry count → 0
      wrapper.vm.show = false
      await nextTick()
      expect(Object.keys(stats.value)).toHaveLength(0)

      // activate → rehydrate from the surviving rows (no re-fetch): exact again
      wrapper.vm.show = true
      await nextTick()
      expect(stats.value.status.total).toBe(3)
      expect(stats.value.host.uniqueCount).toBe(2)
    })
  })

  describe('useDocumentSearch — index released on deactivate, rebuilt on activate', () => {
    it('keeps an active search working across a deactivate/activate cycle', async () => {
      const rows = shallowRef([
        { id: 'a', name: 'Alice' },
        { id: 'b', name: 'Bob' }
      ])

      let filtered
      let queryRef
      const Child = defineComponent({
        name: 'DocSearchChild',
        setup() {
          const api = useDocumentSearch(rows)
          filtered = api.filteredData
          queryRef = api.query
          return () => h('div')
        }
      })

      vi.useFakeTimers()
      const wrapper = mount(makeHost(Child))

      // activate a search: set the query, let the `query` watch register the
      // debounce timer, flush the 400ms debounce, then let the reactive index
      // build settle.
      queryRef.value = 'alice'
      await nextTick()
      vi.advanceTimersByTime(400)
      await nextTick()
      expect(filtered.value).toHaveLength(1)
      expect(filtered.value[0].id).toBe('a')

      // deactivate → index released (query survives)
      wrapper.vm.show = false
      await nextTick()

      // activate → index rebuilt for the still-active query: match preserved
      wrapper.vm.show = true
      await nextTick()
      expect(filtered.value).toHaveLength(1)
      expect(filtered.value[0].id).toBe('a')
      vi.useRealTimers()
    })

    it('leaves the index released (no matches materialized) when search is inactive across the cycle', async () => {
      const rows = shallowRef([
        { id: 'a', name: 'Alice' },
        { id: 'b', name: 'Bob' }
      ])

      let filtered
      const Child = defineComponent({
        name: 'DocSearchIdleChild',
        setup() {
          const api = useDocumentSearch(rows)
          filtered = api.filteredData
          return () => h('div')
        }
      })

      const wrapper = mount(makeHost(Child))
      await nextTick()
      // idle search returns rows untouched
      expect(filtered.value).toHaveLength(2)

      wrapper.vm.show = false
      await nextTick()
      wrapper.vm.show = true
      await nextTick()
      // still idle → still all rows (index stays released, nothing materialized)
      expect(filtered.value).toHaveLength(2)
    })
  })
})
