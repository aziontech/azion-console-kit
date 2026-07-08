import { ref, onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue'

/**
 * Reactively tracks a CSS media query.
 *
 * @param {string} query - A CSS media query string, e.g. '(max-width: 639px)'.
 * @returns {import('vue').Ref<boolean>} Ref reflecting `MediaQueryList.matches`.
 */
export function useReactiveMediaQuery(query) {
  const matches = ref(false)
  let mql = null

  const onChange = (event) => {
    matches.value = event.matches
  }

  const setup = () => {
    if (mql || typeof window === 'undefined') return
    mql = window.matchMedia(query)
    matches.value = mql.matches
    mql.addEventListener('change', onChange)
  }

  const teardown = () => {
    if (!mql) return
    mql.removeEventListener('change', onChange)
    mql = null
  }

  // onActivated complements onMounted because the host view lives under
  // <keep-alive>: re-entering the cached view fires onActivated, not onMounted.
  onMounted(setup)
  onActivated(setup)
  onBeforeUnmount(teardown)
  onDeactivated(teardown)

  return matches
}
