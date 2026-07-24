import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useFocusTrap } from '../useFocusTrap.js'

/**
 * Unit tests for useFocusTrap (task 13.2).
 *
 * Behavioral guarantees:
 *  - Tab wraps last→first and Shift+Tab wraps first→last inside the container.
 *  - Escape invokes the onEscape callback.
 *  - activate focuses the initialFocus target; deactivate restores focus to
 *    returnFocusTo (falling back to the previously focused element).
 *  - the keydown listener is added on activate and removed on deactivate AND on
 *    unmount — symmetric, no leak.
 *  - activate/deactivate are idempotent.
 */

// Harness: renders a trigger + a container of three buttons, wires the trap to
// the container, and exposes the trap API plus template refs to the test.
const makeHarness = (options = {}) =>
  defineComponent({
    name: 'FocusTrapHarness',
    setup() {
      const containerRef = ref(null)
      const initialFocusRef = ref(null)
      const returnFocusRef = ref(null)
      const trap = useFocusTrap(containerRef, {
        onEscape: options.onEscape,
        initialFocus: options.useInitialFocus ? initialFocusRef : null,
        returnFocusTo: options.useReturnFocus ? returnFocusRef : null
      })
      return { containerRef, initialFocusRef, returnFocusRef, trap }
    },
    render() {
      return h('div', [
        h('button', { ref: 'returnFocusRef', 'data-testid': 'trigger' }, 'trigger'),
        h('div', { ref: 'containerRef', 'data-testid': 'container' }, [
          h('button', { ref: 'initialFocusRef', 'data-testid': 'first' }, 'first'),
          h('button', { 'data-testid': 'middle' }, 'middle'),
          h('button', { 'data-testid': 'last' }, 'last')
        ])
      ])
    }
  })

const pressKey = (key, { shiftKey = false } = {}) => {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })
  document.dispatchEvent(event)
  return event
}

let addSpy
let removeSpy

beforeEach(() => {
  addSpy = vi.spyOn(document, 'addEventListener')
  removeSpy = vi.spyOn(document, 'removeEventListener')
})

afterEach(() => {
  vi.restoreAllMocks()
})

const keydownAddCount = () => addSpy.mock.calls.filter(([type]) => type === 'keydown').length
const keydownRemoveCount = () => removeSpy.mock.calls.filter(([type]) => type === 'keydown').length

describe('useFocusTrap', () => {
  it('adds exactly one keydown listener on activate and removes it on deactivate', async () => {
    const wrapper = mount(makeHarness(), { attachTo: document.body })

    wrapper.vm.trap.activate()
    await nextTick()
    expect(keydownAddCount()).toBe(1)
    expect(wrapper.vm.trap.isActive.value).toBe(true)

    wrapper.vm.trap.deactivate()
    expect(keydownRemoveCount()).toBe(1)
    expect(wrapper.vm.trap.isActive.value).toBe(false)

    wrapper.unmount()
  })

  it('is idempotent: repeated activate/deactivate add/remove the listener once', async () => {
    const wrapper = mount(makeHarness(), { attachTo: document.body })

    wrapper.vm.trap.activate()
    wrapper.vm.trap.activate()
    await nextTick()
    expect(keydownAddCount()).toBe(1)

    wrapper.vm.trap.deactivate()
    wrapper.vm.trap.deactivate()
    expect(keydownRemoveCount()).toBe(1)

    wrapper.unmount()
  })

  it('wraps focus from last to first on Tab', async () => {
    const wrapper = mount(makeHarness(), { attachTo: document.body })
    wrapper.vm.trap.activate()
    await nextTick()

    const last = document.querySelector('[data-testid="last"]')
    const first = document.querySelector('[data-testid="first"]')
    last.focus()

    const event = pressKey('Tab')
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    wrapper.unmount()
  })

  it('wraps focus from first to last on Shift+Tab', async () => {
    const wrapper = mount(makeHarness(), { attachTo: document.body })
    wrapper.vm.trap.activate()
    await nextTick()

    const first = document.querySelector('[data-testid="first"]')
    const last = document.querySelector('[data-testid="last"]')
    first.focus()

    const event = pressKey('Tab', { shiftKey: true })
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)

    wrapper.unmount()
  })

  it('pulls focus back inside when it has escaped the container', async () => {
    const wrapper = mount(makeHarness(), { attachTo: document.body })
    wrapper.vm.trap.activate()
    await nextTick()

    // Focus the trigger (outside the container), then Tab should pull to first.
    const trigger = document.querySelector('[data-testid="trigger"]')
    const first = document.querySelector('[data-testid="first"]')
    trigger.focus()

    const event = pressKey('Tab')
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    wrapper.unmount()
  })

  it('does not intercept Tab when focus is on a middle element', async () => {
    const wrapper = mount(makeHarness(), { attachTo: document.body })
    wrapper.vm.trap.activate()
    await nextTick()

    const middle = document.querySelector('[data-testid="middle"]')
    middle.focus()

    const event = pressKey('Tab')
    // Neither first nor last is focused, focus is inside → let the browser move.
    expect(event.defaultPrevented).toBe(false)

    wrapper.unmount()
  })

  it('invokes onEscape when Escape is pressed while active', async () => {
    const onEscape = vi.fn()
    const wrapper = mount(makeHarness({ onEscape }), { attachTo: document.body })
    wrapper.vm.trap.activate()
    await nextTick()

    const event = pressKey('Escape')
    expect(onEscape).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)

    wrapper.unmount()
  })

  it('focuses the initialFocus target on activate', async () => {
    const wrapper = mount(makeHarness({ useInitialFocus: true }), { attachTo: document.body })
    wrapper.vm.trap.activate()
    await nextTick()

    expect(document.activeElement).toBe(document.querySelector('[data-testid="first"]'))
    wrapper.unmount()
  })

  it('restores focus to returnFocusTo on deactivate', async () => {
    const wrapper = mount(makeHarness({ useReturnFocus: true }), { attachTo: document.body })
    const trigger = document.querySelector('[data-testid="trigger"]')

    wrapper.vm.trap.activate()
    await nextTick()
    // Move focus somewhere inside the trap.
    document.querySelector('[data-testid="last"]').focus()

    wrapper.vm.trap.deactivate()
    expect(document.activeElement).toBe(trigger)

    wrapper.unmount()
  })

  it('restores focus to the previously focused element when no returnFocusTo is given', async () => {
    const wrapper = mount(makeHarness(), { attachTo: document.body })
    const trigger = document.querySelector('[data-testid="trigger"]')
    // Simulate the user having focused the trigger before opening.
    trigger.focus()

    wrapper.vm.trap.activate()
    await nextTick()
    document.querySelector('[data-testid="middle"]').focus()

    wrapper.vm.trap.deactivate()
    expect(document.activeElement).toBe(trigger)

    wrapper.unmount()
  })

  it('removes the keydown listener on unmount when still active (no leak)', async () => {
    const wrapper = mount(makeHarness(), { attachTo: document.body })
    wrapper.vm.trap.activate()
    await nextTick()
    expect(keydownAddCount()).toBe(1)

    wrapper.unmount()
    expect(keydownRemoveCount()).toBe(1)
  })

  it('ignores Escape/Tab after deactivate (listener fully detached)', async () => {
    const onEscape = vi.fn()
    const wrapper = mount(makeHarness({ onEscape }), { attachTo: document.body })
    wrapper.vm.trap.activate()
    await nextTick()
    wrapper.vm.trap.deactivate()

    pressKey('Escape')
    expect(onEscape).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
