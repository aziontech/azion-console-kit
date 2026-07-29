import { ref, watch, nextTick } from 'vue'

const CHART_COLLAPSE_KEY = 'rte:chart-collapsed'

/**
 * Owns the chart-collapse state + persistence for the RTE tab panel.
 * In fullscreen the chart is collapsed by default to maximise table space;
 * the user can expand it again via the chart-header toggle.
 *
 * @param {Object} deps
 * @param {import('vue').Ref<boolean>} deps.isFullscreen
 * @returns {{ isChartCollapsed: import('vue').Ref<boolean>, toggleCollapse: Function }}
 */
export function useChartCollapse({ isFullscreen }) {
  const isChartCollapsed = ref(false)
  try {
    if (localStorage.getItem(CHART_COLLAPSE_KEY) === '1') isChartCollapsed.value = true
  } catch {
    /* ignore */
  }

  // Fullscreen drives isChartCollapsed programmatically (collapse on enter,
  // restore on exit). Those writes must NOT clobber the persisted user pref:
  // `fullscreenDriven` gates the persistence watcher; `preFullscreenCollapsed`
  // remembers the value to restore on exit. User toggles persist as before.
  let fullscreenDriven = false
  let preFullscreenCollapsed = null
  const setCollapsedProgrammatically = (val) => {
    fullscreenDriven = true
    isChartCollapsed.value = val
    nextTick(() => {
      fullscreenDriven = false
    })
  }

  watch(isChartCollapsed, (val) => {
    if (fullscreenDriven) return
    try {
      localStorage.setItem(CHART_COLLAPSE_KEY, val ? '1' : '0')
    } catch {
      /* ignore */
    }
  })

  watch(isFullscreen, (val) => {
    if (val) {
      preFullscreenCollapsed = isChartCollapsed.value
      setCollapsedProgrammatically(true)
    } else {
      setCollapsedProgrammatically(preFullscreenCollapsed ?? false)
      preFullscreenCollapsed = null
    }
  })

  const toggleCollapse = () => {
    isChartCollapsed.value = !isChartCollapsed.value
  }

  return { isChartCollapsed, toggleCollapse }
}
