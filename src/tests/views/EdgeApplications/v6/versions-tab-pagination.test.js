/* eslint-disable azion-architecture/no-versioning-module-mock --
 * JUSTIFIED EXCEPTION (view test): the tab is isolated at the service's paged
 * read seam; listVersionsPage's real behavior is covered by the shared
 * version-service contract suite through the HTTP seam. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTableDefinitionsStore } from '@/stores/table-definitions'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
import VersionsTab from '@/views/EdgeApplications/v6/tabs/VersionsTab.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: vi.fn() }) }))
vi.mock('@/composables/versioning/use-active-versions', () => ({
  useActiveVersions: () => ({ activeVersions: { value: new Map() }, refresh: vi.fn() })
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

beforeEach(() => {
  useTableDefinitionsStore().setNumberOfLinesPerPage(20)
  vi.spyOn(edgeAppVersionService, 'listVersionsPage').mockResolvedValue({
    body: [{ id: 'AV1', state: 'ready' }],
    count: 42
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const mountTab = () =>
  mount(VersionsTab, {
    props: { applicationId: '77' },
    global: { stubs: { VersionListDataView: ListStub, VersionActionDialog: true } }
  })

describe('EdgeApplications v6 VersionsTab pagination', () => {
  it('requests page 1 through the paged service read', async () => {
    mountTab()
    await flush()

    expect(edgeAppVersionService.listVersionsPage).toHaveBeenCalledWith('77', {
      page: 1,
      pageSize: 20,
      skipCache: true
    })
  })

  it('drives the list in lazy mode with the server count', async () => {
    const wrapper = mountTab()
    await flush()

    const list = wrapper.findComponent(ListStub)
    expect(list.props('lazy')).toBe(true)
    expect(list.props('totalRecords')).toBe(42)
    expect(list.props('paginatorFirst')).toBe(0)
    expect(list.props('hasVersions')).toBe(true)
  })

  it('fetches the requested page when the paginator emits', async () => {
    const wrapper = mountTab()
    await flush()
    edgeAppVersionService.listVersionsPage.mockClear()

    wrapper.findComponent(ListStub).vm.$emit('page', { first: 20, rows: 20 })
    await flush()

    expect(edgeAppVersionService.listVersionsPage).toHaveBeenCalledWith('77', {
      page: 2,
      pageSize: 20,
      skipCache: false
    })
  })

  it('renders the toolbar controls disabled with an explanatory tooltip', async () => {
    const wrapper = mountTab()
    await flush()

    const list = wrapper.findComponent(ListStub)
    expect(list.props('controlsDisabled')).toBe(true)
    expect(list.props('controlsDisabledTooltip')).toContain('not available')
  })

  it('keeps the rows-per-page selection after a page-size change', async () => {
    const wrapper = mountTab()
    await flush()
    expect(wrapper.findComponent(ListStub).props('paginatorRows')).toBe(20)

    wrapper.findComponent(ListStub).vm.$emit('page', { first: 0, rows: 50 })
    await flush()

    expect(edgeAppVersionService.listVersionsPage).toHaveBeenCalledWith('77', {
      page: 1,
      pageSize: 50,
      skipCache: false
    })
    expect(wrapper.findComponent(ListStub).props('paginatorRows')).toBe(50)
  })

  it('refetches from page 1 on refresh', async () => {
    const wrapper = mountTab()
    await flush()
    wrapper.findComponent(ListStub).vm.$emit('page', { first: 20, rows: 20 })
    await flush()
    edgeAppVersionService.listVersionsPage.mockClear()

    wrapper.findComponent(ListStub).vm.$emit('refresh')
    await flush()

    expect(edgeAppVersionService.listVersionsPage).toHaveBeenCalledWith('77', {
      page: 1,
      pageSize: 20,
      skipCache: true
    })
  })
})
