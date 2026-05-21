import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTabLimit, MAX_TOTAL_TABS } from '../useTabLimit.js'

describe('useTabLimit', () => {
  it('MAX_TOTAL_TABS is 6', () => {
    expect(MAX_TOTAL_TABS).toBe(6)
  })

  it('canOpenNewTab is true when tabs < 6', () => {
    const openTabs = ref([1, 2, 3])
    const { canOpenNewTab } = useTabLimit({ openTabs })
    expect(canOpenNewTab()).toBe(true)
  })

  it('canOpenNewTab is false when tabs >= 6', () => {
    const openTabs = ref([1, 2, 3, 4, 5, 6])
    const { canOpenNewTab } = useTabLimit({ openTabs })
    expect(canOpenNewTab()).toBe(false)
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
