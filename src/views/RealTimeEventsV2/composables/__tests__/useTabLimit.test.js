import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTabLimit, MAX_TOTAL_TABS } from '../useTabLimit.js'

describe('useTabLimit', () => {
  it('MAX_TOTAL_TABS is 6', () => {
    expect(MAX_TOTAL_TABS).toBe(6)
  })

  // canOpenNewTab is now a STABLE computed (single source of truth, not
  // re-created per call). Consumers read `.value`.
  it('canOpenNewTab is true when tabs < 6', () => {
    const openTabs = ref([1, 2, 3])
    const { canOpenNewTab } = useTabLimit({ openTabs })
    expect(canOpenNewTab.value).toBe(true)
  })

  it('canOpenNewTab is false when tabs >= 6', () => {
    const openTabs = ref([1, 2, 3, 4, 5, 6])
    const { canOpenNewTab } = useTabLimit({ openTabs })
    expect(canOpenNewTab.value).toBe(false)
  })

  it('canOpenNewTab is a stable computed reference reused across reads', () => {
    const openTabs = ref([1])
    const { canOpenNewTab } = useTabLimit({ openTabs })
    const firstRead = canOpenNewTab
    expect(firstRead.value).toBe(true)
    openTabs.value = [1, 2, 3, 4, 5, 6]
    // Same ref instance recomputes reactively — no re-creation per call.
    expect(firstRead).toBe(canOpenNewTab)
    expect(canOpenNewTab.value).toBe(false)
  })

  it('capForRestore honors the ceiling given reserved slots', () => {
    const openTabs = ref([])
    const { capForRestore } = useTabLimit({ openTabs })
    // 1 pinned reserved → 5 restorable; 6 reserved → 0; over-reserved → 0
    expect(capForRestore(1)).toBe(5)
    expect(capForRestore(6)).toBe(0)
    expect(capForRestore(9)).toBe(0)
    expect(capForRestore(0)).toBe(6)
  })

  it('totalTabCount tracks openTabs reactively', () => {
    const openTabs = ref([])
    const { totalTabCount } = useTabLimit({ openTabs })

    expect(totalTabCount()).toBe(0)

    openTabs.value.push('tab-1')
    expect(totalTabCount()).toBe(1)

    openTabs.value.push('tab-2', 'tab-3')
    expect(totalTabCount()).toBe(3)
  })
})
