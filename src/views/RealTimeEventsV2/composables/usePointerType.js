import { useReactiveMediaQuery } from './useReactiveMediaQuery'

/**
 * Detects the primary pointer type via CSS media queries.
 *
 * Both refs can be true simultaneously (e.g. iPad with Magic Keyboard/mouse:
 * touch + cursor coexist). Consumers decide policy from the combination.
 *
 * @returns {{ isCoarse: import('vue').Ref<boolean>, isFine: import('vue').Ref<boolean> }}
 */
export function usePointerType() {
  const isCoarse = useReactiveMediaQuery('(pointer: coarse)')
  const isFine = useReactiveMediaQuery('(pointer: fine)')

  return { isCoarse, isFine }
}
