/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers application,connector,custom_page,firewall,workload:J8 component
 * @covers function,network_list,waf:J8 n/a
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'
import { DEFAULT_CAPABILITY, VERSIONED_ONLY } from '@/composables/versioning/version-capability'
import { getAvailableActions } from '@/composables/versioning/version-machine'

vi.mock('@aziontech/webkit/button', () => ({
  default: {
    name: 'PrimeButton',
    props: ['label', 'icon', 'disabled', 'size', 'outlined', 'severity'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>'
  }
}))
vi.mock('@aziontech/webkit/prime-tag', () => ({
  default: {
    name: 'PrimeTag',
    props: ['value', 'severity', 'icon'],
    template: '<span>{{ value }}</span>'
  }
}))

vi.mock('@/helpers/convert-date', () => ({ formatExhibitionDate: () => 'Jan 1, 2026' }))

import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
import VersionActionBar from '@/templates/version-shell-block/components/VersionActionBar.vue'

const makeContext = ({ capability, state = 'ready' }) => ({
  state: ref(state),
  readOnly: ref(true),
  version: ref({ id: 'v1', createdAt: '2026-01-01T00:00:00Z', lastEditor: 'ada' }),
  availableActions: ref(getAvailableActions(state, capability)),
  disabledActions: ref([]),
  isVersioned: ref(true),
  capability: ref(capability),
  dispatch: vi.fn()
})

const mountHeading = ({ capability, resourceContext = { resourceType: 'edge_application' } }) =>
  mount(VersionHeadingActions, {
    attachTo: document.body,
    props: { resourceContext },
    global: { provide: { [VERSION_CONTEXT_KEY]: makeContext({ capability }) } }
  })

const hasDeployButton = () => !!document.querySelector('[data-testid="version-heading__deploy"]')

const mountFooter = ({ capability, state = 'ready', availableActions = [] }) =>
  mount(VersionActionBar, {
    props: { state, availableActions, disabledActions: [] },
    global: { provide: { [VERSION_CONTEXT_KEY]: makeContext({ capability, state }) } }
  })

beforeEach(() => {
  const target = document.createElement('div')
  target.id = 'version-lifecycle-action'
  document.body.appendChild(target)
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('VersionHeadingActions — Deploy button gated by capability (Req 2.1)', () => {
  it('renders the Deploy button for a deployable resource', async () => {
    mountHeading({ capability: DEFAULT_CAPABILITY })
    await flushPromises()
    expect(hasDeployButton()).toBe(true)
  })

  it('removes the Deploy button entirely for a versioned-only resource', async () => {
    mountHeading({ capability: VERSIONED_ONLY })
    await flushPromises()
    expect(hasDeployButton()).toBe(false)
  })
})

describe('VersionActionBar — footer Deploy gated by availableActions + copy (Req 2.4)', () => {
  it('shows the Deploy action when the state machine allows it (deployable)', () => {
    const wrapper = mountFooter({
      capability: DEFAULT_CAPABILITY,
      state: 'ready',
      availableActions: ['NEW_DRAFT_FROM', 'DEPLOY']
    })
    expect(wrapper.find('[data-testid="version-action-bar__action-DEPLOY"]').exists()).toBe(true)
  })

  it('drops the Deploy action for versioned-only even if listed (filtered set)', () => {
    const wrapper = mountFooter({
      capability: VERSIONED_ONLY,
      state: 'ready',
      availableActions: ['NEW_DRAFT_FROM']
    })
    expect(wrapper.find('[data-testid="version-action-bar__action-DEPLOY"]').exists()).toBe(false)
  })

  it('uses Deploy-free subtitle copy for versioned-only on a ready version', () => {
    const deployable = mountFooter({ capability: DEFAULT_CAPABILITY, state: 'ready' })
    const versionedOnly = mountFooter({ capability: VERSIONED_ONLY, state: 'ready' })

    expect(deployable.text()).toContain('deploy it to go live')
    expect(versionedOnly.text()).not.toContain('deploy it to go live')
    expect(versionedOnly.text()).toContain('Create a new version to make changes.')
  })
})
