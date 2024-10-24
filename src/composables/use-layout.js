import { computed, reactive, readonly } from 'vue'

const layoutState = reactive({
  sidebarVisible: false
})

export function useLayout() {
  const resetMenu = () => {
    layoutState.sidebarVisible = false
  }

  const isSidebarActive = computed(() => layoutState.sidebarVisible)

  const toggleSidebar = () => {
    layoutState.sidebarVisible = !layoutState.sidebarVisible
  }

  return {
    layoutState: readonly(layoutState),
    isSidebarActive,
    toggleSidebar,
    resetMenu
  }
}
