/* global globalThis */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import {
  installResizeObserverCounter,
  countMountedRows,
  countDomNodes
} from '../_helpers/measurement.js'
import { useEventDataset } from '../../composables/useEventDataset.js'
import { useKeepAliveResource } from '@/composables/useKeepAliveResource.js'

/**
 * Task 13.8 — REAL multi-tab memory-footprint measurement (P-real).
 *
 * This file REPLACES the former `multi-tab-memory.bench.js`, which produced
 * false confidence: it never ran in `vitest run` (the default include glob is
 * `*.{test,spec}` — `.bench.js` is skipped) and, more importantly, it only
 * asserted REF IDENTITY (`instanceA.kpis !== instanceB.kpis`) plus the *shape*
 * of the returned object (`Object.keys(...).length < 20`). Two composables
 * returning distinct refs proves nothing about whether memory is actually
 * released when a tab is hidden — a leak keeps distinct refs alive just fine.
 *
 * The replacement measures the three quantities that actually determine the
 * per-tab memory envelope, using the shared helpers in `_helpers/measurement.js`
 * and the real Fase 4 release/rehydrate seam (`useEventDataset.releaseReclaimable`
 * / `rehydrate`) driven by the single keep-alive owner (`useKeepAliveResource`):
 *
 *  1. RETAINED OBSERVERS — live `ResizeObserver` count (installResizeObserverCounter).
 *     An inactive tab must hold ZERO; the active tab holds exactly ONE; the count
 *     does not accumulate across many activate/deactivate cycles.
 *  2. RETAINED INDEX ENTRIES — how many buffered rows are still resolvable through
 *     the derived id-index (`dataset.hasId`). This is the heaviest reclaimable
 *     state (one `Map<field,value>` per row). It must drop to 0 on deactivate and
 *     rehydrate to the exact row count on activate — WITHOUT a re-fetch (the
 *     source `rows` survive).
 *  3. DOM SURFACE — mounted rows / element nodes (countMountedRows / countDomNodes).
 *     A deactivated tab contributes zero rendered rows to the live tree.
 *
 * Everything is exercised through a real `<KeepAlive>` host so activate /
 * deactivate fire for real, mirroring `keep-alive-reclaim.spec.js` and
 * `event-chart.observer-lifecycle.test.js`.
 */

const ROW_TESTID = 'table-body-row'

const makeRows = (prefix, count) =>
  Array.from({ length: count }, (unused, index) => ({
    id: `${prefix}-${index}`,
    summary: [
      { key: 'status', value: index % 2 === 0 ? '200' : '404' },
      { key: 'host', value: `${prefix}.example.com` }
    ]
  }))

/**
 * A real "tab body": owns a real `useEventDataset` (its id-keyed indexes are the
 * heavy reclaimable state) and a real `ResizeObserver`, both driven by the
 * single `useKeepAliveResource` owner — rehydrate + observe on acquire
 * (mount/activate), releaseReclaimable + disconnect on release
 * (unmount/deactivate). Renders one real DOM row per buffered row so the DOM
 * surface is measurable.
 *
 * `sink` receives probes the test uses to read the tab's retained footprint.
 */
const makeTabBody = (rowsData, sink) =>
  defineComponent({
    name: 'RteTabBody',
    setup() {
      const rows = shallowRef(rowsData)
      const dataset = useEventDataset({ rows })
      const rootRef = ref(null)

      const lifecycle = useKeepAliveResource(
        () => {
          dataset.rehydrate()
          const observer = new globalThis.ResizeObserver(() => {})
          if (rootRef.value) observer.observe(rootRef.value)
          return observer
        },
        (observer) => {
          if (observer) observer.disconnect()
          dataset.releaseReclaimable()
        }
      )

      // REAL retained-entry count: how many buffered ids still resolve through
      // the derived index. 0 when reclaimed, rowCount when hydrated. This is not
      // ref identity — it reads the actual heavy structure being reclaimed.
      const retainedIndexCount = () =>
        rows.value.reduce((total, row) => total + (dataset.hasId(row.id) ? 1 : 0), 0)

      if (sink) {
        sink({
          retainedIndexCount,
          isActive: lifecycle.isActive,
          rowCount: rows.value.length
        })
      }

      return () =>
        h(
          'div',
          { ref: rootRef, class: 'rte-tab-body' },
          rows.value.map((row) =>
            h('div', { key: row.id, 'data-testid': ROW_TESTID }, String(row.id))
          )
        )
    }
  })

// Single-tab host: toggling `show` drives activate/deactivate under KeepAlive
// without a full unmount (same pattern as keep-alive-reclaim.spec.js).
const makeToggleHost = (child) =>
  defineComponent({
    setup() {
      const show = ref(true)
      return { show }
    },
    render() {
      return h(KeepAlive, {}, [this.show ? h(child) : null])
    }
  })

// Multi-tab host: keeps every tab alive but shows exactly one at a time. Keys
// differ per tab, so switching `activeIndex` deactivates the current tab and
// activates (or first-mounts) the target — the real tab-switch behaviour.
const makeTabbedHost = (tabDefs) =>
  defineComponent({
    setup() {
      const activeIndex = ref(0)
      return { activeIndex }
    },
    render() {
      const def = tabDefs[this.activeIndex]
      return h(KeepAlive, { max: tabDefs.length }, [h(def.component, { key: def.key })])
    }
  })

describe('RealTimeEventsV2 multi-tab memory footprint (real measurement, task 13.8)', () => {
  let roCounter

  beforeEach(() => {
    roCounter = installResizeObserverCounter()
  })

  afterEach(() => {
    roCounter.restore()
  })

  describe('single tab across keep-alive cycles — footprint returns to baseline', () => {
    it('releases observer, index and DOM on deactivate and restores them on activate, with no accumulation over many cycles', async () => {
      const rowCount = 40
      let probes
      const wrapper = mount(
        makeToggleHost(makeTabBody(makeRows('tab', rowCount), (api) => (probes = api))),
        { attachTo: document.body }
      )
      await nextTick()

      // When active the tab body is in the live document tree; when deactivated
      // KeepAlive detaches it, so counting rows through `document` yields the
      // real rendered surface either way (a hidden host root is a comment node).
      const liveRows = () => countMountedRows(document)

      // Baseline after mount: exactly one observer, full index, full DOM.
      expect(roCounter.liveCount()).toBe(1)
      expect(probes.retainedIndexCount()).toBe(rowCount)
      expect(liveRows()).toBe(rowCount)
      const activeDomBaseline = countDomNodes(wrapper.get('.rte-tab-body'))
      expect(activeDomBaseline).toBeGreaterThan(rowCount) // rows + container

      // Drive many deactivate/activate cycles. Every ACTIVE settle must return
      // to the exact same baseline; every INACTIVE settle must be fully released.
      // A leak would show up as liveCount / retainedIndexCount growing per cycle.
      const CYCLES = 5
      // eslint-disable-next-line id-length
      for (let cycle = 0; cycle < CYCLES; cycle++) {
        wrapper.vm.show = false
        await nextTick()
        expect(roCounter.liveCount()).toBe(0)
        expect(probes.retainedIndexCount()).toBe(0)
        expect(liveRows()).toBe(0)
        expect(probes.isActive.value).toBe(false)

        wrapper.vm.show = true
        await nextTick()
        expect(roCounter.liveCount()).toBe(1)
        expect(probes.retainedIndexCount()).toBe(rowCount)
        expect(liveRows()).toBe(rowCount)
        expect(countDomNodes(wrapper.get('.rte-tab-body'))).toBe(activeDomBaseline)
        expect(probes.isActive.value).toBe(true)
      }

      // Peak live observers never exceeded one: release precedes re-acquire, so
      // no transient doubling — the envelope is a single observer, not O(cycles).
      expect(roCounter.peakCount()).toBe(1)

      // Unmount → everything released to zero (no leak past teardown).
      wrapper.unmount()
      await nextTick()
      expect(roCounter.liveCount()).toBe(0)
      expect(probes.retainedIndexCount()).toBe(0)
    })
  })

  describe('N tabs kept alive — retained footprint equals ONE active tab, not N', () => {
    it('holds exactly one live observer and only the active tab index while switching across 6 tabs', async () => {
      const NUM_TABS = 6
      const rowCount = 25

      const sinks = []
      const tabDefs = Array.from({ length: NUM_TABS }, (unused, index) => ({
        key: `tab-${index}`,
        component: makeTabBody(makeRows(`tab${index}`, rowCount), (api) => (sinks[index] = api))
      }))

      const wrapper = mount(makeTabbedHost(tabDefs))
      await nextTick()

      const totalRetainedIndex = () =>
        sinks.reduce((sum, sink) => sum + (sink ? sink.retainedIndexCount() : 0), 0)
      const activeTabCount = () => sinks.filter((sink) => sink && sink.isActive.value).length

      // Only tab 0 has been created/activated so far.
      expect(sinks[0].isActive.value).toBe(true)
      expect(roCounter.liveCount()).toBe(1)
      expect(totalRetainedIndex()).toBe(rowCount)

      // Walk forward through every tab, then wrap back to the first. At each
      // settled step the invariant holds: exactly one active tab, one live
      // observer, and exactly one tab's worth of retained index — independent of
      // how many tabs exist or how many switches happened (no per-tab pile-up).
      const visitOrder = [1, 2, 3, 4, 5, 0, 3, 5, 0]
      for (const target of visitOrder) {
        wrapper.vm.activeIndex = target
        await nextTick()

        expect(activeTabCount()).toBe(1)
        expect(sinks[target].isActive.value).toBe(true)
        expect(roCounter.liveCount()).toBe(1)
        expect(totalRetainedIndex()).toBe(rowCount)
        // The visible tree only ever renders the active tab's rows.
        expect(countMountedRows(wrapper)).toBe(rowCount)
      }

      // Every tab that has been visited was created at least once, but at most
      // one observer is ever live — total retained footprint is O(1 tab), the
      // real claim the old "6 distinct ref sets" bench never verified.
      expect(roCounter.totalCreated()).toBeGreaterThanOrEqual(NUM_TABS)
      expect(roCounter.liveCount()).toBe(1)

      wrapper.unmount()
      await nextTick()
      expect(roCounter.liveCount()).toBe(0)
      expect(totalRetainedIndex()).toBe(0)
    })
  })
})
