import { computed, reactive, readonly, markRaw, watch, ref } from 'vue'
import Copilot from '@/layout/components/sidebar/copilot.vue'
import Helper from '@/layout/components/sidebar/helper.vue'
import { useWindowSize } from '@vueuse/core'

const componentMapSidebar = {
  copilot: markRaw(Copilot),
  helper: markRaw(Helper)
}

const layoutState = reactive({
  sidebarVisible: false,
  currentComponent: null
})

const WIDTH_SIDEBAR_DESKTOP = 850

export function useLayout() {
  const { width } = useWindowSize()
  const currentWidth = ref(width.value)

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

  watch(isSidebarActive, (newVal) => {
    if (!newVal) {
      layoutState.currentComponent = null
    }
  })

  const isVisibleMobileSidebar = computed(() => {
    return currentWidth.value > WIDTH_SIDEBAR_DESKTOP
  })

  watch(
    width,
    () => {
      currentWidth.value = width.value
    },
    { immediate: true }
  )

  return {
    layoutState: readonly(layoutState),
    isSidebarActive,
    activeComponent,
    activeComponentKey,
    toggleSidebarComponent,
    closeSidebar,
    isVisibleMobileSidebar
  }
}
