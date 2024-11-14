import { computed, reactive, readonly, markRaw, watch, ref } from 'vue'
import Copilot from '@/layout/components/sidebar/copilot.vue'
import Helper from '@/layout/components/sidebar/helper.vue'
import { useWindowSize } from '@vueuse/core'
import { useRouter } from 'vue-router'

const componentMapSidebar = {
  copilot: markRaw(Copilot),
  helper: markRaw(Helper)
}

const layoutState = reactive({
  sidebarVisible: false,
  currentComponent: {
    component: null,
    props: {}
  }
})

const WIDTH_SIDEBAR_DESKTOP = 850

export function useLayout() {
  const { width } = useWindowSize()
  const currentWidth = ref(width.value)
  const router = useRouter()

  const isCurrentRouteCopilot = computed(() => router.currentRoute.value.name === 'copilot')

  const OpenSidebarComponent = (componentKey, props) => {
    if (componentKey === 'copilot' && isCurrentRouteCopilot.value) {
      return
    }

    const component = componentMapSidebar[componentKey]
    layoutState.currentComponent = { component, props }
    layoutState.sidebarVisible = true
  }

  const toggleSidebarComponent = (componentKey, props) => {
    if (componentKey === 'copilot' && isCurrentRouteCopilot.value) {
      return
    }
    const component = componentMapSidebar[componentKey]
    if (layoutState.currentComponent.component === component) {
      closeSidebar()
    } else {
      layoutState.currentComponent = { component, props }
      layoutState.sidebarVisible = true
    }
  }

  const closeSidebar = () => {
    layoutState.sidebarVisible = false
    layoutState.currentComponent = {
      component: null,
      props: {}
    }
  }

  const isSidebarActive = computed(() => layoutState.sidebarVisible)
  const activeComponent = computed(() => ({
    component: layoutState.currentComponent.component,
    props: layoutState.currentComponent.props
  }))

  const activeComponentKey = computed(() => {
    return (
      Object.keys(componentMapSidebar).find(
        (key) => componentMapSidebar[key] === layoutState.currentComponent.component
      ) || null
    )
  })

  watch(isSidebarActive, (newVal) => {
    if (!newVal) {
      layoutState.currentComponent = {
        component: null,
        props: {}
      }
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
    OpenSidebarComponent,
    closeSidebar,
    isVisibleMobileSidebar
  }
}
