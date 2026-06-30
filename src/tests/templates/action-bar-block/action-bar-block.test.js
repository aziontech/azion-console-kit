import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ActionBarBlock from '@/templates/action-bar-block/index.vue'

// Distinct-class stubs so assertions never depend on webkit button internals.
const stubs = {
  ButtonSave: { template: '<button class="stub-save" />' },
  ButtonCancel: { template: '<button class="stub-cancel" />' }
}

const mountBar = (props = {}) => mount(ActionBarBlock, { props, global: { stubs } })

describe('ActionBarBlock - hideSubmit', () => {
  it('renders both Save and Cancel by default', () => {
    const wrapper = mountBar()
    expect(wrapper.findAll('button.stub-save')).toHaveLength(1)
    expect(wrapper.findAll('button.stub-cancel')).toHaveLength(1)
  })

  it('hides the Save button when hideSubmit is true, keeping Cancel/Close', () => {
    const wrapper = mountBar({ hideSubmit: true })
    expect(wrapper.findAll('button.stub-save')).toHaveLength(0)
    expect(wrapper.findAll('button.stub-cancel')).toHaveLength(1)
  })
})
