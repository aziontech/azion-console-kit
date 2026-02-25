import { computed, inject, toValue } from 'vue'

/**
 * Composable that determines whether a skeleton loader should be displayed
 * in edit forms based on loading state and cache availability.
 *
 * The skeleton should appear only during the initial load when no cached data
 * is available. It should NOT appear when:
 * - Data is already available (even if a background refetch is happening)
 * - Cached data exists in TanStack Query
 *
 * The loading state can be provided in two ways:
 * 1. Via the `isLoading` option (explicit ref)
 * 2. Via `inject('editFormLoading')` from EditFormBlock's `provide` (automatic)
 *
 * @param {Object} [options]
 * @param {import('vue').Ref<boolean>|boolean} [options.isLoading] - Loading state (overrides injected state if provided)
 * @param {import('vue').Ref<Object|undefined>|Object|undefined} options.cachedData - Cached data from queryClient
 * @param {import('vue').Ref<Object|undefined>|Object|undefined} [options.data] - The actual loaded data (optional)
 *
 * @returns {{ showSkeleton: import('vue').ComputedRef<boolean> }}
 *
 * @example
 * // In an edit view component (inside EditFormBlock tree):
 * const cachedDataStream = computed(() =>
 *   dataStreamService.getDataStreamFromCache(route.params?.id)
 * )
 *
 * const { showSkeleton } = useFormSkeleton({
 *   cachedData: cachedDataStream
 * })
 *
 * // In template:
 * // <DataStreamFormSkeleton v-if="showSkeleton" />
 * // <FormFieldsDataStream v-else />
 */
export function useFormSkeleton({ isLoading, cachedData, data } = {}) {
  // If no explicit isLoading is provided, try to inject from EditFormBlock
  const injectedLoading = inject('editFormLoading', null)

  const showSkeleton = computed(() => {
    // Resolve loading state: explicit > injected > default false
    const loading = isLoading !== undefined ? toValue(isLoading) : toValue(injectedLoading)

    // If not loading, never show skeleton
    if (!loading) {
      return false
    }

    // If we have cached data, don't show skeleton (renders form immediately)
    const cached = toValue(cachedData)
    if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
      return false
    }

    // If we have loaded data from any source, don't show skeleton
    const loadedData = toValue(data)
    if (loadedData && typeof loadedData === 'object' && Object.keys(loadedData).length > 0) {
      return false
    }

    // Loading is true and no data is available — show skeleton
    return true
  })

  return {
    showSkeleton
  }
}
