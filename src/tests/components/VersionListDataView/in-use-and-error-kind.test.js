import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import VersionListDataView from '@/components/VersionListDataView/index.vue'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

/**
 * Task 5.5 — the informative "In use" column renders the version reference count
 * (no UI lock), and the error state branches by `errorKind`: 'network' offers
 * Retry, 'forbidden' (403) hides it, 'notFound' (404) offers back-to-list
 * instead (Req 5.2, 5.4, 6.1). The count is informative only; the backend stays
 * the authority on whether a version may be archived/deleted.
 */

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
    template:
      '<button :data-icon="icon" :aria-label="ariaLabel" @click="$emit(\'click\', $event)">{{ label }}</button>'
  }
}))
vi.mock('@aziontech/webkit/dropdown', () => ({
  default: { name: 'Dropdown', template: '<div />' }
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

// DataView stub: render the #list slot once per item so each row exists.
const DataViewStub = {
  name: 'DataView',
  props: ['value'],
  template:
    '<div><template v-for="row in value" :key="row.id"><slot name="list" :data="row" /></template></div>'
}

// The cell reads `version.referenceCount`; the optional column auto-hides via
// `columnHasData`, which inspects `column.field`, so it points at the same field.
const IN_USE_COLUMNS = [
  { key: 'version', label: 'Version' },
  { key: 'inUse', field: 'referenceCount', label: 'In use', optional: true }
]

const mountList = (props) =>
  mount(VersionListDataView, {
    props: { columns: IN_USE_COLUMNS, ...props },
    global: { directives: { tooltip: {} }, stubs: { DataView: DataViewStub } }
  })

const inUseCell = (wrapper, id) =>
  wrapper.get(`[data-testid="version-list-data-view__row-${id}__in-use"]`)

describe('VersionListDataView — informative "In use" column', () => {
  it('renders the reference count for a version that exposes it', () => {
    const version = { id: 'v1', state: VERSION_STATES.READY, referenceCount: 4 }
    const wrapper = mountList({ items: [version], hasVersions: true, resourceType: 'function' })
    expect(inUseCell(wrapper, 'v1').text()).toContain('4')
  })

  it('renders a placeholder for a null row while the column stays visible', () => {
    // The column shows because v1 carries a count; v2's null cell reads "--".
    const items = [
      { id: 'v1', state: VERSION_STATES.READY, referenceCount: 2 },
      { id: 'v2', state: VERSION_STATES.READY, referenceCount: null }
    ]
    const wrapper = mountList({ items, hasVersions: true, resourceType: 'function' })
    expect(inUseCell(wrapper, 'v2').text()).toContain('--')
  })

  it('shows a zero count instead of a placeholder', () => {
    const version = { id: 'v1', state: VERSION_STATES.READY, referenceCount: 0 }
    const wrapper = mountList({ items: [version], hasVersions: true, resourceType: 'function' })
    expect(inUseCell(wrapper, 'v1').text()).toContain('0')
  })

  it('auto-hides the optional column when no row carries a count', () => {
    const items = [
      { id: 'v1', state: VERSION_STATES.READY, referenceCount: null },
      { id: 'v2', state: VERSION_STATES.DRAFT }
    ]
    const wrapper = mountList({ items, hasVersions: true, resourceType: 'waf' })
    expect(wrapper.find('[data-testid="version-list-data-view__row-v1__in-use"]').exists()).toBe(
      false
    )
  })
})

describe('VersionListDataView — errorKind affordances', () => {
  const errorState = {
    title: 'Could not load versions',
    description: 'Something failed.',
    buttonLabel: 'Try again',
    buttonAction: vi.fn()
  }

  it('network error offers a Retry action with the refresh icon', () => {
    const wrapper = mountList({ isError: true, errorKind: 'network', errorState })
    const action = wrapper.get('[data-testid="version-list-data-view__error-action--network"]')
    expect(action.attributes('data-icon')).toBe('pi pi-refresh')
  })

  it('forbidden (403) hides the action entirely — Retry is useless', () => {
    const wrapper = mountList({ isError: true, errorKind: 'forbidden', errorState })
    expect(
      wrapper.find('[data-testid="version-list-data-view__error-action--forbidden"]').exists()
    ).toBe(false)
  })

  it('not found (404) offers a back-to-list action with the arrow icon', () => {
    const wrapper = mountList({ isError: true, errorKind: 'notFound', errorState })
    const action = wrapper.get('[data-testid="version-list-data-view__error-action--notFound"]')
    expect(action.attributes('data-icon')).toBe('pi pi-arrow-left')
  })

  it('invokes the configured error action when the affordance is clicked', async () => {
    const buttonAction = vi.fn()
    const wrapper = mountList({
      isError: true,
      errorKind: 'network',
      errorState: { ...errorState, buttonAction }
    })
    await wrapper
      .get('[data-testid="version-list-data-view__error-action--network"]')
      .trigger('click')
    expect(buttonAction).toHaveBeenCalledOnce()
  })
})
