import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ReleaseCompositionField from '@/templates/deploy-drawer-block/components/ReleaseCompositionField.vue'

const versions = [
  { label: 'v3 (ready)', value: 'ver-3' },
  { label: 'v2', value: 'ver-2' }
]

const keep = [
  { resourceType: 'edge_firewall', resourceId: 'fw-1', resourceVersion: 'v7' },
  { resourceType: 'edge_function', resourceId: 'fn-9', resourceVersion: 'v2' }
]

const makeWrapper = (props = {}) =>
  mount(ReleaseCompositionField, {
    props: {
      resourceName: 'my-application',
      versions,
      modelValue: 'ver-3',
      ...props
    }
  })

describe('ReleaseCompositionField', () => {
  it('renders the highlight (Zone A) with the editable application version line', () => {
    const wrapper = makeWrapper()

    const highlight = wrapper.find('[data-testid="deploy-drawer__composition-highlight"]')
    expect(highlight.exists()).toBe(true)
    expect(wrapper.find('[data-testid="deploy-drawer__resource-name"]').text()).toBe(
      'my-application'
    )
    expect(wrapper.find('[data-testid="deploy-drawer__version-select"]').exists()).toBe(true)
  })

  it('emits update:modelValue when the highlighted application version changes', async () => {
    const wrapper = makeWrapper()

    wrapper
      .findComponent({ name: 'deploy-drawer-resource-version-field' })
      .vm.$emit('update:modelValue', 'ver-2')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['ver-2'])
  })

  it('forwards disabled/invalid to the highlighted version field', () => {
    const wrapper = makeWrapper({ disabled: true, invalid: true })

    const field = wrapper.findComponent({ name: 'deploy-drawer-resource-version-field' })
    expect(field.props('disabled')).toBe(true)
    expect(field.props('invalid')).toBe(true)
    expect(wrapper.find('[data-testid="deploy-drawer__version-error"]').exists()).toBe(true)
  })

  describe('rest of the composition (Zone B / keep[])', () => {
    it('omits Zone B entirely when there are no carried-over resources', () => {
      const wrapper = makeWrapper({ keep: [] })

      expect(wrapper.find('[data-testid="deploy-drawer__composition-rest"]').exists()).toBe(false)
    })

    it('renders each keep[] entry with its type, id and version', () => {
      const wrapper = makeWrapper({ keep })

      const rest = wrapper.find('[data-testid="deploy-drawer__composition-rest"]')
      expect(rest.exists()).toBe(true)

      const firewall = wrapper.find(
        '[data-testid="deploy-drawer__composition-keep-edge_firewall-fw-1"]'
      )
      expect(firewall.exists()).toBe(true)
      expect(firewall.text()).toContain('edge_firewall')
      expect(firewall.text()).toContain('fw-1')
      expect(firewall.text()).toContain('v7')

      const fn = wrapper.find('[data-testid="deploy-drawer__composition-keep-edge_function-fn-9"]')
      expect(fn.exists()).toBe(true)
      expect(fn.text()).toContain('v2')
    })

    it('marks Zone B read-only in mode="resource" (v1 default)', () => {
      const wrapper = makeWrapper({ keep })

      const readonlyBadge = wrapper.find('[data-testid="deploy-drawer__composition-rest-readonly"]')
      expect(readonlyBadge.exists()).toBe(true)
      expect(readonlyBadge.text()).toBe('Carried over unchanged')

      const rest = wrapper.find('[data-testid="deploy-drawer__composition-rest"]')
      expect(rest.findAll('.p-dropdown').length).toBe(0)
      expect(rest.findAll('input').length).toBe(0)
    })

    it('hides the read-only badge in mode="release" (edit-all, prepared)', () => {
      const wrapper = makeWrapper({ keep, mode: 'release' })

      expect(
        wrapper.find('[data-testid="deploy-drawer__composition-rest-readonly"]').exists()
      ).toBe(false)
      expect(wrapper.find('[data-testid="deploy-drawer__composition-rest"]').exists()).toBe(true)
    })
  })

  it('rejects an unknown mode via the prop validator', () => {
    const validator = ReleaseCompositionField.props.mode.validator
    expect(validator('resource')).toBe(true)
    expect(validator('release')).toBe(true)
    expect(validator('bogus')).toBe(false)
  })
})
