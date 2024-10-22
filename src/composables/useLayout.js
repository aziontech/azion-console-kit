import { computed, reactive, readonly } from 'vue'

const layoutConfig = reactive({
  darkTheme: false,
  drawer: false
})

const layoutState = reactive({
  profileSidebarVisible: false, // barra lateral do perfil visível
  productSidebarVisible: false, // barra lateral do produto visível
  sidebarVisible: false // barra lateral visível
})

export function useLayout() {
  const toggleDarkMode = () => {
    if (!document.startViewTransition) {
      executeDarkModeToggle()

      return
    }

    document.startViewTransition(() => executeDarkModeToggle(event))
  }

  const themeSelect = ({ HTMLElement, theme }) => {
    let selectedTheme = theme
    if (!theme || theme === 'system') {
      selectedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const currentApplicationTheme = selectedTheme === 'light' ? 'dark' : 'light'
    HTMLElement.classList.replace(`azion-${currentApplicationTheme}`, `azion-${selectedTheme}`)
  }

  const executeDarkModeToggle = () => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme
    document.documentElement.classList.toggle('app-dark')
  }

  const onMenuToggle = () => {
    if (layoutConfig.menuMode === 'overlay') {
      layoutState.overlayMenuActive = !layoutState.overlayMenuActive
    }

    if (window.innerWidth > 991) {
      layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive
    } else {
      layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive
    }
  }

  const resetMenu = () => {
    layoutState.overlayMenuActive = false
    layoutState.staticMenuMobileActive = false
    layoutState.menuHoverActive = false
  }

  const isSidebarActive = computed(
    () => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive
  )

  const isDarkTheme = computed(() => layoutConfig.darkTheme)

  const getPrimary = computed(() => layoutConfig.primary)

  const getSurface = computed(() => layoutConfig.surface)

  return {
    layoutConfig: readonly(layoutConfig),
    layoutState: readonly(layoutState),
    onMenuToggle,
    isSidebarActive,
    isDarkTheme,
    getPrimary,
    getSurface,
    setActiveMenuItem,
    toggleDarkMode,
    setPrimary,
    setSurface,
    setPreset,
    resetMenu,
    setMenuMode
  }
}
