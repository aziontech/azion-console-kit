/* eslint-disable xss/no-mixed-html -- `template` strings here are Vue stub component templates, not HTML sinks */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import AdvancedFilterSystem from '../index.vue'

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

const DAY_MS = 864e5

const mountFilter = ({ maxDays, spanDays }) => {
  const end = new Date('2026-01-31T00:00:00Z')
  const begin = new Date(end.getTime() - spanDays * DAY_MS)
  const filterData = {
    fields: [],
    tsRange: {
      tsRangeBegin: begin.toISOString().replace(/\.\d{3}/, ''),
      tsRangeEnd: end.toISOString().replace(/\.\d{3}/, ''),
      label: '',
      labelStart: '',
      labelEnd: ''
    }
  }
  const wrapper = mount(AdvancedFilterSystem, {
    props: {
      filterData,
      'onUpdate:filterData': (value) => {
        wrapper.setProps({ filterData: value })
      },
      fieldsInFilter: [],
      filterDateRangeMaxDays: maxDays,
      isLoadingFilters: false,
      hideFilterTags: false,
      dataset: 'httpEvents'
    },
    global: { plugins: [createPinia()], stubs }
  })
  return wrapper
}

const triggerTimeUpdate = async (wrapper) => {
  wrapper.findComponent(DataTimeRangeStub).vm.$emit('autoRefresh')
  await nextTick()
}

const appliedSpanDays = (wrapper) => {
  const { tsRangeBegin, tsRangeEnd } = wrapper.props('filterData').tsRange
  return (new Date(tsRangeEnd).getTime() - new Date(tsRangeBegin).getTime()) / DAY_MS
}

beforeEach(() => {
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
})

describe('AdvancedFilterSystem — filterDateRangeMaxDays clamps the applied tsRange', () => {
  it('a 30-day range with a 7-day cap is clamped to exactly 7 days, end preserved', async () => {
    const wrapper = mountFilter({ maxDays: 7, spanDays: 30 })
    await nextTick()
    const endBefore = wrapper.props('filterData').tsRange.tsRangeEnd

    await triggerTimeUpdate(wrapper)

    const { tsRangeBegin, tsRangeEnd } = wrapper.props('filterData').tsRange
    expect(appliedSpanDays(wrapper)).toBe(7)
    expect(tsRangeEnd).toBe(endBefore)
    expect(new Date(tsRangeBegin).getTime()).toBe(new Date(tsRangeEnd).getTime() - 7 * DAY_MS)
  })

  it('a range within the cap passes through untouched', async () => {
    const wrapper = mountFilter({ maxDays: 7, spanDays: 3 })
    await nextTick()
    const before = { ...wrapper.props('filterData').tsRange }

    await triggerTimeUpdate(wrapper)

    const after = wrapper.props('filterData').tsRange
    expect(after.tsRangeBegin).toBe(before.tsRangeBegin)
    expect(after.tsRangeEnd).toBe(before.tsRangeEnd)
  })

  it('no cap configured → no clamping (other consumers unaffected)', async () => {
    const wrapper = mountFilter({ maxDays: undefined, spanDays: 30 })
    await nextTick()

    await triggerTimeUpdate(wrapper)

    expect(appliedSpanDays(wrapper)).toBe(30)
  })
})
