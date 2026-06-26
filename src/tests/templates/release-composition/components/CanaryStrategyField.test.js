import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CanaryStrategyField from '@/templates/release-composition/components/CanaryStrategyField.vue'
import {
  ROLLOUT_MODE_OPTIONS,
  canaryStrategyValidationSchema,
  buildCanaryInitialValues
} from '@/templates/release-composition/components/canary-strategy-validation'

const fieldStub = (testid) => ({
  name: testid,
  props: ['name', 'label'],
  template: `<div :data-testid="$attrs['data-testid']"></div>`
})

const makeWrapper = () =>
  mount(CanaryStrategyField, {
    global: {
      stubs: {
        FieldNumber: fieldStub('number'),
        FieldText: fieldStub('text'),
        FieldDropdown: fieldStub('dropdown')
      }
    }
  })

const enableCanary = async (wrapper) => {
  const input = wrapper.find('input[type="checkbox"]')
  await input.setValue(true)
  await flushPromises()
}

describe('CanaryStrategyField', () => {
  it('renders the toggle and hides the gradual_rollout inputs while disabled', () => {
    const wrapper = makeWrapper()

    expect(wrapper.find('[data-testid="release-composition__canary-toggle"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__canary-fields"]').exists()).toBe(false)
  })

  it('emits the disabled state and the canary form on mount', () => {
    const wrapper = makeWrapper()

    expect(wrapper.emitted('update:enabled')?.[0]).toEqual([false])

    const formEmit = wrapper.emitted('update:form')?.[0]?.[0]
    expect(formEmit).toMatchObject(buildCanaryInitialValues())
    expect(formEmit).not.toHaveProperty('gradual_rollout_candidate_from_release_id')
    expect(formEmit).not.toHaveProperty('candidate_from_release_id')
  })

  it('reveals the gradual_rollout inputs once Canary is enabled', async () => {
    const wrapper = makeWrapper()

    await enableCanary(wrapper)

    expect(wrapper.find('[data-testid="release-composition__canary-fields"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__canary-rollout-mode"]').exists()).toBe(
      true
    )
    expect(
      wrapper.find('[data-testid="release-composition__canary-candidate-percentage"]').exists()
    ).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__canary-cookie-name"]').exists()).toBe(
      true
    )
    expect(
      wrapper.find('[data-testid="release-composition__canary-cookie-max-age"]').exists()
    ).toBe(true)

    expect(wrapper.emitted('update:enabled')?.at(-1)).toEqual([true])
  })

  it('reuses ROLLOUT_MODE_OPTIONS from the validation module', () => {
    expect(ROLLOUT_MODE_OPTIONS).toEqual([
      { label: 'Instant', value: 'INSTANT' },
      { label: 'Gradual', value: 'GRADUAL' }
    ])
  })
})

describe('canaryStrategyValidationSchema (F5)', () => {
  const baseEnabled = {
    gradual_rollout_enabled: true,
    rollout_mode: 'GRADUAL',
    gradual_rollout_candidate_percentage: 10,
    gradual_rollout_candidate_cookie_name: 'azion_canary',
    gradual_rollout_candidate_cookie_max_age_seconds: 3600
  }

  it('passes when Canary is disabled regardless of the gradual_rollout inputs', async () => {
    await expect(
      canaryStrategyValidationSchema.validate({
        gradual_rollout_enabled: false,
        gradual_rollout_candidate_percentage: null,
        gradual_rollout_candidate_cookie_name: '',
        gradual_rollout_candidate_cookie_max_age_seconds: null
      })
    ).resolves.toBeTruthy()
  })

  it('passes when Canary is enabled and the three inputs are filled', async () => {
    await expect(canaryStrategyValidationSchema.validate(baseEnabled)).resolves.toMatchObject(
      baseEnabled
    )
  })

  it.each([
    'gradual_rollout_candidate_percentage',
    'gradual_rollout_candidate_cookie_name',
    'gradual_rollout_candidate_cookie_max_age_seconds'
  ])('requires %s when Canary is enabled', async (field) => {
    const invalid = { ...baseEnabled }
    invalid[field] = field === 'gradual_rollout_candidate_cookie_name' ? '' : null

    await expect(canaryStrategyValidationSchema.validate(invalid)).rejects.toThrow()
  })
})
