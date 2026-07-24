import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useKeepAliveResource } from '../useKeepAliveResource.js'

/**
 * Property 2: cleanup keep-alive simétrico.
 * - acquire fires exactly once across mount + activate (guarded by isActive)
 * - release fires on both deactivate and unmount (guarded by isActive)
 * - a throwing release still resets handle + active (error path stays clean)
 */

// Child that consumes the composable and captures its return value.
const makeChild = (acquire, release, apiSink) =>
  defineComponent({
    name: 'ResourceChild',
    setup() {
      const api = useKeepAliveResource(acquire, release)
      if (apiSink) apiSink(api)
      return () => h('div', 'child')
    }
  })

// Host wraps the child in <KeepAlive>, toggling `show` to drive
// activate/deactivate without a full unmount.
const makeHost = (child) =>
  defineComponent({
    setup() {
      const show = ref(true)
      return { show }
    },
    render() {
      return h(KeepAlive, {}, [this.show ? h(child) : null])
    }
  })

describe('useKeepAliveResource', () => {
  it('acquires exactly once across mount then activate', async () => {
    const handle = { id: 'ro' }
    const acquire = vi.fn(() => handle)
    const release = vi.fn()

    const wrapper = mount(makeHost(makeChild(acquire, release)))
    // mount → acquire
    expect(acquire).toHaveBeenCalledTimes(1)

    // deactivate (hide) → release, then activate (show) → acquire again
    wrapper.vm.show = false
    await nextTick()
    expect(release).toHaveBeenCalledTimes(1)

    wrapper.vm.show = true
    await nextTick()
    // one more acquire on re-activation, never a double-acquire while active
    expect(acquire).toHaveBeenCalledTimes(2)
  })

  it('does not re-acquire while already active', () => {
    const acquire = vi.fn(() => ({}))
    const release = vi.fn()
    let api
    mount(makeChild(acquire, release, (exposed) => (api = exposed)))

    expect(acquire).toHaveBeenCalledTimes(1)
    expect(api.isActive.value).toBe(true)

    // manual forceAcquire is a no-op while active
    api.forceAcquire()
    expect(acquire).toHaveBeenCalledTimes(1)
  })

  it('releases on deactivate and passes the acquired handle', async () => {
    const handle = { id: 'ro' }
    const acquire = vi.fn(() => handle)
    const release = vi.fn()

    const wrapper = mount(makeHost(makeChild(acquire, release)))
    wrapper.vm.show = false
    await nextTick()

    expect(release).toHaveBeenCalledTimes(1)
    expect(release).toHaveBeenCalledWith(handle)
  })

  it('releases on unmount', () => {
    const acquire = vi.fn(() => ({}))
    const release = vi.fn()

    const wrapper = mount(makeChild(acquire, release))
    expect(release).not.toHaveBeenCalled()

    wrapper.unmount()
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('does not release when nothing is active', () => {
    const acquire = vi.fn(() => ({}))
    const release = vi.fn()
    let api
    mount(makeChild(acquire, release, (exposed) => (api = exposed)))

    api.forceRelease()
    expect(release).toHaveBeenCalledTimes(1)
    expect(api.isActive.value).toBe(false)

    // second release is a no-op — nothing held
    api.forceRelease()
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('passes null to release when acquire returns nothing', () => {
    const acquire = vi.fn(() => undefined)
    const release = vi.fn()

    const wrapper = mount(makeChild(acquire, release))
    wrapper.unmount()

    expect(release).toHaveBeenCalledWith(null)
  })

  it('resets handle and active even when release throws', () => {
    const acquire = vi.fn(() => ({ id: 'ro' }))
    const release = vi.fn(() => {
      throw new Error('release boom')
    })
    let api
    mount(makeChild(acquire, release, (exposed) => (api = exposed)))

    expect(api.isActive.value).toBe(true)
    expect(() => api.forceRelease()).toThrow('release boom')

    // finally block still ran: state is clean, re-acquire works
    expect(api.isActive.value).toBe(false)
    api.forceAcquire()
    expect(acquire).toHaveBeenCalledTimes(2)
    expect(api.isActive.value).toBe(true)
    // handle was reset to null before re-acquire, so release still got null?
    // no — re-acquire stored the new handle; release now receives it
    release.mockImplementationOnce(() => {})
    api.forceRelease()
    expect(release).toHaveBeenLastCalledWith({ id: 'ro' })
  })
})
