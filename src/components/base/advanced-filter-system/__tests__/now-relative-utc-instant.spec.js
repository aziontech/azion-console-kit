/* eslint-disable xss/no-mixed-html -- `template` strings here are Vue stub component templates, not HTML sinks */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import AdvancedFilterSystem from '../index.vue'
import { useAccountStore } from '@/stores/account'

vi.mock('@/services/v2/listTimezones', () => ({
  listTimezonesService: {
    listTimezones: vi.fn().mockResolvedValue({ listTimeZones: [] })
  }
}))

const DataTimeRangeStub = {
  name: 'DataTimeRange',
  emits: ['autoRefresh', 'update:modelValue', 'select'],
  template: '<div data-testid="stub-data-time-range" />'
}

const stubs = {
  DataTimeRange: DataTimeRangeStub,
  DialogFilter: { name: 'DialogFilter', template: '<div />' },
  AzionQueryLanguage: {
    name: 'AzionQueryLanguage',
    props: ['fieldsInFilter', 'searchAdvancedFilter', 'filterAdvanced'],
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
    tsRange: { label: '', ...tsRange }
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
      hideFilterTags: false
    },
    global: { plugins: [pinia], stubs }
  })
  return wrapper
}

const seedPickerModel = async (wrapper, model) => {
  wrapper.findComponent(DataTimeRangeStub).vm.$emit('update:modelValue', model)
  await nextTick()
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

describe('AdvancedFilterSystem v1 — now and relative ranges resolve to the real UTC instant', () => {
  const relativeTsRange = () => ({
    tsRangeBegin: '2026-07-30T11:55:00Z',
    tsRangeEnd: '2026-07-30T12:00:00Z',
    label: 'Last 5 minutes'
  })

  const nowPickerModel = () => ({
    startDate: new Date('2026-07-30T09:00:00Z'),
    endDate: new Date('2026-07-30T10:00:00Z'),
    label: '',
    labelStart: '',
    labelEnd: 'now'
  })

  it.each(['+0000', '-0300'])(
    'a relative label applies the true instant window under account offset %s',
    async (utcOffset) => {
      const wrapper = mountFilter({ tsRange: relativeTsRange(), utcOffset })
      await nextTick()

      await applyTimeUpdate(wrapper)

      const { tsRangeBegin, tsRangeEnd } = appliedTsRange(wrapper)
      expect(tsRangeEnd).toBe('2026-07-30T12:00:00')
      expect(tsRangeBegin).toBe('2026-07-30T11:55:00')
    }
  )

  it.each(['+0000', '-0300'])(
    'labelEnd "now" applies the true current instant under account offset %s',
    async (utcOffset) => {
      const wrapper = mountFilter({
        tsRange: {
          tsRangeBegin: '2026-07-30T09:00:00Z',
          tsRangeEnd: '2026-07-30T10:00:00Z'
        },
        utcOffset
      })
      await nextTick()
      await seedPickerModel(wrapper, nowPickerModel())

      await applyTimeUpdate(wrapper)

      expect(appliedTsRange(wrapper).tsRangeEnd).toBe('2026-07-30T12:00:00')
    }
  )

  it('keeps wall-clock reinterpretation for the absolute start endpoint (hybrid range)', async () => {
    const baseTsRange = () => ({
      tsRangeBegin: '2026-07-30T09:00:00Z',
      tsRangeEnd: '2026-07-30T10:00:00Z'
    })

    const wrapperUtc = mountFilter({ tsRange: baseTsRange(), utcOffset: '+0000' })
    const wrapperMinus3 = mountFilter({ tsRange: baseTsRange(), utcOffset: '-0300' })
    await nextTick()
    await seedPickerModel(wrapperUtc, nowPickerModel())
    await seedPickerModel(wrapperMinus3, nowPickerModel())

    await applyTimeUpdate(wrapperUtc)
    await applyTimeUpdate(wrapperMinus3)

    const beginUtc = new Date(appliedTsRange(wrapperUtc).tsRangeBegin).getTime()
    const beginMinus3 = new Date(appliedTsRange(wrapperMinus3).tsRangeBegin).getTime()
    expect(beginMinus3 - beginUtc).toBe(3 * HOUR_MS)
  })
})
