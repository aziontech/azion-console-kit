import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { VERSION_POLL_INTERVAL_MS } from '@/services/v2/versioning/version-cache-policy'

vi.mock('@/services/v2/deployment/deployment-version-service', () => ({
  deploymentVersionService: { listVersionsService: vi.fn() }
}))

vi.mock('@aziontech/webkit/use-toast', () => ({
  useToast: () => ({ add: vi.fn() })
}))

vi.mock('@aziontech/webkit/button', () => ({
  default: {
    name: 'PrimeButton',
    inheritAttrs: false,
    props: ['icon', 'text', 'severity', 'ariaLabel'],
    emits: ['click'],
    template: `<button v-bind="$attrs" @click="$emit('click', $event)"><slot /></button>`
  }
}))

vi.mock('@aziontech/webkit/menu', () => ({
  default: {
    name: 'Menu',
    props: ['model', 'popup', 'appendTo', 'pt'],
    methods: {
      toggle() {}
    },
    template: `<ul data-testid="row-menu"><li v-for="entry in model" :key="entry.label" class="row-menu__item">{{ entry.label }}</li></ul>`
  }
}))

vi.mock('@aziontech/webkit/prime-tag', () => ({
  default: { name: 'PrimeTag', props: ['value', 'severity'], template: '<span>{{ value }}</span>' }
}))

vi.mock('@/components/VersionListDataView', () => ({
  default: {
    name: 'VersionListDataView',
    props: [
      'items',
      'columns',
      'loading',
      'isError',
      'hasVersions',
      'lazy',
      'totalRecords',
      'paginatorRows',
      'searchTerm',
      'searchPlaceholder',
      'filters',
      'filterValues',
      'showRowActions',
      'emptyState',
      'errorState',
      'filteredEmptyTitle',
      'filteredEmptyDescription'
    ],
    emits: ['update:searchTerm', 'update:filterValues', 'page'],
    template: `
      <div :data-show-row-actions="String(showRowActions)">
        <div v-for="item in items" :key="item.id" class="vldv-row">
          <slot name="cell-version" :item="item" />
          <slot name="cell-status" :item="item" />
          <slot name="cell-actions" :item="item" />
        </div>
      </div>
    `
  }
}))

import { deploymentVersionService } from '@/services/v2/deployment/deployment-version-service'
import VersionHistoryTab from '@/views/Deployments/tabs/VersionHistoryTab.vue'

const listVersionsService = deploymentVersionService.listVersionsService

const flush = async () => {
  for (let index = 0; index < 6; index += 1) {
    await Promise.resolve()
  }
}

const mountTab = () =>
  mount(VersionHistoryTab, {
    props: { deploymentId: 'dep-1' }
  })

describe('VersionHistoryTab — polling lifecycle (P6)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    listVersionsService.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts polling only after the poll interval elapses while a version is queued/building', async () => {
    listVersionsService.mockResolvedValue({
      body: [{ id: 'a1b2c3', state: 'building' }],
      count: 1
    })

    mountTab()
    await flush()

    expect(listVersionsService).toHaveBeenCalledTimes(1)
    expect(listVersionsService).toHaveBeenLastCalledWith(
      'dep-1',
      expect.objectContaining({ page: 1, pageSize: 20 })
    )
    expect(listVersionsService.mock.calls[0][1]).not.toHaveProperty('skipCache')

    await vi.advanceTimersByTimeAsync(VERSION_POLL_INTERVAL_MS - 1)
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(2)
    expect(listVersionsService).toHaveBeenLastCalledWith(
      'dep-1',
      expect.objectContaining({ skipCache: true })
    )
  })

  it('keeps re-fetching every interval while a transient version remains', async () => {
    listVersionsService.mockResolvedValue({
      body: [{ id: 'a1b2c3', state: 'queued' }],
      count: 1
    })

    mountTab()
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(VERSION_POLL_INTERVAL_MS)
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(VERSION_POLL_INTERVAL_MS)
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(3)
  })

  it('stops polling once every version reaches a terminal state (ready/error)', async () => {
    listVersionsService.mockResolvedValue({
      body: [{ id: 'a1b2c3', state: 'building' }],
      count: 1
    })

    mountTab()
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(VERSION_POLL_INTERVAL_MS)
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(2)

    listVersionsService.mockResolvedValue({
      body: [
        { id: 'a1b2c3', state: 'ready' },
        { id: 'd4e5f6', state: 'error' }
      ],
      count: 2
    })

    await vi.advanceTimersByTimeAsync(VERSION_POLL_INTERVAL_MS)
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(3)

    await vi.advanceTimersByTimeAsync(VERSION_POLL_INTERVAL_MS * 3)
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(3)
  })

  it('does not poll at all when the initial load has no transient versions', async () => {
    listVersionsService.mockResolvedValue({
      body: [{ id: 'a1b2c3', state: 'ready' }],
      count: 1
    })

    mountTab()
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(VERSION_POLL_INTERVAL_MS * 4)
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(1)
  })

  it('clears the poll timer on unmount so no fetch fires afterwards', async () => {
    listVersionsService.mockResolvedValue({
      body: [{ id: 'a1b2c3', state: 'building' }],
      count: 1
    })

    const wrapper = mountTab()
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(1)

    wrapper.unmount()

    await vi.advanceTimersByTimeAsync(VERSION_POLL_INTERVAL_MS * 3)
    await flush()
    expect(listVersionsService).toHaveBeenCalledTimes(1)
  })
})

describe('VersionHistoryTab — read-only row contract', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    listVersionsService.mockReset()
    listVersionsService.mockResolvedValue({
      body: [
        { id: 'a1b2c3d4e5', state: 'ready' },
        { id: 'f6g7h8i9j0', state: 'error' }
      ],
      count: 2
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('disables the built-in state-machine action menu', async () => {
    const wrapper = mountTab()
    await flush()

    const dataView = wrapper.find('[data-testid="deployment-version-history"]')
    expect(dataView.exists()).toBe(true)
    expect(dataView.attributes('data-show-row-actions')).toBe('false')
  })

  it('renders the version identifier as the hash (item.id), never a "Version N" label', async () => {
    const wrapper = mountTab()
    await flush()

    const cells = wrapper.findAll('[data-testid="deployment-version-history__id"]')
    expect(cells).toHaveLength(2)
    expect(cells[0].text()).toBe('a1b2c3d4e5')
    expect(cells[1].text()).toBe('f6g7h8i9j0')
    cells.forEach((cell) => expect(cell.text()).not.toMatch(/version\s*\d+/i))
  })

  it('offers only "Copy version ID" in the row menu — no rollback or any mutating action', async () => {
    const wrapper = mountTab()
    await flush()

    const trigger = wrapper.find('[data-testid="deployment-version-history__menu-a1b2c3d4e5"]')
    expect(trigger.exists()).toBe(true)

    await trigger.trigger('click')

    const labels = wrapper.findAll('.row-menu__item').map((node) => node.text())
    expect(labels).toEqual(['Copy version ID'])
    expect(labels.join(' ')).not.toMatch(
      /rollback|delete|archive|build|cancel|promote|deploy|new draft|save/i
    )
  })
})

describe('VersionHistoryTab — active vs historical derives from state', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    listVersionsService.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('marks ready/active as Active and everything else as Historical', async () => {
    listVersionsService.mockResolvedValue({
      body: [
        { id: 'ready01', state: 'ready' },
        { id: 'active01', state: 'active' },
        { id: 'archived01', state: 'archived' },
        { id: 'draft01', state: 'draft' }
      ],
      count: 4
    })

    const wrapper = mountTab()
    await flush()

    expect(
      wrapper.findAll('[data-testid="deployment-version-history__status-active"]')
    ).toHaveLength(2)
    const historical = wrapper.findAll(
      '[data-testid="deployment-version-history__status-historical"]'
    )
    expect(historical).toHaveLength(2)
    historical.forEach((node) => expect(node.text()).toBe('Historical'))
  })
})
