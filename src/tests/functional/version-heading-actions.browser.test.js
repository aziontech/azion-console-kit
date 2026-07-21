/**
 * Functional (real Chromium) — VersionHeadingActions (spec task 4.3).
 *
 * The component teleports its buttons into #version-lifecycle-action, so the
 * target is created in the real DOM before each render and queried from
 * document.body. `vue-router` is a legitimate boundary mock (useRouter → push
 * spy); the version-context is provided for real via VERSION_CONTEXT_KEY.
 */
import { render } from '@testing-library/vue'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'
import { DEFAULT_CAPABILITY, VERSIONED_ONLY } from '@/composables/versioning/version-capability'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: pushMock }) }))

// Imported after the mock is declared so the component picks up the fake router.
import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'

const primevue = { plugins: [PrimeVue], directives: { tooltip: Tooltip } }

const buildContext = (overrides = {}) => ({
  state: ref('ready'),
  version: ref({ id: 'v1' }),
  availableActions: ref(['NEW_DRAFT_FROM', 'DEPLOY']),
  disabledActions: ref([]),
  dispatch: vi.fn(),
  capability: ref(DEFAULT_CAPABILITY),
  ...overrides
})

const renderHeading = (props = {}, context = buildContext()) =>
  render(VersionHeadingActions, {
    props,
    global: { ...primevue, provide: { [VERSION_CONTEXT_KEY]: context } }
  })

// Teleport content lands in document.body under the target, so waitFor watches
// there (onMounted flips the isMounted guard on the next tick).
const findInTarget = async (testId) => {
  const target = document.getElementById('version-lifecycle-action')
  await vi.waitFor(() => {
    expect(target.querySelector(`[data-testid="${testId}"]`)).not.toBeNull()
  })
  return target.querySelector(`[data-testid="${testId}"]`)
}

describe('VersionHeadingActions (functional)', () => {
  beforeEach(() => {
    pushMock.mockReset()
    const target = document.createElement('div')
    target.id = 'version-lifecycle-action'
    document.body.appendChild(target)
  })

  afterEach(() => {
    document.getElementById('version-lifecycle-action')?.remove()
  })

  it('renders the Deploy button when the resource can deploy', async () => {
    renderHeading({ deployRoute: { name: 'custom-deploy' } })
    expect(await findInTarget('version-heading__deploy')).toHaveTextContent('Deploy')
  })

  it('omits the Deploy button for a versioned-only resource', async () => {
    renderHeading(
      {},
      buildContext({
        capability: ref(VERSIONED_ONLY),
        availableActions: ref(['NEW_DRAFT_FROM'])
      })
    )
    // New Version stays available, proving the heading rendered — only Deploy is gone.
    await findInTarget('version-heading__action-NEW_DRAFT_FROM')
    const target = document.getElementById('version-lifecycle-action')
    expect(target.querySelector('[data-testid="version-heading__deploy"]')).toBeNull()
  })

  it('clicking Deploy pushes the explicit deployRoute', async () => {
    const deployRoute = { name: 'custom-deploy', query: { step: '1' } }
    renderHeading({ deployRoute })
    const button = await findInTarget('version-heading__deploy')
    button.click()
    expect(pushMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith(deployRoute)
  })

  it('clicking Deploy without a route builds the resource-scoped composer route', async () => {
    renderHeading({
      resourceContext: { resourceType: 'application', resourceId: '123', version: { id: 'v1' } }
    })
    const button = await findInTarget('version-heading__deploy')
    button.click()
    expect(pushMock).toHaveBeenCalledWith({
      name: 'release-composer',
      query: {
        fromVersion: 'true',
        scopedType: 'application',
        versionId: 'v1',
        resourceId: '123'
      }
    })
  })
})
