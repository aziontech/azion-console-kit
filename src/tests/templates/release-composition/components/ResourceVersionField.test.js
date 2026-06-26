import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ResourceVersionField from '@/templates/release-composition/components/ResourceVersionField.vue'
import { LATEST_READY } from '@/templates/release-composition/version-options'

const versions = [
  {
    id: 'v-1',
    value: 'v-1',
    label: '0E3A6A57',
    createdAt: '2026-06-16T10:30:00Z',
    author: 'user@azion.com',
    isCurrent: true
  }
]

const makeWrapper = (props = {}) =>
  mount(ResourceVersionField, {
    props: {
      resourceName: 'my-application',
      versions,
      modelValue: 'v-1',
      ...props
    }
  })

describe('ResourceVersionField', () => {
  it('renders the resource name with an icon', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="release-composition__resource-name"]').text()).toContain(
      'my-application'
    )
  })

  it('builds grouped options with the Track latest sentinel on top and a pinned group', () => {
    const wrapper = makeWrapper()
    const groups = wrapper.vm.dropdownOptions

    expect(groups[0].items[0].value).toBe(LATEST_READY)
    expect(groups[0].items[0].isLatest).toBe(true)
    expect(groups[1].label).toBe('PIN A READY VERSION')
    expect(groups[1].items).toEqual(versions)
  })

  it('flags the latest sentinel as selected when modelValue is LATEST', () => {
    const wrapper = makeWrapper({ modelValue: LATEST_READY })
    expect(wrapper.vm.isLatest).toBe(true)
  })

  it('emits update:modelValue on version change', () => {
    const wrapper = makeWrapper()
    wrapper.findComponent({ name: 'Dropdown' }).vm.$emit('update:modelValue', 'v-1')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['v-1'])
  })

  it('shows the required error when invalid', () => {
    const wrapper = makeWrapper({ invalid: true })
    expect(wrapper.find('[data-testid="release-composition__version-error"]').exists()).toBe(true)
  })
})
