export const MAX_TOTAL_TABS = 6

/**
 * Thin helper that keeps the global tab counter in one place.
 * Both useSessionManager and useEventsTabs consult canOpenNewTab()
 * before admitting a new tab.
 *
 * @param {{ openTabs: import('vue').Ref<Array> }} options
 * @returns {{ MAX_TOTAL_TABS: number, totalTabCount: () => number, canOpenNewTab: () => boolean }}
 */
export function useTabLimit({ openTabs }) {
  const totalTabCount = () => openTabs.value.length
  const canOpenNewTab = () => totalTabCount() < MAX_TOTAL_TABS
  return { MAX_TOTAL_TABS, totalTabCount, canOpenNewTab }
}
