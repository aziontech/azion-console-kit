import { computed, reactive, readonly } from 'vue'

const layoutState = reactive({
  profileSidebarVisible: false,
  productSidebarVisible: false,
  sidebarVisible: false
})

export function useLayout() {
  const resetMenu = () => {
    layoutState.profileSidebarVisible = false
    layoutState.productSidebarVisible = false
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
