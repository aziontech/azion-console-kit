import { computed, isRef, unref } from 'vue'

export const MAX_TOTAL_TABS = 6

/**
 * Single, ceiling-aware source of truth for the RTE tab limit.
 *
 * All tab kinds (pinned Events, additional Events, Dashboard) admit and
 * restore through THIS unit, so there is exactly one ceiling
 * (`MAX_TOTAL_TABS`) and one admission predicate. `useSessionManager` and
 * `useEventsTabs` consume the returned `canOpenNewTab` / `capForRestore`
 * instead of maintaining their own counting logic (req 2.1, 2.5).
 *
 * @param {Object} options
 * @param {import('vue').Ref<Array>|(() => Array)} options.openTabs
 *   Reactive combined tab list (or a getter returning it). Its length is the
 *   authoritative total tab count across every tab kind.
 * @returns {{
 *   MAX_TOTAL_TABS: number,
 *   totalTabCount: () => number,
 *   canOpenNewTab: import('vue').ComputedRef<boolean>,
 *   capForRestore: (reservedCount?: number) => number
 * }}
 */
export function useTabLimit({ openTabs }) {
  // Accept either a ref/computed or a plain getter, so every call site can
  // feed the same reactive combined list without wrapping ceremony.
  const readTabs = () => {
    const source = isRef(openTabs) ? unref(openTabs) : openTabs
    const value = typeof source === 'function' ? source() : source
    return Array.isArray(value) ? value : []
  }

  const totalTabCount = () => readTabs().length

  // Stable computed — created once per composable instance, not re-created on
  // each admission check. Consumers read `canOpenNewTab.value`.
  const canOpenNewTab = computed(() => totalTabCount() < MAX_TOTAL_TABS)

  /**
   * Ceiling-aware slice cap for restore paths.
   *
   * Restoration must honor the SAME ceiling as admission: given how many tab
   * slots are already reserved (e.g. the pinned Events tab plus any tabs
   * restored by a sibling unit), return how many additional tabs may still be
   * restored without exceeding `MAX_TOTAL_TABS`.
   *
   * @param {number} [reservedCount=0] slots already accounted for
   * @returns {number} max additional tabs restorable (never negative)
   */
  const capForRestore = (reservedCount = 0) => Math.max(0, MAX_TOTAL_TABS - reservedCount)

  return { MAX_TOTAL_TABS, totalTabCount, canOpenNewTab, capForRestore }
}
