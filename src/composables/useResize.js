import { ref, computed, onMounted, onUnmounted } from 'vue'

const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280
}

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

  const isGreaterThanSM = computed(() => windowWidth.value > BREAKPOINTS.SM)
  const isGreaterThanMD = computed(() => windowWidth.value > BREAKPOINTS.MD)
  const isGreaterThanLG = computed(() => windowWidth.value > BREAKPOINTS.LG)
  const isGreaterThanXL = computed(() => windowWidth.value > BREAKPOINTS.XL)

  const isMobile = computed(() => windowWidth.value <= BREAKPOINTS.MD)
  const isTablet = computed(
    () => windowWidth.value > BREAKPOINTS.MD && windowWidth.value <= BREAKPOINTS.XL
  )
  const isDesktop = computed(() => windowWidth.value > BREAKPOINTS.XL)

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
