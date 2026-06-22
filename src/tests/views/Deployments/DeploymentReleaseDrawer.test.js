import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'

// Webkit primitives reduced to plain DOM so the contract (button presence +
// click → emit) is observable in jsdom without the real component internals.
vi.mock('@aziontech/webkit/button', () => ({
  default: {
    name: 'Button',
    props: ['label', 'icon'],
    emits: ['click'],
    template:
      '<button data-testid="wk-button" :data-label="label" @click="$emit(\'click\')">{{ label }}</button>'
  }
}))
vi.mock('@aziontech/webkit/skeleton', () => ({
  default: { name: 'Skeleton', template: '<div data-testid="skeleton" />' }
}))
const toastAdd = vi.fn()
vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: toastAdd }) }))

vi.mock('@/templates/info-drawer-block/index.vue', () => ({
  default: {
    name: 'InfoDrawerBlock',
    props: ['visible', 'title', 'widthClass'],
    template: '<div><slot name="header-actions" /><slot name="body" /></div>'
  }
}))
vi.mock('@/views/Deployments/components/DeploymentReleaseDetails.vue', () => ({
  default: { name: 'DeploymentReleaseDetails', props: ['release'], template: '<div />' }
}))

// Drive the composable directly: this isolates the component's job, which is the
// uniform rollback/redeploy contract (actionable gate) + forwarding the emit.
const onSecondaryAction = vi.fn()
const secondaryButtonLabel = ref('Rollback')
let capturedEmit
vi.mock('@/composables/versioning/use-deployment-release-drawer', () => ({
  useDeploymentReleaseDrawer: ({ emit }) => {
    capturedEmit = emit
    return {
      detail: ref({ id: 'R1' }),
      isLoading: ref(false),
      visibleDrawer: ref(true),
      displayRelease: computed(() => ({ id: 'R1' })),
      visitUrl: ref(''),
      secondaryButtonLabel,
      onSecondaryAction
    }
  }
}))

import DeploymentReleaseDrawer from '@/views/Deployments/components/DeploymentReleaseDrawer.vue'

const mountDrawer = (props = {}) =>
  mount(DeploymentReleaseDrawer, {
    props: { visible: true, release: { id: 'R1', deployment_id: 'D1' }, ...props }
  })

describe('DeploymentReleaseDrawer — uniform rollback/redeploy contract', () => {
  beforeEach(() => {
    toastAdd.mockReset()
    onSecondaryAction.mockReset()
    secondaryButtonLabel.value = 'Rollback'
  })

  it('renders the secondary action when actionable (default true)', () => {
    const wrapper = mountDrawer()
    const secondary = wrapper.find('[data-testid="deployment-release-drawer__secondary"]')
    expect(secondary.exists()).toBe(true)
    expect(secondary.attributes('data-label')).toBe('Rollback')
  })

  it('hides the secondary action when not actionable (no no-op button)', () => {
    const wrapper = mountDrawer({ actionable: false })
    expect(wrapper.find('[data-testid="deployment-release-drawer__secondary"]').exists()).toBe(
      false
    )
  })

  it('routes the click to the composable action (single contract entry)', async () => {
    const wrapper = mountDrawer()
    await wrapper.find('[data-testid="deployment-release-drawer__secondary"]').trigger('click')
    expect(onSecondaryAction).toHaveBeenCalledTimes(1)
  })

  it('reflects the Redeploy label for a non-current release', () => {
    secondaryButtonLabel.value = 'Redeploy'
    const wrapper = mountDrawer()
    const secondary = wrapper.find('[data-testid="deployment-release-drawer__secondary"]')
    expect(secondary.attributes('data-label')).toBe('Redeploy')
  })

  it('forwards rollback/redeploy emits to parent and toasts only on error', () => {
    const wrapper = mountDrawer()
    capturedEmit('rollback', { id: 'R1' })
    capturedEmit('redeploy', { id: 'R1' })
    capturedEmit('error', new Error('boom'))

    expect(wrapper.emitted('rollback')).toEqual([[{ id: 'R1' }]])
    expect(wrapper.emitted('redeploy')).toEqual([[{ id: 'R1' }]])
    // `error` is a DOM-bound concern: it toasts and is NOT re-emitted upward.
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(toastAdd).toHaveBeenCalledTimes(1)
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))
  })
})
