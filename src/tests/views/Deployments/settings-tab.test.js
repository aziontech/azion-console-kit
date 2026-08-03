import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/services/v2/deployment/deployment-service', () => ({
  deploymentService: {
    updateDeploymentService: vi.fn().mockResolvedValue({})
  }
}))

vi.mock('@/views/Deployments/FormFields/FormFieldsDeployment.vue', () => ({
  default: {
    name: 'FormFieldsDeployment',
    props: ['isEdit', 'resourceId'],
    template: '<div data-testid="form-fields" />'
  }
}))

vi.mock('@/templates/action-bar-block/action-bar-with-teleport', () => ({
  default: {
    name: 'ActionBarTemplate',
    props: ['loading', 'submitDisabled'],
    emits: ['onSubmit', 'onCancel'],
    template: '<div data-testid="action-bar" :data-submit-disabled="String(submitDisabled)" />'
  }
}))

vi.mock('@/templates/edit-form-block', () => ({
  default: {
    name: 'EditFormBlock',
    props: ['editService', 'loadService', 'initialValues', 'schema', 'isTabs', 'disableRedirect'],
    emits: ['on-edit-success'],
    data() {
      return { slotValues: {} }
    },
    template: `
      <div data-testid="edit-form-block">
        <slot name="form" />
        <slot
          name="action-bar"
          :onSubmit="() => {}"
          :onCancel="() => {}"
          :loading="false"
          :values="slotValues"
        />
      </div>
    `
  }
}))

import SettingsTab from '@/views/Deployments/tabs/SettingsTab.vue'
import { deploymentService } from '@/services/v2/deployment/deployment-service'

const baseDeployment = {
  id: 'dep-1',
  name: 'my-deployment',
  description: 'desc',
  binding_policy: 'STRICT',
  deployment_policy: 'single_version',
  strategy_canary_enabled: true,
  strategy_canary_default_percentage: 20,
  strategy_skew_enabled: false,
  strategy_skew_default_ttl_seconds: 7200,
  state: 'ready'
}

const unchangedValues = {
  name: 'my-deployment',
  description: 'desc',
  binding_policy: 'STRICT',
  deployment_policy: 'single_version',
  strategy_canary_enabled: true,
  strategy_canary_default_percentage: 20,
  strategy_skew_enabled: false,
  strategy_skew_default_ttl_seconds: 7200
}

const mountTab = (deployment = {}) =>
  mount(SettingsTab, {
    props: { deployment: { ...baseDeployment, ...deployment } }
  })

const editFormBlock = (wrapper) => wrapper.findComponent({ name: 'EditFormBlock' })
const actionBar = (wrapper) => wrapper.findComponent({ name: 'ActionBarTemplate' })

describe('SettingsTab', () => {
  beforeEach(() => {
    deploymentService.updateDeploymentService.mockClear()
    deploymentService.updateDeploymentService.mockResolvedValue({})
  })

  describe('save success', () => {
    it('emits "updated" when the edit form reports success', async () => {
      const wrapper = mountTab()

      await editFormBlock(wrapper).vm.$emit('on-edit-success')

      expect(wrapper.emitted('updated')).toBeTruthy()
      expect(wrapper.emitted('updated')).toHaveLength(1)
    })

    it('does not emit "updated" before a success is reported', () => {
      const wrapper = mountTab()

      expect(wrapper.emitted('updated')).toBeUndefined()
    })
  })

  describe('submit gating', () => {
    it('keeps submit disabled while values match the loaded config', async () => {
      const wrapper = mountTab()

      await editFormBlock(wrapper).setData({ slotValues: { ...unchangedValues } })

      expect(actionBar(wrapper).props('submitDisabled')).toBe(true)
    })

    it('enables submit once any field diverges from the loaded config', async () => {
      const wrapper = mountTab()

      await editFormBlock(wrapper).setData({
        slotValues: { ...unchangedValues, name: 'renamed-deployment' }
      })

      expect(actionBar(wrapper).props('submitDisabled')).toBe(false)
    })
  })

  describe('feedback by head state', () => {
    it('reports a new version when the head state is "ready"', async () => {
      const wrapper = mountTab({ state: 'ready' })

      const editService = editFormBlock(wrapper).props('editService')
      const feedback = await editService({ ...unchangedValues })

      expect(deploymentService.updateDeploymentService).toHaveBeenCalledWith(
        'dep-1',
        expect.objectContaining({ name: 'my-deployment' })
      )
      expect(feedback).toBe('A new version is now current')
    })

    it('reports an in-place update when the head state is "draft"', async () => {
      const wrapper = mountTab({ state: 'draft' })

      const editService = editFormBlock(wrapper).props('editService')
      const feedback = await editService({ ...unchangedValues })

      expect(feedback).toBe('Deployment updated')
    })
  })
})
