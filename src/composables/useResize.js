import { ref, computed, onMounted, onUnmounted } from 'vue'

// Screen breakpoints (following Tailwind CSS conventions)
const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280
}

// Global reactive window width
const windowWidth = ref(window.innerWidth)

const updateWidth = () => {
  windowWidth.value = window.innerWidth
}

export function useResize() {
  onMounted(() => {
    if (typeof window !== 'undefined') {
      updateWidth()
      window.addEventListener('resize', updateWidth)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth)
  })

  // Computed properties for different breakpoints
  const isGreaterThanSM = computed(() => windowWidth.value > BREAKPOINTS.SM)
  const isGreaterThanMD = computed(() => windowWidth.value > BREAKPOINTS.MD)
  const isGreaterThanLG = computed(() => windowWidth.value > BREAKPOINTS.LG)
  const isGreaterThanXL = computed(() => windowWidth.value > BREAKPOINTS.XL)

  // Computed properties for specific breakpoint ranges
  const isMobile = computed(() => windowWidth.value <= BREAKPOINTS.MD)
  const isTablet = computed(
    () => windowWidth.value > BREAKPOINTS.MD && windowWidth.value <= BREAKPOINTS.XL
  )
  const isDesktop = computed(() => windowWidth.value > BREAKPOINTS.XL)

  // Helper function to check custom breakpoints
  const isGreaterThan = (breakpoint) => {
    return computed(() => windowWidth.value > breakpoint)
  }

  const isLessThan = (breakpoint) => {
    return computed(() => windowWidth.value < breakpoint)
  }

  return {
    windowWidth: computed(() => windowWidth.value),
    BREAKPOINTS,
    isGreaterThanSM,
    isGreaterThanMD,
    isGreaterThanLG,
    isGreaterThanXL,
    isMobile,
    isTablet,
    isDesktop,
    isGreaterThan,
    isLessThan
  }
}
