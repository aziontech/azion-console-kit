/* eslint-disable xss/no-mixed-html -- `template` strings here are Vue stub component templates, not HTML sinks */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import AdvancedFilterSystem from '../index.vue'
import { useAccountStore } from '@/stores/account'

vi.mock('@/services/users-services', () => ({
  listTimezonesService: vi.fn().mockResolvedValue([])
}))

const DataTimeRangeStub = {
  name: 'DataTimeRange',
  emits: ['autoRefresh', 'update:modelValue', 'select'],
  template: '<div data-testid="stub-data-time-range" />',
  methods: {
    closeOverlay() {}
  }
}

const stubs = {
  DataTimeRange: DataTimeRangeStub,
  FilterFields: { name: 'FilterFields', template: '<div />' },
  AzionQueryLanguage: {
    name: 'AzionQueryLanguage',
    props: ['fieldsInFilter', 'searchAdvancedFilter', 'filterAdvanced', 'dataset'],
    template: '<div />',
    methods: {
      getParsedFilters() {
        return []
      },
      markAsApplied() {}
    }
  },
  FilterTagsDisplay: { name: 'FilterTagsDisplay', template: '<div />' },
  PrimeButton: { name: 'PrimeButton', template: '<button />' }
}

const NOW_INSTANT = new Date('2026-07-30T12:00:00Z')
const HOUR_MS = 36e5

const mountFilter = ({ tsRange, utcOffset }) => {
  const pinia = createPinia()
  const accountStore = useAccountStore(pinia)
  accountStore.$patch({ account: { utc_offset: utcOffset } })

  const filterData = {
    fields: [],
    tsRange: { label: '', labelStart: '', labelEnd: '', ...tsRange }
  }
  const wrapper = mount(AdvancedFilterSystem, {
    props: {
      filterData,
      'onUpdate:filterData': (value) => {
        wrapper.setProps({ filterData: value })
      },
      fieldsInFilter: [],
      filterDateRangeMaxDays: 7,
      isLoadingFilters: false,
      hideFilterTags: false,
      dataset: 'httpEvents'
    },
    global: { plugins: [pinia], stubs }
  })
  return wrapper
}

const applyTimeUpdate = async (wrapper) => {
  wrapper.findComponent(DataTimeRangeStub).vm.$emit('autoRefresh')
  await nextTick()
}

const appliedTsRange = (wrapper) => wrapper.props('filterData').tsRange

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW_INSTANT)
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('AdvancedFilterSystem — now and relative ranges resolve to the real UTC instant', () => {
  const relativeTsRange = () => ({
    tsRangeBegin: '2026-07-30T11:55:00Z',
    tsRangeEnd: '2026-07-30T12:00:00Z',
    label: 'Last 5 minutes'
  })

  it.each(['+0000', '-0300'])(
    'a relative label applies the true instant window under account offset %s',
    async (utcOffset) => {
      const wrapper = mountFilter({ tsRange: relativeTsRange(), utcOffset })
      await nextTick()

      await applyTimeUpdate(wrapper)

      const { tsRangeBegin, tsRangeEnd } = appliedTsRange(wrapper)
      expect(tsRangeEnd).toBe('2026-07-30T12:00:00Z')
      expect(tsRangeBegin).toBe('2026-07-30T11:55:00Z')
    }
  )

  it.each(['+0000', '-0300'])(
    'labelEnd "now" applies the true current instant under account offset %s',
    async (utcOffset) => {
      const wrapper = mountFilter({
        tsRange: {
          tsRangeBegin: '2026-07-30T09:00:00Z',
          tsRangeEnd: '2026-07-30T10:00:00Z',
          labelEnd: 'now'
        },
        utcOffset
      })
      await nextTick()

      await applyTimeUpdate(wrapper)

      expect(appliedTsRange(wrapper).tsRangeEnd).toBe('2026-07-30T12:00:00Z')
    }
  )

  it('keeps wall-clock reinterpretation for the absolute start endpoint (hybrid range)', async () => {
    const hybridTsRange = () => ({
      tsRangeBegin: '2026-07-30T09:00:00Z',
      tsRangeEnd: '2026-07-30T10:00:00Z',
      labelEnd: 'now'
    })

    const wrapperUtc = mountFilter({ tsRange: hybridTsRange(), utcOffset: '+0000' })
    const wrapperMinus3 = mountFilter({ tsRange: hybridTsRange(), utcOffset: '-0300' })
    await nextTick()

    await applyTimeUpdate(wrapperUtc)
    await applyTimeUpdate(wrapperMinus3)

    const beginUtc = new Date(appliedTsRange(wrapperUtc).tsRangeBegin).getTime()
    const beginMinus3 = new Date(appliedTsRange(wrapperMinus3).tsRangeBegin).getTime()
    expect(beginMinus3 - beginUtc).toBe(3 * HOUR_MS)
  })
})
