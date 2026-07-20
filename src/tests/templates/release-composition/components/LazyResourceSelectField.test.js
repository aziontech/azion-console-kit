import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LazyResourceSelectField from '@/templates/release-composition/components/LazyResourceSelectField.vue'

// Stub the PrimeVue Dropdown so the test can drive its lazy-load hook directly and
// observe the header search input, without mounting the real virtual-scroller
// overlay. It renders the `#header` slot (the search box) and exposes the lazy
// hook the real virtual scroller would call as the user scrolls to the end.
const DropdownStub = defineComponent({
  name: 'DropdownStub',
  props: {
    modelValue: { type: [String, Number], default: null },
    options: { type: Array, default: () => [] },
    virtualScrollerOptions: { type: Object, default: () => ({}) },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  methods: {
    triggerLazyLoad(last) {
      return this.virtualScrollerOptions?.onLazyLoad?.({ last })
    }
  },
  render() {
    return h('div', { class: 'dropdown-stub', 'data-count': this.options.length }, [
      this.$slots.header?.(),
      this.$slots.footer?.()
    ])
  }
})

const InputTextStub = defineComponent({
  name: 'InputText',
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  template: `<input class="search-input" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`
})

const mountField = (props = {}) =>
  mount(LazyResourceSelectField, {
    props,
    global: { stubs: { Dropdown: DropdownStub, InputText: InputTextStub } }
  })

const page = (ids, count) => ({
  body: ids.map((id) => ({ id, name: `name-${id}` })),
  count
})

describe('LazyResourceSelectField', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('fetches page 1 with the search/ordering params on mount', async () => {
    const service = vi.fn().mockResolvedValue(page([1, 2], 2))
    mountField({ service, loadService: vi.fn() })
    await flushPromises()

    expect(service).toHaveBeenCalledTimes(1)
    expect(service).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      search: '',
      ordering: 'name'
    })
  })

  it('prefetches and appends (deduped) once scrolled past the load threshold', async () => {
    const service = vi
      .fn()
      .mockResolvedValueOnce(page([1, 2, 3, 4], 250))
      .mockResolvedValueOnce(page([4, 5, 6, 7], 250))
    const wrapper = mountField({ service, loadService: vi.fn() })
    await flushPromises()

    // Below the 0.7 threshold of the 4 loaded rows (2.8): no load.
    wrapper.findComponent(DropdownStub).vm.triggerLazyLoad(2)
    await flushPromises()
    expect(service).toHaveBeenCalledTimes(1)

    // Past the threshold (count=250 => 3 pages), page 2 loads and dedupes id 4.
    wrapper.findComponent(DropdownStub).vm.triggerLazyLoad(3)
    await flushPromises()
    expect(service).toHaveBeenCalledTimes(2)
    expect(service).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
    expect(wrapper.findComponent(DropdownStub).props('options')).toHaveLength(7)
  })

  it('shows the loading row only when the user reaches the end with a page still loading', async () => {
    let resolvePage2
    const firstPage = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const service = vi
      .fn()
      .mockResolvedValueOnce(page(firstPage, 250))
      .mockImplementationOnce(() => new Promise((resolve) => (resolvePage2 = resolve)))
    const wrapper = mountField({ service, loadService: vi.fn() })
    await flushPromises()

    const dropdown = () => wrapper.findComponent(DropdownStub)
    const loadingRow = () =>
      wrapper.find('[data-testid="release-composition__resource-select-loading-more"]')
    expect(dropdown().props('options')).toHaveLength(10)

    // Prefetch fires at the 0.7 threshold (index 7 of 10) but the user is NOT at the
    // end — page 2 loads silently, no loading row.
    dropdown().vm.triggerLazyLoad(7)
    await flushPromises()
    expect(service).toHaveBeenCalledTimes(2)
    expect(loadingRow().exists()).toBe(false)

    // The user scrolls to the very end while page 2 is still in flight → loading row.
    dropdown().vm.triggerLazyLoad(9)
    await flushPromises()
    expect(dropdown().props('loading')).toBe(false)
    expect(loadingRow().exists()).toBe(true)

    // Page arrives: rows appended below and the loading row is replaced/removed.
    resolvePage2(page([11, 12, 13, 14], 250))
    await flushPromises()
    expect(loadingRow().exists()).toBe(false)
    expect(dropdown().props('options').length).toBeGreaterThan(10)
  })

  it('does not request another page when the last one is already loaded', async () => {
    const service = vi.fn().mockResolvedValue(page([1, 2], 2))
    const wrapper = mountField({ service, loadService: vi.fn() })
    await flushPromises()

    wrapper.findComponent(DropdownStub).vm.triggerLazyLoad(2)
    await flushPromises()

    expect(service).toHaveBeenCalledTimes(1)
  })

  it('re-queries page 1 with the search term (debounced) once 3+ chars are typed', async () => {
    const service = vi.fn().mockResolvedValue(page([1], 1))
    const wrapper = mountField({ service, loadService: vi.fn() })
    await flushPromises()
    service.mockClear()

    await wrapper.find('.search-input').setValue('aut')
    // Below the debounce window: no request yet.
    vi.advanceTimersByTime(400)
    expect(service).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    await flushPromises()

    expect(service).toHaveBeenCalledWith(expect.objectContaining({ page: 1, search: 'aut' }))
  })

  it('resolves the label of a pre-selected value that is not on the first page', async () => {
    const service = vi.fn().mockResolvedValue(page([1, 2], 2))
    const loadService = vi.fn().mockResolvedValue({ id: 99, name: 'name-99' })
    const wrapper = mountField({ modelValue: 99, service, loadService })
    await flushPromises()

    expect(loadService).toHaveBeenCalledWith(99)
    // The resolved option is prepended so the trigger can render its label.
    expect(wrapper.findComponent(DropdownStub).props('options')[0]).toMatchObject({
      value: 99,
      label: 'name-99'
    })
  })
})
