import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

vi.mock('@aziontech/webkit/progressspinner', () => ({
  default: { name: 'ProgressSpinner', template: '<div data-testid="spinner" />' }
}))
vi.mock('@aziontech/webkit/inlinemessage', () => ({
  default: { name: 'InlineMessage', template: '<div><slot /></div>' }
}))
vi.mock('@aziontech/webkit/button', () => ({
  default: {
    name: 'PrimeButton',
    props: ['label', 'icon', 'disabled', 'size', 'outlined', 'severity', 'text', 'ariaLabel'],
    emits: ['click'],
    template:
      '<button :disabled="disabled" :aria-label="ariaLabel" @click="$emit(\'click\', $event)">{{ label }}</button>'
  }
}))
vi.mock('@aziontech/webkit/prime-tag', () => ({
  default: {
    name: 'PrimeTag',
    props: ['value', 'severity', 'icon', 'rounded'],
    template: '<span :data-value="value">{{ value }}</span>'
  }
}))

vi.mock('@/helpers/convert-date', () => ({
  formatExhibitionDate: () => 'Jan 1, 2026',
  formatDateToDayMonthYearHour: () => 'Jan 1, 2026 00:00'
}))

import { WebkitPlugin } from '@aziontech/webkit/plugin'
import VersionShell from '@/templates/version-shell-block/index.vue'
import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
import VersionListDataView from '@/components/VersionListDataView'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'
import { VERSIONED_ONLY, getVersionCapability } from '@/composables/versioning/version-capability'

const DataViewStub = {
  name: 'DataView',
  props: ['value'],
  template:
    '<div><template v-for="row in value" :key="row.id"><slot name="list" :data="row" /></template></div>'
}

const mountList = (props) =>
  mount(VersionListDataView, {
    attachTo: document.body,
    props,
    global: { plugins: [WebkitPlugin], stubs: { DataView: DataViewStub } }
  })

const VERSIONED_ONLY_RESOURCES = ['function', 'network_list', 'waf']

const BUILT_STATES = ['ready', 'active']

const makeVersionQueryFactory =
  (state = 'ready') =>
  () => ({
    data: ref({ id: 'v1', state, createdAt: '2026-01-01T00:00:00Z', lastEditor: 'ada' }),
    isLoading: ref(false),
    isError: ref(false)
  })

const mountShellFor = (resourceType, state = 'ready') =>
  mount(VersionShell, {
    attachTo: document.body,
    props: {
      useVersionQuery: makeVersionQueryFactory(state),
      resourceId: '1',
      versionId: 'v1',
      resourceType
    }
  })

beforeEach(() => {
  for (const id of ['action-bar', 'version-lifecycle-action']) {
    const target = document.createElement('div')
    target.id = id
    document.body.appendChild(target)
  }
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Phase 3 — shell resolves versioned-only from each resourceType (Req 1.5, 2.5)', () => {
  it.each(VERSIONED_ONLY_RESOURCES)(
    '"%s" provides the versioned-only capability in the version context',
    async (resourceType) => {
      expect(getVersionCapability(resourceType)).toBe(VERSIONED_ONLY)

      let captured = null
      const Probe = {
        name: 'CapabilityProbe',
        inject: { ctx: { from: VERSION_CONTEXT_KEY } },
        setup() {
          return () => null
        },
        mounted() {
          captured = this.ctx?.capability?.value ?? this.ctx?.capability
        }
      }
      mount(VersionShell, {
        props: {
          useVersionQuery: makeVersionQueryFactory('ready'),
          resourceId: '1',
          versionId: 'v1',
          resourceType
        },
        slots: { default: Probe }
      })
      await flushPromises()
      expect(captured).toEqual({ canDeploy: false, canPromote: false, canRollback: false })
    }
  )
})

describe('Phase 3 — no Deploy in the footer for any versioned-only resource (Req 2.1, 2.4)', () => {
  it.each(VERSIONED_ONLY_RESOURCES.flatMap((type) => BUILT_STATES.map((state) => [type, state])))(
    '"%s" in state "%s" renders the footer without a Deploy action',
    async (resourceType, state) => {
      mountShellFor(resourceType, state)
      await flushPromises()

      const footer = document.querySelector('[data-testid="version-action-bar"]')
      expect(footer).not.toBeNull()
      expect(document.querySelector('[data-testid="version-action-bar__action-DEPLOY"]')).toBeNull()
      expect(footer.textContent).not.toContain('deploy it to go live')
    }
  )
})

describe('Phase 3 — no Deploy button in the heading for versioned-only (Req 2.1)', () => {
  const makeCtx = (capability, state) => ({
    state: ref(state),
    readOnly: ref(true),
    version: ref({ id: 'v1', createdAt: '2026-01-01T00:00:00Z', lastEditor: 'ada' }),
    availableActions: ref([]),
    disabledActions: ref([]),
    isVersioned: ref(true),
    capability: ref(capability),
    dispatch: vi.fn()
  })

  it.each(VERSIONED_ONLY_RESOURCES)('"%s" heading shows no Deploy button', async (resourceType) => {
    mount(VersionHeadingActions, {
      attachTo: document.body,
      props: { resourceContext: null },
      global: {
        provide: { [VERSION_CONTEXT_KEY]: makeCtx(getVersionCapability(resourceType), 'ready') }
      }
    })
    await flushPromises()
    expect(document.querySelector('[data-testid="version-heading__deploy"]')).toBeNull()
  })
})

describe('Phase 3 — row menu drops Promote/Rollback for each resource (Req 2.2, 2.3)', () => {
  const columns = [
    { key: 'version', label: 'Version' },
    { key: 'status', label: 'Status' }
  ]
  const items = [{ id: 'v1', state: 'ready' }]

  const openMenuActions = async (resourceType) => {
    const captured = []
    const wrapper = mountList({
      items,
      columns,
      hasVersions: true,
      showRowActions: true,
      resourceType
    })
    await wrapper.find('[data-testid="version-list-data-view__row-v1__menu"]').trigger('click')
    await flushPromises()
    document
      .querySelectorAll('.version-row-menu__label')
      .forEach((el) => captured.push(el.textContent.trim()))
    wrapper.unmount()
    return captured
  }

  it.each(VERSIONED_ONLY_RESOURCES)(
    '"%s" listing menu omits Promote and Rollback',
    async (resourceType) => {
      const labels = await openMenuActions(resourceType)
      expect(labels).not.toContain('Promote')
      expect(labels).not.toContain('Rollback')
      expect(labels).toContain('New version from this')
    }
  )
})

describe('Phase 3 — listing shows Current and the informative In use column (Req 4.1, 5.1, 5.2, 5.4)', () => {
  const baseColumns = [
    { key: 'version', label: 'Version' },
    { key: 'status', label: 'Status' }
  ]

  it('renders the "Current" tag for the active version in the listing (req 4.1, 5.1)', () => {
    const wrapper = mountList({
      items: [{ id: 'v9', state: 'active' }],
      columns: baseColumns,
      hasVersions: true,
      resourceType: 'function'
    })
    expect(wrapper.find('.version-current-tag').exists()).toBe(true)
    expect(wrapper.find('.version-current-tag').text()).toContain('Current')
    wrapper.unmount()
  })

  it('shows the In use count for Function where the API exposes referenceCount (req 5.2)', () => {
    const wrapper = mountList({
      items: [{ id: 'v1', state: 'ready', referenceCount: 3 }],
      columns: [
        ...baseColumns,
        { key: 'inUse', field: 'referenceCount', label: 'In use', optional: true }
      ],
      hasVersions: true,
      resourceType: 'function'
    })
    const cell = wrapper.find('[data-testid="version-list-data-view__row-v1__in-use"]')
    expect(cell.exists()).toBe(true)
    expect(cell.text()).toContain('3')
    wrapper.unmount()
  })

  it('auto-hides the optional In use column for NL/WAF (no referenceCount) (req 5.4)', () => {
    const wrapper = mountList({
      items: [{ id: 'v1', state: 'ready' }],
      columns: [
        ...baseColumns,
        { key: 'inUse', field: 'referenceCount', label: 'In use', optional: true }
      ],
      hasVersions: true,
      resourceType: 'network_list'
    })
    expect(wrapper.find('[data-testid="version-list-data-view__row-v1__in-use"]').exists()).toBe(
      false
    )
    wrapper.unmount()
  })
})

describe('Phase 3 — release picker hides all three versioned-only resources (Req 2.7)', () => {
  it.each(VERSIONED_ONLY_RESOURCES)('"%s" is not selectable (canDeploy false)', (resourceType) => {
    expect(getVersionCapability(resourceType).canDeploy).toBe(false)
  })

  it('keeps deployable resources selectable (no regression)', () => {
    for (const type of [
      'edge_application',
      'edge_firewall',
      'custom_page',
      'connector',
      'workload'
    ]) {
      expect(getVersionCapability(type).canDeploy).toBe(true)
    }
  })
})
