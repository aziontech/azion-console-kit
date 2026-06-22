import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import VersionListDataView from '@/components/VersionListDataView/index.vue'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

/**
 * Task 5.1 — the kebab renders the FIXED 5-item model from
 * `buildVersionMenuItems` mapped to the webkit Menu (appendTo=body), with a
 * native separator before Delete and disabled/tooltip/danger per item.
 * UI/a11y (keyboard, z-index) is task 5.3.
 */

// Webkit Menu stub: a no-op toggle (the model lives in the `model` prop, read
// after the click flushes) so the SFC's openRowMenu wiring runs untouched.
vi.mock('@aziontech/webkit/menu', () => ({
  default: {
    name: 'Menu',
    props: ['popup', 'model', 'appendTo', 'class'],
    methods: { toggle() {} },
    template: '<div data-test="menu-stub" />'
  }
}))

// Lightweight stubs for the rest of the webkit surface used by the SFC.
vi.mock('@aziontech/webkit/button', () => ({
  default: {
    name: 'PrimeButton',
    props: ['icon', 'text', 'severity', 'size', 'label', 'ariaLabel'],
    emits: ['click'],
    template: '<button :aria-label="ariaLabel" @click="$emit(\'click\', $event)" />'
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

// DataView stub: render the #list slot once per item so the row + kebab exist.
const DataViewStub = {
  name: 'DataView',
  props: ['value'],
  template:
    '<div><template v-for="row in value" :key="row.id"><slot name="list" :data="row" /></template></div>'
}

const COLUMNS = [{ key: 'version', label: 'Version' }]

const mountList = (version) =>
  mount(VersionListDataView, {
    props: {
      items: [version],
      columns: COLUMNS,
      hasVersions: true,
      resourceType: 'edge_application'
    },
    global: { directives: { tooltip: {} }, stubs: { DataView: DataViewStub } }
  })

// Opens the row kebab and returns the model the webkit Menu received.
const openMenuModel = async (wrapper, version) => {
  const trigger = wrapper.get(`[data-testid="version-list-data-view__row-${version.id}__menu"]`)
  await trigger.trigger('click')
  return wrapper.findComponent({ name: 'Menu' }).props('model')
}

describe('VersionListDataView — kebab renders the fixed menu model (task 5.1)', () => {
  it('appends the Menu to body', () => {
    const wrapper = mount(VersionListDataView, {
      props: { items: [], columns: COLUMNS, hasVersions: false },
      global: { directives: { tooltip: {} } }
    })
    expect(wrapper.findComponent({ name: 'Menu' }).props('appendTo')).toBe('body')
  })

  it('maps the 5 fixed items in order with a separator before Delete', async () => {
    const version = { id: 'v-ready', state: VERSION_STATES.READY }
    const wrapper = mountList(version)
    const model = await openMenuModel(wrapper, version)

    const labels = model.filter((entry) => !entry.separator).map((entry) => entry.label)
    expect(labels).toEqual([
      'Open configuration',
      'Promote version',
      'Rollback to this version',
      'Archive',
      'Delete'
    ])

    const deleteIndex = model.findIndex((entry) => entry.label === 'Delete')
    expect(model[deleteIndex - 1]).toEqual({ separator: true })
  })

  it('disables Promote/Rollback/Archive with tooltips when the state forbids them', async () => {
    const version = { id: 'v-archived', state: VERSION_STATES.ARCHIVED }
    const wrapper = mountList(version)
    const model = await openMenuModel(wrapper, version)

    const byLabel = (label) => model.find((entry) => entry.label === label)
    expect(byLabel('Promote version').disabled).toBe(true)
    expect(byLabel('Promote version').tooltip).toBeTruthy()
    expect(byLabel('Rollback to this version').disabled).toBe(true)
    expect(byLabel('Rollback to this version').tooltip).toBeTruthy()
    expect(byLabel('Archive').disabled).toBe(true)
    expect(byLabel('Open configuration').disabled).toBe(false)
  })

  it('flags Delete with the danger class only when enabled', async () => {
    const version = { id: 'v-ready', state: VERSION_STATES.READY }
    const wrapper = mountList(version)
    const model = await openMenuModel(wrapper, version)

    const deleteItem = model.find((entry) => entry.label === 'Delete')
    expect(deleteItem.class).toBe('danger')
  })

  it('emits row-action with { action, item } when an item command runs', async () => {
    const version = { id: 'v-ready', state: VERSION_STATES.READY }
    const wrapper = mountList(version)
    const model = await openMenuModel(wrapper, version)

    const promote = model.find((entry) => entry.label === 'Promote version')
    promote.command()

    expect(wrapper.emitted('row-action')).toBeTruthy()
    expect(wrapper.emitted('row-action')[0][0]).toEqual({ action: 'PROMOTE', item: version })
  })
})

describe('VersionListDataView — row/menu interactions (task 5.2)', () => {
  it('emits OPEN_CONFIGURATION when the whole row (primary cell) is clicked', async () => {
    const version = { id: 'v-ready', state: VERSION_STATES.READY }
    const wrapper = mountList(version)

    await wrapper
      .get(`[data-testid="version-list-data-view__row-${version.id}__primary"]`)
      .trigger('click')

    const actions = wrapper.emitted('row-action')
    expect(actions).toBeTruthy()
    expect(actions[0][0]).toEqual({ action: 'OPEN_CONFIGURATION', item: version })
    // Legacy row-click is preserved for not-yet-migrated consumers.
    expect(wrapper.emitted('row-click')[0][0]).toEqual(version)
  })

  it('stops propagation on the item command so it never triggers the row click', async () => {
    const version = { id: 'v-ready', state: VERSION_STATES.READY }
    const wrapper = mountList(version)
    const model = await openMenuModel(wrapper, version)

    const stopPropagation = vi.fn()
    const archive = model.find((entry) => entry.label === 'Archive')
    archive.command({ originalEvent: { stopPropagation } })

    expect(stopPropagation).toHaveBeenCalledTimes(1)
    const actions = wrapper.emitted('row-action')
    // Only the menu action fired — the row click was not triggered.
    expect(actions.at(-1)[0]).toEqual({ action: 'ARCHIVE', item: version })
    expect(wrapper.emitted('row-click')).toBeFalsy()
  })

  it('does not throw when an item command runs without an event', async () => {
    const version = { id: 'v-ready', state: VERSION_STATES.READY }
    const wrapper = mountList(version)
    const model = await openMenuModel(wrapper, version)

    const open = model.find((entry) => entry.label === 'Open configuration')
    expect(() => open.command()).not.toThrow()
    expect(wrapper.emitted('row-action').at(-1)[0]).toEqual({
      action: 'OPEN_CONFIGURATION',
      item: version
    })
  })
})
