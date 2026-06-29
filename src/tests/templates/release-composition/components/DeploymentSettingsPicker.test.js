import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DeploymentSettingsPicker from '@/templates/release-composition/components/DeploymentSettingsPicker.vue'

// Webkit primitives reduced to plain DOM so the contract (rows, search, counter,
// empty-state action, multi-select) is observable in jsdom without coupling the
// test to the real component internals.
const stubs = {
  // The visual Checkbox is now controlled + non-interactive (binary `modelValue`
  // boolean); selection is driven by the row click, so the stub only reflects state.
  Checkbox: {
    name: 'Checkbox',
    props: ['modelValue', 'value', 'inputId', 'binary'],
    template: `<input type="checkbox" :checked="modelValue" />`
  },
  InputText: {
    name: 'InputText',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: `<input
      type="text"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />`
  },
  PrimeTag: {
    name: 'PrimeTag',
    props: ['value', 'severity'],
    template: `<span class="prime-tag" :data-testid="$attrs['data-testid']">{{ value }}</span>`
  },
  InlineMessage: {
    name: 'InlineMessage',
    template: '<div class="inline-message"><slot /></div>'
  },
  PrimeButton: {
    name: 'PrimeButton',
    props: ['label'],
    emits: ['click'],
    template: `<button :data-testid="$attrs['data-testid']" @click="$emit('click')">{{ label }}</button>`
  }
}

const deployments = [
  {
    id: 'ds-1',
    name: 'production-edge',
    policyLabel: 'Single Version',
    environmentName: 'production',
    workloadsCount: 3
  },
  {
    id: 'ds-2',
    name: 'staging-edge',
    policyLabel: 'Versioned URLs'
  }
]

const makeWrapper = (props = {}) =>
  mount(DeploymentSettingsPicker, {
    props: {
      deployments,
      modelValue: [],
      query: '',
      ...props
    },
    global: { stubs }
  })

describe('DeploymentSettingsPicker', () => {
  it('renders one selectable row per Deployment Setting with its name and policy tag', () => {
    const wrapper = makeWrapper()

    const list = wrapper.find('[data-testid="release-composition__ds-list"]')
    expect(list.exists()).toBe(true)

    const rowOne = wrapper.find('[data-testid="release-composition__ds-row-ds-1"]')
    expect(rowOne.exists()).toBe(true)
    expect(rowOne.text()).toContain('production-edge')

    // req 4.4: every row carries the deployment policy tag.
    const policyOne = wrapper.find('[data-testid="release-composition__ds-policy-ds-1"]')
    expect(policyOne.exists()).toBe(true)
    expect(policyOne.text()).toBe('Single Version')

    expect(wrapper.find('[data-testid="release-composition__ds-policy-ds-2"]').text()).toBe(
      'Versioned URLs'
    )
  })

  it('renders the Environment in bold and the workloads line when the platform provides them', () => {
    const wrapper = makeWrapper()

    const env = wrapper.find('[data-testid="release-composition__ds-environment-ds-1"]')
    expect(env.exists()).toBe(true)
    expect(env.text()).toBe('production')
    expect(env.classes()).toContain('font-bold')

    const workloads = wrapper.find('[data-testid="release-composition__ds-workloads-ds-1"]')
    expect(workloads.exists()).toBe(true)
    expect(workloads.text()).toContain('3 Workloads affected')
  })

  it('omits the Environment and workloads lines when absent (req 4.3 — never fabricated)', () => {
    const wrapper = makeWrapper()

    // ds-2 carries neither environmentName nor workloadsCount.
    expect(wrapper.find('[data-testid="release-composition__ds-environment-ds-2"]').exists()).toBe(
      false
    )
    expect(wrapper.find('[data-testid="release-composition__ds-workloads-ds-2"]').exists()).toBe(
      false
    )
  })

  it('renders a workloads line even when the count is zero (0 is data, not absence)', () => {
    const wrapper = makeWrapper({
      deployments: [{ id: 'ds-3', name: 'edge', policyLabel: 'Single Version', workloadsCount: 0 }]
    })

    const workloads = wrapper.find('[data-testid="release-composition__ds-workloads-ds-3"]')
    expect(workloads.exists()).toBe(true)
    expect(workloads.text()).toContain('0 Workloads affected')
  })

  it('shows a search field placeholder counting the listed Deployment Settings', () => {
    const wrapper = makeWrapper()

    const search = wrapper.find('[data-testid="release-composition__ds-search"]')
    expect(search.exists()).toBe(true)
    expect(search.attributes('placeholder')).toBe('Search 2 Deployment Settings')
  })

  it('emits update:query as the search string is typed', async () => {
    const wrapper = makeWrapper()

    await wrapper.find('[data-testid="release-composition__ds-search"]').setValue('prod')

    expect(wrapper.emitted('update:query')?.at(-1)).toEqual(['prod'])
  })

  it('reflects the selected counter from modelValue', () => {
    const wrapper = makeWrapper({ modelValue: ['ds-1'] })

    expect(wrapper.find('[data-testid="release-composition__ds-selected-counter"]').text()).toBe(
      '1 selected'
    )
  })

  it('emits update:modelValue with the new selection when a row is toggled', async () => {
    const wrapper = makeWrapper({ modelValue: [] })

    await wrapper.find('[data-testid="release-composition__ds-row-ds-1"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['ds-1']])
  })

  it('supports multi-select: a second toggle preserves the first selection', async () => {
    const wrapper = makeWrapper({ modelValue: ['ds-1'] })

    await wrapper.find('[data-testid="release-composition__ds-row-ds-2"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['ds-1', 'ds-2']])
  })

  describe('select-all / clear-all (task 19.1, req 1.9 / NRS §4.5)', () => {
    it('opens with nothing pre-selected when modelValue is empty', () => {
      const wrapper = makeWrapper({ modelValue: [] })

      expect(wrapper.find('[data-testid="release-composition__ds-selected-counter"]').text()).toBe(
        '0 selected'
      )
      // No row carries the selected styling/aria when nothing is pre-selected.
      expect(
        wrapper.find('[data-testid="release-composition__ds-row-ds-1"]').attributes('aria-checked')
      ).toBe('false')
      expect(
        wrapper.find('[data-testid="release-composition__ds-row-ds-2"]').attributes('aria-checked')
      ).toBe('false')
    })

    it('select-all emits update:modelValue with every listed deployment id', async () => {
      const wrapper = makeWrapper({ modelValue: [] })

      await wrapper.find('[data-testid="release-composition__ds-select-all"]').trigger('click')

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['ds-1', 'ds-2']])
    })

    it('clear-all emits update:modelValue with an empty array', async () => {
      const wrapper = makeWrapper({ modelValue: ['ds-1', 'ds-2'] })

      await wrapper.find('[data-testid="release-composition__ds-clear-all"]').trigger('click')

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
    })

    it('disables select-all when everything is already selected and clear-all when nothing is', () => {
      const allSelected = makeWrapper({ modelValue: ['ds-1', 'ds-2'] })
      expect(
        allSelected
          .find('[data-testid="release-composition__ds-select-all"]')
          .attributes('disabled')
      ).toBeDefined()

      const noneSelected = makeWrapper({ modelValue: [] })
      expect(
        noneSelected
          .find('[data-testid="release-composition__ds-clear-all"]')
          .attributes('disabled')
      ).toBeDefined()
    })

    // Issue 4(a): `deployments` is a filtered/capped VIEW (search, display cap),
    // so select-all/clear-all must operate over the LISTED rows only and never
    // drop selections hidden by the search.
    it('select-all UNIONS the listed ids with selections hidden by the search (never drops them)', async () => {
      // `ds-hidden` is selected but NOT in the listed `deployments` (search/cap
      // narrowed the view to ds-1/ds-2). Select-all must keep ds-hidden.
      const wrapper = makeWrapper({ modelValue: ['ds-hidden'] })

      await wrapper.find('[data-testid="release-composition__ds-select-all"]').trigger('click')

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['ds-hidden', 'ds-1', 'ds-2']])
    })

    it('clear-all removes ONLY the listed ids, preserving selections hidden by the search', async () => {
      const wrapper = makeWrapper({ modelValue: ['ds-hidden', 'ds-1', 'ds-2'] })

      await wrapper.find('[data-testid="release-composition__ds-clear-all"]').trigger('click')

      // ds-1/ds-2 (listed) are cleared; ds-hidden (not listed) survives.
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['ds-hidden']])
    })

    it('allSelected (disabling select-all) compares against the LISTED rows, ignoring hidden selections', () => {
      // Every LISTED row (ds-1, ds-2) is already selected → select-all disabled,
      // regardless of the extra hidden selection.
      const wrapper = makeWrapper({ modelValue: ['ds-1', 'ds-2', 'ds-hidden'] })
      expect(
        wrapper.find('[data-testid="release-composition__ds-select-all"]').attributes('disabled')
      ).toBeDefined()

      // A listed row NOT selected → select-all stays enabled even though another
      // (hidden) id is selected.
      const partial = makeWrapper({ modelValue: ['ds-1', 'ds-hidden'] })
      expect(
        partial.find('[data-testid="release-composition__ds-select-all"]').attributes('disabled')
      ).toBeUndefined()
    })
  })

  describe('empty state', () => {
    it('renders the empty state and hides the list/search when there are no Deployment Settings', () => {
      const wrapper = makeWrapper({ deployments: [] })

      expect(wrapper.find('[data-testid="release-composition__ds-empty"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="release-composition__ds-list"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="release-composition__ds-search"]').exists()).toBe(false)
    })

    it('emits bind-environment when the empty-state action is clicked', async () => {
      const wrapper = makeWrapper({ deployments: [] })

      await wrapper
        .find('[data-testid="release-composition__ds-bind-environment"]')
        .trigger('click')

      expect(wrapper.emitted('bind-environment')).toBeTruthy()
    })
  })
})
