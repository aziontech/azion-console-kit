import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, KeepAlive, ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useKeepAliveResource } from '@/composables/useKeepAliveResource'

// ─────────────────────────────────────────────────────────────────────────────
// Property 6 (P6, tasks.md Fase 3, task 7.6): the global keydown listener is
// added exactly ONCE per live period and removed symmetrically, across BOTH the
// mount path and the keep-alive activate/deactivate path.
//
// tab-panel-block.vue owns the listener through useKeepAliveResource:
//   useKeepAliveResource(
//     () => document.addEventListener('keydown', onKeyDown),
//     () => document.removeEventListener('keydown', onKeyDown)
//   )
// This suite exercises that EXACT pattern under <KeepAlive> and asserts the
// add/remove symmetry — one listener at a time, never a duplicate on
// re-activation, never a leak on deactivate/unmount.
// ─────────────────────────────────────────────────────────────────────────────

const KeydownOwner = defineComponent({
  name: 'KeydownOwner',
  setup() {
    const onKeyDown = () => {}
    useKeepAliveResource(
      () => document.addEventListener('keydown', onKeyDown),
      () => document.removeEventListener('keydown', onKeyDown)
    )
    return () => h('div', 'keydown-owner')
  }
})

const KeepAliveHost = defineComponent({
  name: 'KeepAliveHost',
  setup() {
    const show = ref(true)
    return { show }
  },
  render() {
    return h(KeepAlive, {}, [this.show ? h(KeydownOwner) : null])
  }
})

describe('tab-panel keydown listener — single owner, symmetric (P6)', () => {
  let addSpy
  let removeSpy

  const keydownAdds = () => addSpy.mock.calls.filter(([type]) => type === 'keydown').length
  const keydownRemoves = () => removeSpy.mock.calls.filter(([type]) => type === 'keydown').length

  beforeEach(() => {
    addSpy = vi.spyOn(document, 'addEventListener')
    removeSpy = vi.spyOn(document, 'removeEventListener')
  })

  afterEach(() => {
    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('adds the keydown listener exactly once on mount', () => {
    const wrapper = mount(KeydownOwner, { attachTo: document.body })
    expect(keydownAdds()).toBe(1)
    expect(keydownRemoves()).toBe(0)
    wrapper.unmount()
  })

  it('removes the keydown listener on unmount (symmetric, no leak)', () => {
    const wrapper = mount(KeydownOwner, { attachTo: document.body })
    wrapper.unmount()
    expect(keydownAdds()).toBe(1)
    expect(keydownRemoves()).toBe(1)
  })

  it('adds once per activation and removes once per deactivation under KeepAlive', async () => {
    const wrapper = mount(KeepAliveHost, { attachTo: document.body })

    // Initial mount → activate: exactly one add, no remove yet.
    expect(keydownAdds()).toBe(1)
    expect(keydownRemoves()).toBe(0)

    // Deactivate (hide) → exactly one remove.
    wrapper.vm.show = false
    await nextTick()
    expect(keydownAdds()).toBe(1)
    expect(keydownRemoves()).toBe(1)

    // Re-activate (show) → exactly one more add, NOT a duplicate stacked on top.
    wrapper.vm.show = true
    await nextTick()
    expect(keydownAdds()).toBe(2)
    expect(keydownRemoves()).toBe(1)

    // Net live listeners = adds - removes = 1 at all times while active.
    expect(keydownAdds() - keydownRemoves()).toBe(1)

    wrapper.unmount()
  })

  it('leaves zero net listeners after a full activate/deactivate/unmount cycle', async () => {
    const wrapper = mount(KeepAliveHost, { attachTo: document.body })
    wrapper.vm.show = false
    await nextTick()
    wrapper.vm.show = true
    await nextTick()
    wrapper.unmount()

    // Every add is matched by a remove → no leaked keydown listener.
    expect(keydownAdds()).toBe(keydownRemoves())
  })
})
