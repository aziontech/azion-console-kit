/* global globalThis */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

import {
  installResizeObserverCounter,
  countMountedRows,
  countDomNodes,
  makeServiceCallSpy
} from './measurement'

/**
 * Task 1.3 — SELF-TEST for the measurement helpers.
 *
 * This proves the shared P1/P2/P4 infrastructure works BEFORE later waves lean
 * on it. It exercises the helpers directly (installing the RO counter, mounting
 * a tiny fixture, wrapping a fake service) — it does NOT test any production
 * component.
 */

describe('installResizeObserverCounter (P1 basis)', () => {
  let counter

  afterEach(() => {
    if (counter) {
      counter.restore()
      counter = null
    }
  })

  it('replaces the global ResizeObserver with the counting mock', () => {
    counter = installResizeObserverCounter()
    expect(globalThis.ResizeObserver).toBeTypeOf('function')
    // A fresh instance is constructable through the standard API.
    // eslint-disable-next-line no-new
    new globalThis.ResizeObserver(() => {})
    expect(counter.totalCreated()).toBe(1)
  })

  it('liveCount goes up on observe and down on disconnect', () => {
    counter = installResizeObserverCounter()
    const el = document.createElement('div')

    expect(counter.liveCount()).toBe(0)

    const ro = new globalThis.ResizeObserver(() => {})
    // Construction alone is not "live" — only after observe().
    expect(counter.liveCount()).toBe(0)

    ro.observe(el)
    expect(counter.liveCount()).toBe(1)

    // Observing again does not double-count the same instance.
    ro.observe(el)
    expect(counter.liveCount()).toBe(1)

    ro.disconnect()
    expect(counter.liveCount()).toBe(0)
  })

  it('unobserving the last target drops the instance from the live set', () => {
    counter = installResizeObserverCounter()
    const elementA = document.createElement('div')
    const elementB = document.createElement('div')
    const ro = new globalThis.ResizeObserver(() => {})

    ro.observe(elementA)
    ro.observe(elementB)
    expect(counter.liveCount()).toBe(1)

    ro.unobserve(elementA)
    // Still watching elementB → still live.
    expect(counter.liveCount()).toBe(1)

    ro.unobserve(elementB)
    // Watching nothing → no longer live.
    expect(counter.liveCount()).toBe(0)
  })

  it('tracks peak simultaneous live observers and total created', () => {
    counter = installResizeObserverCounter()
    const el = document.createElement('div')

    const ro1 = new globalThis.ResizeObserver(() => {})
    const ro2 = new globalThis.ResizeObserver(() => {})
    ro1.observe(el)
    ro2.observe(el)
    expect(counter.liveCount()).toBe(2)
    expect(counter.peakCount()).toBe(2)

    ro1.disconnect()
    ro2.disconnect()
    expect(counter.liveCount()).toBe(0)
    // Peak is a high-water mark: it does not drop back down.
    expect(counter.peakCount()).toBe(2)
    expect(counter.totalCreated()).toBe(2)
  })

  it('reset clears counters but keeps the mock installed; restore puts the original back', () => {
    const original = globalThis.ResizeObserver
    counter = installResizeObserverCounter()

    const ro = new globalThis.ResizeObserver(() => {})
    ro.observe(document.createElement('div'))
    expect(counter.liveCount()).toBe(1)
    expect(counter.totalCreated()).toBe(1)

    counter.reset()
    expect(counter.liveCount()).toBe(0)
    expect(counter.peakCount()).toBe(0)
    expect(counter.totalCreated()).toBe(0)
    // Mock is still the installed one after reset.
    expect(globalThis.ResizeObserver).not.toBe(original)

    counter.restore()
    expect(globalThis.ResizeObserver).toBe(original)
  })
})

/* ------------------------------------------------------------------ */
/* countMountedRows / countDomNodes (P2 basis)                         */
/* ------------------------------------------------------------------ */

const RowFixture = defineComponent({
  props: { rows: { type: Number, default: 0 } },
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'table-root' },
        Array.from({ length: props.rows }, (entry, index) =>
          h('div', { 'data-testid': 'table-body-row', key: index }, [h('span', {}, String(index))])
        )
      )
  }
})

describe('countMountedRows / countDomNodes (P2 basis)', () => {
  it('countMountedRows counts data-testid="table-body-row" elements in a small fixture', () => {
    const wrapper = mount(RowFixture, { props: { rows: 3 } })
    expect(countMountedRows(wrapper)).toBe(3)
    wrapper.unmount()
  })

  it('countMountedRows returns 0 when there are no rows', () => {
    const wrapper = mount(RowFixture, { props: { rows: 0 } })
    expect(countMountedRows(wrapper)).toBe(0)
    wrapper.unmount()
  })

  it('countMountedRows works on a raw DOM element too', () => {
    const root = document.createElement('div')
    root.innerHTML =
      '<div data-testid="table-body-row"></div><div data-testid="table-body-row"></div>'
    expect(countMountedRows(root)).toBe(2)
  })

  it('countDomNodes counts total element nodes including the root element', () => {
    // root(1) + 2 rows(2) + 2 spans(2) = 5 elements.
    const wrapper = mount(RowFixture, { props: { rows: 2 } })
    expect(countDomNodes(wrapper)).toBe(5)
    wrapper.unmount()
  })

  it('countDomNodes grows with the fixture size', () => {
    const small = mount(RowFixture, { props: { rows: 2 } })
    const large = mount(RowFixture, { props: { rows: 10 } })
    expect(countDomNodes(large)).toBeGreaterThan(countDomNodes(small))
    small.unmount()
    large.unmount()
  })

  it('countDomNodes on a raw element counts the element itself plus descendants', () => {
    const root = document.createElement('div')
    root.innerHTML = '<span></span><span><em></em></span>'
    // root(1) + 2 spans + 1 em = 4.
    expect(countDomNodes(root)).toBe(4)
  })

  it('returns 0 for null/undefined targets', () => {
    expect(countMountedRows(null)).toBe(0)
    expect(countMountedRows(undefined)).toBe(0)
    expect(countDomNodes(null)).toBe(0)
    expect(countDomNodes(undefined)).toBe(0)
  })
})

/* ------------------------------------------------------------------ */
/* makeServiceCallSpy (P4 basis)                                       */
/* ------------------------------------------------------------------ */

describe('makeServiceCallSpy (P4 basis)', () => {
  it('counts calls and records arguments', () => {
    const { spy, callCount, calls } = makeServiceCallSpy()

    expect(callCount()).toBe(0)
    spy('a', 1)
    spy('b', 2)
    expect(callCount()).toBe(2)
    expect(calls()).toEqual([
      ['a', 1],
      ['b', 2]
    ])
  })

  it('delegates to the wrapped implementation and forwards the return value', () => {
    const impl = vi.fn((value) => value * 2)
    const { spy, callCount } = makeServiceCallSpy(impl)

    expect(spy(21)).toBe(42)
    expect(callCount()).toBe(1)
    expect(impl).toHaveBeenCalledWith(21)
  })

  it('forwards promises from an async implementation', async () => {
    const { spy } = makeServiceCallSpy(async () => 'ok')
    await expect(spy()).resolves.toBe('ok')
  })

  it('returns undefined when no implementation is provided', () => {
    const { spy } = makeServiceCallSpy()
    expect(spy('anything')).toBeUndefined()
  })

  it('reset zeroes the count and clears recorded calls', () => {
    const { spy, callCount, calls, reset } = makeServiceCallSpy()
    spy(1)
    spy(2)
    expect(callCount()).toBe(2)

    reset()
    expect(callCount()).toBe(0)
    expect(calls()).toEqual([])

    spy(3)
    expect(callCount()).toBe(1)
  })

  it('models the P4 assertion shape: <= 1 events + <= 1 metrics per action', () => {
    const eventsFetch = makeServiceCallSpy()
    const metricsFetch = makeServiceCallSpy()

    // Simulate a single user action that fetches events once and metrics once.
    eventsFetch.spy({ filter: 'x' })
    metricsFetch.spy({ filter: 'x' })

    expect(eventsFetch.callCount()).toBeLessThanOrEqual(1)
    expect(metricsFetch.callCount()).toBeLessThanOrEqual(1)
    expect(eventsFetch.callCount()).toBe(1)
    expect(metricsFetch.callCount()).toBe(1)
  })
})
