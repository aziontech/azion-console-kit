import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import VersionListDataView from '@/components/VersionListDataView/index.vue'

vi.mock('@aziontech/webkit/menu', () => ({
  default: {
    name: 'Menu',
    props: ['popup', 'model', 'appendTo', 'class'],
    methods: { toggle() {} },
    template: '<div data-test="menu-stub" />'
  }
}))
vi.mock('@aziontech/webkit/button', () => ({
  default: {
    name: 'PrimeButton',
    props: ['icon', 'text', 'severity', 'size', 'label', 'ariaLabel'],
    emits: ['click'],
    template: '<button :aria-label="ariaLabel">{{ label }}</button>'
  }
}))
vi.mock('@aziontech/webkit/dropdown', () => ({
  default: {
    name: 'Dropdown',
    props: ['modelValue', 'options', 'pt', 'optionLabel', 'optionValue', 'placeholder', 'disabled'],
    template: '<div />'
  }
}))
vi.mock('@aziontech/webkit/inputtext', () => ({
  default: { name: 'InputText', template: '<input />' }
}))
vi.mock('@aziontech/webkit/skeleton', () => ({
  default: { name: 'Skeleton', template: '<div />' }
}))
vi.mock('@aziontech/webkit/empty-results-block', () => ({
  default: { name: 'EmptyResultsBlock', template: '<div><slot /></div>' }
}))
vi.mock('@aziontech/webkit/prime-tag', () => ({
  default: { name: 'PrimeTag', props: ['severity', 'value'], template: '<span>{{ value }}</span>' }
}))
vi.mock('@aziontech/webkit/overlaypanel', () => ({
  default: {
    name: 'OverlayPanel',
    props: ['pt'],
    methods: { show() {}, hide() {}, toggle() {} },
    template: '<div data-test="overlay-stub"><slot /></div>'
  }
}))

const DataViewStub = {
  name: 'DataView',
  props: ['value', 'paginator', 'lazy', 'first', 'totalRecords', 'rows'],
  template:
    '<div><template v-for="row in value" :key="row.id"><slot name="list" :data="row" /></template></div>'
}

const COLUMNS = [{ key: 'version', label: 'Version' }]
const ITEMS = [{ id: 'V1', state: 'ready' }]

const mountView = (props = {}) =>
  mount(VersionListDataView, {
    props: { columns: COLUMNS, items: ITEMS, hasVersions: true, ...props },
    global: { directives: { tooltip: {} }, stubs: { DataView: DataViewStub } }
  })

describe('VersionListDataView pagination', () => {
  it('forwards paginatorFirst to the underlying DataView', () => {
    const wrapper = mountView({ lazy: true, totalRecords: 40, paginatorFirst: 20 })
    expect(wrapper.findComponent(DataViewStub).props('first')).toBe(20)
  })

  it('defaults paginatorFirst to 0', () => {
    const wrapper = mountView({ lazy: true, totalRecords: 40 })
    expect(wrapper.findComponent(DataViewStub).props('first')).toBe(0)
  })

  it('keeps the paginator on the emitted page when the parent does not control paginatorFirst', async () => {
    const wrapper = mountView({ lazy: true, totalRecords: 40 })

    wrapper.findComponent(DataViewStub).vm.$emit('page', { first: 20, rows: 20 })
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(DataViewStub).props('first')).toBe(20)
  })

  it('preserves the current page across a loading remount', async () => {
    const wrapper = mountView({ lazy: true, totalRecords: 40 })

    wrapper.findComponent(DataViewStub).vm.$emit('page', { first: 20, rows: 20 })
    await wrapper.vm.$nextTick()

    await wrapper.setProps({ loading: true })
    await wrapper.setProps({ loading: false })

    expect(wrapper.findComponent(DataViewStub).props('first')).toBe(20)
  })

  it('passes the server total through only in lazy mode', () => {
    const lazyWrapper = mountView({ lazy: true, totalRecords: 40 })
    expect(lazyWrapper.findComponent(DataViewStub).props('totalRecords')).toBe(40)

    const clientWrapper = mountView({ totalRecords: 40 })
    expect(clientWrapper.findComponent(DataViewStub).props('totalRecords')).toBeUndefined()
  })
})

describe('VersionListDataView disabled controls', () => {
  it('leaves the search input enabled by default', () => {
    const wrapper = mountView()
    const search = wrapper.find('[data-testid="version-list-data-view__search"]')
    expect(search.attributes('disabled')).toBeUndefined()
  })

  it('disables the search input and exposes the tooltip when controlsDisabled is set', () => {
    const wrapper = mountView({
      controlsDisabled: true,
      controlsDisabledTooltip: 'Not available yet'
    })
    const search = wrapper.find('[data-testid="version-list-data-view__search"]')
    expect(search.attributes('disabled')).toBeDefined()
    expect(search.attributes('title')).toBe('Not available yet')
  })

  const TOOLBAR_PROPS = {
    sortOptions: [{ label: 'Last modified', value: 'lastModified-desc' }],
    filters: [
      {
        key: 'state',
        options: [{ label: 'All Status', value: null }],
        placeholder: 'All Status'
      }
    ]
  }

  const dropdownDisabledFlags = (wrapper) =>
    wrapper.findAllComponents({ name: 'Dropdown' }).map((dropdown) => dropdown.props('disabled'))

  it('disables every filter and sort dropdown when controlsDisabled is set', () => {
    const wrapper = mountView({ controlsDisabled: true, ...TOOLBAR_PROPS })
    const flags = dropdownDisabledFlags(wrapper)

    expect(flags.length).toBeGreaterThan(0)
    expect(flags.every((flag) => flag === true)).toBe(true)
  })

  it('leaves the dropdowns enabled by default', () => {
    const wrapper = mountView(TOOLBAR_PROPS)
    const flags = dropdownDisabledFlags(wrapper)

    expect(flags.length).toBeGreaterThan(0)
    expect(flags.every((flag) => flag === false)).toBe(true)
  })
})
