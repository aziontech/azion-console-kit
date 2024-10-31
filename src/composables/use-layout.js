import { computed, reactive, readonly, markRaw } from 'vue'
import Copilot from '@/layout/components/sidebar/copilot.vue'
import Helper from '@/layout/components/sidebar/helper.vue'

const componentMapSidebar = {
  copilot: markRaw(Copilot),
  helper: markRaw(Helper)
}

const layoutState = reactive({
  sidebarVisible: false,
  currentComponent: null
})

export function useLayout() {
  const toggleSidebarComponent = (componentKey) => {
    const component = componentMapSidebar[componentKey]
    if (layoutState.currentComponent === component) {
      closeSidebar()
    } else {
      layoutState.currentComponent = component
      layoutState.sidebarVisible = true
    }
  }

  const closeSidebar = () => {
    layoutState.sidebarVisible = false
    layoutState.currentComponent = null
  }

  const isSidebarActive = computed(() => layoutState.sidebarVisible)
  const activeComponent = computed(() => layoutState.currentComponent)

  const activeComponentKey = computed(() => {
    return (
      Object.keys(componentMapSidebar).find(
        (key) => componentMapSidebar[key] === layoutState.currentComponent
      ) || null
    )
  })

  return {
    layoutState: readonly(layoutState),
    isSidebarActive,
    activeComponent,
    activeComponentKey,
    toggleSidebarComponent,
    closeSidebar
  }
}
