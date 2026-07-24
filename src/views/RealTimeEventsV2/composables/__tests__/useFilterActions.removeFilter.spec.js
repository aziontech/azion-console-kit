import { describe, it, expect, vi } from 'vitest'
import { ref, computed, toRaw } from 'vue'
import { useFilterActions } from '../useFilterActions.js'

/**
 * Characterization: handleRemoveFilter — chip removal contract.
 *
 * Seam: filter chip removal. Pins the CURRENT observable behavior so the
 * task 5.3 refactor (remove by identity + immutable, no in-place mutation)
 * can be verified to PRESERVE what matters: removing one chip leaves the
 * OTHER chips intact and in their original order.
 *
 * NOT covered here (owned by other specs):
 *  - pruneIncompatibleFilters → useFilterActions.prune.spec.js
 *  - URL hash serialization round-trip → useFilterActions.roundtrip.prop.test.js
 *
 * CONTRACT (post task 5.3 — identity + immutable):
 *  - handleRemoveFilter resolves the emitted position to the SPECIFIC chip
 *    object and removes exactly that chip BY IDENTITY (reference), not by
 *    blindly splicing a positional slot — closing the C6/SR-4 desync where a
 *    non-rendered raw field shifted the index and dropped the wrong chip.
 *  - Removal is IMMUTABLE: a NEW fields array is produced; the base
 *    component's array reference is never mutated in place (no splice), so the
 *    emit is never reordered.
 *  - Surviving chips keep their original relative order.
 *  - After removal it calls the reload path, which persists to the hash and
 *    reloads data (only when initialLoadDone is true).
 */
const makeActions = ({ fields, initialLoadDone = true } = {}) => {
  const filterData = ref({
    tsRange: { tsRangeBegin: '2026-06-17T00:00:00Z', tsRangeEnd: '2026-06-17T01:00:00Z' },
    fields,
    dataset: 'httpEvents'
  })
  const loadData = vi.fn()
  const setFilterInHash = vi.fn()
  const actions = useFilterActions({
    filterData,
    filterFields: computed(() => [{ value: 'host', label: 'Host', operator: [{ value: 'Eq' }] }]),
    tabSelected: computed(() => ({ dataset: 'httpEvents' })),
    initialFilters: [],
    loadData,
    initialLoadDone: ref(initialLoadDone),
    onError: vi.fn(),
    getFiltersFromHash: vi.fn(() => null),
    setFilterInHash
  })
  return { filterData, actions, loadData, setFilterInHash }
}

const chip = (valueField, value) => ({
  field: valueField,
  valueField,
  operator: 'Eq',
  value: String(value),
  type: 'String'
})

describe('useFilterActions.handleRemoveFilter', () => {
  it('removes the emitted chip and leaves the OTHER chips intact and in order', () => {
    const chipA = chip('host', 'a.com')
    const chipB = chip('status', '200')
    const chipC = chip('scheme', 'https')
    const { filterData, actions } = makeActions({ fields: [chipA, chipB, chipC] })

    // The base emits the SOURCE raw filter (the middle chip) by identity.
    actions.handleRemoveFilter(chipB)

    // The two surviving chips must remain, in their original relative order.
    expect(filterData.value.fields).toEqual([chipA, chipC])
  })

  it('removes the first chip without disturbing the trailing chips', () => {
    const chipA = chip('host', 'a.com')
    const chipB = chip('status', '200')
    const { filterData, actions } = makeActions({ fields: [chipA, chipB] })

    actions.handleRemoveFilter(chipA)

    expect(filterData.value.fields).toEqual([chipB])
  })

  it('removes exactly the emitted chip by identity even when a twin chip exists', () => {
    // Two chips share the same valueField+value shape; only their object
    // identity differs. Identity-based removal (task 5.3) must drop exactly the
    // emitted source object — not any structurally-equal twin.
    const dup0 = chip('host', 'a.com')
    const dup1 = chip('host', 'a.com')
    const tail = chip('status', '200')
    const { filterData, actions } = makeActions({ fields: [dup0, dup1, tail] })

    // The base emits dup0 → dup0 (and only dup0) is removed by identity.
    actions.handleRemoveFilter(dup0)

    expect(filterData.value.fields).toHaveLength(2)
    // The surviving chips keep their original relative order: dup1 then tail.
    // toRaw unwraps Vue's reactive proxy so the reference comparison is exact,
    // proving the removed chip was dup0 (by identity), leaving dup1 untouched.
    expect(toRaw(filterData.value.fields[0])).toBe(dup1)
    expect(toRaw(filterData.value.fields[1])).toBe(tail)
  })

  it('produces a NEW array reference (immutable) instead of mutating in place', () => {
    // Identity + immutable contract (task 5.3): removal replaces the fields
    // array with a fresh one; the original array reference is never spliced.
    const chipA = chip('host', 'a.com')
    const { filterData, actions } = makeActions({
      fields: [chipA, chip('status', '200')]
    })
    const originalRef = filterData.value.fields

    actions.handleRemoveFilter(chipA)

    // A brand-new array is produced (no in-place splice on the base ref)…
    expect(filterData.value.fields).not.toBe(originalRef)
    // …and the original array is left untouched (still holds both chips).
    expect(originalRef).toHaveLength(2)
    // The new array carries only the surviving chip.
    expect(filterData.value.fields).toHaveLength(1)
  })

  it('persists to the hash and reloads data after removal when initial load is done', async () => {
    const chipB = chip('status', '200')
    const { actions, loadData, setFilterInHash } = makeActions({
      fields: [chip('host', 'a.com'), chipB]
    })

    actions.handleRemoveFilter(chipB)

    // setFilterInHash fires synchronously; loadData is awaited behind it, so
    // let the pending microtasks settle before asserting the reload.
    await Promise.resolve()

    expect(setFilterInHash).toHaveBeenCalledTimes(1)
    expect(loadData).toHaveBeenCalledTimes(1)
  })

  it('does not persist or reload before the initial load has completed', () => {
    const chipA = chip('host', 'a.com')
    const { actions, loadData, setFilterInHash } = makeActions({
      fields: [chipA, chip('status', '200')],
      initialLoadDone: false
    })

    actions.handleRemoveFilter(chipA)

    expect(setFilterInHash).not.toHaveBeenCalled()
    expect(loadData).not.toHaveBeenCalled()
  })

  // Helper (test-local, avoids relying on internals): mirror the SOURCE-of-truth
  // projection FilterTagsDisplay applies to build its chip list. A raw filter is
  // rendered ONLY when its valueField + operator exist (and aren't disabled) in
  // the catalogue. The rendered chip keeps a reference to its raw source
  // (`__source`) — exactly what the base component emits on removal.
  const projectVisibleChips = (fields, catalogue) =>
    fields
      .map((item) => {
        const field = catalogue.find(({ value }) => value === item.valueField)
        if (!field) return null
        const op = field.operator?.find(({ value }) => value === item.operator)
        if (!op) return null
        return { ...item, __source: item }
      })
      .filter(Boolean)

  it(
    'REPRO C6/SR-4: removes the CORRECT chip when a hidden raw filter shifts the ' +
      'display index away from the raw index',
    () => {
      // Raw array: [hidden(status), visibleA(host), visibleB(scheme)].
      // Catalogue exposes host + scheme, but NOT status → `status` is dropped
      // from the chip list. So the rendered chips are [visibleA, visibleB] and
      // their DISPLAY indices (0,1) no longer match the RAW indices (1,2).
      const hidden = chip('status', '500') // not in catalogue → not rendered
      const visibleA = chip('host', 'a.com') // display index 0, raw index 1
      const visibleB = chip('scheme', 'https') // display index 1, raw index 2

      const catalogue = [
        { value: 'host', label: 'Host', operator: [{ value: 'Eq' }] },
        { value: 'scheme', label: 'Scheme', operator: [{ value: 'Eq' }] }
      ]

      const filterData = ref({
        tsRange: { tsRangeBegin: '2026-06-17T00:00:00Z', tsRangeEnd: '2026-06-17T01:00:00Z' },
        fields: [hidden, visibleA, visibleB],
        dataset: 'httpEvents'
      })
      const actions = useFilterActions({
        filterData,
        filterFields: computed(() => catalogue),
        tabSelected: computed(() => ({ dataset: 'httpEvents' })),
        initialFilters: [],
        loadData: vi.fn(),
        initialLoadDone: ref(true),
        onError: vi.fn(),
        getFiltersFromHash: vi.fn(() => null),
        setFilterInHash: vi.fn()
      })

      // The user clicks the FIRST visible chip (display index 0 → visibleA).
      const chips = projectVisibleChips(filterData.value.fields, catalogue)
      expect(chips).toHaveLength(2)
      const displayIndexClicked = 0
      const clickedChip = chips[displayIndexClicked]
      expect(toRaw(clickedChip.__source)).toBe(visibleA)

      // The OLD code did `fields[emittedDisplayIndex]`. With display index 0 it
      // would have resolved `fields[0]` === the HIDDEN `status` chip — removing
      // the WRONG (invisible) filter and leaving the clicked chip on screen.
      expect(toRaw(filterData.value.fields[displayIndexClicked])).toBe(hidden)

      // The FIXED base emits the source raw filter by identity.
      actions.handleRemoveFilter(clickedChip.__source)

      // Exactly visibleA is gone; the hidden filter and visibleB survive, in order.
      expect(filterData.value.fields).toHaveLength(2)
      expect(toRaw(filterData.value.fields[0])).toBe(hidden)
      expect(toRaw(filterData.value.fields[1])).toBe(visibleB)
    }
  )

  it('is a no-op when the emitted source filter is not present in the array', () => {
    const { filterData, actions, loadData, setFilterInHash } = makeActions({
      fields: [chip('host', 'a.com'), chip('status', '200')]
    })
    const originalRef = filterData.value.fields

    // A stale/foreign reference must not touch the array or trigger a reload.
    actions.handleRemoveFilter(chip('host', 'a.com'))

    expect(filterData.value.fields).toBe(originalRef)
    expect(filterData.value.fields).toHaveLength(2)
    expect(setFilterInHash).not.toHaveBeenCalled()
    expect(loadData).not.toHaveBeenCalled()
  })
})
