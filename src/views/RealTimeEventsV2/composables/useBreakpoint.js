import { computed } from 'vue'
import { useReactiveMediaQuery } from './useReactiveMediaQuery'

const ORDER = ['mobile-s', 'mobile', 'tablet', 'desktop', 'xl']

/**
 * Derives the current viewport breakpoint token from media queries.
 *
 * Tokens: `mobile-s` (<375px), `mobile` (375-639px), `tablet` (640-1023px),
 * `desktop` (1024-1439px), `xl` (>=1440px).
 *
 * @returns {{
 *   current: import('vue').ComputedRef<'mobile-s'|'mobile'|'tablet'|'desktop'|'xl'>,
 *   is: (token: string) => import('vue').ComputedRef<boolean>,
 *   isAtMost: (token: string) => import('vue').ComputedRef<boolean>,
 *   isAtLeast: (token: string) => import('vue').ComputedRef<boolean>
 * }}
 */
export function useBreakpoint() {
  const lt375 = useReactiveMediaQuery('(max-width: 374px)')
  const lt640 = useReactiveMediaQuery('(max-width: 639px)')
  const lt1024 = useReactiveMediaQuery('(max-width: 1023px)')
  const lt1440 = useReactiveMediaQuery('(max-width: 1439px)')

  const current = computed(() => {
    if (lt375.value) return 'mobile-s'
    if (lt640.value) return 'mobile'
    if (lt1024.value) return 'tablet'
    if (lt1440.value) return 'desktop'
    return 'xl'
  })

  const is = (token) => {
    if (!ORDER.includes(token)) return computed(() => false)
    return computed(() => current.value === token)
  }

  const isAtMost = (token) => {
    if (!ORDER.includes(token)) return computed(() => false)
    return computed(() => ORDER.indexOf(current.value) <= ORDER.indexOf(token))
  }

  const isAtLeast = (token) => {
    if (!ORDER.includes(token)) return computed(() => false)
    return computed(() => ORDER.indexOf(current.value) >= ORDER.indexOf(token))
  }

  return { current, is, isAtMost, isAtLeast }
}
