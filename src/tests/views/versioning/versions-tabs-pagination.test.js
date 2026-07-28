/* eslint-disable azion-architecture/no-versioning-module-mock --
 * JUSTIFIED EXCEPTION (view test): each tab is isolated at its service's paged
 * read seam; listVersionsPage's real behavior is covered by the shared
 * version-service contract suite through the HTTP seam. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTableDefinitionsStore } from '@/stores/table-definitions'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'
import { wafVersionService } from '@/services/v2/waf/waf-version-service'
import { networkListVersionService } from '@/services/v2/network-lists/network-list-version-service'
import { edgeConnectorVersionService } from '@/services/v2/edge-connectors/edge-connector-version-service'
import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'
import { edgeFunctionVersionService } from '@/services/v2/edge-function/edge-function-version-service'
import { workloadVersionService } from '@/services/v2/workload/workload-version-service'

import FirewallVersionsTab from '@/views/EdgeFirewall/v6/tabs/VersionsTab.vue'
import WafVersionsTab from '@/views/WafRules/v6/tabs/VersionsTab.vue'
import NetworkListVersionsTab from '@/views/NetworkLists/v6/tabs/VersionsTab.vue'
import ConnectorVersionsTab from '@/views/EdgeConnectors/v6/tabs/VersionsTab.vue'
import CustomPageVersionsTab from '@/views/CustomPages/v6/tabs/VersionsTab.vue'
import FunctionVersionsTab from '@/views/EdgeFunctions/v6/tabs/VersionsTab.vue'
import WorkloadVersionsTab from '@/views/Workload/v6/Tabs/VersionsTab.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: vi.fn() }) }))
vi.mock('@/composables/versioning/use-active-versions', () => ({
  useActiveVersions: () => ({ activeVersions: { value: new Map() }, refresh: vi.fn() })
}))
vi.mock('@/composables/versioning/use-workload-version-environments', () => ({
  useWorkloadVersionEnvironments: () => ({
    environments: { value: [] },
    isResolving: { value: false },
    resolve: vi.fn()
  })
}))

const flush = async () => {
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

const ListStub = {
  name: 'VersionListDataView',
  props: {
    items: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    isError: { type: Boolean, default: false },
    hasVersions: { type: Boolean, default: false },
    lazy: { type: Boolean, default: false },
    totalRecords: { type: Number, default: 0 },
    paginatorFirst: { type: Number, default: 0 },
    paginatorRows: { type: Number, default: 20 },
    controlsDisabled: { type: Boolean, default: false },
    controlsDisabledTooltip: { type: String, default: '' },
    filters: { type: Array, default: () => [] },
    sortOptions: { type: Array, default: () => [] }
  },
  emits: ['page', 'refresh', 'row-click', 'row-action'],
  template: '<div />'
}

const CASES = [
  {
    name: 'firewall',
    component: FirewallVersionsTab,
    service: edgeFirewallVersionService,
    props: { firewallId: '10' },
    id: '10'
  },
  {
    name: 'waf',
    component: WafVersionsTab,
    service: wafVersionService,
    props: { wafId: '11' },
    id: '11'
  },
  {
    name: 'network list',
    component: NetworkListVersionsTab,
    service: networkListVersionService,
    props: { networkListId: '12' },
    id: '12'
  },
  {
    name: 'connector',
    component: ConnectorVersionsTab,
    service: edgeConnectorVersionService,
    props: { connectorId: '13' },
    id: '13'
  },
  {
    name: 'custom page',
    component: CustomPageVersionsTab,
    service: customPageVersionService,
    props: { customPageId: '14' },
    id: '14'
  },
  {
    name: 'function',
    component: FunctionVersionsTab,
    service: edgeFunctionVersionService,
    props: { edgeFunctionId: '15' },
    id: '15'
  },
  {
    name: 'workload',
    component: WorkloadVersionsTab,
    service: workloadVersionService,
    props: { workloadId: '16' },
    id: '16'
  }
]

describe.each(CASES)('$name versions tab pagination', ({ component, service, props, id }) => {
  beforeEach(() => {
    useTableDefinitionsStore().setNumberOfLinesPerPage(20)
    vi.spyOn(service, 'listVersionsPage').mockResolvedValue({
      body: [{ id: 'V1', state: 'ready' }],
      count: 42
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mountTab = () =>
    mount(component, {
      props,
      global: {
        stubs: { VersionListDataView: ListStub, VersionActionDialog: true, Menu: true }
      }
    })

  it('requests page 1 through the paged service read', async () => {
    mountTab()
    await flush()

    expect(service.listVersionsPage).toHaveBeenCalledWith(id, {
      page: 1,
      pageSize: 20,
      skipCache: true
    })
  })

  it('drives the list in lazy mode with disabled controls', async () => {
    const wrapper = mountTab()
    await flush()

    const list = wrapper.findComponent(ListStub)
    expect(list.props('lazy')).toBe(true)
    expect(list.props('totalRecords')).toBe(42)
    expect(list.props('controlsDisabled')).toBe(true)
    expect(list.props('controlsDisabledTooltip')).toContain('not available')
  })

  it('fetches the requested page when the paginator emits', async () => {
    const wrapper = mountTab()
    await flush()
    service.listVersionsPage.mockClear()

    wrapper.findComponent(ListStub).vm.$emit('page', { first: 20, rows: 20 })
    await flush()

    expect(service.listVersionsPage).toHaveBeenCalledWith(id, {
      page: 2,
      pageSize: 20,
      skipCache: false
    })
  })

  it('feeds the live page size back into the paginator', async () => {
    const wrapper = mountTab()
    await flush()

    wrapper.findComponent(ListStub).vm.$emit('page', { first: 0, rows: 50 })
    await flush()

    expect(wrapper.findComponent(ListStub).props('paginatorRows')).toBe(50)
  })
})
