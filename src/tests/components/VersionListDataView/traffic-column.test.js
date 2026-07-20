import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import VersionListDataView from '@/components/VersionListDataView/index.vue'
import { getVersionListColumns } from '@/composables/versioning/version-list-columns'

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
vi.mock('@aziontech/webkit/prime-tag', () => ({
  default: {
    name: 'PrimeTag',
    props: ['severity', 'value', 'icon', 'rounded'],
    template: '<span class="p-tag">{{ value }}</span>'
  }
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
  props: ['value'],
  template:
    '<div><template v-for="row in value" :key="row.id"><slot name="list" :data="row" /></template></div>'
}

const mountList = (props) =>
  mount(VersionListDataView, {
    props: { columns: getVersionListColumns(), ...props },
    global: { directives: { tooltip: {} }, stubs: { DataView: DataViewStub } }
  })

const trafficCell = (wrapper, id) =>
  wrapper.find(`[data-testid="version-list-data-view__row-${id}__traffic"]`)

describe('VersionListDataView — traffic column', () => {
  it('renders the "Live" badge for an active version', () => {
    const items = [
      {
        id: 'v1',
        state: 'ready',
        activeTraffic: { deployments: [{ id: 'D1', name: 'prod', trafficRole: 'ACTIVE' }] }
      }
    ]
    const wrapper = mountList({ items, hasVersions: true, resourceType: 'waf' })
    expect(trafficCell(wrapper, 'v1').text()).toContain('Live')
  })

  it('shows nothing for an inactive version while the column stays visible', () => {
    const items = [
      {
        id: 'v1',
        state: 'ready',
        activeTraffic: { deployments: [{ id: 'D1', name: 'prod', trafficRole: 'ACTIVE' }] }
      },
      { id: 'v2', state: 'ready', activeTraffic: null }
    ]
    const wrapper = mountList({ items, hasVersions: true, resourceType: 'waf' })
    const cell = trafficCell(wrapper, 'v2')
    expect(cell.exists()).toBe(true)
    expect(cell.text().trim()).toBe('')
  })

  it('keeps the traffic column visible (empty) even before/when no version is receiving traffic', () => {
    const items = [
      { id: 'v1', state: 'ready', activeTraffic: null },
      { id: 'v2', state: 'draft' }
    ]
    const wrapper = mountList({ items, hasVersions: true, resourceType: 'waf' })
    const cell = trafficCell(wrapper, 'v1')
    expect(cell.exists()).toBe(true)
    expect(cell.text().trim()).toBe('')
  })

  it('opens a popup on hover showing only the deployment name and its policy', async () => {
    const items = [
      {
        id: 'v1',
        state: 'ready',
        activeTraffic: {
          deployments: [
            {
              id: 'D1',
              name: 'Stage deployment',
              state: 'ready',
              policy: 'versioned_urls',
              trafficRole: 'VALID_URL',
              releaseId: 'R1'
            }
          ]
        }
      }
    ]
    const wrapper = mountList({ items, hasVersions: true, resourceType: 'waf' })
    await trafficCell(wrapper, 'v1').trigger('mouseenter')

    const popup = wrapper.get('[data-testid="version-list-data-view__traffic-popup"]')
    expect(popup.text()).toContain('Stage deployment')
    expect(popup.text()).toContain('versioned_urls')
    expect(popup.text()).not.toContain('VALID_URL')
    expect(popup.text()).not.toContain('ready')
  })
})
